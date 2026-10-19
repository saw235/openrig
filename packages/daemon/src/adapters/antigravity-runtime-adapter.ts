// First-class Google Antigravity runtime adapter (native `agy` CLI).
//
// The harness runs interactively inside the seat's tmux pane, like Claude/Codex.
//   - guidance  -> <cwd>/AGENTS.md (managed block)
//   - skills    -> <cwd>/.agents/skills/<id>/
//   - launch    -> `agy --model <m> --mode accept-edits [--dangerously-skip-permissions] [--conversation <id>]`
//   - resume id -> the Antigravity conversation UUID, captured from the new
//                  `<antigravityHome>/conversations/<uuid>.db` that appears after launch.

import nodePath from "node:path";
import type { TmuxAdapter } from "./tmux.js";
import { shellQuote } from "./shell-quote.js";
import { yoloEnabled } from "./yolo-mode.js";
import type {
  RuntimeAdapter, NodeBinding, ResolvedStartupFile,
  InstalledResource, ProjectionResult, StartupDeliveryResult, ReadinessResult,
  HarnessLaunchResult, ForkSource,
} from "../domain/runtime-adapter.js";
import { resolveConcreteHint } from "../domain/runtime-adapter.js";
import type { ProjectionPlan, ProjectionEntry } from "../domain/projection-planner.js";
import { validateResumeToken } from "../domain/resume-token-validation.js";
import { mergeManagedBlock } from "../domain/managed-blocks.js";

import os from "node:os";
import { randomUUID } from "node:crypto";

const SHELL_COMMANDS = new Set(["bash", "fish", "nu", "sh", "tmux", "zsh"]);
const CONVERSATION_FILE_RE = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.db$/i;
const LOGIN_GATE_RE = /(sign in|log in|login required|authenticate|not authenticated)/i;
const TRUST_GATE_RE = /(trust (this|the) (folder|workspace|directory)|do you trust)/i;

export interface AntigravityFsOps {
  readFile(path: string): string;
  writeFile(path: string, content: string): void;
  exists(path: string): boolean;
  mkdirp(path: string): void;
  listFiles?(dirPath: string): string[];
  /** File names directly inside a directory (no recursion). Absent = capture disabled. */
  listDir?(dirPath: string): string[];
}

export interface AntigravityRuntimeAdapterDeps {
  tmux: TmuxAdapter;
  fsOps: AntigravityFsOps;
  /** Antigravity CLI state root. Default: ~/.gemini/antigravity-cli */
  antigravityHome: string;
  /** Executable to launch. Default: `agy` (resolved from PATH). */
  binary?: string;
  sleep?: (ms: number) => Promise<void>;
  /** Default model when the seat does not choose one. */
  defaultModel?: string;
  /** Path to activity-relay.cjs script to wire Antigravity lifecycle hooks. */
  activityRelayPath?: string;
  /** Directory where Antigravity project JSON files live (~/.gemini/config/projects). */
  configProjectsDir?: string;
}

export class AntigravityRuntimeAdapter implements RuntimeAdapter {
  readonly runtime = "antigravity";
  private tmux: TmuxAdapter;
  private fs: AntigravityFsOps;
  private home: string;
  private binary: string;
  private sleep: (ms: number) => Promise<void>;
  private defaultModel?: string;
  private activityRelayPath?: string;
  private configProjectsDir: string;

  constructor(deps: AntigravityRuntimeAdapterDeps) {
    this.tmux = deps.tmux;
    this.fs = deps.fsOps;
    this.home = deps.antigravityHome;
    this.binary = deps.binary ?? "agy";
    this.sleep = deps.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.defaultModel = deps.defaultModel ?? "gemini-3.8-flash-medium";
    this.activityRelayPath = deps.activityRelayPath;
    this.configProjectsDir = deps.configProjectsDir ?? nodePath.join(os.homedir(), ".gemini", "config", "projects");
  }

  skillTargetPath(_tmuxSession: string | null, _effectiveId: string): string | null {
    return null; // skills live in the seat cwd (.agents/skills); instantiator default applies
  }

  async listInstalled(binding: NodeBinding): Promise<InstalledResource[]> {
    const results: InstalledResource[] = [];
    const skillsDir = nodePath.join(binding.cwd, ".agents", "skills");
    if (this.fs.exists(skillsDir) && this.fs.listFiles) {
      for (const file of this.fs.listFiles(skillsDir)) {
        results.push({ effectiveId: file, category: "skill", installedPath: nodePath.join(skillsDir, file) });
      }
    }
    return results;
  }

  async project(plan: ProjectionPlan, binding: NodeBinding): Promise<ProjectionResult> {
    this.ensureAntigravityActivityHooks(binding.cwd);
    const projected: string[] = [];
    const skipped: string[] = [];
    const warnings: string[] = [];
    const failed: Array<{ effectiveId: string; error: string }> = [];
    for (const entry of plan.entries) {
      const directorySkill = entry.category === "skill" && this.fs.exists(nodePath.join(entry.absolutePath, "SKILL.md"));
      if (entry.classification === "no_op" && !directorySkill) {
        skipped.push(entry.effectiveId);
        continue;
      }
      try {
        if (this.projectEntry(entry, binding, warnings)) projected.push(entry.effectiveId);
        else skipped.push(entry.effectiveId);
      } catch (err) {
        failed.push({ effectiveId: entry.effectiveId, error: (err as Error).message });
      }
    }
    return { projected, skipped, failed, ...(warnings.length ? { warnings } : {}) };
  }

  async deliverStartup(files: ResolvedStartupFile[], binding: NodeBinding, sendInteractiveText?: (text: string) => Promise<void>): Promise<StartupDeliveryResult> {
    const warnings: string[] = [];
    const failed: Array<{ path: string; error: string }> = [];
    let delivered = 0;
    for (const file of files) {
      try {
        const content = this.fs.readFile(file.absolutePath);
        const hint = file.deliveryHint === "auto" ? resolveConcreteHint(file.path, content) : file.deliveryHint;
        if (hint === "guidance_merge") {
          if (!this.mergeGuidance(nodePath.join(binding.cwd, "AGENTS.md"), file.path, content, warnings)) continue;
        } else if (hint === "skill_install") {
          const dir = nodePath.join(binding.cwd, ".agents", "skills", nodePath.basename(nodePath.dirname(file.absolutePath)));
          this.fs.mkdirp(dir);
          this.fs.writeFile(nodePath.join(dir, nodePath.basename(file.path)), content);
        } else if (binding.tmuxSession) {
          if (sendInteractiveText) {
            await sendInteractiveText(content);
          } else {
            const sent = await this.tmux.sendText(binding.tmuxSession, content);
            if (!sent.ok) throw new Error(sent.message);
            await this.sleep(200);
            const submit = await this.tmux.sendKeys(binding.tmuxSession, ["Enter"]);
            if (!submit.ok) throw new Error(submit.message);
          }
          // Asynchronously mirror startup prompt to Antigravity IDE conversation
          try {
            const { AntigravityAgentApiMirror } = await import("./antigravity-agentapi-mirror.js");
            const mirror = new AntigravityAgentApiMirror({ configProjectsDir: this.configProjectsDir });
            mirror.sendMessage(binding.tmuxSession, content).catch(() => {});
          } catch {
            // best-effort
          }
        }
        delivered++;
      } catch (err) {
        if (file.required) failed.push({ path: file.path, error: (err as Error).message });
      }
    }
    return { delivered, failed, ...(warnings.length ? { warnings } : {}) };
  }

  async launchHarness(
    binding: NodeBinding,
    opts: { name: string; resumeToken?: string; forkSource?: ForkSource },
  ): Promise<HarnessLaunchResult> {
    if (!binding.tmuxSession) return { ok: false, error: "No tmux session bound — cannot launch the Antigravity harness" };
    if (opts.resumeToken && opts.forkSource) return { ok: false, error: "resumeToken and forkSource are mutually exclusive — pick one" };
    if (opts.forkSource) {
      return { ok: false, error: "antigravity runtime has no native fork primitive; remove session_source for antigravity members" };
    }
    if (opts.resumeToken) {
      const validation = validateResumeToken(this.runtime, opts.resumeToken);
      if (!validation.ok) return { ok: false, error: `antigravity resume: ${validation.error}` };
      if (!this.fs.exists(nodePath.join(this.home, "conversations", `${validation.token}.db`))) {
        return { ok: false, error: "antigravity resume: the conversation no longer exists", recovery: "retry_fresh", missingConversation: true };
      }
    }

    this.trustWorkspace(binding.cwd);
    this.ensureAntigravityActivityHooks(binding.cwd);
    const before = this.listConversationIds();
    const bypass = yoloEnabled(process.env, binding.launchPosture);
    const model = binding.model ?? this.defaultModel;
    const parts = [this.binary];
    if (model) parts.push("--model", shellQuote(model));
    if (binding.effort) parts.push("--effort", shellQuote(binding.effort));
    parts.push("--mode", bypass || binding.launchPosture === "auto" ? "auto" : "accept-edits");
    if (bypass) parts.push("--dangerously-skip-permissions");

    const podName = opts.name && opts.name.includes("@")
      ? opts.name.split("@")[1]!
      : (binding.nodeId && binding.nodeId.includes(".") ? binding.nodeId.split(".")[0]! : opts.name || "default");
    const projectId = this.findOrCreateProject(podName, binding.cwd);
    parts.push("--project", shellQuote(projectId));

    if (opts.resumeToken) parts.push("--conversation", shellQuote(opts.resumeToken));

    const sent = await this.tmux.sendShellCommand(binding.tmuxSession, parts.join(" "), undefined, { stageIfLong: true, execInScript: true });
    if (!sent.ok) return { ok: false, error: `Failed to send launch command: ${sent.message}` };

    const ready = await this.waitForReady(binding.tmuxSession);
    if (!ready.ready) {
      const pane = (await this.tmux.capturePaneContent(binding.tmuxSession, 40)) ?? "";
      return {
        ok: false,
        error: `antigravity launch failed: ${ready.reason ?? "not ready"}`,
        recovery: "attention_required",
        evidence: pane.split("\n").slice(-12).join("\n"),
      };
    }
    // Asynchronously ensure a mirrored conversation in Antigravity IDE
    try {
      const { AntigravityAgentApiMirror } = await import("./antigravity-agentapi-mirror.js");
      const mirror = new AntigravityAgentApiMirror({ configProjectsDir: this.configProjectsDir });
      mirror.ensureConversation(binding.tmuxSession, {
        rig: podName,
        pod: podName,
        role: opts.name,
        cwd: binding.cwd,
        model,
        prompt: `OpenRig agent online: ${opts.name || binding.tmuxSession}\nSession: ${binding.tmuxSession}\nRig/Pod: ${podName}\nRole: ${opts.name}\nDirectory: ${binding.cwd}\nReady for interaction and task dispatch.`
      }).catch(() => {});
    } catch {
      // best-effort
    }

    if (opts.resumeToken) return { ok: true, resumeToken: opts.resumeToken, resumeType: "antigravity_id" };
    // A fresh conversation's database is created lazily; capture it if it already exists.
    const created = await this.captureNewConversation(before);
    return created ? { ok: true, resumeToken: created, resumeType: "antigravity_id" } : { ok: true };
  }

  async checkReady(binding: NodeBinding): Promise<ReadinessResult> {
    if (!binding.tmuxSession) return { ready: false, reason: "No tmux session bound" };
    if (!(await this.tmux.hasSession(binding.tmuxSession))) return { ready: false, reason: "tmux session not responsive" };
    const paneCommand = (await this.tmux.getPaneCommand(binding.tmuxSession)) ?? "";
    if (SHELL_COMMANDS.has(paneCommand)) {
      return { ready: false, reason: "pane is at a shell; the agy process is not running", code: "awaiting_runtime" };
    }
    const content = (await this.tmux.capturePaneContent(binding.tmuxSession, 40)) ?? "";
    if (TRUST_GATE_RE.test(content)) return { ready: false, reason: "agy is asking to trust the workspace", code: "trust_gate" };
    if (LOGIN_GATE_RE.test(content) && !/\bagy\b.*>/.test(content)) {
      return { ready: false, reason: "agy requires sign-in; run `agy` once interactively to authenticate", code: "login_required" };
    }
    if (content.trim().length === 0) return { ready: false, reason: "agy has not rendered yet", code: "awaiting_runtime" };
    return { ready: true };
  }

  // ── internals ──────────────────────────────────────────────────────────────

  private async waitForReady(session: string): Promise<ReadinessResult> {
    let last: ReadinessResult = { ready: false, reason: "agy has not rendered yet", code: "awaiting_runtime" };
    for (let attempt = 0; attempt < 60; attempt++) {
      last = await this.checkReady({ tmuxSession: session } as NodeBinding);
      if (last.ready || (last.code && last.code !== "awaiting_runtime")) return last;
      await this.sleep(250);
    }
    return last;
  }

  private listConversationIds(): Set<string> {
    const ids = new Set<string>();
    const dir = nodePath.join(this.home, "conversations");
    if (!this.fs.listDir || !this.fs.exists(dir)) return ids;
    for (const name of this.fs.listDir(dir)) {
      const m = CONVERSATION_FILE_RE.exec(name);
      if (m) ids.add(m[1]!.toLowerCase());
    }
    return ids;
  }

  private async captureNewConversation(before: Set<string>): Promise<string | null> {
    for (let attempt = 0; attempt < 20; attempt++) {
      for (const id of this.listConversationIds()) if (!before.has(id)) return id;
      await this.sleep(250);
    }
    return null;
  }

  /** Pre-trust the seat workspace so agy does not stop at its trust prompt. */
  private trustWorkspace(cwd: string): void {
    const settingsPath = nodePath.join(this.home, "settings.json");
    try {
      const settings = this.fs.exists(settingsPath)
        ? (JSON.parse(this.fs.readFile(settingsPath)) as Record<string, unknown>)
        : {};
      const trusted = Array.isArray(settings["trustedWorkspaces"]) ? (settings["trustedWorkspaces"] as string[]) : [];
      if (trusted.includes(cwd)) return;
      this.fs.mkdirp(this.home);
      this.fs.writeFile(settingsPath, JSON.stringify({ ...settings, trustedWorkspaces: [...trusted, cwd] }, null, 2));
    } catch {
      // Best-effort: a trust prompt is surfaced as attention_required by checkReady.
    }
  }

  private projectEntry(entry: ProjectionEntry, binding: NodeBinding, warnings: string[]): boolean {
    if (entry.category === "guidance" && entry.mergeStrategy === "managed_block") {
      return this.mergeGuidance(nodePath.join(binding.cwd, "AGENTS.md"), entry.effectiveId, this.fs.readFile(entry.absolutePath), warnings);
    }
    if (entry.category === "skill") {
      const targetDir = nodePath.join(binding.cwd, ".agents", "skills", entry.effectiveId);
      this.fs.mkdirp(targetDir);
      let files: string[] = [];
      if (this.fs.listFiles) {
        try { files = this.fs.listFiles(entry.absolutePath); } catch { files = []; }
      }
      if (files.length > 0) {
        for (const file of files) {
          const dest = nodePath.join(targetDir, file);
          this.fs.mkdirp(nodePath.dirname(dest));
          this.fs.writeFile(dest, this.fs.readFile(nodePath.join(entry.absolutePath, file)));
        }
      } else {
        this.fs.writeFile(nodePath.join(targetDir, nodePath.basename(entry.absolutePath)), this.fs.readFile(entry.absolutePath));
      }
      return true;
    }
    return false;
  }

  private mergeGuidance(targetPath: string, blockId: string, content: string, warnings: string[]): boolean {
    // Per-seat rig-role content collides across pod-mates in a shared cwd; it is delivered via send_text.
    if (blockId === "rig-role") return false;
    mergeManagedBlock(this.fs, targetPath, blockId, content, {
      warnings,
      replaceBlockIds: blockId === "openrig-start.md" ? ["using-openrig.md"] : [],
    });
    return true;
  }

  /**
   * Ensure the project named "OpenRig - <podName>" exists in ~/.gemini/config/projects/,
   * creating its configuration file if missing.
   */
  findOrCreateProject(podName: string, cwd: string): string {
    const rawPod = (podName || "workspace").trim();
    const targetName = rawPod.startsWith("OpenRig - ") ? rawPod : `OpenRig - ${rawPod}`;
    try {
      this.fs.mkdirp(this.configProjectsDir);
      const files = this.fs.listDir ? this.fs.listDir(this.configProjectsDir) : [];
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        try {
          const content = this.fs.readFile(nodePath.join(this.configProjectsDir, file));
          const parsed = JSON.parse(content) as { id?: string; name?: string };
          if (parsed && parsed.name === targetName && parsed.id) {
            return parsed.id;
          }
        } catch {
          // ignore corrupted or unreadable project file
        }
      }
    } catch {
      // ignore
    }

    // Not found — create a new project
    const newId = randomUUID();
    const newProject = {
      id: newId,
      name: targetName,
      projectResources: {
        resources: [
          {
            gitFolder: {
              folderUri: `file://${nodePath.resolve(cwd)}`,
            },
          },
        ],
      },
      permissionGrants: {
        v2Migrated: true,
      },
      settings: {},
      isWorkspaceOnly: false,
    };

    try {
      this.fs.mkdirp(this.configProjectsDir);
      this.fs.writeFile(
        nodePath.join(this.configProjectsDir, `${newId}.json`),
        JSON.stringify(newProject, null, 2),
      );
    } catch {
      // Best-effort
    }

    return newId;
  }

  /**
   * Project Antigravity lifecycle hooks (.agents/hooks.json) wired to activity-relay.cjs
   * for PreInvocation, PostInvocation, PreToolUse, PostToolUse, and Stop.
   */
  ensureAntigravityActivityHooks(cwd: string): void {
    if (!this.activityRelayPath) return;
    const hooksDir = nodePath.join(cwd, ".agents");
    const hooksPath = nodePath.join(hooksDir, "hooks.json");
    try {
      this.fs.mkdirp(hooksDir);
      const existing = this.fs.exists(hooksPath)
        ? (JSON.parse(this.fs.readFile(hooksPath)) as Record<string, unknown>)
        : {};

      const relay = this.activityRelayPath;
      existing["openrig-activity-relay"] = {
        PreInvocation: [
          {
            type: "command",
            command: `node "${relay}" --event PreInvocation`,
          },
        ],
        PostInvocation: [
          {
            type: "command",
            command: `node "${relay}" --event PostInvocation`,
          },
        ],
        PreToolUse: [
          {
            matcher: "*",
            hooks: [
              {
                type: "command",
                command: `node "${relay}" --event PreToolUse`,
              },
            ],
          },
        ],
        PostToolUse: [
          {
            matcher: "*",
            hooks: [
              {
                type: "command",
                command: `node "${relay}" --event PostToolUse`,
              },
            ],
          },
        ],
        Stop: [
          {
            type: "command",
            command: `node "${relay}" --event Stop`,
          },
        ],
      };

      this.fs.writeFile(hooksPath, JSON.stringify(existing, null, 2));
    } catch {
      // Best-effort
    }
  }
}

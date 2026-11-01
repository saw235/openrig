// First-class Google Antigravity runtime adapter (consolidated onto `agentapi`).
//
// Eliminates the legacy `agy` CLI TUI and the dual-conversation mirror split:
//   - guidance  -> <cwd>/AGENTS.md (managed block)
//   - skills    -> <cwd>/.agents/skills/<id>/
//   - hooks     -> <cwd>/.agents/hooks.json -> activity-relay.cjs
//   - launch    -> hosts `antigravity-runner.js` in the seat's tmux pane to tail
//                  `<appDataDir>/brain/<uuid>/.system_generated/logs/transcript.jsonl`
//   - Turn #1   -> `agentapi new-conversation [--model=<flash_lite|flash|pro>] --title=<...> <bootstrap>`
//                  delivered atomically by `sendInteractiveText()` on Step 6b
//   - Follow-up -> `agentapi send-message <uuid> <content>`

import nodePath from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import type { TmuxAdapter } from "./tmux.js";
import { shellQuote } from "./shell-quote.js";
import type {
  RuntimeAdapter,
  NodeBinding,
  ResolvedStartupFile,
  InstalledResource,
  ProjectionResult,
  StartupDeliveryResult,
  ReadinessResult,
  HarnessLaunchResult,
  ForkSource,
} from "../domain/runtime-adapter.js";
import { resolveConcreteHint } from "../domain/runtime-adapter.js";
import type { ProjectionPlan, ProjectionEntry } from "../domain/projection-planner.js";
import { validateResumeToken } from "../domain/resume-token-validation.js";
import { mergeManagedBlock } from "../domain/managed-blocks.js";
import {
  AgentApiClient,
  type AgentApiExecFn,
  resolveAgentApiBinary,
  resolveAntigravityAppDataDir,
} from "./antigravity-agentapi-client.js";
import {
  antigravityRunnerStatePath,
  parseAntigravityRunnerState,
  type AntigravityRunnerState,
} from "./antigravity-runner.js";

const SHELL_COMMANDS = new Set(["bash", "fish", "nu", "sh", "tmux", "zsh"]);

export interface AntigravityFsOps {
  readFile(path: string): string;
  writeFile(path: string, content: string): void;
  exists(path: string): boolean;
  mkdirp(path: string): void;
  listFiles?(dirPath: string): string[];
  listDir?(dirPath: string): string[];
}

export interface AntigravityRuntimeAdapterDeps {
  tmux: TmuxAdapter;
  fsOps: AntigravityFsOps;
  /** Antigravity IDE app data root. Default: ~/.gemini/antigravity */
  appDataDir?: string;
  /** OpenRig home directory. Default: ~/.openrig */
  openrigHome?: string;
  /** State root for per-seat runner sidecars. Default: <openrigHome>/state/antigravity */
  stateRoot?: string;
  /** Compiled antigravity-runner.js entry path. When omitted (hermetic unit tests), uses in-memory/fs sidecar readiness. */
  runnerEntryPath?: string;
  /** Path to `agentapi` executable. Default: <appDataDir>/bin/agentapi */
  agentapiBinary?: string;
  /** Optional pre-configured AgentApiClient (or custom exec hook for tests). */
  client?: AgentApiClient;
  execFileAsync?: AgentApiExecFn;
  sleep?: (ms: number) => Promise<void>;
  /** Default model when the seat does not specify one (omitted = Antigravity IDE default). */
  defaultModel?: string;
  /** Path to activity-relay.cjs script to wire Antigravity lifecycle hooks. */
  activityRelayPath?: string;
  /** Directory where Antigravity project JSON files live (~/.gemini/config/projects). */
  configProjectsDir?: string;
  newLaunchId?: () => string;
}

export class AntigravityRuntimeAdapter implements RuntimeAdapter {
  readonly runtime = "antigravity";
  readonly client: AgentApiClient;
  private readonly tmux: TmuxAdapter;
  private readonly fs: AntigravityFsOps;
  private readonly appDataDir: string;
  private readonly openrigHome: string;
  private readonly stateRoot: string;
  private readonly runnerEntryPath?: string;
  private readonly agentapiBinary: string;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly defaultModel?: string;
  private readonly activityRelayPath?: string;
  private readonly newLaunchId: () => string;

  constructor(deps: AntigravityRuntimeAdapterDeps) {
    this.tmux = deps.tmux;
    this.fs = deps.fsOps;
    this.appDataDir = resolveAntigravityAppDataDir({ appDataDir: deps.appDataDir });
    this.agentapiBinary = resolveAgentApiBinary({
      agentapiBinary: deps.agentapiBinary,
      appDataDir: this.appDataDir,
    });
    this.openrigHome =
      deps.openrigHome ??
      process.env["OPENRIG_HOME"]?.trim() ??
      nodePath.join(os.homedir(), ".openrig");
    this.stateRoot = deps.stateRoot ?? nodePath.join(this.openrigHome, "state", "antigravity");
    this.runnerEntryPath = deps.runnerEntryPath;
    this.sleep = deps.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.defaultModel = deps.defaultModel;
    this.activityRelayPath = deps.activityRelayPath;
    this.newLaunchId = deps.newLaunchId ?? (() => randomUUID());

    this.client =
      deps.client ??
      new AgentApiClient({
        agentapiBinary: this.agentapiBinary,
        appDataDir: this.appDataDir,
        openrigHome: this.openrigHome,
        configProjectsDir:
          deps.configProjectsDir ?? nodePath.join(os.homedir(), ".gemini", "config", "projects"),
        fsOps: this.fs,
        execFileAsync: deps.execFileAsync,
      });
  }

  skillTargetPath(_tmuxSession: string | null, _effectiveId: string): string | null {
    return null; // skills live in the seat cwd (.agents/skills); instantiator default applies
  }

  async listInstalled(binding: NodeBinding): Promise<InstalledResource[]> {
    const results: InstalledResource[] = [];
    const skillsDir = nodePath.join(binding.cwd, ".agents", "skills");
    if (this.fs.exists(skillsDir) && this.fs.listFiles) {
      for (const file of this.fs.listFiles(skillsDir)) {
        results.push({
          effectiveId: file,
          category: "skill",
          installedPath: nodePath.join(skillsDir, file),
        });
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
      const directorySkill =
        entry.category === "skill" && this.fs.exists(nodePath.join(entry.absolutePath, "SKILL.md"));
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

  async deliverStartup(
    files: ResolvedStartupFile[],
    binding: NodeBinding,
    sendInteractiveText?: (text: string) => Promise<void>,
  ): Promise<StartupDeliveryResult> {
    const warnings: string[] = [];
    const failed: Array<{ path: string; error: string }> = [];
    let delivered = 0;
    for (const file of files) {
      try {
        const content = this.fs.readFile(file.absolutePath);
        const hint = file.deliveryHint === "auto" ? resolveConcreteHint(file.path, content) : file.deliveryHint;
        if (hint === "guidance_merge") {
          if (!this.mergeGuidance(nodePath.join(binding.cwd, "AGENTS.md"), file.path, content, warnings)) {
            continue;
          }
        } else if (hint === "skill_install") {
          const dir = nodePath.join(
            binding.cwd,
            ".agents",
            "skills",
            nodePath.basename(nodePath.dirname(file.absolutePath)),
          );
          this.fs.mkdirp(dir);
          this.fs.writeFile(nodePath.join(dir, nodePath.basename(file.path)), content);
        } else if (binding.tmuxSession) {
          if (sendInteractiveText) {
            await sendInteractiveText(content);
          } else {
            const direct = await this.sendInteractiveText(binding, content);
            if (!direct.ok) throw new Error(direct.error);
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
    if (!binding.tmuxSession) {
      return { ok: false, error: "No tmux session bound — cannot launch the Antigravity harness" };
    }
    if (opts.resumeToken && opts.forkSource) {
      return { ok: false, error: "resumeToken and forkSource are mutually exclusive — pick one" };
    }
    if (opts.forkSource) {
      return {
        ok: false,
        error: "antigravity runtime has no native fork primitive; remove session_source for antigravity members",
      };
    }

    let validatedResumeToken: string | null = null;
    if (opts.resumeToken) {
      const validation = validateResumeToken(this.runtime, opts.resumeToken);
      if (!validation.ok) return { ok: false, error: `antigravity resume: ${validation.error}` };
      const exists = await this.client.conversationExists(validation.token);
      if (!exists) {
        return {
          ok: false,
          error: "antigravity resume: the conversation no longer exists",
          recovery: "retry_fresh",
          missingConversation: true,
        };
      }
      validatedResumeToken = validation.token;
    }

    this.ensureAntigravityActivityHooks(binding.cwd);

    const sessionName = binding.tmuxSession;
    const rigOrPod = sessionName.includes("@")
      ? sessionName.split("@")[1]!
      : binding.nodeId && binding.nodeId.includes(".")
        ? binding.nodeId.split(".")[0]!
        : opts.name || "default";
    const projectId = this.findOrCreateProject(rigOrPod, binding.cwd);

    const envNodeId = await this.readSessionEnvSafe(sessionName, "OPENRIG_NODE_ID");
    const envGeneration = await this.readSessionEnvSafe(sessionName, "OPENRIG_OCCUPANT_GENERATION");
    const nodeId = envNodeId || binding.nodeId || opts.name || sessionName;
    const occupantGeneration = binding.launchGeneration ?? envGeneration ?? null;
    const model = binding.model ?? this.defaultModel;
    const title = opts.name
      ? `OpenRig: ${opts.name} (${rigOrPod})`
      : `OpenRig: ${sessionName}`;

    const statePath = antigravityRunnerStatePath(this.stateRoot, sessionName);
    const initialState: AntigravityRunnerState = {
      launchId: this.newLaunchId(),
      sessionName,
      nodeId,
      occupantGeneration,
      projectId,
      cwd: binding.cwd,
      title,
      ...(model ? { model } : {}),
      conversationId: validatedResumeToken,
      status: this.runnerEntryPath ? "starting" : "ready",
      updatedAt: new Date().toISOString(),
    };
    this.writeRunnerState(statePath, initialState);

    if (validatedResumeToken) {
      this.client.registerSeatConversation({
        conversationId: validatedResumeToken,
        sessionName,
        nodeId,
        occupantGeneration,
        projectId,
        cwd: binding.cwd,
        title,
      });
    }

    if (this.runnerEntryPath) {
      if (!this.fs.exists(this.runnerEntryPath)) {
        return {
          ok: false,
          error: `antigravity runner entry missing at ${this.runnerEntryPath}`,
        };
      }
      const cmdParts = [
        shellQuote(process.execPath),
        shellQuote(this.runnerEntryPath),
        "--state-file",
        shellQuote(statePath),
        "--app-data-dir",
        shellQuote(this.appDataDir),
        "--agentapi-bin",
        shellQuote(this.agentapiBinary),
        "--openrig-home",
        shellQuote(this.openrigHome),
      ];
      const sent = await this.tmux.sendShellCommand(
        sessionName,
        `exec ${cmdParts.join(" ")}`,
        undefined,
        { stageIfLong: true },
      );
      if (!sent.ok) {
        return { ok: false, error: `Failed to launch antigravity runner: ${sent.message}` };
      }

      const ready = await this.waitForReady(binding);
      if (!ready.ready) {
        const pane = (await this.tmux.capturePaneContent(sessionName, 40)) ?? "";
        return {
          ok: false,
          error: `antigravity launch failed: ${ready.reason ?? "runner not ready"}`,
          recovery: "attention_required",
          evidence: pane.split("\n").slice(-12).join("\n"),
        };
      }
    }

    if (validatedResumeToken) {
      return { ok: true, resumeToken: validatedResumeToken, resumeType: "antigravity_id" };
    }
    return { ok: true };
  }

  async checkReady(binding: NodeBinding): Promise<ReadinessResult> {
    if (!binding.tmuxSession) return { ready: false, reason: "No tmux session bound" };
    if (!(await this.tmux.hasSession(binding.tmuxSession))) {
      return { ready: false, reason: "tmux session not responsive" };
    }

    const statePath = antigravityRunnerStatePath(this.stateRoot, binding.tmuxSession);
    const runnerState = this.readRunnerState(statePath);

    if (this.runnerEntryPath) {
      const paneCommand = (await this.tmux.getPaneCommand(binding.tmuxSession)) ?? "";
      if (SHELL_COMMANDS.has(paneCommand)) {
        return {
          ready: false,
          reason: "pane is at a shell; the antigravity runner is not running",
          code: "awaiting_runtime",
        };
      }
    }

    if (!runnerState) {
      if (!this.runnerEntryPath && this.client.isAvailable()) {
        return { ready: true };
      }
      return {
        ready: false,
        reason: "antigravity runner state sidecar has not materialized yet",
        code: "awaiting_runtime",
      };
    }

    if (runnerState.status === "error") {
      return {
        ready: false,
        reason: runnerState.error ?? "antigravity runner reported an error",
        code: "login_required",
      };
    }
    if (runnerState.status === "exited") {
      return {
        ready: false,
        reason: "antigravity runner exited",
        code: "awaiting_runtime",
      };
    }
    if (runnerState.status !== "ready") {
      return {
        ready: false,
        reason: "antigravity runner is still starting",
        code: "awaiting_runtime",
      };
    }
    return { ready: true };
  }

  /**
   * Direct programmatic `agentapi` prompt delivery called by StartupOrchestrator.
   * On fresh launch (`conversationId === null`), creates the single canonical
   * Antigravity IDE conversation with the full OpenRig bootstrap prompt as Turn #1.
   * On subsequent prompts or restored seats, sends via `agentapi send-message`.
   */
  async sendInteractiveText(
    binding: NodeBinding,
    text: string,
  ): Promise<{ ok: true; resumeToken?: string; resumeType?: string } | { ok: false; error: string }> {
    const sessionName = binding.tmuxSession;
    if (!sessionName) {
      return { ok: false, error: "No tmux session bound for Antigravity interactive delivery" };
    }

    const statePath = antigravityRunnerStatePath(this.stateRoot, sessionName);
    const state = this.readRunnerState(statePath);
    const rigOrPod = sessionName.includes("@") ? sessionName.split("@")[1]! : "workspace";
    const projectId = state?.projectId ?? this.findOrCreateProject(rigOrPod, binding.cwd);
    const title = state?.title ?? `OpenRig: ${sessionName}`;
    const model = binding.model ?? state?.model ?? this.defaultModel;
    const nodeId = state?.nodeId ?? binding.nodeId ?? sessionName;
    const occupantGeneration = state?.occupantGeneration ?? binding.launchGeneration ?? null;

    if (!state?.conversationId) {
      const created = await this.client.newConversation({
        projectId,
        title,
        model,
        prompt: text,
      });
      if (!created.ok) {
        return { ok: false, error: created.error };
      }

      const nextState: AntigravityRunnerState = {
        launchId: state?.launchId ?? this.newLaunchId(),
        sessionName,
        nodeId,
        occupantGeneration,
        projectId,
        cwd: binding.cwd,
        title,
        ...(model ? { model } : {}),
        conversationId: created.conversationId,
        status: state?.status ?? "ready",
        ...(state?.pid ? { pid: state.pid } : {}),
        updatedAt: new Date().toISOString(),
      };
      this.writeRunnerState(statePath, nextState);
      this.client.registerSeatConversation({
        conversationId: created.conversationId,
        sessionName,
        nodeId,
        occupantGeneration,
        projectId,
        cwd: binding.cwd,
        title,
      });

      return {
        ok: true,
        resumeToken: created.conversationId,
        resumeType: "antigravity_id",
      };
    }

    const sent = await this.client.sendMessage(state.conversationId, text);
    if (!sent.ok) {
      return { ok: false, error: sent.error };
    }
    return {
      ok: true,
      resumeToken: state.conversationId,
      resumeType: "antigravity_id",
    };
  }

  getConversationIdForSession(sessionName: string): string | null {
    const statePath = antigravityRunnerStatePath(this.stateRoot, sessionName);
    const state = this.readRunnerState(statePath);
    if (state?.conversationId) return state.conversationId;
    return this.client.lookupBySessionName(sessionName)?.conversationId ?? null;
  }

  /** Ensure project `"OpenRig - <podName>"` exists in `~/.gemini/config/projects/`. */
  findOrCreateProject(podName: string, cwd: string): string {
    return this.client.resolveOrCreateProject(cwd, podName);
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
      const nodeBin = process.execPath || "node";
      existing["openrig-activity-relay"] = {
        PreInvocation: [
          {
            type: "command",
            command: `"${nodeBin}" "${relay}" --event PreInvocation`,
          },
        ],
        PostInvocation: [
          {
            type: "command",
            command: `"${nodeBin}" "${relay}" --event PostInvocation`,
          },
        ],
        PreToolUse: [
          {
            matcher: "*",
            hooks: [
              {
                type: "command",
                command: `"${nodeBin}" "${relay}" --event PreToolUse`,
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
                command: `"${nodeBin}" "${relay}" --event PostToolUse`,
              },
            ],
          },
        ],
        Stop: [
          {
            type: "command",
            command: `"${nodeBin}" "${relay}" --event Stop`,
          },
        ],
      };

      this.fs.writeFile(hooksPath, JSON.stringify(existing, null, 2));
    } catch {
      // Best-effort
    }
  }

  // ── internals ──────────────────────────────────────────────────────────────

  private async waitForReady(binding: NodeBinding): Promise<ReadinessResult> {
    let last: ReadinessResult = {
      ready: false,
      reason: "antigravity runner has not started yet",
      code: "awaiting_runtime",
    };
    for (let attempt = 0; attempt < 60; attempt++) {
      last = await this.checkReady(binding);
      if (last.ready || (last.code && last.code !== "awaiting_runtime")) return last;
      await this.sleep(150);
    }
    return last;
  }

  private readRunnerState(statePath: string): AntigravityRunnerState | null {
    try {
      if (!this.fs.exists(statePath)) return null;
      return parseAntigravityRunnerState(this.fs.readFile(statePath));
    } catch {
      return null;
    }
  }

  private writeRunnerState(statePath: string, state: AntigravityRunnerState): void {
    try {
      this.fs.mkdirp(nodePath.dirname(statePath));
      this.fs.writeFile(statePath, JSON.stringify(state, null, 2));
    } catch {
      // Best-effort
    }
  }

  private async readSessionEnvSafe(session: string, key: string): Promise<string | undefined> {
    try {
      const fn = (this.tmux as unknown as { getSessionEnv?: (s: string, k: string) => Promise<string | undefined> })
        .getSessionEnv;
      if (typeof fn === "function") return await fn.call(this.tmux, session, key);
    } catch {
      // ignore missing mock / tmux env lookup failure
    }
    return undefined;
  }

  private projectEntry(entry: ProjectionEntry, binding: NodeBinding, warnings: string[]): boolean {
    if (entry.category === "guidance" && entry.mergeStrategy === "managed_block") {
      return this.mergeGuidance(
        nodePath.join(binding.cwd, "AGENTS.md"),
        entry.effectiveId,
        this.fs.readFile(entry.absolutePath),
        warnings,
      );
    }
    if (entry.category === "skill") {
      const targetDir = nodePath.join(binding.cwd, ".agents", "skills", entry.effectiveId);
      this.fs.mkdirp(targetDir);
      let files: string[] = [];
      if (this.fs.listFiles) {
        try {
          files = this.fs.listFiles(entry.absolutePath);
        } catch {
          files = [];
        }
      }
      if (files.length > 0) {
        for (const file of files) {
          const dest = nodePath.join(targetDir, file);
          this.fs.mkdirp(nodePath.dirname(dest));
          this.fs.writeFile(dest, this.fs.readFile(nodePath.join(entry.absolutePath, file)));
        }
      } else {
        this.fs.writeFile(
          nodePath.join(targetDir, nodePath.basename(entry.absolutePath)),
          this.fs.readFile(entry.absolutePath),
        );
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
}

import { describe, it, expect } from "vitest";
import { AntigravityRuntimeAdapter } from "../src/adapters/antigravity-runtime-adapter.js";
import {
  AgentApiClient,
  antigravityConversationsIndexPath,
  formatAntigravityTranscriptTail,
  mapModelToAgentApiTier,
} from "../src/adapters/antigravity-agentapi-client.js";
import { antigravityRunnerStatePath } from "../src/adapters/antigravity-runner.js";
import { selectVariant } from "../src/domain/kernel-boot.js";
import { validateResumeToken } from "../src/domain/resume-token-validation.js";
import type { NodeBinding } from "../src/domain/runtime-adapter.js";

const UUID = "03532f48-aedc-4f71-96fc-027b9b55716b";

interface ExecCall {
  file: string;
  args: readonly string[];
  env: NodeJS.ProcessEnv;
}

function harness(opts: {
  pane?: string;
  paneCommand?: string;
  withRunnerEntry?: boolean;
  runnerStatusOnLaunch?: "ready" | "error" | "starting";
  runnerError?: string;
  newConversationId?: string;
} = {}) {
  const files = new Map<string, string>([
    ["/app/bin/agentapi", "#!/bin/sh\n"],
  ]);
  if (opts.withRunnerEntry) {
    files.set("/daemon/dist/adapters/antigravity-runner.js", "// compiled runner\n");
  }
  const dirs = new Map<string, string[]>([
    ["/app/conversations", []],
    ["/gemini/projects", []],
  ]);
  const sentShellCommands: string[] = [];
  const execCalls: ExecCall[] = [];

  const fsOps = {
    readFile: (p: string) => {
      const v = files.get(p);
      if (v === undefined) throw new Error(`ENOENT: ${p}`);
      return v;
    },
    writeFile: (p: string, c: string) => {
      files.set(p, c);
    },
    exists: (p: string) => files.has(p) || dirs.has(p),
    mkdirp: () => {},
    listDir: (p: string) => dirs.get(p) ?? [],
  };

  const tmux = {
    hasSession: async () => true,
    getPaneCommand: async () => opts.paneCommand ?? "node",
    capturePaneContent: async () => opts.pane ?? "[AGENT] Ready",
    getSessionEnv: async (_s: string, key: string) => {
      if (key === "OPENRIG_NODE_ID") return "dev.impl";
      if (key === "OPENRIG_OCCUPANT_GENERATION") return "gen-123";
      return undefined;
    },
    sendShellCommand: async (sessionName: string, cmd: string) => {
      sentShellCommands.push(cmd);
      const statePath = antigravityRunnerStatePath("/openrig/state/antigravity", sessionName);
      const raw = files.get(statePath);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        parsed["status"] = opts.runnerStatusOnLaunch ?? "ready";
        if (opts.runnerError) parsed["error"] = opts.runnerError;
        files.set(statePath, JSON.stringify(parsed, null, 2));
      }
      return { ok: true };
    },
    sendText: async () => ({ ok: true }),
    sendKeys: async () => ({ ok: true }),
  };

  const execFileAsync = async (
    file: string,
    args: readonly string[],
    options: { env: NodeJS.ProcessEnv; timeout: number },
  ) => {
    execCalls.push({ file, args, env: options.env });
    if (args[0] === "new-conversation") {
      return {
        stdout: JSON.stringify({
          response: {
            newConversation: {
              conversationId: opts.newConversationId ?? UUID,
            },
          },
        }),
        stderr: "",
      };
    }
    if (args[0] === "send-message") {
      return { stdout: "{}", stderr: "" };
    }
    if (args[0] === "get-conversation-metadata") {
      return { stdout: "{}", stderr: "" };
    }
    return { stdout: "", stderr: "" };
  };

  const adapter = new AntigravityRuntimeAdapter({
    tmux: tmux as never,
    appDataDir: "/app",
    openrigHome: "/openrig",
    stateRoot: "/openrig/state/antigravity",
    ...(opts.withRunnerEntry ? { runnerEntryPath: "/daemon/dist/adapters/antigravity-runner.js" } : {}),
    configProjectsDir: "/gemini/projects",
    activityRelayPath: "/daemon/relay.cjs",
    execFileAsync,
    sleep: async () => {},
    fsOps,
  });

  return { adapter, files, dirs, sentShellCommands, execCalls, fsOps, execFileAsync };
}

const binding = (extra: Partial<NodeBinding> = {}) =>
  ({ cwd: "/work", tmuxSession: "dev-impl@rig", ...extra }) as NodeBinding;

describe("mapModelToAgentApiTier", () => {
  it("maps Argon, Pro, Flash, and Flash-Lite identifiers to agentapi TieredModelConfig", () => {
    expect(mapModelToAgentApiTier("argon")).toBe("pro");
    expect(mapModelToAgentApiTier("gemini-4-argon")).toBe("pro");
    expect(mapModelToAgentApiTier("gemini-4-argon-high")).toBe("pro");
    expect(mapModelToAgentApiTier("gemini-3-pro")).toBe("pro");
    expect(mapModelToAgentApiTier("pro")).toBe("pro");
    expect(mapModelToAgentApiTier("gemini-3.8-flash-medium")).toBe("flash");
    expect(mapModelToAgentApiTier("flash")).toBe("flash");
    expect(mapModelToAgentApiTier("flash_lite")).toBe("flash_lite");
    expect(mapModelToAgentApiTier("gemini-3.8-flash-lite")).toBe("flash_lite");
    expect(mapModelToAgentApiTier(undefined)).toBeUndefined();
    expect(mapModelToAgentApiTier("")).toBeUndefined();
    expect(mapModelToAgentApiTier("inherit")).toBeUndefined();
    expect(mapModelToAgentApiTier("default")).toBeUndefined();
  });
});

describe("AntigravityRuntimeAdapter (agentapi-only)", () => {
  it("stages antigravity-runner in tmux without invoking agy CLI and spawns conversation on Turn #1 bootstrap", async () => {
    const h = harness({ withRunnerEntry: true });
    const launchRes = await h.adapter.launchHarness(binding({ model: "gemini-4-argon" }), { name: "dev.impl" });
    expect(launchRes).toEqual({ ok: true });
    expect(h.sentShellCommands).toHaveLength(1);
    expect(h.sentShellCommands[0]).toContain("antigravity-runner.js");
    expect(h.sentShellCommands[0]).not.toContain("agy");
    // Zero wasted greeting turn during launchHarness
    expect(h.execCalls).toHaveLength(0);

    // Step 6b Turn #1: StartupOrchestrator delivers full OpenRig bootstrap prompt
    const turn1 = await h.adapter.sendInteractiveText(
      binding({ model: "gemini-4-argon" }),
      "BOOTSTRAP: session_identity + role.md + rig whoami --json + startup-proof",
    );
    expect(turn1).toEqual({
      ok: true,
      resumeToken: UUID,
      resumeType: "antigravity_id",
    });
    expect(h.execCalls).toHaveLength(1);
    expect(h.execCalls[0]!.file).toBe("/app/bin/agentapi");
    expect(h.execCalls[0]!.args).toEqual([
      "new-conversation",
      "--model=pro",
      "--title=OpenRig: dev.impl (rig)",
      "--",
      "BOOTSTRAP: session_identity + role.md + rig whoami --json + startup-proof",
    ]);
    expect(h.execCalls[0]!.env["ANTIGRAVITY_PROJECT_ID"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(h.execCalls[0]!.env["ANTIGRAVITY_CONVERSATION_ID"]).toBeUndefined();

    // Public conversation index written for CLI & hook auto-hydration (zero secrets)
    const indexRaw = h.files.get(antigravityConversationsIndexPath("/openrig"))!;
    const index = JSON.parse(indexRaw);
    expect(index.byConversationId[UUID]).toMatchObject({
      conversationId: UUID,
      sessionName: "dev-impl@rig",
      nodeId: "dev.impl",
      runtime: "antigravity",
      occupantGeneration: "gen-123",
      cwd: "/work",
    });
    expect(indexRaw).not.toContain("token");

    // Turn #2+: subsequent delivery uses agentapi send-message on the same conversation
    const turn2 = await h.adapter.sendInteractiveText(binding(), "Follow-up task");
    expect(turn2).toEqual({
      ok: true,
      resumeToken: UUID,
      resumeType: "antigravity_id",
    });
    expect(h.execCalls).toHaveLength(2);
    expect(h.execCalls[1]!.args).toEqual(["send-message", "--", UUID, "Follow-up task"]);
  });

  it("resumes an existing agentapi conversation and refuses a missing one", async () => {
    const h = harness({ withRunnerEntry: true });
    h.files.set(`/app/conversations/${UUID}.db`, "");
    const ok = await h.adapter.launchHarness(binding(), { name: "dev.impl", resumeToken: UUID });
    expect(ok).toEqual({ ok: true, resumeToken: UUID, resumeType: "antigravity_id" });

    // Resumed seat sends directly via send-message rather than new-conversation
    const followUp = await h.adapter.sendInteractiveText(binding(), "Restore preload");
    expect(followUp).toEqual({ ok: true, resumeToken: UUID, resumeType: "antigravity_id" });
    expect(h.execCalls).toHaveLength(1);
    expect(h.execCalls[0]!.args).toEqual(["send-message", "--", UUID, "Restore preload"]);

    const missing = await harness({ withRunnerEntry: true }).adapter.launchHarness(binding(), {
      name: "dev.impl",
      resumeToken: UUID,
    });
    expect(missing).toMatchObject({ ok: false, recovery: "retry_fresh", missingConversation: true });
  });

  it("refuses fork and resume+fork together", async () => {
    const h = harness();
    expect(
      await h.adapter.launchHarness(binding(), { name: "x", forkSource: { kind: "native_id", value: UUID } }),
    ).toMatchObject({ ok: false });
    expect(
      await h.adapter.launchHarness(binding(), { name: "x", resumeToken: UUID, forkSource: { kind: "last" } }),
    ).toMatchObject({ ok: false });
  });

  it("reports runner readiness gates accurately", async () => {
    const readyH = harness({ withRunnerEntry: true });
    await readyH.adapter.launchHarness(binding(), { name: "x" });
    expect(await readyH.adapter.checkReady(binding())).toEqual({ ready: true });

    const shellH = harness({ withRunnerEntry: true, paneCommand: "bash" });
    expect(await shellH.adapter.checkReady(binding())).toMatchObject({
      ready: false,
      code: "awaiting_runtime",
    });

    const errH = harness({
      withRunnerEntry: true,
      runnerStatusOnLaunch: "error",
      runnerError: "agentapi language server unreachable",
    });
    await errH.adapter.launchHarness(binding(), { name: "x" });
    expect(await errH.adapter.checkReady(binding())).toMatchObject({
      ready: false,
      code: "login_required",
    });
  });

  it("creates project config and projects hooks into .agents/hooks.json", () => {
    const h = harness();
    const projId = h.adapter.findOrCreateProject("dev-pod", "/workspace");
    expect(projId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    const createdJson = JSON.parse(h.files.get(`/gemini/projects/${projId}.json`)!);
    expect(createdJson.name).toBe("OpenRig - dev-pod");
    expect(createdJson.projectResources.resources[0].gitFolder.folderUri).toBe("file:///workspace");

    // Reusing existing project test
    h.dirs.set("/gemini/projects", [`${projId}.json`]);
    const reusedId = h.adapter.findOrCreateProject("dev-pod", "/workspace");
    expect(reusedId).toBe(projId);

    // Lifecycle hooks test
    h.adapter.ensureAntigravityActivityHooks("/workspace");
    const hooksJson = JSON.parse(h.files.get("/workspace/.agents/hooks.json")!);
    expect(hooksJson["openrig-activity-relay"]).toBeDefined();
    expect(hooksJson["openrig-activity-relay"].PreInvocation[0].command).toContain("relay.cjs");
    expect(hooksJson["openrig-activity-relay"].PreToolUse[0].matcher).toBe("*");
    expect(hooksJson["openrig-activity-relay"].Stop[0].command).toContain("relay.cjs");
  });

  it("formats brain transcript.jsonl turns for terminal capture", () => {
    const client = new AgentApiClient({ appDataDir: "/app", openrigHome: "/openrig" });
    const tPath = client.transcriptPath(UUID);
    const sample = [
      JSON.stringify({ type: "USER_INPUT", content: "<USER_REQUEST>Run whoami</USER_REQUEST>" }),
      JSON.stringify({
        type: "PLANNER_RESPONSE",
        tool_calls: [{ name: "run_command" }],
        content: "Orientation complete.",
      }),
    ].join("\n");

    const rendered = formatAntigravityTranscriptTail(tPath, 20, {
      exists: (p) => p === tPath,
      readFile: () => sample,
    });
    expect(rendered).toBe("[USER] Run whoami\n[TOOL] run_command\n[AGENT] Orientation complete.");
  });
});

describe("antigravity wiring", () => {
  it("kernel variant falls back to antigravity-only", () => {
    expect(selectVariant({ claudeCode: "unavailable", codex: "unavailable", antigravity: "ok" })).toBe(
      "rig-antigravity-only.yaml",
    );
    expect(selectVariant({ claudeCode: "ok", codex: "unavailable", antigravity: "ok" })).toBe(
      "rig-claude-only.yaml",
    );
  });

  it("validates conversation ids as resume tokens", () => {
    expect(validateResumeToken("antigravity", UUID)).toMatchObject({ ok: true, resumeType: "antigravity_id" });
    expect(validateResumeToken("antigravity", "../x")).toMatchObject({ ok: false });
  });
});

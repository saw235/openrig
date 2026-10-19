import { describe, it, expect } from "vitest";
import { AntigravityRuntimeAdapter } from "../src/adapters/antigravity-runtime-adapter.js";
import { selectVariant } from "../src/domain/kernel-boot.js";
import { validateResumeToken } from "../src/domain/resume-token-validation.js";
import type { NodeBinding } from "../src/domain/runtime-adapter.js";

const UUID = "03532f48-aedc-4f71-96fc-027b9b55716b";

function harness(opts: { pane?: string; paneCommand?: string; newConversationAfterLaunch?: boolean } = {}) {
  const files = new Map<string, string>();
  const dirs = new Map<string, string[]>([["/agy/conversations", []]]);
  const sent: string[] = [];
  const tmux = {
    hasSession: async () => true,
    getPaneCommand: async () => opts.paneCommand ?? "agy",
    capturePaneContent: async () => opts.pane ?? "Antigravity ready\n> ",
    sendShellCommand: async (_s: string, cmd: string) => {
      sent.push(cmd);
      if (opts.newConversationAfterLaunch) dirs.set("/agy/conversations", [`${UUID}.db`]);
      return { ok: true };
    },
    sendText: async () => ({ ok: true }),
    sendKeys: async () => ({ ok: true }),
  };
  const adapter = new AntigravityRuntimeAdapter({
    tmux: tmux as never,
    antigravityHome: "/agy",
    sleep: async () => {},
    fsOps: {
      readFile: (p) => { const v = files.get(p); if (v === undefined) throw new Error("ENOENT"); return v; },
      writeFile: (p, c) => { files.set(p, c); },
      exists: (p) => files.has(p) || dirs.has(p),
      mkdirp: () => {},
      listDir: (p) => dirs.get(p) ?? [],
    },
  });
  return { adapter, files, dirs, sent };
}

const binding = (extra: Partial<NodeBinding> = {}) =>
  ({ cwd: "/work", tmuxSession: "dev-impl@rig", ...extra }) as NodeBinding;

describe("AntigravityRuntimeAdapter", () => {
  it("launches agy with model, mode and captures the new conversation id", async () => {
    const h = harness({ newConversationAfterLaunch: true });
    const result = await h.adapter.launchHarness(binding({ model: "gemini-3-pro" }), { name: "x" });
    expect(h.sent[0]).toContain("agy --model 'gemini-3-pro' --mode accept-edits");
    expect(h.sent[0]).not.toContain("--dangerously-skip-permissions");
    expect(result).toMatchObject({ ok: true, resumeToken: UUID, resumeType: "antigravity_id" });
  });

  it("adds bypass flags at full_bypass posture", async () => {
    const h = harness();
    await h.adapter.launchHarness(binding({ launchPosture: "full_bypass" }), { name: "x" });
    expect(h.sent[0]).toContain("--mode auto");
    expect(h.sent[0]).toContain("--dangerously-skip-permissions");
  });

  it("pre-trusts the workspace in agy settings", async () => {
    const h = harness();
    await h.adapter.launchHarness(binding(), { name: "x" });
    expect(JSON.parse(h.files.get("/agy/settings.json")!).trustedWorkspaces).toContain("/work");
  });

  it("resumes an existing conversation and refuses a missing one", async () => {
    const h = harness();
    h.files.set(`/agy/conversations/${UUID}.db`, "");
    const ok = await h.adapter.launchHarness(binding(), { name: "x", resumeToken: UUID });
    expect(h.sent[0]).toContain(`--conversation '${UUID}'`);
    expect(ok).toMatchObject({ ok: true, resumeToken: UUID });

    const missing = await harness().adapter.launchHarness(binding(), { name: "x", resumeToken: UUID });
    expect(missing).toMatchObject({ ok: false, recovery: "retry_fresh", missingConversation: true });
  });

  it("refuses fork and resume+fork together", async () => {
    const h = harness();
    expect(await h.adapter.launchHarness(binding(), { name: "x", forkSource: { kind: "native_id", value: UUID } })).toMatchObject({ ok: false });
    expect(await h.adapter.launchHarness(binding(), { name: "x", resumeToken: UUID, forkSource: { kind: "last" } })).toMatchObject({ ok: false });
  });

  it("reports readiness gates", async () => {
    expect(await harness().adapter.checkReady(binding())).toEqual({ ready: true });
    expect(await harness({ paneCommand: "bash" }).adapter.checkReady(binding())).toMatchObject({ ready: false });
    expect(await harness({ pane: "Please sign in to continue" }).adapter.checkReady(binding())).toMatchObject({ code: "login_required" });
    expect(await harness({ pane: "Do you trust this folder?" }).adapter.checkReady(binding())).toMatchObject({ code: "trust_gate" });
  });

  it("creates project config and projects hooks into .agents/hooks.json", async () => {
    const files = new Map<string, string>();
    const dirs = new Map<string, string[]>([["/gemini/projects", []]]);
    const adapter = new AntigravityRuntimeAdapter({
      tmux: {
        hasSession: async () => true,
        getPaneCommand: async () => "agy",
        capturePaneContent: async () => "> ",
        sendShellCommand: async () => ({ ok: true }),
      } as never,
      antigravityHome: "/agy",
      configProjectsDir: "/gemini/projects",
      activityRelayPath: "/daemon/relay.cjs",
      sleep: async () => {},
      fsOps: {
        readFile: (p) => { const v = files.get(p); if (v === undefined) throw new Error("ENOENT: " + p); return v; },
        writeFile: (p, c) => { files.set(p, c); },
        exists: (p) => files.has(p) || dirs.has(p),
        mkdirp: () => {},
        listDir: (p) => dirs.get(p) ?? [],
      },
    });

    // Project creation test
    const projId = adapter.findOrCreateProject("dev-pod", "/workspace");
    expect(projId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    const createdJson = JSON.parse(files.get(`/gemini/projects/${projId}.json`)!);
    expect(createdJson.name).toBe("OpenRig - dev-pod");
    expect(createdJson.projectResources.resources[0].gitFolder.folderUri).toBe("file:///workspace");

    // Reusing existing project test
    dirs.set("/gemini/projects", [`${projId}.json`]);
    const reusedId = adapter.findOrCreateProject("dev-pod", "/workspace");
    expect(reusedId).toBe(projId);

    // Lifecycle hooks test
    adapter.ensureAntigravityActivityHooks("/workspace");
    const hooksJson = JSON.parse(files.get("/workspace/.agents/hooks.json")!);
    expect(hooksJson["openrig-activity-relay"]).toBeDefined();
    expect(hooksJson["openrig-activity-relay"].PreInvocation[0].command).toContain("relay.cjs");
    expect(hooksJson["openrig-activity-relay"].PreToolUse[0].matcher).toBe("*");
    expect(hooksJson["openrig-activity-relay"].Stop[0].command).toContain("relay.cjs");
  });
});

describe("antigravity wiring", () => {
  it("kernel variant falls back to antigravity-only", () => {
    expect(selectVariant({ claudeCode: "unavailable", codex: "unavailable", antigravity: "ok" })).toBe("rig-antigravity-only.yaml");
    expect(selectVariant({ claudeCode: "ok", codex: "unavailable", antigravity: "ok" })).toBe("rig-claude-only.yaml");
  });

  it("validates conversation ids as resume tokens", () => {
    expect(validateResumeToken("antigravity", UUID)).toMatchObject({ ok: true, resumeType: "antigravity_id" });
    expect(validateResumeToken("antigravity", "../x")).toMatchObject({ ok: false });
  });
});

import { describe, it, expect } from "vitest";
import {
  detectAntigravityLimitBanner,
  clearRecordedAntigravityBanner,
  recordAntigravityLimitBanner,
} from "../src/domain/provider/antigravity-limit-banner.js";
import { classifyPaneActivity } from "../src/domain/session-transport.js";
import { attachAgentActivity, attachTerminalActivityAndWork } from "../src/domain/node-inventory.js";
import { AgentActivityStore } from "../src/domain/agent-activity-store.js";
import { EventBus } from "../src/domain/event-bus.js";
import { createFullTestDb } from "./helpers/test-app.js";

const ANTIGRAVITY_QUOTA_PANE = [
  "  # Lead Agent Role",
  "",
  "  You are the Lead Engineer for the Antigravity Demo Team.",
  "  Your job is to coordinate tasks, review architecture, and implement features.",
  "",
  "⚠ Individual quota reached. Please upgrade your subscription to increase your",
  "limits. Resets in 139h40m37s.",
  "Error ID: 0f774f79-1f9a-44b7-9c01-f8c95301237c-3",
  "",
  "────────────────────────────────────────────────────────────────────────────────",
  ">",
  "────────────────────────────────────────────────────────────────────────────────",
  "? for shortcuts                                          Gemini 4 Argon · medium",
].join("\n");

const ANTIGRAVITY_IDLE_PANE = [
  "Done implementing feature. All tests passing.",
  "",
  "────────────────────────────────────────────────────────────────────────────────",
  ">",
  "────────────────────────────────────────────────────────────────────────────────",
  "? for shortcuts                                          Gemini 4 Argon · medium",
].join("\n");

describe("detectAntigravityLimitBanner", () => {
  it("matches the quota banner and extracts reset text", () => {
    const res = detectAntigravityLimitBanner(ANTIGRAVITY_QUOTA_PANE);
    expect(res).not.toBeNull();
    expect(res?.resetText).toBe("139h40m37s");
    expect(res?.evidence).toContain("Individual quota reached");
  });

  it("matches rate limit exceeded phrasing", () => {
    const pane = "Rate limit reached. Try again in 2m30s.\n>\n? for shortcuts";
    const res = detectAntigravityLimitBanner(pane);
    expect(res).not.toBeNull();
    expect(res?.resetText).toBe("2m30s");
  });

  it("ignores limit text inside fenced code blocks", () => {
    const fenced = "```\n⚠ Individual quota reached. Resets in 10m.\n```\n>\n? for shortcuts";
    expect(detectAntigravityLimitBanner(fenced)).toBeNull();
  });

  it("returns null for standard idle pane", () => {
    expect(detectAntigravityLimitBanner(ANTIGRAVITY_IDLE_PANE)).toBeNull();
  });
});

describe("classifyPaneActivity for Antigravity", () => {
  it("classifies agy idle prompt and footer as agent_idle", () => {
    const classification = classifyPaneActivity(ANTIGRAVITY_IDLE_PANE);
    expect(classification.state).toBe("agent_idle");
  });
});

describe("attachAgentActivity for Antigravity", () => {
  it("preserves usage_limit over live motion when at_limit event is present", async () => {
    const db = createFullTestDb();
    const eventBus = new EventBus(db);
    const store = new AgentActivityStore({
      db,
      eventBus,
      resolveOccupantGeneration: () => "gen-1",
    });

    const sessionName = "core-lead@test-rig";
    db.prepare(`
      INSERT INTO rigs (id, name) VALUES ('rig-1', 'test-rig')
    `).run();
    db.prepare(`
      INSERT INTO nodes (id, rig_id, logical_id, runtime)
      VALUES ('node-1', 'rig-1', 'core.lead', 'antigravity')
    `).run();
    db.prepare(`
      INSERT INTO sessions (id, node_id, session_name, status)
      VALUES ('sess-1', 'node-1', '${sessionName}', 'running')
    `).run();

    recordAntigravityLimitBanner({
      store,
      resolveGeneration: () => "gen-1",
      sessionName,
      banner: { resetText: "139h40m37s", evidence: "Individual quota reached" },
    });

    const entries = [{
      id: "node-1",
      rigId: "rig-1",
      logicalId: "core.lead",
      runtime: "antigravity",
      canonicalSessionName: sessionName,
      identityVerdict: null,
    }];

    const now = new Date();
    // Simulate motion running: isActiveWithinWindow = true
    const seatActivity = {
      getSeatActivity: () => ({
        isActiveWithinWindow: true,
        lastActivityAt: now.toISOString(),
        silenceWindowSeconds: 5,
        lastObservedAt: now.toISOString(),
      }),
    };

    const out = await attachAgentActivity(entries as any, {
      tmuxAdapter: {} as any,
      activityStore: store,
      seatActivity: seatActivity as any,
      now,
    });

    expect(out[0]?.agentActivity?.state).toBe("unknown");
    expect(out[0]?.agentActivity?.reason).toBe("usage_limit");
    expect(out[0]?.agentActivity?.rawEvent).toBe("at_limit");
  });

  it("does not override structural agent_idle to running for antigravity even with live motion", async () => {
    const now = new Date();
    const entries = [{
      id: "node-2",
      rigId: "rig-1",
      logicalId: "core.lead",
      runtime: "antigravity",
      canonicalSessionName: "core-lead@test-rig-2",
      identityVerdict: null,
    }];

    const seatActivity = {
      getSeatActivity: () => ({
        isActiveWithinWindow: true,
        lastActivityAt: now.toISOString(),
        silenceWindowSeconds: 5,
        lastObservedAt: now.toISOString(),
      }),
    };

    const structuralActivity = {
      getStructuralActivity: () => ({
        state: "agent_idle" as const,
        reason: "idle_prompt",
        evidence: ">",
        observedAt: now.toISOString(),
      }),
    };

    const out = await attachAgentActivity(entries as any, {
      tmuxAdapter: {} as any,
      structuralActivity: structuralActivity as any,
      seatActivity: seatActivity as any,
      now,
    });

    expect(out[0]?.agentActivity?.state).toBe("idle");
    expect(out[0]?.agentActivity?.reason).toBe("idle_prompt");
  });

  it("reconciles activityState with agentActivity in attachTerminalActivityAndWork", () => {
    const db = createFullTestDb();
    const mockSeatActivity = {
      getSeatActivity: () => ({
        paneId: "lead@antigravity-demo",
        isActiveWithinWindow: true,
        silenceWindowSeconds: 3,
        lastObservedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      }),
      getSeatStateBySession: () => ({
        seatNodeId: "node-1",
        activity: "working",
        needsInput: { count: 0, reason: null },
        needsInputEvidence: null,
        decidedBy: "window-sampling",
        seq: 1,
        changedAt: new Date().toISOString(),
        rungs: [],
        lastSwap: null,
      }),
    };

    const entry = {
      nodeId: "node-1",
      rigId: "rig-1",
      logicalId: "core.lead",
      canonicalSessionName: "lead@antigravity-demo",
      runtime: "antigravity",
      agentActivity: {
        state: "idle" as const,
        reason: "idle_status_bar",
        evidenceSource: "pane_heuristic",
        sampledAt: new Date().toISOString(),
        evidence: "? for shortcuts",
      },
      restoreOutcome: "clean",
    } as any;

    const attached = attachTerminalActivityAndWork([entry], {
      db,
      seatActivity: mockSeatActivity as any,
    });

    expect(attached[0]?.activityState?.display).toBe("idle");
    expect(attached[0]?.activityState?.activity).toBe("idle-at-prompt");
  });
});

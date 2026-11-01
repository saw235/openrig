import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createFullTestDb } from "./helpers/test-app.js";
import { startSidecarServer } from "../src/sidecar/sidecar-server.js";
import { AgentActivityStore } from "../src/domain/agent-activity-store.js";
import { EventBus } from "../src/domain/event-bus.js";
import { RigRepository } from "../src/domain/rig-repository.js";
import { SessionRegistry } from "../src/domain/session-registry.js";
import { WhoamiService } from "../src/domain/whoami-service.js";
import { TranscriptStore } from "../src/domain/transcript-store.js";
import { SessionTransport } from "../src/domain/session-transport.js";
import { AgentApiClient } from "../src/adapters/antigravity-agentapi-client.js";
import http from "node:http";

const require = createRequire(import.meta.url);
const {
  buildSessionIdentityPayload,
  buildOpenRigPayload,
} = require("../assets/plugins/openrig-core/hooks/scripts/activity-relay.cjs");

describe("Antigravity Activity Relay Integration", () => {
  const env = {
    OPENRIG_SESSION_NAME: "operator.agent@kernel",
    OPENRIG_NODE_ID: "operator.agent",
    OPENRIG_RUNTIME: "antigravity",
    OPENRIG_OCCUPANT_GENERATION: "gen-1",
  };

  it("extracts conversationId and PreInvocation event for Antigravity", () => {
    const payload = {
      conversationId: "8fb91cf0-cf7d-4aba-9e3a-b8d3b8257fb4",
      modelName: "gemini-2.5-pro",
    };
    const argv = ["node", "activity-relay.cjs", "--event", "PreInvocation"];

    const identity = buildSessionIdentityPayload(payload, env, () => new Date("2026-10-18T12:00:00Z"), argv);
    expect(identity).toMatchObject({
      eventFamily: "session_identity",
      sessionName: "operator.agent@kernel",
      nodeId: "operator.agent",
      runtime: "antigravity",
      sessionId: "8fb91cf0-cf7d-4aba-9e3a-b8d3b8257fb4",
      hookEvent: "PreInvocation",
    });

    const openrigPayload = buildOpenRigPayload(payload, env, () => new Date("2026-10-18T12:00:00Z"), argv);
    expect(openrigPayload).toMatchObject({
      sessionName: "operator.agent@kernel",
      runtime: "antigravity",
      hookEvent: "PreInvocation",
    });
  });

  it("extracts PreToolUse with toolCall.name and stepIdx", () => {
    const payload = {
      conversationId: "8fb91cf0-cf7d-4aba-9e3a-b8d3b8257fb4",
      toolCall: {
        name: "run_command",
        args: { CommandLine: "ls" },
      },
      stepIdx: 5,
    };
    const argv = ["node", "activity-relay.cjs", "--event", "PreToolUse"];

    const openrigPayload = buildOpenRigPayload(payload, env, () => new Date("2026-10-18T12:00:00Z"), argv);
    expect(openrigPayload).toMatchObject({
      sessionName: "operator.agent@kernel",
      hookEvent: "PreToolUse",
      subtype: "run_command",
      turnId: "5",
    });
  });

  it("auto-hydrates seat identity and occupantGeneration from ANTIGRAVITY_CONVERSATION_ID + conversations.json when OPENRIG_* env vars are absent", () => {
    const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "openrig-ag-relay-"));
    try {
      const convId = "15140af0-0c39-4131-88f9-4874882aaf12";
      const stateDir = path.join(tmpHome, "state", "antigravity");
      fs.mkdirSync(stateDir, { recursive: true });
      fs.writeFileSync(
        path.join(stateDir, "conversations.json"),
        JSON.stringify({
          byConversationId: {
            [convId]: {
              conversationId: convId,
              sessionName: "impl@demo-rig",
              nodeId: "node-ag-1",
              runtime: "antigravity",
              occupantGeneration: "gen-ag-99",
              projectId: "proj-1",
              cwd: "/tmp/demo",
              title: "OpenRig: impl (demo-rig)",
              updatedAt: "2026-10-31T12:00:00Z",
            },
          },
          bySessionName: {
            "impl@demo-rig": convId,
          },
        }),
        "utf-8",
      );

      const bareAgentApiEnv = {
        OPENRIG_HOME: tmpHome,
        ANTIGRAVITY_CONVERSATION_ID: convId,
      };
      const argv = ["node", "activity-relay.cjs", "--event", "PreInvocation"];
      const identity = buildSessionIdentityPayload({}, bareAgentApiEnv, () => new Date("2026-10-31T12:00:00Z"), argv);
      expect(identity).toMatchObject({
        eventFamily: "session_identity",
        sessionName: "impl@demo-rig",
        nodeId: "node-ag-1",
        conversationId: convId,
        runtime: "antigravity",
        generation: "gen-ag-99",
        sessionId: convId,
        hookEvent: "PreInvocation",
      });

      const hookPayload = buildOpenRigPayload(
        { toolCall: { name: "read_file" }, stepIdx: 2 },
        bareAgentApiEnv,
        () => new Date("2026-10-31T12:00:01Z"),
        ["node", "activity-relay.cjs", "--event", "PreToolUse"],
      );
      expect(hookPayload).toMatchObject({
        sessionName: "impl@demo-rig",
        nodeId: "node-ag-1",
        conversationId: convId,
        runtime: "antigravity",
        generation: "gen-ag-99",
        hookEvent: "PreToolUse",
        subtype: "read_file",
        turnId: "2",
      });
    } finally {
      fs.rmSync(tmpHome, { recursive: true, force: true });
    }
  });

  it("AgentActivityStore, WhoamiService, and SessionTransport resolve and deliver via agentapi conversationId", async () => {
    const db = createFullTestDb();
    try {
      const now = "2026-10-31T12:00:00.000Z";
      const convId = "99990af0-0c39-4131-88f9-4874882aaf12";
      const rigRepo = new RigRepository(db);
      const sessionRegistry = new SessionRegistry(db);
      const eventBus = new EventBus(db);

      const rig = rigRepo.createRig("demo-rig");
      const node = rigRepo.addNode(rig.id, "dev.impl", { runtime: "antigravity" });
      const session = sessionRegistry.registerSession(node.id, "dev-impl@demo-rig");
      sessionRegistry.updateStatus(session.id, "running");
      sessionRegistry.updateResumeToken(session.id, "antigravity_id", convId, "hook");
      sessionRegistry.updateBinding(node.id, {
        attachmentType: "tmux",
        tmuxSession: "dev-impl@demo-rig",
        tmuxWindow: "0",
        tmuxPane: "%1",
      });

      // 1. AgentActivityStore DB fallback resolution by conversationId
      const store = new AgentActivityStore({ db, eventBus, now: () => new Date(now) });
      const recorded = store.recordHookEvent({
        runtime: "antigravity",
        conversationId: convId,
        hookEvent: "PostInvocation",
        occurredAt: now,
      });
      expect(recorded.ok).toBe(true);
      if (recorded.ok) {
        expect(recorded.activity.state).toBe("idle");
        expect(recorded.event.nodeId).toBe(node.id);
      }

      // 2. WhoamiService DB resolution by conversationId
      const whoami = new WhoamiService({
        db,
        rigRepo,
        sessionRegistry,
        transcriptStore: new TranscriptStore({ enabled: false, basePath: "/tmp" }),
      });
      const resolvedWhoami = whoami.resolve({ conversationId: convId, compact: true });
      expect(resolvedWhoami).not.toBeNull();
      expect(resolvedWhoami?.resolvedBy).toBe("conversation_id");
      expect(resolvedWhoami?.identity.nodeId).toBe(node.id);
      expect(resolvedWhoami?.identity.sessionName).toBe("dev-impl@demo-rig");

      // 3. SessionTransport delivers directly via AgentApiClient.sendMessage (skipping tmux sendText)
      let tmuxPasted = false;
      const apiCalls: Array<{ file: string; args: readonly string[] }> = [];
      const client = new AgentApiClient({
        agentapiBinary: "/app/bin/agentapi",
        appDataDir: "/app",
        openrigHome: "/openrig",
        fsOps: {
          exists: (p) => p === "/app/bin/agentapi",
          readFile: () => "",
          writeFile: () => {},
          mkdirp: () => {},
        },
        execFileAsync: async (file, args) => {
          apiCalls.push({ file, args });
          return { stdout: "{}", stderr: "" };
        },
      });
      const transport = new SessionTransport({
        db,
        rigRepo,
        sessionRegistry,
        agentActivityStore: store,
        eventBus,
        antigravityClient: client,
        sleep: async () => {},
        tmuxAdapter: {
          probeSession: async () => ({ state: "present" as const }),
          hasSession: async () => true,
          getPaneCommand: async () => "node",
          getPaneMode: async () => ({ inMode: false, mode: null }),
          capturePaneContent: async () => "[AGENT] Ready",
          sendText: async () => {
            tmuxPasted = true;
            return { ok: true as const };
          },
          sendKeys: async () => ({ ok: true as const }),
        } as never,
      });

      const sendRes = await transport.send("dev-impl@demo-rig", "Hello via agentapi", { verify: true });
      expect(sendRes.ok).toBe(true);
      expect(sendRes.outcome).toBe("delivered");
      expect(sendRes.verified).toBe(true);
      expect(sendRes.conversationId).toBe(convId);
      expect(tmuxPasted).toBe(false);
      expect(apiCalls).toHaveLength(1);
      expect(apiCalls[0]!.args).toEqual(["send-message", "--", convId, "Hello via agentapi"]);
    } finally {
      db.close();
    }
  });
});

describe("Standalone Sidecar Server", () => {
  it("starts HTTP server, serves dashboard with 3 tabs", async () => {
    const { server, url } = await startSidecarServer({ port: 0, host: "127.0.0.1", daemonUrl: "http://127.0.0.1:7433" });

    try {
      const res = await fetch(url);
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("OpenRig Sidecar");
      expect(html).toContain("Approvals & Attention");
      expect(html).toContain("Agent Topology");
      expect(html).toContain("Deliverables & Proofs");
      expect(html).toContain("confirm-reject-btn");
      expect(html).toContain("confirm-reply-btn");
      expect(html).toContain("confirm-proof-reject-btn");
      expect(html).toContain("acceptProof");
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("proxies /api/ requests to the target daemon", async () => {
    // Spin up mock daemon on ephemeral port
    const mockDaemon = http.createServer((req, res) => {
      if (req.url === "/api/attention") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ items: [{ id: "queue:test-1", summary: "Test Attention Item", urgency: "high" }] }));
        return;
      }
      res.writeHead(404);
      res.end();
    });

    await new Promise<void>((resolve) => mockDaemon.listen(0, "127.0.0.1", resolve));
    const mockPort = (mockDaemon.address() as import("node:net").AddressInfo).port;

    const { server, url } = await startSidecarServer({
      port: 0,
      host: "127.0.0.1",
      daemonUrl: `http://127.0.0.1:${mockPort}`,
    });

    try {
      const res = await fetch(`${url}/api/attention`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items[0].summary).toBe("Test Attention Item");
    } finally {
      await new Promise((resolve) => server.close(resolve));
      await new Promise((resolve) => mockDaemon.close(resolve));
    }
  });
});

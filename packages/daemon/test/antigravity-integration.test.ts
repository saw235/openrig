import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";
import { startSidecarServer } from "../src/sidecar/sidecar-server.js";
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

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

interface StoredConversationRecord {
  conversationId?: unknown;
  sessionName?: unknown;
  nodeId?: unknown;
  runtime?: unknown;
  occupantGeneration?: unknown;
}

interface StoredConversationsIndex {
  byConversationId?: Record<string, StoredConversationRecord>;
}

/**
 * Hydrate OpenRig seat identity environment variables (`OPENRIG_SESSION_NAME`,
 * `OPENRIG_NODE_ID`, `OPENRIG_RUNTIME`, `OPENRIG_OCCUPANT_GENERATION`) when a
 * `rig` CLI command runs inside an `agentapi`-managed Antigravity conversation
 * (`ANTIGRAVITY_CONVERSATION_ID` present, `OPENRIG_SESSION_NAME`/`OPENRIG_NODE_ID` unset).
 *
 * Strictly public seat metadata — never reads or injects tokens/credentials.
 */
export function hydrateAntigravitySeatEnv(
  env: NodeJS.ProcessEnv = process.env,
  readFile: (filePath: string) => string = (p) => fs.readFileSync(p, "utf-8"),
): boolean {
  if (
    env["OPENRIG_SESSION_NAME"]?.trim() ||
    env["RIGGED_SESSION_NAME"]?.trim() ||
    env["OPENRIG_NODE_ID"]?.trim() ||
    env["RIGGED_NODE_ID"]?.trim()
  ) {
    return false;
  }

  const conversationId = env["ANTIGRAVITY_CONVERSATION_ID"]?.trim();
  if (!conversationId) return false;

  const openrigHome =
    env["OPENRIG_HOME"]?.trim() ||
    env["RIGGED_HOME"]?.trim() ||
    path.join(env["HOME"]?.trim() || os.homedir(), ".openrig");
  const indexPath = path.join(openrigHome, "state", "antigravity", "conversations.json");

  let parsed: StoredConversationsIndex;
  try {
    parsed = JSON.parse(readFile(indexPath)) as StoredConversationsIndex;
  } catch {
    return false;
  }

  const record = parsed?.byConversationId?.[conversationId];
  if (!record || typeof record !== "object") return false;

  const sessionName = typeof record.sessionName === "string" ? record.sessionName.trim() : "";
  const nodeId = typeof record.nodeId === "string" ? record.nodeId.trim() : "";
  if (!sessionName && !nodeId) return false;

  if (sessionName) env["OPENRIG_SESSION_NAME"] = sessionName;
  if (nodeId) env["OPENRIG_NODE_ID"] = nodeId;
  env["OPENRIG_RUNTIME"] = "antigravity";
  if (typeof record.occupantGeneration === "string" && record.occupantGeneration.trim()) {
    env["OPENRIG_OCCUPANT_GENERATION"] = record.occupantGeneration.trim();
  }
  return true;
}

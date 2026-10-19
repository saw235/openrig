import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import nodePath from "node:path";

export interface AgentApiMirrorEntry {
  session: string;
  conversationId: string;
  projectId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AntigravityAgentApiMirrorDeps {
  agentapiBinary?: string;
  openrigHome?: string;
  configProjectsDir?: string;
}

export class AntigravityAgentApiMirror {
  private agentapiBinary: string;
  private storePath: string;
  private configProjectsDir: string;

  constructor(deps?: AntigravityAgentApiMirrorDeps) {
    this.agentapiBinary =
      deps?.agentapiBinary ??
      process.env.ANTIGRAVITY_AGENTAPI_BIN ??
      nodePath.join(os.homedir(), ".gemini", "antigravity", "bin", "agentapi");
    const openrigHome = deps?.openrigHome ?? process.env.OPENRIG_HOME ?? nodePath.join(os.homedir(), ".openrig");
    this.storePath = nodePath.join(openrigHome, "antigravity-conversations.json");
    this.configProjectsDir = deps?.configProjectsDir ?? nodePath.join(os.homedir(), ".gemini", "config", "projects");
  }

  isAvailable(): boolean {
    try {
      return fs.existsSync(this.agentapiBinary);
    } catch {
      return false;
    }
  }

  readStore(): Record<string, AgentApiMirrorEntry> {
    try {
      if (fs.existsSync(this.storePath)) {
        const raw = fs.readFileSync(this.storePath, "utf-8");
        return JSON.parse(raw) as Record<string, AgentApiMirrorEntry>;
      }
    } catch {
      // ignore read/parse errors
    }
    return {};
  }

  writeStore(store: Record<string, AgentApiMirrorEntry>): void {
    try {
      fs.mkdirSync(nodePath.dirname(this.storePath), { recursive: true });
      fs.writeFileSync(this.storePath, JSON.stringify(store, null, 2), "utf-8");
    } catch (err) {
      console.error("[antigravity-mirror] Failed to persist conversations map:", err);
    }
  }

  getEntryForSession(session: string): AgentApiMirrorEntry | null {
    const store = this.readStore();
    return store[session] ?? null;
  }

  resolveProjectId(cwd: string): string {
    // 1. Env variable takes precedence if set
    if (process.env.ANTIGRAVITY_PROJECT_ID) {
      return process.env.ANTIGRAVITY_PROJECT_ID;
    }

    // 2. Search existing projects for matching workspace folder
    try {
      if (fs.existsSync(this.configProjectsDir)) {
        const resolvedCwd = nodePath.resolve(cwd);
        const files = fs.readdirSync(this.configProjectsDir);
        for (const file of files) {
          if (!file.endsWith(".json")) continue;
          try {
            const raw = fs.readFileSync(nodePath.join(this.configProjectsDir, file), "utf-8");
            const data = JSON.parse(raw) as {
              id?: string;
              projectResources?: { resources?: Array<{ gitFolder?: { folderUri?: string } }> };
            };
            if (data.id && data.projectResources?.resources) {
              for (const r of data.projectResources.resources) {
                const uri = r.gitFolder?.folderUri;
                if (uri && uri.startsWith("file://")) {
                  const projectPath = nodePath.resolve(uri.replace("file://", ""));
                  if (resolvedCwd === projectPath || resolvedCwd.startsWith(projectPath + nodePath.sep)) {
                    return data.id;
                  }
                }
              }
            }
          } catch {
            // ignore corrupt files
          }
        }
      }
    } catch {
      // ignore
    }

    // 3. Fallback to outside-of-project
    return "outside-of-project";
  }

  async ensureConversation(
    session: string,
    meta: {
      rig?: string;
      pod?: string;
      role?: string;
      cwd: string;
      model?: string;
      prompt?: string;
    }
  ): Promise<AgentApiMirrorEntry | null> {
    if (!this.isAvailable()) return null;

    const store = this.readStore();
    if (store[session]) {
      return store[session];
    }

    const projectId = this.resolveProjectId(meta.cwd);
    const title = meta.role
      ? `OpenRig: ${meta.role} (${meta.rig || "openrig"})`
      : `OpenRig: ${session}`;

    const modelArg = meta.model?.includes("pro") ? "pro" : "flash";
    const initialPrompt =
      meta.prompt ??
      `OpenRig agent session established.\nSession: ${session}\nRig: ${meta.rig || "openrig"}\nRole: ${meta.role || session}\nWorking directory: ${meta.cwd}`;

    const env: Record<string, string | undefined> = { ...process.env, ANTIGRAVITY_PROJECT_ID: projectId };
    delete env["ANTIGRAVITY_CONVERSATION_ID"];
    delete env["ANTIGRAVITY_SOURCE_METADATA"];

    try {
      const res = spawnSync(
        this.agentapiBinary,
        [
          "new-conversation",
          `--model=${modelArg}`,
          `--title=${title}`,
          initialPrompt,
        ],
        { env, encoding: "utf-8", timeout: 15_000 }
      );

      if (res.status === 0 && res.stdout) {
        const parsed = JSON.parse(res.stdout) as {
          response?: { newConversation?: { conversationId?: string } };
        };
        const conversationId = parsed.response?.newConversation?.conversationId;
        if (conversationId) {
          const entry: AgentApiMirrorEntry = {
            session,
            conversationId,
            projectId,
            title,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          store[session] = entry;
          this.writeStore(store);
          return entry;
        }
      } else {
        console.warn("[antigravity-mirror] agentapi new-conversation failed:", res.stderr || res.stdout);
      }
    } catch (err) {
      console.warn("[antigravity-mirror] Error invoking agentapi new-conversation:", err);
    }

    return null;
  }

  async sendMessage(sessionOrId: string, content: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    let conversationId = sessionOrId;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionOrId)) {
      const entry = this.getEntryForSession(sessionOrId);
      if (!entry) return false;
      conversationId = entry.conversationId;
    }

    const env: Record<string, string | undefined> = { ...process.env };
    delete env["ANTIGRAVITY_CONVERSATION_ID"];
    delete env["ANTIGRAVITY_SOURCE_METADATA"];

    try {
      const res = spawnSync(
        this.agentapiBinary,
        ["send-message", conversationId, content],
        { env, encoding: "utf-8", timeout: 15_000 }
      );

      if (res.status === 0) {
        const store = this.readStore();
        for (const [s, entry] of Object.entries(store)) {
          if (entry.conversationId === conversationId) {
            entry.updatedAt = new Date().toISOString();
            this.writeStore(store);
            break;
          }
        }
        return true;
      } else {
        console.warn("[antigravity-mirror] agentapi send-message non-zero status:", res.stderr || res.stdout);
      }
    } catch (err) {
      console.warn("[antigravity-mirror] Error invoking agentapi send-message:", err);
    }

    return false;
  }
}

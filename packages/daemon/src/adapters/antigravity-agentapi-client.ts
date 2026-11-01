import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import nodePath from "node:path";
import { promisify } from "node:util";

const defaultExecFileAsync = promisify(execFile);

export type AgentApiModelTier = "flash_lite" | "flash" | "pro";

export interface AntigravitySeatConversationRecord {
  conversationId: string;
  sessionName: string;
  nodeId: string;
  runtime: "antigravity";
  occupantGeneration: string | null;
  projectId: string;
  cwd: string;
  title: string;
  updatedAt: string;
}

export interface AntigravityConversationsIndex {
  byConversationId: Record<string, AntigravitySeatConversationRecord>;
  bySessionName: Record<string, string>;
}

export interface AgentApiExecResult {
  stdout: string;
  stderr: string;
}

export type AgentApiExecFn = (
  file: string,
  args: readonly string[],
  options: { env: NodeJS.ProcessEnv; timeout: number },
) => Promise<AgentApiExecResult>;

export interface AgentApiFsOps {
  exists(path: string): boolean;
  readFile(path: string): string;
  writeFile(path: string, content: string): void;
  mkdirp(path: string): void;
  listDir?(path: string): string[];
}

const defaultFsOps: AgentApiFsOps = {
  exists: (p) => fs.existsSync(p),
  readFile: (p) => fs.readFileSync(p, "utf-8"),
  writeFile: (p, c) => fs.writeFileSync(p, c, "utf-8"),
  mkdirp: (p) => fs.mkdirSync(p, { recursive: true }),
  listDir: (p) => fs.readdirSync(p),
};

export function resolveAntigravityAppDataDir(opts?: {
  appDataDir?: string;
  env?: NodeJS.ProcessEnv;
  homedir?: string;
}): string {
  const env = opts?.env ?? process.env;
  const configured = opts?.appDataDir?.trim() || env["ANTIGRAVITY_APP_DATA_DIR"]?.trim();
  if (configured) return configured;
  return nodePath.join(opts?.homedir ?? os.homedir(), ".gemini", "antigravity");
}

export function resolveAgentApiBinary(opts?: {
  agentapiBinary?: string;
  appDataDir?: string;
  env?: NodeJS.ProcessEnv;
  homedir?: string;
}): string {
  const env = opts?.env ?? process.env;
  const explicit =
    opts?.agentapiBinary?.trim() ||
    env["ANTIGRAVITY_AGENTAPI_BIN"]?.trim() ||
    env["OPENRIG_AGENTAPI_BIN"]?.trim();
  if (explicit) return explicit;
  return nodePath.join(resolveAntigravityAppDataDir(opts), "bin", "agentapi");
}

export function antigravityConversationsIndexPath(openrigHome: string): string {
  return nodePath.join(openrigHome, "state", "antigravity", "conversations.json");
}

/**
 * Translate an authored RigSpec/AgentSpec `model` string to Antigravity's
 * `agentapi new-conversation --model=<flash_lite|flash|pro>` tier.
 *
 * Returns `undefined` when omitted, `"inherit"`, `"default"`, or unrecognized so
 * `agentapi` falls back to the user's selected Antigravity IDE default model
 * instead of failing with `unknown model tier`.
 */
export function mapModelToAgentApiTier(model?: string | null): AgentApiModelTier | undefined {
  const normalized = (model ?? "").trim().toLowerCase();
  if (!normalized || normalized === "inherit" || normalized === "default") {
    return undefined;
  }
  if (normalized === "flash_lite" || normalized.includes("flash-lite") || normalized.includes("flash_lite") || normalized.includes("lite")) {
    return "flash_lite";
  }
  if (
    normalized === "pro" ||
    normalized.includes("argon") ||
    normalized.includes("pro") ||
    normalized.includes("ultra") ||
    normalized.includes("opus")
  ) {
    return "pro";
  }
  if (
    normalized === "flash" ||
    normalized.includes("flash") ||
    normalized.includes("sonnet") ||
    normalized.includes("haiku")
  ) {
    return "flash";
  }
  return undefined;
}

export interface AgentApiClientDeps {
  agentapiBinary?: string;
  appDataDir?: string;
  openrigHome?: string;
  configProjectsDir?: string;
  fsOps?: AgentApiFsOps;
  execFileAsync?: AgentApiExecFn;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
  now?: () => Date;
}

export class AgentApiClient {
  readonly agentapiBinary: string;
  readonly appDataDir: string;
  readonly openrigHome: string;
  readonly configProjectsDir: string;
  private readonly fs: AgentApiFsOps;
  private readonly exec: AgentApiExecFn;
  private readonly env: NodeJS.ProcessEnv;
  private readonly timeoutMs: number;
  private readonly now: () => Date;

  constructor(deps?: AgentApiClientDeps) {
    this.env = deps?.env ?? process.env;
    this.appDataDir = resolveAntigravityAppDataDir({
      appDataDir: deps?.appDataDir,
      env: this.env,
    });
    this.agentapiBinary = resolveAgentApiBinary({
      agentapiBinary: deps?.agentapiBinary,
      appDataDir: this.appDataDir,
      env: this.env,
    });
    this.openrigHome =
      deps?.openrigHome ??
      this.env["OPENRIG_HOME"]?.trim() ??
      nodePath.join(os.homedir(), ".openrig");
    this.configProjectsDir =
      deps?.configProjectsDir ??
      nodePath.join(os.homedir(), ".gemini", "config", "projects");
    this.fs = deps?.fsOps ?? defaultFsOps;
    this.timeoutMs = deps?.timeoutMs ?? 15_000;
    this.now = deps?.now ?? (() => new Date());
    this.exec =
      deps?.execFileAsync ??
      (async (file, args, options) => {
        const out = await defaultExecFileAsync(file, [...args], {
          env: options.env,
          timeout: options.timeout,
          encoding: "utf-8",
          maxBuffer: 4 * 1024 * 1024,
        });
        return { stdout: out.stdout ?? "", stderr: out.stderr ?? "" };
      });
  }

  isAvailable(): boolean {
    try {
      return this.fs.exists(this.agentapiBinary);
    } catch {
      return false;
    }
  }

  private cleanAgentApiEnv(extra?: Record<string, string | undefined>): NodeJS.ProcessEnv {
    const childEnv: NodeJS.ProcessEnv = { ...this.env, ...extra };
    delete childEnv["ANTIGRAVITY_CONVERSATION_ID"];
    delete childEnv["ANTIGRAVITY_SOURCE_METADATA"];
    return childEnv;
  }

  /**
   * Resolve or create an Antigravity project JSON in `~/.gemini/config/projects/`.
   * Matches `"OpenRig - <rigOrPod>"` first, then exact `file://<cwd>` gitFolder,
   * creating `"OpenRig - <rigOrPod>"` if not found.
   */
  resolveOrCreateProject(cwd: string, rigOrPod?: string): string {
    const rawPod = (rigOrPod || "workspace").trim();
    const targetName = rawPod.startsWith("OpenRig - ") ? rawPod : `OpenRig - ${rawPod}`;
    const candidateNames = [targetName, rawPod];
    const resolvedCwd = nodePath.resolve(cwd);

    try {
      this.fs.mkdirp(this.configProjectsDir);
      const files = this.fs.listDir ? this.fs.listDir(this.configProjectsDir) : [];

      // Pass 1: match by dedicated OpenRig project name
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        try {
          const raw = this.fs.readFile(nodePath.join(this.configProjectsDir, file));
          const data = JSON.parse(raw) as { id?: string; name?: string };
          if (data?.id && data?.name && candidateNames.includes(data.name)) {
            return data.id;
          }
        } catch {
          // ignore unreadable project JSON
        }
      }

      // Pass 2: match by exact gitFolder workspace URI when no explicit rig/pod name was supplied
      if (!rigOrPod) {
        for (const file of files) {
          if (!file.endsWith(".json")) continue;
          try {
            const raw = this.fs.readFile(nodePath.join(this.configProjectsDir, file));
            const data = JSON.parse(raw) as {
              id?: string;
              projectResources?: { resources?: Array<{ gitFolder?: { folderUri?: string } }> };
            };
            if (data?.id && Array.isArray(data.projectResources?.resources)) {
              for (const resource of data.projectResources.resources) {
                const uri = resource.gitFolder?.folderUri;
                if (uri?.startsWith("file://")) {
                  const folderPath = nodePath.resolve(uri.slice("file://".length));
                  if (folderPath === resolvedCwd) return data.id;
                }
              }
            }
          } catch {
            // ignore unreadable project JSON
          }
        }
      }
    } catch {
      // fall through to creation
    }

    const newId = randomUUID();
    const newProject = {
      id: newId,
      name: targetName,
      projectResources: {
        resources: [
          {
            gitFolder: {
              folderUri: `file://${resolvedCwd}`,
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
      // best-effort write
    }

    return newId;
  }

  async newConversation(input: {
    projectId: string;
    title: string;
    model?: string;
    profile?: string;
    prompt: string;
  }): Promise<{ ok: true; conversationId: string } | { ok: false; error: string }> {
    const args: string[] = ["new-conversation"];
    const tier = mapModelToAgentApiTier(input.model);
    if (tier) args.push(`--model=${tier}`);
    if (input.title.trim()) args.push(`--title=${input.title.trim()}`);
    if (input.profile?.trim()) args.push(`--profile=${input.profile.trim()}`);
    args.push("--", input.prompt);

    try {
      const { stdout, stderr } = await this.exec(this.agentapiBinary, args, {
        env: this.cleanAgentApiEnv({ ANTIGRAVITY_PROJECT_ID: input.projectId }),
        timeout: this.timeoutMs,
      });
      const parsed = JSON.parse(stdout) as {
        response?: { newConversation?: { conversationId?: string } };
      };
      const conversationId = parsed?.response?.newConversation?.conversationId?.trim();
      if (!conversationId) {
        return {
          ok: false,
          error: `agentapi new-conversation returned no conversationId (${(stderr || stdout).trim().slice(0, 240)})`,
        };
      }
      return { ok: true, conversationId };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `agentapi new-conversation failed: ${msg}` };
    }
  }

  async sendMessage(
    conversationId: string,
    content: string,
    title?: string,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const args: string[] = ["send-message"];
    if (title?.trim()) args.push(`--title=${title.trim()}`);
    args.push("--", conversationId, content);

    try {
      await this.exec(this.agentapiBinary, args, {
        env: this.cleanAgentApiEnv(),
        timeout: this.timeoutMs,
      });
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `agentapi send-message failed: ${msg}` };
    }
  }

  async conversationExists(conversationId: string): Promise<boolean> {
    const trimmed = conversationId.trim();
    if (!trimmed) return false;
    const dbPath = nodePath.join(this.appDataDir, "conversations", `${trimmed}.db`);
    const brainPath = nodePath.join(this.appDataDir, "brain", trimmed);
    if (this.fs.exists(dbPath) || this.fs.exists(brainPath)) {
      return true;
    }
    try {
      const { stdout } = await this.exec(
        this.agentapiBinary,
        ["get-conversation-metadata", trimmed],
        {
          env: this.cleanAgentApiEnv(),
          timeout: 5_000,
        },
      );
      const parsed = JSON.parse(stdout) as {
        response?: { conversationMetadata?: unknown };
      };
      return Boolean(parsed?.response?.conversationMetadata);
    } catch {
      return false;
    }
  }

  transcriptPath(conversationId: string): string {
    return nodePath.join(
      this.appDataDir,
      "brain",
      conversationId,
      ".system_generated",
      "logs",
      "transcript.jsonl",
    );
  }

  readConversationsIndex(): AntigravityConversationsIndex {
    const indexPath = antigravityConversationsIndexPath(this.openrigHome);
    try {
      if (this.fs.exists(indexPath)) {
        const parsed = JSON.parse(this.fs.readFile(indexPath)) as Partial<AntigravityConversationsIndex>;
        if (parsed && typeof parsed === "object") {
          return {
            byConversationId:
              parsed.byConversationId && typeof parsed.byConversationId === "object"
                ? parsed.byConversationId
                : {},
            bySessionName:
              parsed.bySessionName && typeof parsed.bySessionName === "object"
                ? parsed.bySessionName
                : {},
          };
        }
      }
    } catch {
      // return empty index on parse/read error
    }
    return { byConversationId: {}, bySessionName: {} };
  }

  private writeConversationsIndex(index: AntigravityConversationsIndex): void {
    const indexPath = antigravityConversationsIndexPath(this.openrigHome);
    try {
      this.fs.mkdirp(nodePath.dirname(indexPath));
      this.fs.writeFile(indexPath, JSON.stringify(index, null, 2));
    } catch {
      // best-effort persistence
    }
  }

  registerSeatConversation(
    input: Omit<AntigravitySeatConversationRecord, "runtime" | "updatedAt"> & { updatedAt?: string },
  ): AntigravitySeatConversationRecord {
    const index = this.readConversationsIndex();
    const priorForSession = index.bySessionName[input.sessionName];
    if (priorForSession && priorForSession !== input.conversationId) {
      delete index.byConversationId[priorForSession];
    }
    const record: AntigravitySeatConversationRecord = {
      conversationId: input.conversationId,
      sessionName: input.sessionName,
      nodeId: input.nodeId,
      runtime: "antigravity",
      occupantGeneration: input.occupantGeneration ?? null,
      projectId: input.projectId,
      cwd: input.cwd,
      title: input.title,
      updatedAt: input.updatedAt ?? this.now().toISOString(),
    };
    index.byConversationId[record.conversationId] = record;
    index.bySessionName[record.sessionName] = record.conversationId;
    this.writeConversationsIndex(index);
    return record;
  }

  unregisterSeatConversation(sessionOrConversationId: string): void {
    const index = this.readConversationsIndex();
    const bySessionConvId = index.bySessionName[sessionOrConversationId];
    if (bySessionConvId) {
      delete index.bySessionName[sessionOrConversationId];
      delete index.byConversationId[bySessionConvId];
      this.writeConversationsIndex(index);
      return;
    }
    const rec = index.byConversationId[sessionOrConversationId];
    if (rec) {
      delete index.byConversationId[sessionOrConversationId];
      if (index.bySessionName[rec.sessionName] === sessionOrConversationId) {
        delete index.bySessionName[rec.sessionName];
      }
      this.writeConversationsIndex(index);
    }
  }

  lookupByConversationId(conversationId: string): AntigravitySeatConversationRecord | null {
    const index = this.readConversationsIndex();
    return index.byConversationId[conversationId] ?? null;
  }

  lookupBySessionName(sessionName: string): AntigravitySeatConversationRecord | null {
    const index = this.readConversationsIndex();
    const convId = index.bySessionName[sessionName];
    if (!convId) return null;
    return index.byConversationId[convId] ?? null;
  }
}

/**
 * Format a single JSONL line from `<appDataDir>/brain/<id>/.system_generated/logs/transcript.jsonl`
 * into clean human-readable output lines for terminal capture / streaming.
 */
export function formatAntigravityTranscriptLine(rawLine: string): string[] {
  const trimmed = rawLine.trim();
  if (!trimmed) return [];
  let entry: Record<string, unknown>;
  try {
    entry = JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    return [];
  }

  const type = typeof entry["type"] === "string" ? entry["type"] : "";
  const status = typeof entry["status"] === "string" ? entry["status"] : "";
  const content = typeof entry["content"] === "string" ? entry["content"].trim() : "";
  const toolCalls = Array.isArray(entry["tool_calls"]) ? entry["tool_calls"] : [];
  const out: string[] = [];

  if (type === "USER_INPUT" && content) {
    const compact = content.replace(/<\/?USER_REQUEST>/g, "").trim();
    if (compact) {
      out.push(`[USER] ${compact}`);
    }
    return out;
  }

  if (type === "PLANNER_RESPONSE") {
    for (const tc of toolCalls) {
      if (tc && typeof tc === "object") {
        const name =
          typeof (tc as Record<string, unknown>)["name"] === "string"
            ? ((tc as Record<string, unknown>)["name"] as string)
            : typeof (tc as Record<string, unknown>)["tool_name"] === "string"
              ? ((tc as Record<string, unknown>)["tool_name"] as string)
              : null;
        if (name) out.push(`[TOOL] ${name}`);
      }
    }
    if (content) {
      out.push(`[AGENT] ${content}`);
    }
    if (status === "ERROR" && !content) {
      out.push(`[ERROR] Planner step failed`);
    }
    return out;
  }

  if (status === "ERROR" && content) {
    out.push(`[ERROR] ${content}`);
  }
  return out;
}

export function formatAntigravityTranscriptTail(
  transcriptPath: string,
  maxLines = 40,
  fsOps: Pick<AgentApiFsOps, "exists" | "readFile"> = defaultFsOps,
): string | null {
  try {
    if (!fsOps.exists(transcriptPath)) return null;
    const raw = fsOps.readFile(transcriptPath);
    const formatted: string[] = [];
    for (const jsonLine of raw.split("\n")) {
      for (const block of formatAntigravityTranscriptLine(jsonLine)) {
        for (const subLine of block.split("\n")) {
          formatted.push(subLine);
        }
      }
    }
    if (formatted.length === 0) return "(conversation active — awaiting transcript entries)";
    return formatted.slice(-Math.max(1, maxLines)).join("\n");
  } catch {
    return null;
  }
}

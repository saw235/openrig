#!/usr/bin/env node
import fs from "node:fs";
import nodePath from "node:path";
import readline from "node:readline";
import {
  AgentApiClient,
  formatAntigravityTranscriptLine,
  resolveAgentApiBinary,
  resolveAntigravityAppDataDir,
} from "./antigravity-agentapi-client.js";

export interface AntigravityRunnerState {
  launchId: string;
  sessionName: string;
  nodeId: string;
  occupantGeneration: string | null;
  projectId: string;
  cwd: string;
  title: string;
  model?: string;
  conversationId: string | null;
  status: "starting" | "ready" | "error" | "exited";
  pid?: number;
  error?: string;
  updatedAt: string;
}

export function antigravityRunnerStatePath(stateRoot: string, sessionName: string): string {
  const safeName = sessionName.replace(/[^A-Za-z0-9._@-]/g, "_");
  return nodePath.join(stateRoot, safeName, "runner-state.json");
}

export function parseAntigravityRunnerState(raw: string): AntigravityRunnerState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<AntigravityRunnerState>;
    if (!parsed || typeof parsed !== "object" || typeof parsed.status !== "string" || typeof parsed.launchId !== "string") {
      return null;
    }
    return parsed as AntigravityRunnerState;
  } catch {
    return null;
  }
}

function writeStateAtomic(statePath: string, state: AntigravityRunnerState): void {
  fs.mkdirSync(nodePath.dirname(statePath), { recursive: true });
  const tmpPath = `${statePath}.tmp.${process.pid}`;
  fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), "utf-8");
  fs.renameSync(tmpPath, statePath);
}

function getArg(argv: readonly string[], flag: string): string | undefined {
  const idx = argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < argv.length) return argv[idx + 1];
  return undefined;
}

async function runMain(): Promise<void> {
  const statePath = getArg(process.argv, "--state-file");
  if (!statePath) {
    process.stderr.write("[antigravity-runner] Missing required --state-file <path>\n");
    process.exit(1);
  }

  const appDataDir = resolveAntigravityAppDataDir({
    appDataDir: getArg(process.argv, "--app-data-dir"),
  });
  const agentapiBinary = resolveAgentApiBinary({
    agentapiBinary: getArg(process.argv, "--agentapi-bin"),
    appDataDir,
  });
  const openrigHome = getArg(process.argv, "--openrig-home") ?? process.env["OPENRIG_HOME"];

  const client = new AgentApiClient({
    agentapiBinary,
    appDataDir,
    ...(openrigHome ? { openrigHome } : {}),
  });

  const readCurrentState = (): AntigravityRunnerState | null => {
    try {
      return parseAntigravityRunnerState(fs.readFileSync(statePath, "utf-8"));
    } catch {
      return null;
    }
  };

  const initial = readCurrentState();
  if (!initial) {
    process.stderr.write(`[antigravity-runner] Unable to read initial runner state at ${statePath}\n`);
    process.exit(1);
  }

  if (!client.isAvailable()) {
    writeStateAtomic(statePath, {
      ...initial,
      status: "error",
      pid: process.pid,
      error: `agentapi binary not found at ${client.agentapiBinary}`,
      updatedAt: new Date().toISOString(),
    });
    process.stderr.write(`[antigravity-runner] agentapi binary not found at ${client.agentapiBinary}\n`);
    process.exit(1);
  }

  let currentState: AntigravityRunnerState = {
    ...initial,
    status: "ready",
    pid: process.pid,
    updatedAt: new Date().toISOString(),
  };
  writeStateAtomic(statePath, currentState);

  process.stdout.write(
    `[OpenRig Antigravity] Seat: ${currentState.sessionName} | Project: ${currentState.projectId}` +
      (currentState.conversationId ? ` | Conversation: ${currentState.conversationId}` : " | Awaiting initial prompt...") +
      "\n",
  );

  let activeConversationId: string | null = currentState.conversationId;
  let processedLines = 0;

  const pollTranscript = () => {
    const latest = readCurrentState();
    if (latest && latest.conversationId && latest.conversationId !== activeConversationId) {
      activeConversationId = latest.conversationId;
      processedLines = 0;
      currentState = latest;
      process.stdout.write(`[OpenRig Antigravity] Bound conversation://${activeConversationId}\n`);
    } else if (latest) {
      currentState = latest;
    }

    if (!activeConversationId) return;
    const tPath = client.transcriptPath(activeConversationId);
    if (!fs.existsSync(tPath)) return;

    try {
      const raw = fs.readFileSync(tPath, "utf-8");
      const lines = raw.split("\n").filter((l) => l.trim().length > 0);
      if (lines.length < processedLines) {
        processedLines = 0;
      }
      while (processedLines < lines.length) {
        const line = lines[processedLines]!;
        processedLines++;
        const formatted = formatAntigravityTranscriptLine(line);
        for (const msg of formatted) {
          process.stdout.write(`${msg}\n`);
        }
      }
    } catch {
      // ignore transient read errors during concurrent transcript append
    }
  };

  pollTranscript();
  const timer = setInterval(pollTranscript, 500);

  // Support direct manual operator lines typed in `tmux attach -t <seat>`
  const rl = readline.createInterface({ input: process.stdin, terminal: false });
  rl.on("line", async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const latest = readCurrentState() ?? currentState;
    if (!latest.conversationId) {
      const created = await client.newConversation({
        projectId: latest.projectId,
        title: latest.title,
        model: latest.model,
        prompt: trimmed,
      });
      if (created.ok) {
        activeConversationId = created.conversationId;
        currentState = {
          ...latest,
          conversationId: created.conversationId,
          updatedAt: new Date().toISOString(),
        };
        writeStateAtomic(statePath, currentState);
        client.registerSeatConversation({
          conversationId: created.conversationId,
          sessionName: currentState.sessionName,
          nodeId: currentState.nodeId,
          occupantGeneration: currentState.occupantGeneration,
          projectId: currentState.projectId,
          cwd: currentState.cwd,
          title: currentState.title,
        });
        process.stdout.write(`[OpenRig Antigravity] Bound conversation://${created.conversationId}\n`);
      } else {
        process.stderr.write(`[OpenRig Antigravity] ${created.error}\n`);
      }
      return;
    }
    const sent = await client.sendMessage(latest.conversationId, trimmed);
    if (!sent.ok) {
      process.stderr.write(`[OpenRig Antigravity] ${sent.error}\n`);
    }
  });

  const shutdown = () => {
    clearInterval(timer);
    rl.close();
    const latest = readCurrentState() ?? currentState;
    try {
      writeStateAtomic(statePath, {
        ...latest,
        status: "exited",
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // ignore shutdown write errors
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

const isDirectEntry =
  typeof process.argv[1] === "string" &&
  (process.argv[1].endsWith("antigravity-runner.js") || process.argv[1].endsWith("antigravity-runner.ts"));

if (isDirectEntry) {
  runMain().catch((err) => {
    process.stderr.write(`[antigravity-runner] Fatal error: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
}

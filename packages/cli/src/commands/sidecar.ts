import { Command } from "commander";
import path from "node:path";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { OPENRIG_DIR } from "../daemon-lifecycle.js";
import { openBrowserUrl } from "./ui.js";

const SIDECAR_STATE_FILE = path.join(OPENRIG_DIR, "sidecar.json");
const SIDECAR_LOG_FILE = path.join(OPENRIG_DIR, "sidecar.log");

interface SidecarState {
  pid: number;
  port: number;
  host: string;
  daemonUrl: string;
  startedAt: string;
}

function readSidecarState(): SidecarState | null {
  try {
    if (!fs.existsSync(SIDECAR_STATE_FILE)) return null;
    return JSON.parse(fs.readFileSync(SIDECAR_STATE_FILE, "utf-8")) as SidecarState;
  } catch {
    return null;
  }
}

function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function sidecarCommand(): Command {
  const cmd = new Command("sidecar")
    .description("Manage the standalone OpenRig Sidecar web application (Antigravity Studio)")
    .option("-p, --port <number>", "Port to run the sidecar on", "7434")
    .option("-h, --host <address>", "Host interface to bind", "127.0.0.1")
    .option("--daemon-url <url>", "Daemon base URL", process.env.OPENRIG_URL ?? "http://127.0.0.1:7433")
    .option("-f, --foreground", "Run in foreground (default is background detached daemon)")
    .option("--no-open", "Do not automatically open the sidecar in a browser")
    .action(async (opts: { port: string; host: string; daemonUrl: string; foreground?: boolean; open?: boolean }) => {
      const port = Number(opts.port) || 7434;
      const host = opts.host || "127.0.0.1";
      const daemonUrl = opts.daemonUrl;

      if (opts.foreground) {
        // Run foreground server (prefer staged standalone openrig-sidecar runtime when available)
        try {
          const stagedSidecarServer = path.join(OPENRIG_DIR, "runtime", "openrig-sidecar", "dist", "server.js");
          let startSidecarServer: (o: { port: number; host: string; daemonUrl: string }) => Promise<{ url: string }>;
          if (fs.existsSync(stagedSidecarServer)) {
            ({ startSidecarServer } = await import(pathToFileURL(stagedSidecarServer).href) as typeof import("@openrig/daemon/sidecar-server"));
          } else {
            ({ startSidecarServer } = await import("@openrig/daemon/sidecar-server"));
          }
          const { url } = await startSidecarServer({ port, host, daemonUrl });

          console.log(`\nOpenRig Sidecar (Antigravity Studio)`);
          console.log(`  Sidecar URL: ${url}`);
          console.log(`  Connected to Daemon: ${daemonUrl}`);
          console.log(`  Tabs available: Approvals | Agent Topology | Deliverables & Proofs`);
          console.log(`\nPress Ctrl+C to stop.\n`);

          if (opts.open !== false) {
            await openBrowserUrl(url).catch(() => {});
          }
        } catch (err) {
          console.error(`Failed to start sidecar:`, (err as Error).message);
          process.exitCode = 1;
        }
        return;
      }

      // Detached background daemon mode
      const existing = readSidecarState();
      if (existing && isPidAlive(existing.pid)) {
        console.log(`Sidecar is already running on port ${existing.port} (pid ${existing.pid})`);
        console.log(`  URL: http://${existing.host}:${existing.port}`);
        if (opts.open !== false) {
          await openBrowserUrl(`http://${existing.host}:${existing.port}`).catch(() => {});
        }
        return;
      }

      fs.mkdirSync(OPENRIG_DIR, { recursive: true });
      const logFd = fs.openSync(SIDECAR_LOG_FILE, "a");

      const child = spawn(
        process.execPath,
        [
          process.argv[1]!,
          "sidecar",
          "--foreground",
          "--port", String(port),
          "--host", host,
          "--daemon-url", daemonUrl,
          "--no-open"
        ],
        {
          detached: true,
          stdio: ["ignore", logFd, logFd],
          env: process.env
        }
      );

      const pid = child.pid!;
      child.unref();

      const state: SidecarState = {
        pid,
        port,
        host,
        daemonUrl,
        startedAt: new Date().toISOString()
      };
      fs.writeFileSync(SIDECAR_STATE_FILE, JSON.stringify(state, null, 2));

      // Quick liveness poll
      const url = `http://${host}:${port}`;
      let ready = false;
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 150));
        try {
          const res = await fetch(url);
          if (res.ok) {
            ready = true;
            break;
          }
        } catch {}
      }

      if (ready) {
        console.log(`Sidecar started on port ${port} (pid ${pid})`);
        console.log(`  Sidecar URL: ${url}`);
        console.log(`  Logs: ${SIDECAR_LOG_FILE}`);
        if (opts.open !== false) {
          await openBrowserUrl(url).catch(() => {});
        }
      } else {
        console.log(`Sidecar process spawned (pid ${pid}), checking logs...`);
        console.log(`  Logs: ${SIDECAR_LOG_FILE}`);
      }
    });

  cmd.command("stop")
    .description("Stop the background OpenRig Sidecar")
    .action(() => {
      const state = readSidecarState();
      if (!state) {
        console.log("Sidecar is not running (no state file found)");
        return;
      }

      if (isPidAlive(state.pid)) {
        try {
          process.kill(state.pid, "SIGTERM");
          console.log(`Sidecar stopped (pid ${state.pid})`);
        } catch (e) {
          console.error(`Failed to kill sidecar process:`, (e as Error).message);
        }
      } else {
        console.log(`Sidecar process was already stopped`);
      }

      try {
        fs.unlinkSync(SIDECAR_STATE_FILE);
      } catch {}
    });

  cmd.command("status")
    .description("Show the status of the OpenRig Sidecar")
    .action(async () => {
      const state = readSidecarState();
      if (!state || !isPidAlive(state.pid)) {
        console.log("Sidecar is stopped");
        if (state) {
          try { fs.unlinkSync(SIDECAR_STATE_FILE); } catch {}
        }
        return;
      }

      const url = `http://${state.host}:${state.port}`;
      let responding = false;
      try {
        const res = await fetch(url);
        responding = res.ok;
      } catch {}

      console.log(`Sidecar running on port ${state.port} (pid ${state.pid})`);
      console.log(`  Status: ${responding ? "healthy" : "unresponsive"}`);
      console.log(`  URL: ${url}`);
      console.log(`  Connected daemon: ${state.daemonUrl}`);
      console.log(`  Started: ${new Date(state.startedAt).toLocaleString()}`);
    });

  return cmd;
}

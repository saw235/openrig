import { Command } from "commander";
import { getDaemonStatus, getDaemonUrl, type LifecycleDeps , daemonStatusGuard} from "../daemon-lifecycle.js";
import { readOpenRigEnv } from "../openrig-compat.js";
import { realDeps } from "./daemon.js";

export interface UiDeps {
  lifecycleDeps: LifecycleDeps;
  exec: (cmd: string, args: string[]) => Promise<void>;
  /** Reads the daemon's own answer for the UI page. Defaults to fetch with a short timeout. */
  probeUi?: (url: string) => Promise<{ status: number; headers: { get(name: string): string | null } }>;
}

export const UI_DISABLED_GUIDANCE =
  "The OpenRig web UI is off on this daemon. To turn it on, run `rig config set ui.enabled true`, then stop and start the daemon (`rig daemon stop`, `rig daemon start`).";

export async function openBrowserUrl(
  url: string,
  exec?: (cmd: string, args: string[]) => Promise<void>,
): Promise<void> {
  const runner = exec ?? (async (cmd, args) => {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    await promisify(execFile)(cmd, args);
  });

  const isWsl = process.platform === "linux" && !!(process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP);
  if (isWsl) {
    try {
      await runner("wslview", [url]);
      return;
    } catch {
      try {
        await runner("cmd.exe", ["/c", "start", "", url]);
        return;
      } catch {
        // fall through
      }
    }
  } else if (process.platform === "darwin") {
    try {
      await runner("open", [url]);
      return;
    } catch {
      // fall through
    }
  } else if (process.platform === "linux") {
    try {
      await runner("xdg-open", [url]);
      return;
    } catch {
      // fall through
    }
  }

  // Fallback
  await runner("open", [url]);
}

export function uiCommand(depsOverride?: UiDeps): Command {
  const cmd = new Command("ui").description("UI commands");
  const getDeps = (): UiDeps => depsOverride ?? {
    lifecycleDeps: realDeps(),
    exec: async (cmd, args) => {
      const { execFile } = await import("node:child_process");
      const { promisify } = await import("node:util");
      await promisify(execFile)(cmd, args);
    },
  };

  cmd
    .command("open")
    .description("Open the OpenRig UI in the default browser")
    .action(async () => {
      const deps = getDeps();

      // Explicit override skips daemon status entirely (dev workflow with Vite)
      const overrideUrl = readOpenRigEnv("OPENRIG_UI_URL", "RIGGED_UI_URL")?.trim();
      if (overrideUrl) {
        console.log(`OpenRig Studio: ${overrideUrl}`);
        try {
          await openBrowserUrl(overrideUrl, deps.exec);
        } catch {
          console.error("Failed to open browser — open the URL manually");
          process.exitCode = 1;
        }
        return;
      }

      // Default: derive UI URL from daemon status (daemon serves the UI)
      const status = await getDaemonStatus(deps.lifecycleDeps);
      if (!daemonStatusGuard(status)) return;

      const url = getDaemonUrl(status);
      // Ask the running daemon, not local config: the setting takes effect when the daemon starts.
      const probeUi = deps.probeUi ?? ((target: string) => fetch(target, { signal: AbortSignal.timeout(3000) }));
      try {
        const res = await probeUi(url);
        if (res.status === 404 && res.headers.get("x-openrig-web-ui") === "off") {
          console.error(UI_DISABLED_GUIDANCE);
          process.exitCode = 1;
          return;
        }
      } catch {
        // No answer: open the URL as before; the browser shows whatever the daemon serves.
      }
      console.log(`OpenRig Studio: ${url}`);

      try {
        await openBrowserUrl(url, deps.exec);
      } catch {
        console.error("Failed to open browser — open the URL manually");
        process.exitCode = 1;
      }
    });

  return cmd;
}

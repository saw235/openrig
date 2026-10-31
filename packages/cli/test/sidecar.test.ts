import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sidecarCommand } from "../src/commands/sidecar.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

describe("sidecar command CLI suite", () => {
  it("defines the sidecar commander surface with options and subcommands", () => {
    const cmd = sidecarCommand();
    expect(cmd.name()).toBe("sidecar");
    expect(cmd.description()).toContain("OpenRig Sidecar");

    const optionNames = cmd.options.map((o) => o.name());
    expect(optionNames).toContain("port");
    expect(optionNames).toContain("host");
    expect(optionNames).toContain("daemon-url");
    expect(optionNames).toContain("foreground");
    expect(optionNames).toContain("no-open");

    const subcommands = cmd.commands.map((c) => c.name());
    expect(subcommands).toContain("stop");
    expect(subcommands).toContain("status");
  });

  it("handles sidecar stop when state file does not exist", async () => {
    const cmd = sidecarCommand();
    const stopCmd = cmd.commands.find((c) => c.name() === "stop")!;
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(" "));

    try {
      await stopCmd.parseAsync([], { from: "user" });
      expect(logs.some((l) => l.includes("not running"))).toBe(true);
    } finally {
      console.log = origLog;
    }
  });

  it("handles sidecar status when stopped", async () => {
    const cmd = sidecarCommand();
    const statusCmd = cmd.commands.find((c) => c.name() === "status")!;
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(" "));

    try {
      await statusCmd.parseAsync([], { from: "user" });
      expect(logs.some((l) => l.includes("Sidecar is stopped"))).toBe(true);
    } finally {
      console.log = origLog;
    }
  });
});

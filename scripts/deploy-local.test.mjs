import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(import.meta.dirname, "..");
const deployScript = path.join(repoRoot, "scripts", "deploy-local.sh");

test("deploy-local.sh syntax passes bash -n", () => {
  const result = spawnSync("bash", ["-n", deployScript], { encoding: "utf8" });
  assert.equal(result.status, 0, `bash -n failed: ${result.stderr}`);
});

test("package.json declares deploy:local script", () => {
  const pkgJsonPath = path.join(repoRoot, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
  assert.equal(pkg.scripts["deploy:local"], "bash scripts/deploy-local.sh");
});

test("deploy-local.sh staging and atomic symlinking into isolated prefix", (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "openrig-deploy-test-"));
  t.after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  const openrigDir = path.join(tmpDir, ".openrig");
  const runtimeDir = path.join(openrigDir, "runtime");
  const localBinDir = path.join(tmpDir, "local-bin");
  const agyBinDir = path.join(tmpDir, "agy-bin");
  fs.mkdirSync(localBinDir, { recursive: true });
  fs.mkdirSync(agyBinDir, { recursive: true });

  // Create a minimal fake openrig-sidecar source for hermetic testing
  const fakeSidecarSrc = path.join(tmpDir, "fake-sidecar");
  fs.mkdirSync(path.join(fakeSidecarSrc, "dist"), { recursive: true });
  fs.writeFileSync(path.join(fakeSidecarSrc, "package.json"), JSON.stringify({ name: "openrig-sidecar", version: "0.1.0" }));
  const fakeSidecarBin = path.join(fakeSidecarSrc, "dist", "index.js");
  fs.writeFileSync(fakeSidecarBin, "#!/usr/bin/env node\nconsole.log('OpenRig Sidecar');\n", { mode: 0o755 });

  const env = {
    ...process.env,
    OPENRIG_DIR: openrigDir,
    OPENRIG_RUNTIME_DIR: runtimeDir,
    LOCAL_BIN_DIR: localBinDir,
    AGY_BIN_DIR: agyBinDir,
    OPENRIG_SIDECAR_SRC: fakeSidecarSrc,
    SKIP_BUILD: "true",
  };

  const result = spawnSync("bash", [deployScript], {
    cwd: repoRoot,
    env,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, `deploy-local.sh failed:\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);

  // Check openrig-core staged runtime
  const coreRuntime = path.join(runtimeDir, "openrig-core");
  assert.ok(fs.existsSync(coreRuntime), "openrig-core runtime directory must exist");
  assert.ok(fs.existsSync(path.join(coreRuntime, "dist", "bin-wrapper.js")), "dist/bin-wrapper.js must exist");
  assert.ok(fs.existsSync(path.join(coreRuntime, "package.json")), "package.json must exist in core runtime");
  assert.ok(fs.existsSync(path.join(coreRuntime, "daemon")), "daemon directory must exist in core runtime");
  assert.ok(fs.existsSync(path.join(coreRuntime, "node_modules")), "node_modules symlink must exist");
  assert.ok(fs.existsSync(path.join(coreRuntime, "packages", "cli")), "packages/cli compatibility link must exist");

  // Check rig binary symlinks
  const rigSymlink = path.join(localBinDir, "rig");
  assert.ok(fs.existsSync(rigSymlink), "local-bin/rig symlink must exist");
  assert.equal(fs.realpathSync(rigSymlink), fs.realpathSync(path.join(coreRuntime, "dist", "bin-wrapper.js")));

  const agyRigSymlink = path.join(agyBinDir, "rig");
  assert.ok(fs.existsSync(agyRigSymlink), "agy-bin/rig symlink must exist");
  assert.equal(fs.realpathSync(agyRigSymlink), fs.realpathSync(path.join(coreRuntime, "dist", "bin-wrapper.js")));

  // Check openrig-sidecar staged runtime
  const sidecarRuntime = path.join(runtimeDir, "openrig-sidecar");
  assert.ok(fs.existsSync(sidecarRuntime), "openrig-sidecar runtime directory must exist");
  assert.ok(fs.existsSync(path.join(sidecarRuntime, "dist", "index.js")), "sidecar dist/index.js must exist");

  // Check sidecar binary symlinks
  const sidecarSymlink = path.join(localBinDir, "openrig-sidecar");
  assert.ok(fs.existsSync(sidecarSymlink), "local-bin/openrig-sidecar symlink must exist");
  assert.equal(fs.realpathSync(sidecarSymlink), fs.realpathSync(path.join(sidecarRuntime, "dist", "index.js")));
});

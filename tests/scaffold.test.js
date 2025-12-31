import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const binPath = path.join(repoRoot, "bin", "create-mcp-server-kit.js");

test("scaffolds ts-stdio template with placeholder replacement", async () => {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), "create-mcp-server-kit-"));
  const projectDir = path.join(base, "my-mcp-server");

  const res = spawnSync(
    process.execPath,
    [binPath, projectDir, "--template", "ts-stdio", "--no-install", "--no-git"],
    { cwd: repoRoot, encoding: "utf8" }
  );

  assert.equal(res.status, 0, `non-zero exit code\n${res.stderr}`);

  const pkg = JSON.parse(
    await fs.readFile(path.join(projectDir, "package.json"), "utf8")
  );
  assert.equal(pkg.name, "my-mcp-server");
  assert.ok(pkg.description);

  // `gitignore` should be renamed to `.gitignore`
  await fs.access(path.join(projectDir, ".gitignore"));

  const src = await fs.readFile(path.join(projectDir, "src", "index.ts"), "utf8");
  assert.ok(!src.includes("__PROJECT_NAME__"));
  assert.ok(src.includes("my-mcp-server"));

  const readme = await fs.readFile(path.join(projectDir, "README.md"), "utf8");
  assert.ok(!readme.includes("__PROJECT_NAME__"));
});



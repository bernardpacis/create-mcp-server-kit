import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

async function assertExists(relPath) {
  const p = path.join(repoRoot, relPath);
  try {
    await fs.access(p);
  } catch {
    throw new Error(`Missing required file: ${relPath}`);
  }
}

async function assertFileContains(relPath, needle) {
  const p = path.join(repoRoot, relPath);
  const txt = await fs.readFile(p, "utf8");
  if (!txt.includes(needle)) {
    throw new Error(`Expected "${relPath}" to contain: ${needle}`);
  }
}

async function main() {
  // Core CLI
  await assertExists("package.json");
  await assertExists("bin/create-mcp-server-kit.js");

  // Template: ts-stdio
  await assertExists("templates/ts-stdio/package.json");
  await assertExists("templates/ts-stdio/src/index.ts");
  await assertExists("templates/ts-stdio/README.md");
  await assertExists("templates/ts-stdio/gitignore");

  // Placeholders must exist (used by the CLI replacement step)
  await assertFileContains("templates/ts-stdio/package.json", "__PACKAGE_NAME__");
  await assertFileContains(
    "templates/ts-stdio/package.json",
    "__DESCRIPTION__"
  );
  await assertFileContains("templates/ts-stdio/src/index.ts", "__PROJECT_NAME__");

  process.stdout.write("check: ok\n");
}

main().catch((err) => {
  process.stderr.write(`check: failed\n${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});



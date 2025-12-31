#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function println(line = "") {
  process.stdout.write(`${line}\n`);
}

function eprintln(line = "") {
  process.stderr.write(`${line}\n`);
}

function die(message, code = 1) {
  eprintln(`\nError: ${message}\n`);
  process.exit(code);
}

function readJsonFromRepo(relPath) {
  const p = path.join(repoRoot, relPath);
  return fs.readFile(p, "utf8").then((txt) => JSON.parse(txt));
}

function isFlag(arg, longName, shortName) {
  return arg === `--${longName}` || (shortName && arg === `-${shortName}`);
}

function parseArgs(argv) {
  /** @type {{dir?: string, template: string, install: boolean, git: boolean, pm?: string, name?: string, description?: string, force: boolean}} */
  const out = {
    template: "ts-stdio",
    install: true,
    git: true,
    force: false,
  };

  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];

    if (isFlag(a, "help", "h")) out.help = true;
    else if (isFlag(a, "version", "v")) out.version = true;
    else if (a === "--template") out.template = argv[++i];
    else if (a === "--pm") out.pm = argv[++i];
    else if (a === "--name") out.name = argv[++i];
    else if (a === "--description") out.description = argv[++i];
    else if (a === "--no-install") out.install = false;
    else if (a === "--install") out.install = true;
    else if (a === "--no-git") out.git = false;
    else if (a === "--git") out.git = true;
    else if (a === "--force") out.force = true;
    else if (a.startsWith("-")) die(`Unknown flag: ${a}`);
    else positional.push(a);
  }

  if (positional.length > 1) {
    die(`Too many positional arguments: ${positional.join(" ")}`);
  }

  if (positional.length === 1) out.dir = positional[0];

  return out;
}

function helpText(pkg) {
  return `
${pkg.name} v${pkg.version}

Scaffold a production-ready Model Context Protocol (MCP) server.

Usage:
  npx ${pkg.name}@latest <dir> [options]
  ${pkg.name} <dir> [options]

Options:
  --template <name>     Template name (default: ts-stdio)
  --pm <npm|pnpm|yarn|bun>
                        Package manager to use for install
  --name <pkg-name>     Override generated package name
  --description <text>  Override generated description
  --no-install          Skip dependency install
  --no-git              Skip \`git init\`
  --force               Write into a non-empty directory
  -h, --help            Show help
  -v, --version         Show version
`.trim();
}

function toPackageName(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return "mcp-server";
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
  if (!slug) return "mcp-server";
  // npm package name must not start with '.' or '_'
  return slug.replace(/^[._]+/, "") || "mcp-server";
}

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function isDirEmpty(p) {
  const entries = await fs.readdir(p);
  return entries.length === 0;
}

function spawnOk(cmd, args, cwd) {
  const needsShell =
    process.platform === "win32" && ["npm", "pnpm", "yarn"].includes(cmd);

  const result = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    shell: needsShell,
  });

  if (result.error) {
    return { ok: false, status: 1, error: result.error };
  }

  return { ok: result.status === 0, status: result.status ?? 1 };
}

function looksTextFile(fileName) {
  const lower = fileName.toLowerCase();
  const textExts = [
    ".js",
    ".cjs",
    ".mjs",
    ".ts",
    ".tsx",
    ".json",
    ".md",
    ".txt",
    ".yml",
    ".yaml",
    ".gitignore",
    ".gitattributes",
    ".npmrc",
    ".editorconfig",
    ".env",
  ];
  if (textExts.some((ext) => lower.endsWith(ext))) return true;
  // Template files like `gitignore` (renamed on copy)
  if (lower === "gitignore") return true;
  return true;
}

async function copyTemplateDir(fromDir, toDir, tokens) {
  await fs.mkdir(toDir, { recursive: true });
  const entries = await fs.readdir(fromDir, { withFileTypes: true });

  for (const ent of entries) {
    const src = path.join(fromDir, ent.name);
    const destName = ent.name === "gitignore" ? ".gitignore" : ent.name;
    const dest = path.join(toDir, destName);

    if (ent.isDirectory()) {
      await copyTemplateDir(src, dest, tokens);
      continue;
    }

    if (!ent.isFile()) {
      // ignore symlinks/sockets/etc for safety
      continue;
    }

    const buf = await fs.readFile(src);
    if (!looksTextFile(destName)) {
      await fs.writeFile(dest, buf);
      continue;
    }

    let text = buf.toString("utf8");
    for (const [k, v] of Object.entries(tokens)) {
      text = text.split(k).join(v);
    }
    await fs.writeFile(dest, text, "utf8");
  }
}

function resolvePm(pmFlag) {
  if (!pmFlag) return "npm";
  const pm = String(pmFlag).toLowerCase();
  if (!["npm", "pnpm", "yarn", "bun"].includes(pm)) {
    die(`Unsupported package manager: ${pmFlag} (use npm|pnpm|yarn|bun)`);
  }
  return pm;
}

function pmInstallCmd(pm) {
  switch (pm) {
    case "pnpm":
      return { cmd: "pnpm", args: ["install"] };
    case "yarn":
      return { cmd: "yarn", args: [] };
    case "bun":
      return { cmd: "bun", args: ["install"] };
    case "npm":
    default:
      return { cmd: "npm", args: ["install"] };
  }
}

async function main() {
  const pkg = await readJsonFromRepo("package.json");
  const args = parseArgs(process.argv.slice(2));

  if (args.version) {
    println(pkg.version);
    return;
  }

  if (args.help || !args.dir) {
    println(helpText(pkg));
    return;
  }

  const template = args.template || "ts-stdio";
  const templateDir = path.join(repoRoot, "templates", template);
  if (!(await pathExists(templateDir))) {
    die(`Unknown template "${template}". Available: ts-stdio`);
  }

  const targetDir = path.resolve(process.cwd(), args.dir);
  const targetName = path.basename(targetDir);

  if (await pathExists(targetDir)) {
    if (!args.force && !(await isDirEmpty(targetDir))) {
      die(
        `Target directory is not empty: ${targetDir}\n` +
          `Use --force to write anyway, or choose another directory.`
      );
    }
  } else {
    await fs.mkdir(targetDir, { recursive: true });
  }

  const pkgName = toPackageName(args.name ?? targetName);
  const description =
    args.description ?? "An MCP server generated by create-mcp-server-kit.";

  const tokens = {
    "__PACKAGE_NAME__": pkgName,
    "__PROJECT_NAME__": pkgName,
    "__DESCRIPTION__": description,
  };

  println(`\nCreating MCP server in: ${targetDir}`);
  println(`- template: ${template}`);
  println(`- package:  ${pkgName}\n`);

  await copyTemplateDir(templateDir, targetDir, tokens);

  if (args.git) {
    const res = spawnOk("git", ["init"], targetDir);
    if (!res.ok) {
      eprintln("Warning: git init failed (git not installed?) — continuing.");
    }
  }

  if (args.install) {
    const pm = resolvePm(args.pm);
    const { cmd, args: installArgs } = pmInstallCmd(pm);
    println(`\nInstalling dependencies (${pm})...`);
    const res = spawnOk(cmd, installArgs, targetDir);
    if (!res.ok) {
      if (res.error) die(`Install failed: ${res.error.message}`, res.status);
      die(`Install failed (exit code ${res.status}).`, res.status);
    }
  }

  println("\nDone.");
  println("\nNext steps:");
  println(`  cd ${args.dir}`);
  println("  npm run dev");
  println("\nTip: The generated server is a stdio MCP server (great for Claude Desktop).");
}

main().catch((err) => {
  die(err instanceof Error ? err.message : String(err));
});



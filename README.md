# create-mcp-server-kit

![node >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen) ![license MIT](https://img.shields.io/badge/license-MIT-blue)

Scaffold a **production-ready Model Context Protocol (MCP) server** in seconds.

**Who is this for?** Anyone who wants to ship an MCP server fast — with a starter that actually runs, a clean structure, and CI-ready defaults.

## What you get (default template: `ts-stdio`)

- **TypeScript** + **Zod** validation
- **stdio transport** (ideal for local integrations like Claude Desktop)
- Example tools you can extend immediately (`hello`, `add`)
- Template includes **GitHub Actions CI** out of the box

## Quick start

### Option A: Use it after publishing to npm (recommended)

```bash
npx create-mcp-server-kit@latest my-mcp-server
```

Or:

```bash
npm create mcp-server-kit@latest my-mcp-server
```

### Option B: Use it from this repo (no publish needed)

```bash
node ./bin/create-mcp-server-kit.js my-mcp-server
cd my-mcp-server
npm run dev
```

> Windows note: if you previously ran `node create-mcp-server-kit` and got `MODULE_NOT_FOUND`,
> run the entry file explicitly:
>
> ```bash
> node ./create-mcp-server-kit/bin/create-mcp-server-kit.js my-mcp-server
> ```

## What gets generated

Example output (simplified):

```text
my-mcp-server/
  src/index.ts
  package.json
  tsconfig.json
  README.md
  .github/workflows/ci.yml
```

## Using the generated server (Claude Desktop example)

1. Build your server:

```bash
npm run build
```

2. Configure your MCP client to run `node dist/index.js`.

The generated project includes a ready-to-copy config snippet in its own `README.md`.

## Templates

- **ts-stdio** (default): TypeScript MCP server using `@modelcontextprotocol/sdk` + `StdioServerTransport`.

## CLI options

```text
--template <name>     Template name (default: ts-stdio)
--pm <npm|pnpm|yarn|bun>
                      Package manager to use for install
--name <pkg-name>     Override generated package name
--description <text>  Override generated description
--no-install          Skip dependency install
--no-git              Skip `git init`
--force               Write into a non-empty directory
```

## Contributing

PRs welcome — especially additional templates (Streamable HTTP, OAuth, task-enabled tools) and improvements to the default template.

## Publishing (optional)

If you want others to use it via `npx`/`npm create`, publish to npm:

1. Fill in `package.json` metadata (author/repository/homepage).
2. Run `npm publish`.

## 中文（繁體）

這個專案是一個 MCP 伺服器腳手架：讓你用一行指令生成「可以直接跑」的 TypeScript + stdio MCP server（很適合 Claude Desktop 這類本機整合）。


/* eslint-disable no-console */
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function main() {
  const entry = pathToFileURL(
    path.join(__dirname, "bin", "create-mcp-server-kit.js")
  ).href;

  await import(entry);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});



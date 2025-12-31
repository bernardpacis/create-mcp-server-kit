import process from "node:process";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer(
  {
    name: "__PROJECT_NAME__",
    version: "0.1.0",
  },
  {
    capabilities: {
      // Enables the "notifications/message" channel (so you can log back to the client).
      logging: {},
    },
  }
);

const HelloInputSchema = z.object({
  name: z.string().min(1),
});
type HelloInput = z.infer<typeof HelloInputSchema>;

server.registerTool(
  "hello",
  {
    title: "Hello",
    description: "Say hello to someone.",
    inputSchema: HelloInputSchema,
  },
  async ({ name }: HelloInput) => ({
    content: [{ type: "text", text: `Hello, ${name}!` }],
  })
);

const AddInputSchema = z.object({
  a: z.number(),
  b: z.number(),
});
type AddInput = z.infer<typeof AddInputSchema>;

server.registerTool(
  "add",
  {
    title: "Add",
    description: "Add two numbers.",
    inputSchema: AddInputSchema,
  },
  async ({ a, b }: AddInput) => ({
    content: [{ type: "text", text: String(a + b) }],
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[__PROJECT_NAME__] MCP stdio server running`);
}

process.on("SIGINT", async () => {
  try {
    await server.close();
  } finally {
    process.exit(0);
  }
});

main().catch((err) => {
  console.error(err);
  process.exit(1);
});



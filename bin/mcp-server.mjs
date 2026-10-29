#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer, TOKEN_HINT } from "../dist/mcp-server.js";

const token = process.env.MERCADOLIBRE_ACCESS_TOKEN;
if (!token) {
  // Not fatal: get_category still works anonymously and policies may change. Say it once, on stderr.
  console.error(`[mercadolibre-mcp] MERCADOLIBRE_ACCESS_TOKEN is not set. ${TOKEN_HINT}`);
}

const server = createMcpServer(token);
const transport = new StdioServerTransport();
await server.connect(transport);

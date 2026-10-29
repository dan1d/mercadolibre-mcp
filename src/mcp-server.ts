import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMercadoLibreTools } from "./index.js";
import { MercadoLibreError } from "./errors.js";
import {
  SearchItemsSchema,
  GetItemSchema,
  GetItemDescriptionSchema,
  GetCategoriesSchema,
  GetCategorySchema,
  GetSellerInfoSchema,
  GetTrendsSchema,
  GetCurrencyConversionSchema,
} from "./schemas.js";

// Resolves to the repo root from dist/ (runtime) and from src/ (tests) alike.
const { version: PACKAGE_VERSION } = createRequire(__filename)("../package.json") as { version: string };

export const TOKEN_HINT =
  "MercadoLibre requires an access token for this endpoint. Set MERCADOLIBRE_ACCESS_TOKEN (create a free application at https://developers.mercadolibre.com and use its access token).";

type ToolResult = { content: Array<{ type: "text"; text: string }>; isError?: boolean };

/** Turns an error into the text the agent sees, adding the fix for the failure modes it can act on. */
export function describeError(error: unknown): string {
  if (error instanceof MercadoLibreError) {
    if (error.status === 401 || error.status === 403) return `${error.message}\n\n${TOKEN_HINT}`;
    if (error.isRateLimited) return `${error.message}\n\nRate limited by MercadoLibre; wait before retrying.`;
    return error.message;
  }
  return error instanceof Error ? error.message : String(error);
}

/** Shared result/error envelope for every tool: JSON on success, message + isError on failure. */
function wrap<P>(fn: (params: P) => Promise<unknown>): (params: P) => Promise<ToolResult> {
  return async (params) => {
    try {
      const result = await fn(params);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: describeError(error) }], isError: true };
    }
  };
}

const NEEDS_TOKEN = " Requires MERCADOLIBRE_ACCESS_TOKEN.";

export function createMcpServer(accessToken?: string) {
  const { tools } = createMercadoLibreTools(accessToken);

  const server = new McpServer({ name: "mercadolibre-mcp", version: PACKAGE_VERSION });

  server.registerTool(
    "search_items",
    {
      description:
        "Search products on MercadoLibre by keyword. Supports filtering by category, price range, and site (MLA=Argentina, MLB=Brazil, MLM=Mexico, etc.)." + NEEDS_TOKEN,
      inputSchema: SearchItemsSchema.shape,
    },
    wrap(tools.search_items),
  );

  server.registerTool(
    "get_item",
    {
      description: "Get full details of a MercadoLibre item including title, price, pictures, seller, condition, and stock." + NEEDS_TOKEN,
      inputSchema: GetItemSchema.shape,
    },
    wrap(tools.get_item),
  );

  server.registerTool(
    "get_item_description",
    {
      description: "Get the full text description of a MercadoLibre item." + NEEDS_TOKEN,
      inputSchema: GetItemDescriptionSchema.shape,
    },
    wrap(tools.get_item_description),
  );

  server.registerTool(
    "get_categories",
    {
      description: "List all top-level categories for a MercadoLibre site." + NEEDS_TOKEN,
      inputSchema: GetCategoriesSchema.shape,
    },
    wrap(tools.get_categories),
  );

  server.registerTool(
    "get_category",
    {
      description: "Get category details including name, path from root, and children categories. Works without a token.",
      inputSchema: GetCategorySchema.shape,
    },
    wrap(tools.get_category),
  );

  server.registerTool(
    "get_seller_info",
    {
      description: "Get seller profile including reputation, ratings, and transaction stats." + NEEDS_TOKEN,
      inputSchema: GetSellerInfoSchema.shape,
    },
    wrap(tools.get_seller_info),
  );

  server.registerTool(
    "get_trends",
    {
      description: "Get current trending searches on MercadoLibre for a specific site/country." + NEEDS_TOKEN,
      inputSchema: GetTrendsSchema.shape,
    },
    wrap(tools.get_trends),
  );

  server.registerTool(
    "get_currency_conversion",
    {
      description: "Convert between currencies using MercadoLibre exchange rates (ARS, BRL, MXN, USD, etc.)." + NEEDS_TOKEN,
      inputSchema: GetCurrencyConversionSchema.shape,
    },
    wrap(tools.get_currency_conversion),
  );

  return server;
}

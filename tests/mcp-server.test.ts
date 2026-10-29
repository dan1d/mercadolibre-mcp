import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer, describeError, TOKEN_HINT } from "../src/mcp-server.js";
import { MercadoLibreError } from "../src/errors.js";
import pkg from "../package.json";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function textOf(result: Awaited<ReturnType<Client["callTool"]>>): string {
  return (result.content as Array<{ text: string }>)[0].text;
}

describe("describeError", () => {
  it("adds the token hint on 401 and 403", () => {
    for (const status of [401, 403]) {
      const text = describeError(new MercadoLibreError("GET", "/sites/MLA/search?q=x", status, "forbidden"));
      expect(text).toContain(`GET /sites/MLA/search?q=x failed (${status})`);
      expect(text).toContain(TOKEN_HINT);
    }
  });

  it("adds a back-off hint on 429", () => {
    expect(describeError(new MercadoLibreError("GET", "/x", 429, "slow down"))).toContain("Rate limited");
  });

  it("passes other API errors and plain errors through", () => {
    expect(describeError(new MercadoLibreError("GET", "/x", 500, "boom"))).toBe("GET /x failed (500): boom");
    expect(describeError(new Error("plain"))).toBe("plain");
    expect(describeError("string")).toBe("string");
  });
});

describe("MCP Server", () => {
  let client: Client;
  let server: ReturnType<typeof createMcpServer>;

  async function connect(token?: string) {
    server = createMcpServer(token);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    client = new Client({ name: "test-client", version: "0.0.0" });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  }

  beforeEach(async () => {
    mockFetch.mockReset();
    await connect("TEST_TOKEN");
  });

  afterEach(async () => {
    await client.close();
    await server.close();
  });

  it("reports the package.json version to clients", () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe("mercadolibre-mcp");
    expect(info?.version).toBe(pkg.version);
    expect(info?.version).not.toBe("1.0.0");
  });

  it("registers all 8 tools with descriptions and typed, bounded schemas", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      "get_categories",
      "get_category",
      "get_currency_conversion",
      "get_item",
      "get_item_description",
      "get_seller_info",
      "get_trends",
      "search_items",
    ]);
    for (const tool of tools) {
      expect(tool.description?.length ?? 0).toBeGreaterThan(10);
      expect(tool.inputSchema.type).toBe("object");
    }
    const search = tools.find((t) => t.name === "search_items")!;
    const props = search.inputSchema.properties as Record<string, Record<string, unknown>>;
    expect(props.limit).toMatchObject({ type: "integer", minimum: 1, maximum: 50 });
    expect(props.query.description).toBeTruthy();
  });

  it("forwards the access token as a Bearer header", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ results: [] }));
    await client.callTool({ name: "search_items", arguments: { query: "x" } });
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe("Bearer TEST_TOKEN");
  });

  describe("tool calls — success", () => {
    it.each([
      { name: "search_items", args: { query: "iphone" }, response: { results: [{ id: "MLA1" }] }, check: (t: string) => expect(JSON.parse(t).results).toHaveLength(1) },
      { name: "get_item", args: { item_id: "MLA123" }, response: { id: "MLA123", title: "Test" }, check: (t: string) => expect(JSON.parse(t).id).toBe("MLA123") },
      { name: "get_item_description", args: { item_id: "MLA123" }, response: { plain_text: "A product" }, check: (t: string) => expect(JSON.parse(t).plain_text).toBe("A product") },
      { name: "get_categories", args: {}, response: [{ id: "MLA1055" }], check: (t: string) => expect(JSON.parse(t)).toHaveLength(1) },
      { name: "get_category", args: { category_id: "MLA1055" }, response: { id: "MLA1055", name: "Electronics" }, check: (t: string) => expect(JSON.parse(t).name).toBe("Electronics") },
      { name: "get_seller_info", args: { seller_id: 123 }, response: { id: 123, nickname: "SELLER" }, check: (t: string) => expect(JSON.parse(t).nickname).toBe("SELLER") },
      { name: "get_trends", args: {}, response: [{ keyword: "iphone" }], check: (t: string) => expect(JSON.parse(t)[0].keyword).toBe("iphone") },
      { name: "get_currency_conversion", args: { from: "USD", to: "ARS", amount: 100 }, response: { ratio: 1250.5 }, check: (t: string) => expect(JSON.parse(t).converted).toBe(125050) },
    ])("$name $args", async ({ name, args, response, check }) => {
      mockFetch.mockResolvedValueOnce(jsonResponse(response));
      const result = await client.callTool({ name, arguments: args });
      expect(result.isError).toBeFalsy();
      check(textOf(result));
    });

    it("search_items sends the price range as price=MIN-MAX", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ results: [] }));
      await client.callTool({ name: "search_items", arguments: { query: "tv", price_min: 100000, price_max: 500000 } });
      expect(new URL(mockFetch.mock.calls[0][0] as string).searchParams.get("price")).toBe("100000-500000");
    });
  });

  describe("tool calls — errors are returned as isError, never thrown", () => {
    it.each([
      { name: "search_items", args: { query: "test" } },
      { name: "get_item", args: { item_id: "INVALID" } },
      { name: "get_item_description", args: { item_id: "INVALID" } },
      { name: "get_categories", args: {} },
      { name: "get_category", args: { category_id: "INVALID" } },
      { name: "get_seller_info", args: { seller_id: 999 } },
      { name: "get_trends", args: {} },
      { name: "get_currency_conversion", args: { from: "USD", to: "ARS" } },
    ])("$name on HTTP 500", async ({ name, args }) => {
      mockFetch.mockImplementation(async () => new Response("Server Error", { status: 500 }));
      const result = await client.callTool({ name, arguments: args });
      expect(result.isError).toBe(true);
      expect(textOf(result)).toContain("failed (500)");
    });

    it("403 without a token tells the agent exactly what to set", async () => {
      await client.close();
      await server.close();
      await connect(undefined);
      mockFetch.mockResolvedValueOnce(new Response('{"message":"forbidden"}', { status: 403 }));
      const result = await client.callTool({ name: "search_items", arguments: { query: "iphone" } });
      expect(result.isError).toBe(true);
      expect(textOf(result)).toContain("GET /sites/MLA/search?q=iphone&limit=10 failed (403)");
      expect(textOf(result)).toContain("MERCADOLIBRE_ACCESS_TOKEN");
      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
    });

    it("network failure (fetch rejects) is reported with isError", async () => {
      mockFetch.mockRejectedValueOnce(new DOMException("The operation was aborted due to timeout", "TimeoutError"));
      const result = await client.callTool({ name: "get_trends", arguments: {} });
      expect(result.isError).toBe(true);
      expect(textOf(result)).toContain("timeout");
    });

    it("rejects out-of-range limit at the schema boundary without calling the API", async () => {
      const outcome = await client.callTool({ name: "search_items", arguments: { query: "tv", limit: 0 } }).then(
        (r) => ({ isError: r.isError, text: textOf(r) }),
        (e: Error) => ({ isError: true, text: e.message }),
      );
      expect(outcome.isError).toBe(true);
      expect(outcome.text).toMatch(/limit|Invalid|greater/i);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});

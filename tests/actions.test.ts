import { describe, it, expect, vi, beforeEach } from "vitest";
import { MercadoLibreClient } from "../src/client.js";
import {
  searchItems,
  getItem,
  getItemDescription,
  getCategories,
  getCategory,
  getSellerInfo,
  getTrends,
  getCurrencyConversion,
} from "../src/actions.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const BASE = "https://api.mercadolibre.com";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function calledUrl(n = 0): string {
  return mockFetch.mock.calls[n][0] as string;
}

describe("actions", () => {
  let client: MercadoLibreClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new MercadoLibreClient();
  });

  describe("searchItems", () => {
    it("searches with query, default site MLA and default limit 10", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ results: [{ id: "MLA1" }] }));
      const result = await searchItems(client, { query: "iphone" });
      expect(calledUrl()).toBe(`${BASE}/sites/MLA/search?q=iphone&limit=10`);
      expect(result).toEqual({ results: [{ id: "MLA1" }] });
    });

    it("uses a custom site_id and offset", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ results: [] }));
      await searchItems(client, { query: "notebook", site_id: "MLB", offset: 20 });
      expect(calledUrl()).toBe(`${BASE}/sites/MLB/search?q=notebook&limit=10&offset=20`);
    });

    it("sends the price range as MercadoLibre's single price=MIN-MAX filter", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ results: [] }));
      await searchItems(client, { query: "tv", category: "MLA1055", price_min: 100000, price_max: 500000 });
      expect(calledUrl()).toBe(`${BASE}/sites/MLA/search?q=tv&category=MLA1055&price=100000-500000&limit=10`);
    });

    it.each([
      [{ price_max: 500000 }, "*-500000"],
      [{ price_min: 100000 }, "100000-*"],
    ])("leaves an open side as * for %j", async (range, expected) => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ results: [] }));
      await searchItems(client, { query: "tv", ...range });
      expect(calledUrl()).toContain(`price=${encodeURIComponent(expected).replace("%2A", "*")}`.replace("*", "*"));
      expect(new URL(calledUrl()).searchParams.get("price")).toBe(expected);
    });

    it("omits the price filter when no bound is given", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ results: [] }));
      await searchItems(client, { query: "tv" });
      expect(new URL(calledUrl()).searchParams.has("price")).toBe(false);
    });

    it("caps limit at 50 for programmatic callers that bypass the schema", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ results: [] }));
      await searchItems(client, { query: "test", limit: 200 });
      expect(new URL(calledUrl()).searchParams.get("limit")).toBe("50");
    });

    it("URL-encodes the query and site", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ results: [] }));
      await searchItems(client, { query: "a&b c", site_id: "ML/X" });
      expect(calledUrl()).toBe(`${BASE}/sites/ML%2FX/search?q=a%26b+c&limit=10`);
    });
  });

  describe("getItem / getItemDescription", () => {
    it("fetches item by exact path", async () => {
      const item = { id: "MLA123", title: "Test Item", price: 50000 };
      mockFetch.mockResolvedValueOnce(jsonResponse(item));
      const result = await getItem(client, { item_id: "MLA123" });
      expect(calledUrl()).toBe(`${BASE}/items/MLA123`);
      expect(result).toEqual(item);
    });

    it("fetches item description by exact path", async () => {
      const desc = { plain_text: "A great product" };
      mockFetch.mockResolvedValueOnce(jsonResponse(desc));
      const result = await getItemDescription(client, { item_id: "MLA123" });
      expect(calledUrl()).toBe(`${BASE}/items/MLA123/description`);
      expect(result).toEqual(desc);
    });

    it("URL-encodes the item id", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      await getItem(client, { item_id: "../users/me" });
      expect(calledUrl()).toBe(`${BASE}/items/..%2Fusers%2Fme`);
    });
  });

  describe("getCategories / getCategory", () => {
    it("lists categories for the default site", async () => {
      const cats = [{ id: "MLA1055", name: "Electrónica" }];
      mockFetch.mockResolvedValueOnce(jsonResponse(cats));
      const result = await getCategories(client);
      expect(calledUrl()).toBe(`${BASE}/sites/MLA/categories`);
      expect(result).toEqual(cats);
    });

    it("lists categories for a custom site", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));
      await getCategories(client, { site_id: "MLM" });
      expect(calledUrl()).toBe(`${BASE}/sites/MLM/categories`);
    });

    it("fetches category details", async () => {
      const cat = { id: "MLA1055", name: "Electrónica", path_from_root: [] };
      mockFetch.mockResolvedValueOnce(jsonResponse(cat));
      const result = await getCategory(client, { category_id: "MLA1055" });
      expect(calledUrl()).toBe(`${BASE}/categories/MLA1055`);
      expect(result).toEqual(cat);
    });
  });

  describe("getSellerInfo", () => {
    it("fetches seller profile", async () => {
      const seller = { id: 12345, nickname: "SELLER_TEST", reputation: {} };
      mockFetch.mockResolvedValueOnce(jsonResponse(seller));
      const result = await getSellerInfo(client, { seller_id: 12345 });
      expect(calledUrl()).toBe(`${BASE}/users/12345`);
      expect(result).toEqual(seller);
    });
  });

  describe("getTrends", () => {
    it("fetches trends for the default site", async () => {
      const trends = [{ keyword: "iphone 15" }, { keyword: "ps5" }];
      mockFetch.mockResolvedValueOnce(jsonResponse(trends));
      const result = await getTrends(client);
      expect(calledUrl()).toBe(`${BASE}/trends/MLA`);
      expect(result).toEqual(trends);
    });

    it("fetches trends for a custom site", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));
      await getTrends(client, { site_id: "MLB" });
      expect(calledUrl()).toBe(`${BASE}/trends/MLB`);
    });
  });

  describe("getCurrencyConversion", () => {
    it("converts with the returned ratio", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ ratio: 1250.5 }));
      const result = await getCurrencyConversion(client, { from: "USD", to: "ARS", amount: 100 });
      expect(calledUrl()).toBe(`${BASE}/currency_conversions/search?from=USD&to=ARS`);
      expect(result).toEqual({ from: "USD", to: "ARS", rate: 1250.5, amount: 100, converted: 125050 });
    });

    it("defaults amount to 1", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ ratio: 1250.5 }));
      const result = await getCurrencyConversion(client, { from: "USD", to: "ARS" }) as { amount: number; converted: number };
      expect(result.amount).toBe(1);
      expect(result.converted).toBe(1250.5);
    });

    it.each([{}, { ratio: null }, { ratio: 0 }, { ratio: "1250" }])(
      "throws instead of returning NaN/null when the response is %j",
      async (body) => {
        mockFetch.mockResolvedValueOnce(jsonResponse(body));
        await expect(getCurrencyConversion(client, { from: "USD", to: "ARS", amount: 100 })).rejects.toThrow(
          /no usable rate for USD->ARS/
        );
      }
    );
  });
});

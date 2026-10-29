import { MercadoLibreClient } from "./client.js";
import type {
  SearchItemsParams,
  GetItemParams,
  GetItemDescriptionParams,
  GetCategoriesParams,
  GetCategoryParams,
  GetSellerInfoParams,
  GetTrendsParams,
  GetCurrencyConversionParams,
} from "./schemas.js";

const DEFAULT_SITE = "MLA";
const MAX_LIMIT = 50;

export async function searchItems(
  client: MercadoLibreClient,
  params: SearchItemsParams
): Promise<unknown> {
  const siteId = params.site_id ?? DEFAULT_SITE;
  const qp: Record<string, string> = { q: params.query };
  if (params.category) qp.category = params.category;
  // MercadoLibre expresses price ranges as a single `price=MIN-MAX` filter; `*` leaves a side open.
  if (params.price_min !== undefined || params.price_max !== undefined) {
    qp.price = `${params.price_min ?? "*"}-${params.price_max ?? "*"}`;
  }
  qp.limit = String(Math.min(params.limit ?? 10, MAX_LIMIT));
  if (params.offset !== undefined) qp.offset = String(params.offset);
  return client.get(`/sites/${encodeURIComponent(siteId)}/search`, qp);
}

export async function getItem(
  client: MercadoLibreClient,
  params: GetItemParams
): Promise<unknown> {
  return client.get(`/items/${encodeURIComponent(params.item_id)}`);
}

export async function getItemDescription(
  client: MercadoLibreClient,
  params: GetItemDescriptionParams
): Promise<unknown> {
  return client.get(`/items/${encodeURIComponent(params.item_id)}/description`);
}

export async function getCategories(
  client: MercadoLibreClient,
  params?: GetCategoriesParams
): Promise<unknown> {
  const siteId = params?.site_id ?? DEFAULT_SITE;
  return client.get(`/sites/${encodeURIComponent(siteId)}/categories`);
}

export async function getCategory(
  client: MercadoLibreClient,
  params: GetCategoryParams
): Promise<unknown> {
  return client.get(`/categories/${encodeURIComponent(params.category_id)}`);
}

export async function getSellerInfo(
  client: MercadoLibreClient,
  params: GetSellerInfoParams
): Promise<unknown> {
  return client.get(`/users/${encodeURIComponent(String(params.seller_id))}`);
}

export async function getTrends(
  client: MercadoLibreClient,
  params?: GetTrendsParams
): Promise<unknown> {
  const siteId = params?.site_id ?? DEFAULT_SITE;
  return client.get(`/trends/${encodeURIComponent(siteId)}`);
}

export async function getCurrencyConversion(
  client: MercadoLibreClient,
  params: GetCurrencyConversionParams
): Promise<unknown> {
  const result = await client.get<{ ratio?: unknown }>(
    `/currency_conversions/search`,
    { from: params.from, to: params.to }
  );
  const rate = result?.ratio;
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    throw new Error(`MercadoLibre returned no usable rate for ${params.from}->${params.to} (${String(rate)})`);
  }
  const amount = params.amount ?? 1;
  return {
    from: params.from,
    to: params.to,
    rate,
    amount,
    converted: Number((amount * rate).toFixed(4)),
  };
}

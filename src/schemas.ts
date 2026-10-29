import { z } from "zod";

const SITE_HINT = "Site ID (default: MLA). MLA=Argentina, MLB=Brazil, MLM=Mexico, MLC=Chile, MCO=Colombia, MLU=Uruguay, MPE=Peru";

const siteId = z.string().min(1).optional().describe(SITE_HINT);

export const SearchItemsSchema = z.object({
  query: z.string().min(1).describe("Search query"),
  site_id: siteId,
  category: z.string().min(1).optional().describe("Category ID to filter (e.g. MLA1055)"),
  price_min: z.number().nonnegative().optional().describe("Minimum price (in the site's currency)"),
  price_max: z.number().nonnegative().optional().describe("Maximum price (in the site's currency)"),
  limit: z.number().int().min(1).max(50).optional().describe("Max results (default 10, max 50)"),
  offset: z.number().int().min(0).optional().describe("Pagination offset (default 0)"),
});

export const GetItemSchema = z.object({
  item_id: z.string().min(1).describe("Item ID (e.g. MLA1234567890)"),
});

export const GetItemDescriptionSchema = z.object({
  item_id: z.string().min(1).describe("Item ID (e.g. MLA1234567890)"),
});

export const GetCategoriesSchema = z.object({
  site_id: siteId,
});

export const GetCategorySchema = z.object({
  category_id: z.string().min(1).describe("Category ID (e.g. MLA1055)"),
});

export const GetSellerInfoSchema = z.object({
  seller_id: z.number().int().positive().describe("Seller user ID"),
});

export const GetTrendsSchema = z.object({
  site_id: siteId,
});

export const GetCurrencyConversionSchema = z.object({
  from: z.string().min(1).describe("Source currency code (e.g. USD)"),
  to: z.string().min(1).describe("Target currency code (e.g. ARS)"),
  amount: z.number().positive().optional().describe("Amount to convert (default: 1)"),
});

export type SearchItemsParams = z.infer<typeof SearchItemsSchema>;
export type GetItemParams = z.infer<typeof GetItemSchema>;
export type GetItemDescriptionParams = z.infer<typeof GetItemDescriptionSchema>;
export type GetCategoriesParams = z.infer<typeof GetCategoriesSchema>;
export type GetCategoryParams = z.infer<typeof GetCategorySchema>;
export type GetSellerInfoParams = z.infer<typeof GetSellerInfoSchema>;
export type GetTrendsParams = z.infer<typeof GetTrendsSchema>;
export type GetCurrencyConversionParams = z.infer<typeof GetCurrencyConversionSchema>;

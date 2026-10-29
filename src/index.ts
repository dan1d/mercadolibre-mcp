import { MercadoLibreClient } from "./client.js";
import {
  searchItems,
  getItem,
  getItemDescription,
  getCategories,
  getCategory,
  getSellerInfo,
  getTrends,
  getCurrencyConversion,
} from "./actions.js";
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

export function createMercadoLibreTools(accessToken?: string) {
  const client = new MercadoLibreClient(accessToken);

  return {
    tools: {
      search_items: (params: SearchItemsParams) => searchItems(client, params),
      get_item: (params: GetItemParams) => getItem(client, params),
      get_item_description: (params: GetItemDescriptionParams) => getItemDescription(client, params),
      get_categories: (params?: GetCategoriesParams) => getCategories(client, params),
      get_category: (params: GetCategoryParams) => getCategory(client, params),
      get_seller_info: (params: GetSellerInfoParams) => getSellerInfo(client, params),
      get_trends: (params?: GetTrendsParams) => getTrends(client, params),
      get_currency_conversion: (params: GetCurrencyConversionParams) => getCurrencyConversion(client, params),
    },
  };
}

export { MercadoLibreClient } from "./client.js";
export { MercadoLibreError } from "./errors.js";
export {
  searchItems,
  getItem,
  getItemDescription,
  getCategories,
  getCategory,
  getSellerInfo,
  getTrends,
  getCurrencyConversion,
} from "./actions.js";
export {
  SearchItemsSchema,
  GetItemSchema,
  GetItemDescriptionSchema,
  GetCategoriesSchema,
  GetCategorySchema,
  GetSellerInfoSchema,
  GetTrendsSchema,
  GetCurrencyConversionSchema,
} from "./schemas.js";
export type {
  SearchItemsParams,
  GetItemParams,
  GetItemDescriptionParams,
  GetCategoriesParams,
  GetCategoryParams,
  GetSellerInfoParams,
  GetTrendsParams,
  GetCurrencyConversionParams,
} from "./schemas.js";

import { MercadoLibreError } from "./errors.js";

const BASE_URL = "https://api.mercadolibre.com";

export class MercadoLibreClient {
  private accessToken?: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.accessToken) {
      h.Authorization = `Bearer ${this.accessToken}`;
    }
    return h;
  }

  async get<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
    let fullPath = path;
    if (params) {
      const qs = new URLSearchParams(params).toString();
      if (qs) fullPath += `?${qs}`;
    }
    const res = await fetch(`${BASE_URL}${fullPath}`, {
      method: "GET",
      headers: this.headers(),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      const body = await res.text();
      // fullPath keeps the query string so a failing search is debuggable from the message alone.
      throw new MercadoLibreError("GET", fullPath, res.status, body);
    }
    return res.json() as Promise<T>;
  }
}

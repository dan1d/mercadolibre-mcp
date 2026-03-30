# mercadolibre-mcp

**MercadoLibre marketplace for AI agents.**

[![npm version](https://img.shields.io/npm/v/@dan1d/mercadolibre-mcp)](https://www.npmjs.com/package/@dan1d/mercadolibre-mcp)
[![tests](https://img.shields.io/github/actions/workflow/status/dan1d/mercadolibre-mcp/ci.yml?label=tests)](https://github.com/dan1d/mercadolibre-mcp/actions)
[![npm downloads](https://img.shields.io/npm/dm/@dan1d/mercadolibre-mcp)](https://www.npmjs.com/package/@dan1d/mercadolibre-mcp)
[![license](https://img.shields.io/npm/l/@dan1d/mercadolibre-mcp)](./LICENSE)

MCP server that connects AI agents to [MercadoLibre](https://www.mercadolibre.com), the largest e-commerce marketplace in Latin America (150M+ users). Search products, get item details, browse categories, track trends, and convert currencies across Argentina, Brazil, Mexico, Chile, Colombia, and more.

[npm](https://www.npmjs.com/package/@dan1d/mercadolibre-mcp) | [GitHub](https://github.com/dan1d/mercadolibre-mcp)

---

## Quick Start

No API key required for public endpoints (search, items, categories, trends).

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mercadolibre": {
      "command": "npx",
      "args": ["-y", "@dan1d/mercadolibre-mcp"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add mercadolibre -- npx -y @dan1d/mercadolibre-mcp
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "mercadolibre": {
      "command": "npx",
      "args": ["-y", "@dan1d/mercadolibre-mcp"]
    }
  }
}
```

### Windsurf

```json
{
  "mcpServers": {
    "mercadolibre": {
      "command": "npx",
      "args": ["-y", "@dan1d/mercadolibre-mcp"]
    }
  }
}
```

### With authentication (optional)

For endpoints that require auth (future premium features), add your access token:

```json
{
  "mcpServers": {
    "mercadolibre": {
      "command": "npx",
      "args": ["-y", "@dan1d/mercadolibre-mcp"],
      "env": {
        "MERCADOLIBRE_ACCESS_TOKEN": "APP_USR-..."
      }
    }
  }
}
```

> Once configured, ask your AI assistant things like: *"Search for iPhone 15 on MercadoLibre"* or *"What are the trending searches in Argentina?"* or *"Show me details for item MLA1234567890"*

---

## Hosted deployment

A hosted deployment is available on [Fronteir AI](https://fronteir.ai/mcp/dan1d-mercadolibre-mcp).

## Available Tools

| Tool | Description |
|------|-------------|
| `search_items` | Search products by keyword. Filter by category, price range, and site (MLA=Argentina, MLB=Brazil, MLM=Mexico, MLC=Chile, MCO=Colombia). |
| `get_item` | Get full item details: title, price, pictures, seller, condition, stock, and more. |
| `get_item_description` | Get the full text description of an item. |
| `get_categories` | List all top-level categories for a MercadoLibre site. |
| `get_category` | Get category details including name, path from root, and children. |
| `get_seller_info` | Get seller profile: reputation, ratings, and transaction stats. |
| `get_trends` | Get current trending searches for a specific site/country. |
| `get_currency_conversion` | Convert between currencies using MercadoLibre exchange rates (ARS, BRL, MXN, USD, etc.). |

---

## Supported Sites

| Site ID | Country |
|---------|---------|
| `MLA` | Argentina |
| `MLB` | Brazil |
| `MLM` | Mexico |
| `MLC` | Chile |
| `MCO` | Colombia |
| `MLU` | Uruguay |
| `MPE` | Peru |
| `MEC` | Ecuador |
| `MCR` | Costa Rica |
| `MPA` | Panama |
| `MLV` | Venezuela |
| `MRD` | Dominican Republic |
| `MHN` | Honduras |
| `MBO` | Bolivia |
| `MNI` | Nicaragua |
| `MPY` | Paraguay |
| `MSV` | El Salvador |
| `MGT` | Guatemala |

---

## Example Prompts

- "Search for PlayStation 5 under $500000 in Argentina"
- "Show me the details of item MLA1405857684"
- "What are the trending searches in Brazil?"
- "List all categories on MercadoLibre Mexico"
- "Show me the reputation of seller 123456789"
- "Convert 100 USD to ARS"

---

## Programmatic Usage

```bash
npm install @dan1d/mercadolibre-mcp
```

```typescript
import { createMercadoLibreTools } from "@dan1d/mercadolibre-mcp";

const ml = createMercadoLibreTools();

// Search products
const results = await ml.tools.search_items({
  query: "iPhone 15",
  site_id: "MLA",
  price_max: 2000000,
  limit: 5,
});

// Get item details
const item = await ml.tools.get_item({ item_id: "MLA1405857684" });

// Get trending searches in Argentina
const trends = await ml.tools.get_trends({ site_id: "MLA" });

// Browse categories
const categories = await ml.tools.get_categories({ site_id: "MLA" });

// Get seller reputation
const seller = await ml.tools.get_seller_info({ seller_id: 123456789 });

// Convert currencies
const conversion = await ml.tools.get_currency_conversion({
  from: "USD",
  to: "BRL",
  amount: 100,
});
```

---

## Part of the LATAM MCP Toolkit

| Server | What it does |
|--------|-------------|
| [CobroYa](https://github.com/dan1d/mercadopago-tool) | Mercado Pago payments — create links, search payments, refunds |
| **MercadoLibre MCP** | MercadoLibre marketplace — search products, categories, trends |
| [DolarAPI MCP](https://github.com/dan1d/dolar-mcp) | Argentine exchange rates — blue, oficial, CCL, crypto, conversion |

---

## License

[MIT](./LICENSE) -- by [dan1d](https://dan1d.dev/)

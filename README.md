# Shopify Storefront Tech Stack & Contact Extractor

Audit public Shopify stores at scale. Extract installed third-party apps, active theme names, tracking pixels, and verified public business contact emails. 

Outputs directly to CSV, JSON, and Excel via the Apify Dataset API.

---

### Key Capabilities
* **App Detection:** Scans storefront payloads for high-value e-commerce apps including **Klaviyo, Gorgias, ReCharge Payments, Yotpo, Okendo, Loop Returns, Elevar, Triple Whale, Smile.io, Postscript, Attentive, and Judge.me**.
* **Theme Identification:** Extracts the active Shopify theme title (e.g., Dawn, Impulse, Prestige, or custom agency builds).
* **Automated Data Cleaning:** Built-in email validation strips out Sentry telemetry, webpack chunks, and placeholder dummy emails, returning only verified business contact leads.
* **Social Media Discovery:** Detects official Instagram, TikTok, Facebook, and X (Twitter) accounts.

---

### Pricing (Pay-Per-Event)
* **$0.004 per enriched store** ($4.00 per 1,000 records).
* Fully compatible with Apify free platform credits.

---

### Input Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `startUrls` | Array | Yes | List of Shopify domain URLs to audit. |
| `maxConcurrency` | Integer | No | Number of parallel browser workers (Default: 5). |

### Output Example
```json
{
  "url": "[https://allbirds.com](https://allbirds.com)",
  "isShopify": true,
  "themeName": "[DNAM Theme July 2026]",
  "detectedApps": ["Elevar", "Google Analytics / Tag Manager"],
  "detectedAppCount": 2,
  "contactEmails": ["help@allbirds.com"],
  "socialMedia": {
    "instagram": "[https://www.instagram.com/allbirds](https://www.instagram.com/allbirds)",
    "facebook": "[https://www.facebook.com/weareallbirds](https://www.facebook.com/weareallbirds)",
    "tiktok": "[https://www.tiktok.com/@weareallbirds](https://www.tiktok.com/@weareallbirds)",
    "twitter": "[https://twitter.com/allbirds](https://twitter.com/allbirds)"
  },
  "scrapedAt": "2026-10-10T05:03:42.411Z"
}
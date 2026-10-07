# Shopify Store Tech Stack & Lead Extractor (Apify Actor)

Automated tool to audit Shopify storefronts, detect installed third-party apps, identify active themes, and extract public contact emails.

[![Run on Apify](https://apify.com/actor-badge?actor=theyungstump/shopify-extractor)](https://apify.com/theyungstump/shopify-extractor)

## Features
- **App Detection:** Identifies Klaviyo, ReCharge, Gorgias, Yotpo, Judge.me, Postscript, Attentive, and more.
- **Theme Metadata:** Extracts active Shopify theme name.
- **Contact Discovery:** Extracts public business emails and connected social media profiles (Instagram, Facebook, TikTok, X).
- **Export Ready:** Outputs directly to CSV, Excel, or JSON via the Apify Dataset API.

## Quick Run
Run this tool directly in the cloud without local environment configuration:
👉 [Run on Apify Store](https://apify.com/theyungstump/shopify-extractor)

## Input Format
```json
{
  "startUrls": [
    "[https://gymshark.com](https://gymshark.com)",
    "[https://allbirds.com](https://allbirds.com)"
  ],
  "maxConcurrency": 5
}
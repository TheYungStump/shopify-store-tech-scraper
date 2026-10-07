import { Actor } from 'apify';
import { CheerioCrawler, log } from 'crawlee';

await Actor.init();

const input = await Actor.getInput() || {};
const startUrls = input.startUrls || [];
const maxConcurrency = input.maxConcurrency || 5;

if (!startUrls.length) {
    log.error('No start URLs provided. Exiting.');
    await Actor.exit({ exitCode: 1 });
}

// Signatures of popular Shopify apps and trackers to detect
const APP_SIGNATURES = {
    'Klaviyo': ['klaviyo', 'static.klaviyo.com'],
    'ReCharge Payments': ['rechargepayments.com', 'rechargeassets.com'],
    'Gorgias': ['gorgias.chat', 'contact-form.gorgias.io'],
    'Yotpo': ['staticw2.yotpo.com', 'yotpo-widgets'],
    'Judge.me': ['judge.me', 'judgeme-core'],
    'Loox': ['loox.io'],
    'Smile.io': ['smile.io', 'sweettooth'],
    'Postscript': ['postscript.io'],
    'Attentive': ['attentivemobile.com'],
    'Meta Pixel': ['connect.facebook.net/en_US/fbevents.js'],
    'TikTok Pixel': ['analytics.tiktok.com/i18n/pixel'],
    'Google Analytics / Tag Manager': ['googletagmanager.com', 'google-analytics.com'],
    'Hotjar': ['static.hotjar.com'],
    'Omnisend': ['omnisend.com']
};

const crawler = new CheerioCrawler({
    maxConcurrency,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, body }) {
        const url = request.url;
        log.info(`Inspecting: ${url}`);

        const html = body.toLowerCase();
        
        // 1. Detect if it is actually a Shopify store
        const isShopify = html.includes('cdn.shopify.com') || 
                          html.includes('shopify.theme') || 
                          $('link[href*="cdn.shopify.com"]').length > 0;

        if (!isShopify) {
            await Actor.pushData({
                url,
                isShopify: false,
                scrapedAt: new Date().toISOString()
            });
            return;
        }

        // 2. Extract theme metadata
        let themeName = 'Unknown';
        const themeScript = $('script:contains("Shopify.theme")').text();
        const themeMatch = themeScript.match(/name["']?:\s*["']([^"']+)["']/i);
        if (themeMatch && themeMatch[1]) {
            themeName = themeMatch[1];
        }

        // 3. Detect installed apps & scripts
        const detectedApps = [];
        const scriptSrcs = $('script[src]').map((_, el) =>$(el).attr('src')).get().join(' ').toLowerCase();

        for (const [appName, patterns] of Object.entries(APP_SIGNATURES)) {
            const isPresent = patterns.some(pattern => scriptSrcs.includes(pattern) || html.includes(pattern));
            if (isPresent) {
                detectedApps.push(appName);
            }
        }

        // 4. Extract public contact & social links
        const emails = new Set();
        const emailMatches = body.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
        for (const email of emailMatches) {
            if (!email.endsWith('.png') && !email.endsWith('.jpg') && !email.endsWith('.webp')) {
                emails.add(email);
            }
        }

        const socials = {
            instagram: $('a[href*="instagram.com"]').first().attr('href') || null,
            facebook: $('a[href*="facebook.com"]').first().attr('href') || null,
            tiktok: $('a[href*="tiktok.com"]').first().attr('href') || null,
            twitter: $('a[href*="twitter.com"], a[href*="x.com"]').first().attr('href') || null
        };

        // 5. Store record
        await Actor.pushData({
            url,
            isShopify: true,
            themeName,
            detectedApps,
            detectedAppCount: detectedApps.length,
            contactEmails: Array.from(emails).slice(0, 5),
            socialMedia: socials,
            scrapedAt: new Date().toISOString()
        });
    },
    failedRequestHandler({ request }) {
        log.error(`Request ${request.url} failed completely.`);
    }
});

await crawler.run(startUrls);
await Actor.exit();
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

// High-demand e-commerce tech stack signatures
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
    'Triple Whale': ['triplewhale-pixel', 'triplewhale.com'],
    'Elevar': ['getelevar.com'],
    'Okendo': ['okendo.io', 'okendo-reviews'],
    'Privy': ['privy.com'],
    'Loop Returns': ['loopreturns.com'],
    'PageFly': ['pagefly.io'],
    'Meta Pixel': ['connect.facebook.net/en_US/fbevents.js'],
    'TikTok Pixel': ['analytics.tiktok.com/i18n/pixel'],
    'Google Analytics / Tag Manager': ['googletagmanager.com', 'google-analytics.com'],
    'Hotjar': ['static.hotjar.com'],
    'Omnisend': ['omnisend.com']
};

// Domain and filename blacklists for email extraction
const BLOCKED_EMAIL_DOMAINS = [
    'sentry.io', 'example.com', 'domain.com', 'storefront.com', 
    'shopify.com', 'myshopify.com', 'wixpress.com'
];
const INVALID_EMAIL_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.css', '.js', '.map'];

const crawler = new CheerioCrawler({
    maxConcurrency,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, body }) {
        const url = request.url;
        log.info(`Inspecting: ${url}`);

        const html = body.toLowerCase();
        
        // 1. Verify Shopify storefront
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

        // 2. Extract and clean theme metadata
        let themeName = 'Unknown';
        const themeScript = $('script:contains("Shopify.theme")').text();
        const themeMatch = themeScript.match(/name["']?:\s*["']([^"']+)["']/i);
        if (themeMatch && themeMatch[1]) {
            themeName = themeMatch[1].replace(/\\\//g, '/').trim();
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

        // 4. Extract verified public contact emails
        const emails = new Set();
        const rawMatches = body.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
        
        for (const email of rawMatches) {
            const lowerEmail = email.toLowerCase().trim();
            const domainPart = lowerEmail.split('@')[1] || '';

            const isBlockedDomain = BLOCKED_EMAIL_DOMAINS.some(b => domainPart.endsWith(b));
            const hasInvalidExt = INVALID_EMAIL_EXTENSIONS.some(ext => domainPart.endsWith(ext) || lowerEmail.endsWith(ext));
            const isPlaceholder = lowerEmail.startsWith('youremail') || lowerEmail.startsWith('chunk@') || lowerEmail.startsWith('defaultvendors@');

            if (!isBlockedDomain && !hasInvalidExt && !isPlaceholder) {
                emails.add(lowerEmail);
            }
        }

        // 5. Extract social channels with strict host checks
        const cleanSocial = (selector, regex) => {
            const el = $(selector).filter((_, a) => regex.test($(a).attr('href') || '')).first();
            return el.attr('href') || null;
        };

        const socials = {
            instagram: cleanSocial('a[href*="instagram.com"]', /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+/i),
            facebook: cleanSocial('a[href*="facebook.com"]', /^https?:\/\/(www\.)?facebook\.com\/(?!sharer)/i),
            tiktok: cleanSocial('a[href*="tiktok.com"]', /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9_.]+/i),
            twitter: cleanSocial('a[href]', /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+/i)
        };

        // 6. Push clean payload
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
        log.error(`Request ${request.url} failed.`);
    }
});

await crawler.run(startUrls);
await Actor.exit();
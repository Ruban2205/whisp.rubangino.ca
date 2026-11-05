# Search identity and launch verification

Updated November 3, 2026. Production origin: **https://whisp.rubangino.ca/**.

## Public identity

Whisp identifies its creator as **Ruban Gino Singh**, also known as **Ruban Gino**, and its publisher as **Ruban AI Labs**. Visible credits, titles, copy, author metadata, and linked structured data use these names consistently.

The biography follows the [official portfolio](https://www.rubangino.ca/), which describes AI engineering, full-stack development, and production-ready AI systems. The business description follows [Ruban AI Labs](https://labs.rubangino.ca/), which describes an independent AI startup in Alberta building agents, copilots, and automation systems. No founder title, social account, qualification, address, review, or rating has been invented.

## Crawlable product pages

| URL | Purpose |
| --- | --- |
| `/` | Private online notebook, temporary writing, voice typing, and letting go; title includes the developer's full name. |
| `/about/` | Ruban Gino Singh, his portfolio, Ruban AI Labs, and a natural “Products by Ruban Gino” section. |
| `/how-it-works/` | Private writing, English voice input, breath/manual release, cache handling, and temporary data. |

All three deliver complete public HTML without JavaScript, unique titles/descriptions, production canonicals, share cards, and an updated sitemap. The homepage hydrates into the interactive notebook; information pages are static. There is no bot-specific content. User writing is never rendered during build, placed in a URL, or exposed as an indexable entry.

JSON-LD links `Person`, `Organization`, `WebSite`, `WebApplication`, and `WebPage`/`AboutPage` through stable IDs. The app's creator/author references the Person; its publisher references the business. This does not claim the app is an eligible personal profile page. See Google's [Organization guidance](https://developers.google.com/search/docs/appearance/structured-data/organization), [ProfilePage requirements](https://developers.google.com/search/docs/appearance/structured-data/profile-page), and [software application guidance](https://developers.google.com/search/docs/appearance/structured-data/software-app). No rating has been fabricated to qualify for an app rich result.

Useful product copy supports private online notebook, writing without an account, on-device voice typing, and releasing thoughts. It connects the product naturally with Ruban Gino, Ruban Gino Singh, and products by Ruban Gino. There are no hidden keyword blocks, doorway pages, or medical outcome claims. Search engines decide whether and where a page appears; these changes cannot guarantee results for a query.

## Technical foundations

- Public pages have one main heading, meaningful links, English metadata, and mobile layouts.
- SVG/ICO/PNG/Apple icons and the 1200×630 sharing image remain available. Share metadata uses absolute production URLs.
- Fonts are local, speech loads on demand, and no third-party runtime script is added. Measure actual Core Web Vitals after launch; no field score is claimed.
- Missing production URLs return the custom **HTTP 404**. Host error documents use `noindex, follow`, have no canonical destination, and are omitted from the sitemap. They remain crawlable so crawlers can read `noindex`. The `/errors/` gallery and feature-preview routes are development-only and return 404 in production.
- SEO adds no analytics, tracking, accounts, storage of writing, or remote inference.

## Owner actions after deployment

1. Verify `/`, `/about/`, and `/how-it-works/` return 200 without a `noindex` response header. Inspect View Source with JavaScript disabled and check each canonical/title/heading/creator credit.
2. Verify ownership in [Google Search Console](https://search.google.com/search-console/about) using the actual DNS record supplied to your account. Submit **https://whisp.rubangino.ca/sitemap.xml**, inspect all three URLs, and request indexing.
3. Validate with [Schema.org Validator](https://validator.schema.org/) and [Google's Rich Results Test](https://search.google.com/test/rich-results). Valid schema does not guarantee rich results.
4. Add a real Whisp product link on **www.rubangino.ca** and **labs.rubangino.ca**, with its production URL and an accurate description. These reciprocal links help visitors and crawlers find it; this repository cannot modify the other sites.
5. Check a missing URL returns status 404 and the branded screen. Open icons/sharing images directly and review shared links, which can retain cached cards.
6. Keep staging out of search. Vercel documents default `noindex` headers for previews/outdated deployments; verify actual responses: [Vercel response headers](https://vercel.com/docs/headers/response-headers).
7. Monitor indexing, relevant queries, broken URLs, and real-user performance. Update sitemap `lastmod` when public content changes.

No ownership verification, search submission, edits to the portfolio/Labs sites, deployment, or ranking has been performed or promised by this implementation.

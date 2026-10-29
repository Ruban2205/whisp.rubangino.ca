# Search visibility and launch verification

Production URL: **https://whisp.rubangino.ca/**. Developer/publisher: **[Ruban AI Labs](https://labs.rubangino.ca/)**.

## Included in the release

- An informative title and description describing a free private online notebook, with one production canonical URL.
- The same initial landing page pre-rendered for every visitor. React hydrates that HTML into the interactive app. No bot-specific content or user drafts are rendered during build.
- Semantic page structure, one main heading, readable invitation copy, and a visible developer link.
- WebSite, WebApplication, and Organization JSON-LD describing real features and free access. No invented ratings, reviews, medical outcomes, or unsupported search actions.
- Open Graph and Twitter large-image cards with absolute production URLs, image dimensions, and descriptive alternatives.
- Crawlable robots.txt and a single-page sitemap. Notebook stages are temporary app state, not indexable personal entries or separate URLs.
- A square SVG logo, multi-resolution ICO, 48px PNG, 180px Apple icon, and 192/512px manifest icons. The manifest uses browser display and does not claim offline/PWA support.
- Bundled fonts, lazy speech loading, no third-party runtime scripts, immutable hashed assets, and revalidated HTML. These are performance foundations; no Core Web Vitals score is claimed without field measurements.

Google recommends pre-rendering as useful for visitors and crawlers, including bots unable to run JavaScript: [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics). Icon implementation follows [Google's favicon guidance](https://developers.google.com/search/docs/appearance/favicon-in-search); structured data uses [Schema.org WebApplication](https://schema.org/WebApplication).

## Owner actions after deployment

1. Verify `https://whisp.rubangino.ca/` over HTTPS returns the intended release with a 200 response. Check that the production response has no `noindex` directive and that the canonical URL is correct.
2. Inspect View Source with JavaScript disabled: the public invitation, heading, description, and developer link should exist once. Enable JavaScript and confirm there are no hydration errors or duplicate headings.
3. Verify the domain in [Google Search Console](https://search.google.com/search-console/about). Add the actual DNS verification record supplied for your account; none has been invented in this repository.
4. Submit `https://whisp.rubangino.ca/sitemap.xml`. Use URL Inspection to check the rendered page and request indexing after the domain is live.
5. Validate the JSON-LD with [Schema.org Validator](https://validator.schema.org/) and check any supported features with Google's [Rich Results Test](https://search.google.com/test/rich-results). Schema validity does not guarantee a rich result; this app does not include fabricated reviews to qualify for one.
6. Open the sharing image and icon URLs directly, and preview a shared production link. Social services may retain earlier cached previews.
7. Keep preview/staging deployments out of search. Vercel adds `X-Robots-Tag: noindex` to preview and outdated deployments by default; verify the actual response rather than assuming another host does so. See [Vercel response headers](https://vercel.com/docs/headers/response-headers).
8. Monitor indexing, real user performance, relevant search queries, and broken asset responses. Update the sitemap's lastmod only when public page content materially changes.

Good technical SEO supports discovery; indexing, rankings, traffic, and rich results are determined by search engines and are not guaranteed. No search-engine submission, account access, domain verification, or deployment has been performed by this agent.

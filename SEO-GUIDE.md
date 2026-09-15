# Legit.cm: SEO setup and editorial plan

## Copy for Settings → SEO & analytics

**Default SEO title**

Cameroon & Africa News, Business & Trends | Legit.cm

**Default SEO description**

Read Cameroon and Africa news on Legit.cm. Explore business trends, entrepreneurship, entertainment and stories shaping life in Douala, Yaoundé and beyond.

The settings screen includes a button to fill these two fields. Review the copy and save it. Use it only if it accurately describes the coverage you publish. Each article should have its own specific SEO title and description; the homepage defaults are fallbacks.

## Search topics to develop

These are editorial opportunities, not measured search-volume or current-trend claims. Check Search Console query data after launch and current primary sources before commissioning time-sensitive reporting.

| Section | Search intent | Reporting ideas |
| --- | --- | --- |
| Cameroon | Cameroon news, news in Cameroon, Douala news, Yaoundé news | Original local reporting, explainers about public services, verified changes affecting daily life |
| Africa | African news, Africa business news | Regional stories with a clear Cameroon connection; original interviews and comparisons supported by sources |
| Business | Cameroon business news, business trends in Cameroon, entrepreneurship in Cameroon | Small-business profiles, logistics and trade reporting, interviews with local founders, analysis of official economic releases |
| Economy | Cameroon economy, Cameroon trade, cost of living in Cameroon | Dated price reporting with a stated methodology, official statistics explained, sector reporting |
| Technology | Cameroon startups, digital payments in Cameroon | Product and service reporting based on official announcements and local user interviews |

Suggested category descriptions:

- **Cameroon:** News and stories from Cameroon, covering life in Douala, Yaoundé and communities across the country, with local perspectives and context.
- **Africa:** African news, business, culture and ideas, with stories exploring how developments across the continent connect with Cameroon.
- **Business:** Cameroon business news, entrepreneurship and economic trends, with reporting on local companies, trade, startups and the people building businesses.

Do not repeat “best news blog in Africa” across titles or describe the site as the best without evidence. Build recognition through useful reporting, transparent sourcing, credible bylines and an accurate About page. Broad competitive phrases do not have a guaranteed route to the first page.

## Article checklist

1. Choose one reader question or news development per article. Use a descriptive headline that names the relevant place, subject and development.
2. Write a unique SEO title and a short, accurate description. Roughly 50–60 title characters and 140–160 description characters are useful editorial guides, not Google limits or ranking requirements.
3. Lead with the verified news or answer. Include original reporting, named sources, dates, supporting evidence and links to primary documents.
4. Use meaningful H2/H3 headings. Avoid keyword repetition, invented facts and padding to reach a word count.
5. Add relevant images with descriptive alt text and publication rights. Use a high-quality lead image; supply a large image when available.
6. Select the correct category and link naturally to relevant earlier coverage. Update topic pages as coverage grows.
7. Show the author’s real name and biography. Keep published and updated dates truthful; update an article when its content materially changes.
8. Review each article on mobile. Recheck facts, spelling, attribution and broken links before publishing.

Example headline patterns, to use only after reporting the underlying facts:

- “How [verified change] affects small businesses in Douala”
- “[Company]: what its expansion means for Cameroon’s [sector]”
- “Cameroon [indicator]: what the latest official figures show”
- “Inside a Yaoundé business: how [founder] solved [specific problem]”

Publish at a pace your team can verify. Prioritize a small number of strong pieces and maintain useful background explainers. Do not publish unsupported claims about laws, tax, finance or investment opportunities.

## Technical changes included

- Page-specific title, description, canonical URL, Open Graph and Twitter metadata.
- Article and breadcrumb structured data using actual article fields, dates and authors.
- Server-rendered homepage, category listings and article text on the Vercel frontend, available before JavaScript executes. All visitors receive the same server-rendered content.
- Live sitemap index at `/sitemap.xml`, category/static-page sitemap and article sitemaps split into batches of 1,000 published posts.
- `/robots.txt`, private-page indexing restrictions, proper server 404 responses for missing articles/categories and 503 responses for temporary failures.
- Continuing feeds with direct `?page=N` URLs and crawlable next/previous links. Categories can expose posts beyond the old fixed limit.

## Deploy and verify

1. Deploy the backend first. Its existing `npm run vercel-build` generates Prisma Client and applies migrations. The new additive migration adds nullable `SiteSetting.ctaTextColor`; older settings retain automatic text contrast.
2. Set frontend `VITE_API_URL` to the production backend API URL, ending in `/api`. The Vercel server function also reads this variable at runtime; do not use localhost in production.
3. Set frontend `VITE_SITE_URL` to the preferred production origin in both build and runtime environments. The default is `https://www.legit.cm`. Use one preferred HTTPS hostname and configure the other hostname to redirect in hosting settings.
4. Deploy the frontend as a Vercel project rooted at `frontend`, using the checked-in `vercel.json` and `npm run build`. The build creates `.vercel/output` with static assets, explicit routes, and a self-contained Node renderer with its HTML template embedded. Do not override the build command with only `vite build` or publish only `dist`: shared-link previews require the renderer. Run `node --test server/seo.test.js server/sharing.test.js` after building to verify the packaged function. A static-only host needs an equivalent server renderer; `vite preview` alone does not exercise the production function.
5. Open an article using View Source. Confirm the headline, article text, unique title, canonical URL and JSON-LD are present. Check that a nonexistent article returns HTTP 404 and an API outage returns 503.
6. Open `/robots.txt`, `/sitemap.xml` and one article sitemap on the public domain. Confirm that links use the preferred public domain, not the API or preview domain.
7. Verify domain ownership in Google Search Console, submit `/sitemap.xml`, and inspect the homepage, a category and several articles. Run Google’s Rich Results Test on article URLs.
8. Monitor indexing, mobile performance, query impressions and clicks. Improve pages based on actual reader needs and Search Console evidence. Ranking and rich-result inclusion are not guaranteed.

## References

- [Google: SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google: Helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google: Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Google: JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google: Crawlable pagination and incremental loading](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading)
- [Google: Meta descriptions](https://developers.google.com/search/docs/appearance/snippet)

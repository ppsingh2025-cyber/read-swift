# PaceRead — Global Visibility Execution Plan

**Company:** Techscript Limited  
**Product:** PaceRead  
**Document version:** 1.0  
**Execution model:** Single developer  
**Timeline:** 90 days from public launch

---

## Overview

This plan assumes a single developer executing all visibility work. It is sequenced to achieve three outcomes within 90 days:

1. Google indexes the site and begins ranking for long-tail speed-reading queries
2. AI assistants can retrieve accurate product information when users ask about speed-reading apps
3. Play Store ranking for "speed reading" and "RSVP reader" enters top-20 in the Productivity category

---

## Phase 1 — Technical Foundation (Days 1–7)

### Step 1.1 — Publish the privacy policy

- Deploy `readswift/legal/privacy-policy.html` (or `release-package/legal/privacy-policy.html`) to `https://techscript.ca/privacy`
- Verify it returns HTTP 200 from a mobile connection
- This is required before Play Store submission and before Google will trust the domain

### Step 1.2 — Deploy structured data

- Copy the `<script type="application/ld+json">` blocks from `readswift/seo/meta.html` into every page of the site
- Copy the full `readswift/seo/schema.jsonld` content as an inline script block on the homepage
- Validate using Google's Rich Results Test: https://search.google.com/test/rich-results

### Step 1.3 — Create `sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://techscript.ca/</loc>
    <lastmod>2025-06-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://techscript.ca/privacy</loc>
    <lastmod>2025-06-01</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
```

Place at `https://techscript.ca/sitemap.xml`.

### Step 1.4 — Create `robots.txt`

```
User-agent: *
Allow: /
Sitemap: https://techscript.ca/sitemap.xml

User-agent: GPTBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Googlebot
Allow: /
```

Explicitly allow AI crawlers to index the site. Place at `https://techscript.ca/robots.txt`.

### Step 1.5 — Create `llms.txt`

Copy the `## Section 7 — llms.txt Content Block` from `readswift/ai-discoverability/ai-description.md` to `https://techscript.ca/llms.txt`.

This file is consumed by AI indexing systems that follow the emerging llms.txt standard (Anthropic, Perplexity, and others have announced support).

### Step 1.6 — Deploy an Open Graph image

Create a 1200×630 px PNG at `https://techscript.ca/og-image.png`:
- Background: `#060606`
- Text: "PaceRead" in Segoe UI 72px `#f0f0f0` + "Read faster. One word at a time." in 36px `#888888`
- This image appears when links are shared on LinkedIn, WhatsApp, Slack, and social platforms

### Step 1.7 — Submit to Google Search Console

1. Add property `https://techscript.ca` in Google Search Console
2. Verify via DNS TXT record (GoDaddy → DNS → TXT → `google-site-verification=...`)
3. Submit sitemap at `https://techscript.ca/sitemap.xml`
4. Request indexing of the homepage via URL Inspection Tool

---

## Phase 2 — Play Store Launch (Days 7–14)

### Step 2.1 — Generate signed release APK

Follow `release-package/README.md` Part 3.

```bash
git tag v1.0.0
git push origin v1.0.0
```

Download the signed APK from GitHub Actions → Artifacts.

### Step 2.2 — Complete Play Console submission

Follow `release-package/README.md` Part 4 using:
- Listing content from `readswift/play-store/listing.md`
- Icons from `release-package/icons/`
- Feature graphic from `release-package/feature-graphic/feature-graphic.png`
- Screenshots from `release-package/screenshots/`
- Privacy policy URL: `https://techscript.ca/privacy`

### Step 2.3 — Validate data safety form

In Play Console → Policy → App content → Data safety:

- Answer "Does your app collect or share any of the required user data types?" → **No**
- Submit the form

This is a common submission blocker. Complete it before sending for review.

### Step 2.4 — Send for review

Target: 1.0 production release. Initial review: 1–3 business days.

---

## Phase 3 — Search Engine Indexing (Days 7–21)

### Step 3.1 — Request Bing indexing

- Submit to Bing Webmaster Tools: https://www.bing.com/webmasters
- Bing indexes faster than Google for new domains and powers Copilot (Microsoft AI)

### Step 3.2 — Submit to additional search engines

| Engine | Submission URL |
|---|---|
| Google | Google Search Console (Step 1.7) |
| Bing | https://www.bing.com/webmasters |
| DuckDuckGo | Crawls via Bing — no separate submission needed |
| Brave Search | https://search.brave.com/help/webmaster |
| Yandex | https://webmaster.yandex.com |

### Step 3.3 — Build the first backlink

Submit the product to these directories within the first two weeks:

| Directory | URL | Free | Dofollow |
|---|---|---|---|
| Product Hunt | https://www.producthunt.com/posts/new | Yes | Yes (nofollow, but high referral traffic) |
| AlternativeTo | https://alternativeto.net/add-software/ | Yes | Yes |
| Hacker News (Show HN) | https://news.ycombinator.com/submit | Yes | Nofollow but high-quality |
| Reddit r/productivity | — | Yes | Nofollow |
| GitHub README link | Repository readme.md already links to site | Yes | Yes |

### Step 3.4 — Create one targeted content page

Write a single page at `https://techscript.ca/what-is-rsvp-reading`:

- H1: "What is RSVP Reading? How to Read Faster With One Word at a Time"
- ~800 words explaining RSVP technique with a CTA to PaceRead
- Target keywords: "what is RSVP reading", "how to read faster", "rapid serial visual presentation"
- This page will rank for informational queries and drive organic traffic to the tool

---

## Phase 4 — AI Indexing (Days 7–30)

### Step 4.1 — Perplexity submission

Perplexity crawls `llms.txt` and public web pages. No separate submission exists, but ensure:
- `llms.txt` is live at `https://techscript.ca/llms.txt`
- `robots.txt` allows `PerplexityBot`
- The site loads correctly on a fresh visit (no JavaScript-only rendering — use server-side HTML where possible)

### Step 4.2 — Common Crawl coverage

Common Crawl is the dataset that powers many AI training corpora. Coverage increases naturally as the site ages and acquires backlinks. The Product Hunt and AlternativeTo submissions in Phase 3 will accelerate this.

### Step 4.3 — Wikipedia disambiguation (long-term)

If the product gains sufficient real-world use, a Wikipedia entry under "RSVP reading applications" or similar will significantly increase AI retrieval accuracy. This is a 6–12 month play, not a day-one action. Do not create a Wikipedia page for PaceRead immediately — it will be deleted as promotional.

### Step 4.4 — Wikidata entry

Create a Wikidata item for PaceRead. Wikidata is used by many AI knowledge graphs. Minimum threshold: the product is live on the Play Store and the site has been indexed.

Structure:
- Instance of: software application, mobile application, web application
- Developer: Techscript Limited
- Programming language: TypeScript, JavaScript
- Operating system: Android, Web
- License: (check repository license)
- Website: https://techscript.ca

---

## Phase 5 — App Store Ranking Improvement (Days 14–90)

### Step 5.1 — Keyword rank tracking

Set up free rank tracking for Play Store keywords using one of:
- AppFollow (free tier): https://appfollow.io
- MobileAction: https://www.mobileaction.co
- Manual search using an Android device in incognito mode, weekly

Track weekly ranking for:
- "speed reading"
- "RSVP reader"
- "PDF speed reader"
- "read faster app"
- "PaceRead"

### Step 5.2 — First rating push

After the first 20 installs (friends, colleagues, beta users):
- Ask for a review via the in-app review prompt (add `@capacitor/review` plugin)
- First five 5-star ratings with text improve ranking signal significantly

### Step 5.3 — A/B test short description (Day 30)

After collecting initial install data, test variant 2 from `readswift/keywords/keyword-strategy.md` Section 3 against the primary short description. Play Console supports A/B testing via the Experiments feature. Run for 14 days, pick the higher-converting variant.

### Step 5.4 — Add a second screenshot set (Day 45)

Upload tablet screenshots (7-inch format) if the app has been tested on tablets. Tablet screenshots unlock the tablet-specific section of the Play Store listing and can drive additional installs from tablet users.

### Step 5.5 — Respond to all reviews (ongoing)

Play Store treats developer response rate and response time as ranking signals. Respond to every review within 48 hours. For negative reviews, acknowledge the issue and describe any fix.

---

## Phase 6 — Content Signals (Days 30–90)

### Step 6.1 — Create the content cluster

Three additional pages targeting RSVP and speed-reading queries:

| Page URL | Target query | Primary keyword |
|---|---|---|
| `/how-to-read-faster` | "how to read faster" | how to read faster |
| `/rsvp-reading-technique` | "RSVP reading technique" | rapid serial visual presentation |
| `/read-pdf-faster` | "read PDF faster android" | PDF speed reader |

Each page: 600–900 words. Factual, technique-focused. CTA to PaceRead at the bottom.

### Step 6.2 — Developer blog post (optional, high impact)

Write a 1,000-word post titled "How I Built a Zero-Backend Speed Reader as a PWA Capacitor App". Publish on Medium, Dev.to, or the Techscript site. Target: "PWA Capacitor tutorial" and "build speed reading app" queries.

This type of technical content earns natural backlinks from developer communities and drives developer-audience installs.

### Step 6.3 — Monthly audit

On the first of each month, run:

```bash
# Check indexing status
curl -I https://techscript.ca/sitemap.xml

# Validate structured data
# Run manually: https://search.google.com/test/rich-results?url=https://techscript.ca

# Check npm for dependency vulnerabilities
cd /path/to/project && npm audit
```

- Review Search Console for new keyword impressions
- Review Play Console crash rate and ANR rate
- Review Play Store rating and respond to new reviews

---

## Timeline Summary

| Day | Action |
|---|---|
| 1–3 | Deploy privacy policy, structured data, sitemap, robots.txt, llms.txt |
| 3–5 | Submit to Google Search Console + Bing Webmaster Tools |
| 5–7 | Generate and test signed release APK |
| 7–10 | Complete Play Console submission, send for review |
| 10–14 | Deploy OG image, submit to Product Hunt + AlternativeTo |
| 14 | Play Store goes live (estimated) |
| 14–21 | Write RSVP explainer page, post to Hacker News |
| 21–30 | First rating push, begin keyword rank tracking |
| 30 | A/B test short description |
| 45 | Add tablet screenshots |
| 60 | Write content cluster (3 pages) |
| 90 | Full review: rankings, installs, reviews, organic traffic |

---

*© 2025 Techscript Limited. Internal use only.*

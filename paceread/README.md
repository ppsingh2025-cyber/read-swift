# PaceRead — Branding & Discoverability System

**Company:** Techscript Limited  
**Product:** PaceRead  
**Version:** 1.0  
**Status:** Production

---

## What This Directory Contains

This directory holds all brand, SEO, AI discoverability, Play Store, and visibility deliverables for **PaceRead** — the speed-reading product by Techscript Limited.

---

## Directory Index

```
paceread/
│
├── README.md                              ← This file
│
├── brand/
│   └── brand-identity.md                 ← Brand positioning, value proposition,
│                                            tone of voice, colour palette, name rationale
│
├── keywords/
│   └── keyword-strategy.md               ← Keyword clusters (A–E), user intent mapping,
│                                            ASO strategy, Play Store keyword field,
│                                            long-tail opportunities
│
├── play-store/
│   └── listing.md                        ← Submission-ready Play Store content:
│                                            title, short desc, full desc, feature list,
│                                            keyword field, data safety answers, what's new
│
├── seo/
│   ├── landing-page-content.md           ← Full landing page copy: hero, problem,
│   │                                        solution, how it works, features, FAQ, footer CTA
│   ├── meta.html                         ← HTML head block: meta title, description,
│   │                                        Open Graph, Twitter Card, PWA meta,
│   │                                        icons, Schema.org JSON-LD (inline)
│   └── schema.jsonld                     ← Standalone Schema.org JSON-LD file:
│                                            SoftwareApplication, WebApplication,
│                                            Organization, WebSite, FAQPage
│
├── ai-discoverability/
│   └── ai-description.md                 ← Structured knowledge block for AI assistants:
│                                            machine-readable product definition,
│                                            capabilities table, use cases, technology
│                                            explanation, competitor comparison,
│                                            llms.txt content block
│
└── visibility/
    └── execution-plan.md                 ← 90-day step-by-step execution plan:
                                             Google/Bing indexing, Play Store launch,
                                             AI indexing, ASO ranking, content signals
```

---

## Quick Reference

### Play Store submission content

→ `play-store/listing.md`

### Landing page copy

→ `seo/landing-page-content.md`

### HTML head tags (meta, OG, schema)

→ `seo/meta.html`

### Schema.org structured data

→ `seo/schema.jsonld`

### What to put in `llms.txt`

→ `ai-discoverability/ai-description.md` Section 7

### What to put in `robots.txt` AI allow-rules

→ `visibility/execution-plan.md` Step 1.4

### Keyword field for Play Console

```
speed reading,PDF reader,EPUB reader,RSVP,read faster,speed reader,study,productivity
```

### App title

```
PaceRead: Speed Reader
```

### Short description (62 chars)

```
PDF, EPUB, DOCX, TXT, MD, HTML, RTF, SRT. Speed reading 60-1500 WPM. No account.
```

---

## Relationship to `release-package/`

This `paceread/` directory contains **product identity, SEO, and discoverability** deliverables.

The sibling `release-package/` directory contains **production asset specifications, design tokens, privacy policy, and deployment runbook**.

Both directories are required for a complete Play Store submission. The typical workflow:

1. Use `paceread/play-store/listing.md` for the Play Console store listing text
2. Use `release-package/` for all icon, screenshot, and APK production steps
3. Use `release-package/legal/privacy-policy.html` as the deployed privacy policy
4. Use `paceread/seo/` for the landing page and SEO

---

*© 2025 Techscript Limited. Internal use only.*

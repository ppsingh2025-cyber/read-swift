# PaceRead — Asset Validation Report

**Client:** Techscript Limited  
**Product:** PaceRead  
**Document version:** 1.0  
**Status:** Production

This report audits every visual asset against Google Play Store requirements, Android adaptive icon requirements, and PWA manifest requirements.

---

## 1. Audit Summary

| Asset | Present | Compliant | Action required |
|---|---|---|---|
| App icon SVG (source) | ✅ | ✅ | None |
| App icon 192×192 PNG | ✅ | ⚠️ | Validate content against adaptive icon safe zone |
| App icon 512×512 PNG | ✅ | ⚠️ | Validate content against Play Store requirements |
| Apple touch icon 180×180 | ✅ | ⚠️ | Validate dimensions |
| Adaptive icon foreground layer | ❌ Missing | ❌ | **Must generate** |
| Adaptive icon background layer | ❌ Missing | ❌ | **Must generate** |
| Play Store feature graphic 1024×500 | ❌ Missing | ❌ | **Must generate** |
| Play Store screenshots (phone) | ❌ Missing | ❌ | **Must generate** — minimum 2, recommend 4 |
| Play Store screenshots (7-inch tablet) | ❌ Missing | — | Optional but recommended |
| Play Store screenshots (10-inch tablet) | ❌ Missing | — | Optional |
| High-res icon for Play Store (512×512) | ✅ | ⚠️ | Verify border padding and content |

---

## 2. Existing Assets — Detailed Assessment

### 2.1 `public/icons/icon.svg`

| Property | Requirement | Status |
|---|---|---|
| Format | SVG | ✅ |
| Viewbox | Square | Must confirm |
| No raster content embedded | Required | Must confirm |
| Scalable to any size without artefacts | Required | ✅ (vector) |

**Action:** Inspect `icon.svg` content. Ensure the viewBox is square (e.g., `0 0 512 512`). Ensure there are no embedded raster images (`<image>` tags). Export at all required sizes from this master source.

---

### 2.2 `public/icons/icon-192.png`

| Property | Requirement | Status |
|---|---|---|
| Dimensions | 192×192 px | Must confirm |
| Format | PNG-24 or PNG-32 | Must confirm |
| Background | Non-transparent OR transparent (for maskable) | Depends on variant |
| Colour profile | sRGB | Must confirm |

**Action:** Verify exact pixel dimensions. Ensure the icon content is contained within the **safe zone** (central 66% = 128×128 px for adaptive icons). Export a clean PNG from `icon.svg` at exactly 192×192 px using a tool like Inkscape, `rsvg-convert`, or Figma.

---

### 2.3 `public/icons/icon-512.png`

| Property | Requirement | Status |
|---|---|---|
| Dimensions | 512×512 px | Must confirm |
| Format | PNG-24 or PNG-32 | Must confirm |
| File size | Under 1 MB recommended | Must confirm |
| Background | Solid or transparent | Must confirm |
| Colour profile | sRGB | Must confirm |

**Play Store requirement:** The 512×512 PNG is the primary icon displayed in the Google Play Store listing. It must have:
- A solid or transparent background (no white border padding added by tooling)
- The brand mark centred with adequate padding (~10–15% on each side)
- No text embedded in the icon at this size (use the app name field in the listing)
- Strictly 512×512 px — any other dimension causes rejection

**Action:** Export directly from `icon.svg` at 512×512. Confirm file size < 1 MB. Confirm sRGB colour profile.

---

### 2.4 `public/apple-touch-icon.png`

| Property | Requirement | Status |
|---|---|---|
| Dimensions | 180×180 px | Must confirm |
| Format | PNG | Must confirm |
| No transparency | Required for iOS | Must confirm |
| Background | Must match `#060606` | Must confirm |

**Action:** Export a 180×180 PNG with a solid `#060606` background from `icon.svg`. iOS ignores transparency in touch icons.

---

## 3. Missing Assets — Generation Specifications

### 3.1 Android Adaptive Icon — Foreground Layer

**Required file:** `release-package/icons/ic_launcher_foreground.png`  
**Dimensions:** 108×108 dp at all densities:

| Density | Size |
|---|---|
| mdpi (1×) | 108×108 px |
| hdpi (1.5×) | 162×162 px |
| xhdpi (2×) | 216×216 px |
| xxhdpi (3×) | 324×324 px |
| xxxhdpi (4×) | 432×432 px |

**Safe zone:** The icon content must fit within the central **72×72 dp** area. The outer 18 dp ring is masked. Nothing critical (letterforms, icon points) may be placed in the outer 18 dp strip.

**Content:** The ⚡ (lightning bolt / RSVP focal mark) brand symbol centred at full safe-zone size. Colour: `#f0f0f0` (white) on transparent background.

**Format:** 32-bit PNG (RGBA), transparent background.

---

### 3.2 Android Adaptive Icon — Background Layer

**Required file:** `release-package/icons/ic_launcher_background.png`  
**Dimensions:** Same density table as foreground  
**Content:** Solid `#060606` fill (match app background). No gradients.  
**Format:** 32-bit PNG (RGBA), fully opaque.

---

### 3.3 Play Store Feature Graphic

**Required file:** `release-package/feature-graphic/feature-graphic.png`

| Property | Requirement |
|---|---|
| Dimensions | Exactly 1024×500 px |
| Format | JPEG or 24-bit PNG |
| File size | Under 1 MB |
| Safe zone | Keep key content within central 924×400 px (50 px margin each side) |
| No baked-in text required | Play Store overlays the app name — do not duplicate |

**Recommended design:**
- Background: `#060606`
- Show the reading word display at large scale (e.g., "focus" in Georgia font, `#f0f0f0`)
- Focal line element (`#e74c3c`) beneath the word
- App name "PaceRead" in top-left or centre in Segoe UI, `#f0f0f0`
- Tagline: "One word at a time." in `#888888`

---

### 3.4 Play Store Screenshots (Phone — Required)

**Minimum:** 2 screenshots. **Recommended:** 4 screenshots.

| Property | Requirement |
|---|---|
| Dimensions | 1080×1920 px (portrait) OR 1080×2340 px |
| Format | JPEG (quality ≥ 90) or 24-bit PNG |
| File size | Under 8 MB each |
| Naming | See `release-package/screenshots/README.md` |

**Required screenshots:**

| Filename | Screen content |
|---|---|
| `phone-01-reader.jpg` | Reading viewport showing the RSVP word display with a word visible, progress shown |
| `phone-02-controls.jpg` | Controls bar expanded, WPM slider visible, file loaded |
| `phone-03-history.jpg` | Reading history panel showing two or more records with progress bars |
| `phone-04-context.jpg` | Context preview panel visible alongside the word display |

**Screenshot design rules:**
- Use real content from an actual EPUB or PDF. Do not use Lorem Ipsum.
- Status bar should show a clean time (e.g., 9:41). Remove notification icons.
- Device frame is optional but recommended (Pixel 8 Pro or similar neutral device).
- All screenshots must use dark theme — background `#060606`.

---

### 3.5 Maskable Icon (512×512)

The existing `icon-512.png` is declared as `purpose: maskable` in the PWA manifest. This is only valid if the **entire 512×512 canvas** has a solid background and the brand mark is within the central **409×409 px safe zone** (80% of 512).

If the current `icon-512.png` has transparency outside the safe zone, it must be regenerated as a separate file `icon-512-maskable.png` with a solid `#060606` background fill.

**Update `vite.config.ts` manifest icons array accordingly:**

```json
{
  "src": "icons/icon-512-maskable.png",
  "sizes": "512x512",
  "type": "image/png",
  "purpose": "maskable"
}
```

---

## 4. Icon Colour Validation

All icon variants must use only brand-approved colours:

| Context | Background | Foreground |
|---|---|---|
| Adaptive icon background | `#060606` | — |
| Adaptive icon foreground | Transparent | `#f0f0f0` |
| Play Store icon | `#060606` | `#f0f0f0` + `#e74c3c` accent |
| Apple touch icon | `#060606` | `#f0f0f0` |
| PWA maskable | `#060606` | `#f0f0f0` |

---

## 5. Play Store Asset Checklist (Pre-Submission)

- [ ] `icons/icon-512.png` — 512×512, PNG, < 1 MB, sRGB
- [ ] `icons/ic_launcher_foreground.png` — all densities exported
- [ ] `icons/ic_launcher_background.png` — all densities exported
- [ ] `feature-graphic/feature-graphic.png` — 1024×500, < 1 MB
- [ ] `screenshots/phone-01-reader.jpg` — 1080×1920, < 8 MB
- [ ] `screenshots/phone-02-controls.jpg` — 1080×1920, < 8 MB
- [ ] `screenshots/phone-03-history.jpg` — 1080×1920, < 8 MB
- [ ] `screenshots/phone-04-context.jpg` — 1080×1920, < 8 MB

---

*© 2025 Techscript Limited. Internal use only.*

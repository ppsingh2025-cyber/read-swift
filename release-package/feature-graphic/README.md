# PaceRead — Feature Graphic Specification

**Client:** Techscript Limited  
**Document version:** 1.0  
**Status:** Production

---

## 1. Play Store Requirements

| Property | Requirement |
|---|---|
| Filename | `feature-graphic.png` or `feature-graphic.jpg` |
| Dimensions | Exactly **1024×500 px** |
| Format | JPEG or 24-bit PNG |
| File size | Under 1 MB |
| Colour space | sRGB |
| Safe zone | Central **924×400 px** — keep all critical content within this area (50 px margin each side) |

**Important:** The Play Store overlays a gradient scrim and the app name/rating on the bottom portion of this graphic. Keep the bottom 100 px of the canvas free of critical content.

---

## 2. Design Specification

### Canvas

| Property | Value |
|---|---|
| Width | 1024 px |
| Height | 500 px |
| Background | `#060606` |

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │  ← 1024 px wide
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                     SAFE ZONE (924×400)                     │  │  ← 50 px margins
│   │                                                             │  │
│   │         ╔══════════════════════════════════╗                │  │
│   │         ║                                  ║                │  │
│   │         ║   [Word Display — "focus"]        ║                │  │
│   │         ║   _____________                   ║                │  │  ← Viewport card (dark surface)
│   │         ║                                  ║                │  │
│   │         ╚══════════════════════════════════╝                │  │
│   │                                                             │  │
│   │  PaceRead                                                  │  │  ← App name — top left
│   │  One word at a time.                                        │  │  ← Tagline — below name
│   │                                                             │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│         [BOTTOM 100px — leave clear for Play Store overlay]         │
└─────────────────────────────────────────────────────────────────────┘
```

### Elements

#### Background
- Fill: `#060606`
- No gradients, no textures

#### Central Viewport Card (hero element)
- Dimensions: ~500×200 px, centred horizontally, vertically offset slightly above centre
- Background: `#0f0f0f`
- Border radius: `12px`
- Content: A single word — recommended **"focus"** — in Georgia serif, `clamp()` equivalent at approximately 80–100px
- Colour: `#f0f0f0`
- Focal line: `#e74c3c` line (60 px wide, 3 px tall) centred below the word, opacity 70%

#### App Name
- Text: **PaceRead**
- Position: 60 px from left edge, 40 px from top edge
- Font: Segoe UI, 28px, weight 800
- Colour: `#f0f0f0`
- Letter spacing: `-0.02em`

#### Tagline
- Text: **One word at a time.**
- Position: below app name, 8 px gap
- Font: Segoe UI, 16px, weight 400
- Colour: `#888888`

#### Optional: Speed indicator
- Text: **Up to 1000 WPM**
- Position: below tagline, 16 px gap
- Font: Segoe UI, 14px, weight 400
- Colour: `#2d6af6`

---

## 3. Alternative Layouts

If the central viewport approach is too minimal for the reviewing designer, an alternative is:

**Split layout:**
- Left half: App name + tagline + feature bullets in a vertical list
- Right half: Phone device mockup showing the reader screen

However, the recommended minimal layout above is preferred — it communicates the app's function more directly than device mockups and renders clearly at small thumbnail sizes.

---

## 4. Export Settings

| Setting | Value |
|---|---|
| Resolution | 72 DPI (screen) |
| Colour mode | RGB |
| Colour profile | sRGB IEC61966-2.1 |
| Format | PNG-24 (preferred) or JPEG at ≥ 90 quality |
| Flatten all layers | Yes |

---

## 5. Validation Checklist (before upload)

- [ ] Dimensions exactly 1024×500 px
- [ ] File size under 1 MB
- [ ] No embedded ICC profile other than sRGB (or no embedded profile)
- [ ] Bottom 100 px contains no critical text or UI elements
- [ ] No white borders or padding added by export tool
- [ ] App name "PaceRead" is legible at 1/4 size (256×125 px preview)
- [ ] Filename: `feature-graphic.png` or `feature-graphic.jpg`

---

*© 2025 Techscript Limited. Internal use only.*

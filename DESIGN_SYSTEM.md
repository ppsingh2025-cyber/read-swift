# DESIGN_SYSTEM.md — UI Rules

> **Purpose:** Single source of truth for all visual and interaction design decisions in ReadSwift. Cross-reference `/AGENT_READSWIFT.md` for component locations and `/READING_ENGINE.md` for engine constraints that affect rendering.

---

## Core Philosophy

ReadSwift is a **reading instrument**, not a typical web app. Every design decision must answer: *Does this help the user read?*

1. **Reading flow is sacred.** No layout shifts, reflows, or visual noise during active reading.
2. **Zero visual jitter.** The ORP word must appear stable at a fixed focal point between word changes.
3. **Minimal UI.** Controls exist to serve reading, not to demonstrate features.
4. **Mobile-first.** The reading viewport must be smooth at 1000+ WPM on a mid-range phone.
5. **Calm aesthetics.** No flashing, no loud colors, no unsolicited animation.

---

## Design Tokens

All tokens are CSS custom properties defined on `:root` in `src/styles/app.css`.

### Spacing Scale (4 px base)

```css
--space-1:   4px
--space-2:   8px
--space-3:  12px
--space-4:  16px
--space-6:  24px
--space-8:  32px
--space-12: 48px
```

Use these tokens for all padding, margin, and gap values. Do **not** use magic pixel numbers.

### Typography Scale

```css
--font-size-xs:  0.75rem   /* 12 px — metadata, footnotes */
--font-size-sm:  0.825rem  /* 13.2 px — secondary labels */
--font-size-md:  1rem       /* 16 px — body / default */
--font-size-lg:  1.125rem  /* 18 px — emphasis */
--font-size-xl:  1.25rem   /* 20 px */
--font-size-2xl: 1.5rem    /* 24 px — section headings */
--font-size-3xl: 1.875rem  /* 30 px — display */
```

### Border Radius Scale

```css
--radius-sm:   6px
--radius-md:  10px
--radius-lg:  14px   /* reading viewport corners */
--radius-full: 9999px
```

### ORP Scale Steps

Pre-computed scale factors for the reading viewport word size. Used when `mainWordFontSize` is non-default.

```css
--orp-scale-xs:   0.60
--orp-scale-sm:   0.75
--orp-scale-md:   1.00   /* default */
--orp-scale-lg:   1.25
--orp-scale-xl:   1.50
--orp-scale-2xl:  1.75
--orp-scale-3xl:  2.00
```

---

## Themes

Themes are applied via `data-theme` on the `<html>` element. Two themes exist: `night` (default) and `day`.

### Night Theme (`:root` default)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#060606` | App background |
| `--bg-panel` | `#0f1117` | Panels, drawers, sidebar |
| `--bg-input` | `#1a1a1a` | Input fields |
| `--border` | `#1e1e1e` | Dividers |
| `--border-input` | `#2a2a2a` | Input borders |
| `--text` | `#f0f0f0` | Primary text |
| `--text-muted` | `#888` | Secondary / label text |
| `--text-faint` | `#444` | Disabled / ghost text |
| `--text-secondary` | `#aaa` | Tertiary text |
| `--color-primary` | `#1E3A8A` | Brand blue |
| `--color-primary-hover` | `#1e4da8` | Brand blue hover |
| `--color-accent` | `#22d3ee` | Cyan accent / focus ring |
| `--color-accent-dim` | `#0e7490` | Muted accent |
| `--accent` (legacy) | `#4a7fa0` | Legacy alias — prefer `--color-accent` |
| `--vp-bg` | `#0a0a0a` | Viewport background |
| `--vp-border` | `#151515` | Viewport border |
| `--vp-text` | `#d4d4d4` | Peripheral word color |
| `--vp-placeholder` | `#666` | Placeholder text |
| `--state-hover` | `rgba(255,255,255,0.06)` | Hover overlay |
| `--state-active` | `rgba(255,255,255,0.12)` | Active overlay |
| `--state-focus` | `#22d3ee` | Focus ring color |
| `--state-disabled` | `0.25` | Opacity for disabled elements |
| `--kbd-bg` | `#1a1a1a` | Keyboard shortcut chip background |
| `--kbd-border` | `#333` | Keyboard shortcut chip border |
| `--kbd-text` | `#888` | Keyboard shortcut chip text |

### Day Theme (`[data-theme='day']`)

| Token | Value |
|-------|-------|
| `--bg` | `#F9FAFB` |
| `--bg-panel` | `#eeeeea` |
| `--bg-input` | `#e6e6e1` |
| `--border` | `#d8d8d0` |
| `--border-input` | `#c8c8c0` |
| `--text` | `#111827` |
| `--text-muted` | `#555` |
| `--text-faint` | `#999` |
| `--text-secondary` | `#6b7280` |
| `--color-accent` | `#0891b2` |
| `--color-accent-dim` | `#cffafe` |
| `--vp-bg` | `#eaeae5` |
| `--vp-border` | `#d0d0c8` |
| `--vp-text` | `#222` |
| `--vp-placeholder` | `#999` |
| `--state-hover` | `rgba(0,0,0,0.05)` |
| `--state-active` | `rgba(0,0,0,0.10)` |
| `--state-focus` | `#0891b2` |
| `--state-disabled` | `0.30` |

**Rule:** always define day-theme overrides inside `[data-theme='day'] { }`. Never hardcode colors inside component CSS Modules.

---

## Typography Rules

### Reading Viewport Font

```css
/* Word slots in ReaderViewport.module.css */
font-family: 'Georgia', serif;
letter-spacing: 0.03em;
```

The reading font is **Georgia serif** — high x-height, clear letterforms, proven legible at speed. Do **not** change to a sans-serif for the viewport.

### ORP Word Font Size

The center (ORP) word uses a `clamp()` value that scales with viewport width and the user's `mainWordFontSize` preference (60–200%):

```css
/* Normal mode */
clamp(1.1rem, calc(8vw / var(--slot-count, 1)), 3.2rem)

/* Focus / full-height mode */
clamp(2rem, calc(10vw / var(--slot-count, 1)), 6rem)
```

The `--slot-count` CSS variable is set from JavaScript on the window container element. Peripheral words always render at the base `clamp` size (scale 1) — they must not compete visually with the ORP word.

### ORP Character Split

When `orpEnabled` is true, the center word is split into three spans:

```
[prefix span — opacity 0.78][ORP char — font-size 1.08em, font-weight 900][suffix span — opacity 0.78]
```

ORP index formula: `Math.max(0, Math.ceil(word.length / 5) - 1)` — approximately the 20% position from the left (classic Spritz placement).

### Body / UI Font

```css
font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
```

Used for all non-viewport text (labels, buttons, panels).

---

## Color Rules

- **Highlight color** is user-configurable (default `#ff0000`). It applies to the ORP word in the viewport.
- 10 preset colors available in BurgerMenu, plus a custom color picker: Red, Orange, Yellow, Green, Teal, Blue, Indigo, Purple, Pink, White.
- Highlight color must remain readable against both `--vp-bg` (dark) and `[data-theme='day'] --vp-bg` (light). Avoid mid-grey highlights.
- **Never use high-saturation backgrounds** in the reading area — they cause visual fatigue.
- The reading area (`--vp-bg`) should always be darker/lighter than the surrounding page to create a subtle focus frame.

---

## Layout System

### App Shell (`app.css`)

```css
.appShell {
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}
```

### Portrait (default)

Vertical flex column: TopBar → ReadingMain → NavLayer → PasteArea → Controls → Footer.

### Landscape Mobile (≤ 480 px height + landscape)

CSS Grid with 2 columns:

```css
grid-template-columns: 3fr 1fr;
grid-template-rows: auto 1fr;
```

- TopBar: spans both columns.
- ReadingMain: left column (75%).
- Controls sidebar: right column (25%). `border-left: 1px solid var(--border)`.
- NavLayer, PasteArea, AppFooter: hidden.
- ContextPreview: hidden (reading area needs full space).

### Narrow Portrait (≤ 640 px)

- `readingMain` switches to `flex-direction: column` (viewport above, context below).
- Viewport height: 220 px (vs 300 px on wider screens).
- NavLayer padding: `0.5rem 0.75rem`.

### Focus Mode

```css
.appShellFocused {
  position: fixed;
  inset: 0;
  z-index: 200;
  max-width: 100%;
}
```

Viewport uses `.viewportFull` (height 100%, border-radius 0).

---

## Reading Viewport

File: `src/styles/ReaderViewport.module.css`

```css
.viewport {
  height: 300px;          /* 220px on mobile ≤ 640px */
  background: var(--vp-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--vp-border);
  overflow: hidden;
  user-select: none;
}
```

### Horizontal Layout (default)

**No DOM layout shifts during word changes.** The center word is the inline-block content of `.wordLayout`; peripherals are `position: absolute` hanging off its left/right edges.

```
[leftPeripherals — absolute, right:100%] [center word — inline-block] [rightPeripherals — absolute, left:100%]
```

- `leftPeripherals` and `rightPeripherals` are capped at `max-width: 40vw` each so they never crowd the center word on narrow screens.
- Gap between adjacent peripheral words: `0.25em`.
- Gap between peripheral and center: `0.5em` (`padding-right` / `padding-left`).

### Vertical Layout

Words stacked in `flex-direction: column`, all horizontally centered. No horizontal shift issue. Gap between words: `0.3em`.

### Peripheral Fade

Enabled when `peripheralFade` is true and `windowSize > 1`.

| Distance from center | Opacity |
|---------------------|---------|
| 0 (center/ORP) | 1.0 |
| 1 | 0.5 |
| 2+ | 0.25 |

Applied via inline `style={{ opacity }}` on each word slot.

---

## Controls Component

File: `src/styles/Controls.module.css`

Three rows:

| Row | Content |
|-----|---------|
| **Progress** | Word counter (clickable to jump) + progress track bar + % label |
| **Playback** | Upload · Paste · ◀ Prev · ▶ Play/Pause · Next ▶ · Reset |
| **Speed** | − · logarithmic WPM slider · + · WPM label |

**All interactive elements meet the 44 px minimum touch target size** (WCAG 2.5.5).

**Speed slider** uses logarithmic mapping so low WPM increments are precise and high WPM increments are coarser:

```typescript
// WPM 60–1500 mapped to slider 0–100
wpmToSlider(wpm) = ((log(wpm) - log(60)) / (log(1500) - log(60))) * 100
sliderToWpm(v)  = round(exp(log(60) + (v/100) * (log(1500) - log(60))))
```

**Faster/Slower buttons** (keyboard ↑↓) apply a 1.2× multiplier: `faster = min(1500, round(wpm * 1.2))`, `slower = max(60, round(wpm / 1.2))`.

---

## Burger Menu / Settings Drawer

The drawer slides in from the left. It contains sections in this order:

1. **Reading Profile** — 5 quick-preset buttons (Max Speed / Sprint / Balanced / Deep Focus / Zen)
2. **Display** — window size (1–5), highlight color (10 presets + custom picker), orientation (H/V), main word font size (60–200%)
3. **Reading Features** — peripheral fade toggle, ORP toggle, punctuation pause toggle, long-word compensation toggle, chunk mode (fixed / intelligent)
4. **Session Analytics** — `SessionStats` component
5. **Reading History** — `ReadingHistory` component
6. **Account** — `AccountSection` (Supabase auth; hidden if not configured)
7. **Links** — Feedback form, donate button
8. **About** — App version, TechScript credit

**During active playback** (`isPlaying === true`), the Display and Reading Features sections are collapsed. A "Show Settings" affordance expands them so the drawer doesn't distract from reading.

---

## Icons

All icons are **inline SVG** (`viewBox="0 0 24 24"`, `width="20" height="20"`). Style: `stroke="currentColor"`, `strokeWidth="2"`, `strokeLinecap="round"`, `strokeLinejoin="round"`. Fill-based icons (play/pause) use `fill="currentColor" stroke="none"`.

**Never use icon fonts or external icon libraries.** Keep icons as inline SVG to avoid FOUC and eliminate external requests.

---

## Interactive Element States

Apply these interaction patterns consistently:

```css
/* Hover */
background: var(--state-hover);   /* subtle overlay */

/* Active (pressed) */
background: var(--state-active);

/* Focus */
outline: 2px solid var(--state-focus);
outline-offset: 2px;

/* Disabled */
opacity: var(--state-disabled);   /* 0.25 night / 0.30 day */
cursor: not-allowed;
pointer-events: none;
```

---

## Animation Guidelines

| Use case | Allowed |
|----------|---------|
| Theme switch | `transition: background 0.2s, color 0.2s` on `body` |
| Loading progress bar fill | `transition: width 0.3s ease` |
| Maximize button fade | `transition: opacity 0.2s` |
| Button hover color | `transition: background 0.15s, border-color 0.15s, color 0.15s` |
| Word changes in viewport | **No transition** — instant swap only |
| Panel open/close | Avoid layout-triggering animations |

> **Strict rule:** Do **not** add `transition` or `animation` to word slot elements. Word changes at high WPM (up to 1500 WPM ≈ one word every 40 ms) must be instantaneous. Any transition would smear words together visually.

---

## Accessibility

- `ReaderViewport` has `aria-live="assertive"` and `aria-atomic="true"` so screen readers announce word changes.
- All buttons have `aria-label` or visible text.
- Progress bar uses `role="progressbar"` with `aria-valuenow/min/max`.
- Loading bar uses the same `role="progressbar"` pattern.
- Empty word slots use `aria-hidden="true"`.
- Disabled elements use the `disabled` attribute (not just visual opacity).
- Touch targets ≥ 44 × 44 px throughout.

---

## CSS Module Conventions

- Each component has exactly one `.module.css` file in `src/styles/`.
- Global structural / layout styles (shell, topBar, navLayer, etc.) live in `src/styles/app.css`.
- Use `camelCase` class names in CSS Modules (e.g. `.wordSlotCenter`, not `.word-slot-center`).
- Never hardcode color hex values inside CSS Modules — always use a CSS custom property from the token system.
- Responsive breakpoints: `640px` (narrow portrait), `480px height + landscape` (landscape mobile).

---

## What Not to Do

| Prohibited | Reason |
|-----------|--------|
| Adding `transition` to word slots | Smears words at high WPM |
| Hardcoding colors in CSS Modules | Breaks theme switching |
| Using layout-triggering properties (`width`, `height`, `top`, `left`) for animation | Causes reflow during reading |
| Introducing external CSS frameworks (Tailwind, Bootstrap, etc.) | Conflicts with CSS Modules, adds unused code |
| Popups, modals, or toasts during active reading | Interrupts reading flow |
| Decorative animations (spin, bounce, pulse) | Visual noise |
| Large `box-shadow` on viewport | GPU overdraw on mobile |

---

## UX Consistency Rules (Agent-Enforced)

### Research-Based RSVP UX Principles

Based on established RSVP research and dark UI best practices:

1. **One word default.** RSVP research consistently shows 1 word at a time is the core paradigm — the brain processes a single focal word fastest. `windowSize` defaults to `1` globally.

2. **Reading viewport is sacred.** During playback, zero layout shifts, zero animations on word slots. The viewport is a reading instrument, not a UI component.

3. **Minimal chrome during reading.** Controls exist to serve reading. Settings live in the drawer. Nothing appears over the reading area uninvited.

### Color Token Rules (All New Code Must Follow)

Every new UI element must use ONLY these existing tokens. No new colors may be introduced. No hardcoded hex values except `#666` and `#999` for the focal tick marks (these are intentionally muted and not interactive).

| Usage | Token |
|---|---|
| App background | `var(--bg)` |
| Panel / drawer background | `var(--bg-panel)` |
| Input / select background | `var(--bg-input)` |
| Primary text | `var(--text)` |
| Secondary / label text | `var(--text-muted)` |
| Disabled / ghost text | `var(--text-faint)` |
| Border | `var(--border)` |
| Input border | `var(--border-input)` |
| Interactive accent | `var(--color-accent)` |
| Accent hover | `var(--color-accent-dim)` |
| Hover overlay | `var(--state-hover)` |
| Active/pressed overlay | `var(--state-active)` |
| Focus ring | `var(--state-focus)` |
| Disabled opacity | `var(--state-disabled)` |

**Never use:**
- `#000000` or `#ffffff` (use token equivalents)
- Any blue other than `--color-primary` or `--color-accent`
- Any hardcoded color inside a CSS Module except `#666`/`#999` for tick marks

### Button & Interactive Element Rules

All buttons and toggles must follow this pattern consistently:

```css
/* Default */
background: var(--bg-input);
border: 1px solid var(--border);
color: var(--text-muted);

/* Hover */
background: var(--state-hover);
color: var(--text);

/* Active/selected */
border-color: var(--color-accent);
color: var(--color-accent);
background: color-mix(in srgb, var(--color-accent) 10%, transparent);

/* Disabled */
opacity: var(--state-disabled);
cursor: not-allowed;

/* Transition */
transition: background 0.15s, border-color 0.15s, color 0.15s;
```

Minimum touch target: `44 × 44px` on all interactive elements (WCAG 2.5.5).

### Typography Rules

- Reading viewport: Georgia serif only — no changes
- All UI (menus, labels, buttons): `font-family: 'Segoe UI', system-ui, -apple-system, sans-serif`
- Never use font-weight below `400` in dark mode — thin fonts are unreadable on dark backgrounds
- Toggle labels: `font-size: var(--font-size-sm)`, `color: var(--text)`
- Toggle descriptions: `font-size: var(--font-size-xs)`, `color: var(--text-muted)`
- Section headings in drawer: `font-size: var(--font-size-sm)`, `font-weight: 700`, `color: var(--text-muted)`, `text-transform: uppercase`, `letter-spacing: 0.08em`

### Slider Rules

The WPM slider in Controls must use:
```css
accent-color: var(--color-accent);
```

No custom slider track styling that differs from the existing implementation.

### Spacing Rules

All margin, padding, and gap values must use the 4px spacing scale:

```
var(--space-1) = 4px
var(--space-2) = 8px
var(--space-3) = 12px
var(--space-4) = 16px
var(--space-6) = 24px
var(--space-8) = 32px
```

No magic pixel values for spacing.

### Contrast Requirements

- All text on `--bg` or `--bg-panel` must meet WCAG AA: minimum 4.5:1 contrast ratio
- Interactive elements at minimum 3:1 contrast ratio
- The existing token system already meets these ratios — do not introduce colors that break them

## ORP Color Rules

ORP highlight colors are scientifically curated per theme. Only these 4 options are offered
per theme. The choices are based on:
- Luminance contrast ≥ 5:1 against theme background (WCAG AA+)
- Pop-out speed from pre-attentive feature detection research
- Fatigue research: red (#ff0000) is explicitly excluded — highest fatigue, worst cognitive performance
- Color-blind safety: cyan option included in all themes as a safe default

Never add red (#ff0000) back as a default or preset option.

## Icon Color Rules

All SVG icons in component files must use `fill: currentColor`.
Never hardcode `fill="#ffffff"`, `fill="#000000"`, or any hex on SVG elements.
The parent element's `color` CSS property controls the icon color via `currentColor`.
This ensures all icons automatically update when theme changes.

## Interactive Element Rules (Updated)

Every interactive element must be in one of exactly 3 visual states:
1. Default: `background: var(--bg-input)`, `border: var(--border)`, `color: var(--text-muted)`
2. Hover: `background: var(--state-hover)`, `color: var(--text)`
3. Active/selected: `border-color: var(--color-accent)`, `color: var(--color-accent)`, `background: var(--color-accent-dim)`

Primary action button (PLAY): background `var(--color-accent)`, color `var(--bg)`.

No element may use a hardcoded color value for interactive states.

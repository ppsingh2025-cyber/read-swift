# PaceRead — Brand Identity Brief

**Client:** Techscript Limited  
**Product:** PaceRead  
**Document version:** 1.0  
**Status:** Production

---

## 1. Brand Positioning

PaceRead is a **precision cognitive-performance tool**. It is not a lifestyle app, entertainment product, or social experience. It exists to solve one problem: helping people read faster and with greater retention.

**Core promise:** Remove visual scanning fatigue. Display text at a fixed focal point. Let the reader's mind absorb language at the speed thought allows.

**Personality:** Precise. Minimal. Focused. Technically credible. No noise.

**Tone of voice:** Direct. Functional. No marketing superlatives. Describe what the tool does, not how it makes you "feel". Avoid: "beautiful", "seamless", "powerful", "amazing".  
Use: "exact", "local", "zero", "instant", "configurable", "no data", "no accounts".

---

## 2. Colour Palette

All colours are extracted from the production codebase. These are the canonical values.

### Core

| Token | Hex | Usage |
|---|---|---|
| `color.background.base` | `#060606` | Page / app background |
| `color.background.surface` | `#0f0f0f` | Reading viewport card |
| `color.background.elevated` | `#1a1a1a` | Controls bar, panels, history |
| `color.background.input` | `#2a2a2a` | Buttons, interactive elements |
| `color.background.item` | `#242424` | List items, history entries |

### Text

| Token | Hex | Usage |
|---|---|---|
| `color.text.primary` | `#f0f0f0` | Body text, labels, word display |
| `color.text.secondary` | `#cccccc` | Section headings, important meta |
| `color.text.tertiary` | `#aaaaaa` | Progress states, descriptions |
| `color.text.muted` | `#888888` | Subtitles, secondary metadata |
| `color.text.faint` | `#666666` | Hints, keyboard shortcuts |
| `color.text.disabled` | `#555555` | Disabled state labels |

### Borders

| Token | Hex | Usage |
|---|---|---|
| `color.border.strong` | `#444444` | Primary button borders |
| `color.border.base` | `#333333` | Panel borders, list item borders |

### Brand Accents

| Token | Hex | Colour | Usage |
|---|---|---|---|
| `color.accent.focal` | `#e74c3c` | Red | Focal guide line, progress fill, delete action hover |
| `color.accent.action` | `#2d6af6` | Blue | Primary CTA (Upload), reading progress bar fill |
| `color.accent.action.hover` | `#1e56d0` | Dark blue | Upload button hover state |

### Derived Semantic Tokens

| Semantic token | Maps to |
|---|---|
| Primary button background | `color.accent.action` |
| Primary button hover | `color.accent.action.hover` |
| Destructive action | `color.accent.focal` |
| Focus indicator | `color.accent.action` |
| Progress indicator | `color.accent.focal` |
| Selected state | `color.accent.action` |

---

## 3. Typography

### Typefaces

| Role | Family | Fallback |
|---|---|---|
| UI chrome | `'Segoe UI'` | `system-ui, -apple-system, sans-serif` |
| Reading word | `'Georgia'` | `serif` |

### Scale

| Token | Value | Usage |
|---|---|---|
| `typography.size.xs` | `0.8rem` (12.8px) | Keyboard hints |
| `typography.size.sm` | `0.85rem` (13.6px) | Progress counters, metadata |
| `typography.size.base` | `0.9rem` (14.4px) | Secondary labels |
| `typography.size.md` | `1rem` (16px) | Body text, section headings |
| `typography.size.lg` | `1.1rem` (17.6px) | Primary labels, loading text |
| `typography.size.xl` | `clamp(1.6rem, 4vw, 2.4rem)` | App header H1 |
| `typography.size.word` | `clamp(2.5rem, 8vw, 5rem)` | RSVP word display |

### Weights

| Token | Value | Usage |
|---|---|---|
| `typography.weight.normal` | `400` | Body text |
| `typography.weight.bold` | `700` | Reading word, speed buttons |
| `typography.weight.heavy` | `800` | App header H1 |

### Letter spacing

| Token | Value | Usage |
|---|---|---|
| `typography.tracking.tight` | `-0.02em` | H1 headlines |
| `typography.tracking.wide` | `0.04em` | RSVP reading word |

---

## 4. Iconography

The app uses **no custom icon set** at the component level. All interactive icons are Unicode / emoji glyphs (▶, ⏸, ↺, +, −) to ensure zero render latency. New icons should follow this convention — prefer standard Unicode over custom SVGs for in-UI controls.

The app icon (launcher / Play Store) uses the SVG defined at `public/icons/icon.svg`.

---

## 5. Motion & Animation

| Token | Value | Usage |
|---|---|---|
| `animation.word.duration` | `60ms` | Word appear (RSVP) |
| `animation.word.easing` | `ease-out` | Word fade/slide in |
| `animation.transition.fast` | `150ms` | Button hover backgrounds |
| `animation.transition.base` | `300ms` | Progress bars, sliders |
| `animation.transition.easing` | `ease` | All standard transitions |

**Animation philosophy:** Animations are either imperceptible micro-transitions (60 ms) or purely functional progress indicators. No decorative motion. The word-appear animation must never exceed 80 ms — anything longer disrupts RSVP rhythm at high WPM.

---

## 6. Spacing

The layout uses a base-8 spacing grid.

| Token | Value |
|---|---|
| `spacing.xs` | `0.25rem` (4px) |
| `spacing.sm` | `0.5rem` (8px) |
| `spacing.md` | `0.75rem` (12px) |
| `spacing.lg` | `1rem` (16px) |
| `spacing.xl` | `1.5rem` (24px) |
| `spacing.2xl` | `2rem` (32px) |

---

## 7. Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius.sm` | `4px` | `kbd` elements, small chips |
| `radius.md` | `8px` | Buttons, inputs |
| `radius.lg` | `10px` | Control bars, panels |
| `radius.xl` | `12px` | Reading viewport card |

---

## 8. Elevation / Depth

The app is entirely flat. No drop shadows are used. Depth is communicated entirely through background colour stepping:

```
#060606 → #0f0f0f → #1a1a1a → #2a2a2a → #242424
```

Do not add `box-shadow` to any component. Use background colour contrast instead.

---

## 9. UI Behaviour Principles

1. **Zero chrome:** Remove every element that does not serve the current reading task.
2. **Fixed focal point:** The reading word must always appear at the exact vertical and horizontal centre of the viewport card. Layout reflow is prohibited during playback.
3. **State never disappears:** Progress, word count, and history are always persisted and visible. A user can close the browser and resume exactly where they stopped.
4. **Local-first:** No file is ever sent to a server. No network request is made during reading. The privacy guarantee is architectural, not policy.
5. **Accessible by default:** All interactive elements have keyboard equivalents. Colour contrast meets WCAG AA minimum (4.5:1 for small text). Disabled states are visually unambiguous.
6. **No onboarding:** The UI teaches itself. Upload a file and press play. No tutorial, modal, or tooltip required.

---

## 10. Visual Design Rules

- **Do not** add gradient backgrounds.
- **Do not** use a light/white background variant. The app is dark-mode first and exclusively.
- **Do not** introduce new accent colours without matching an existing semantic token.
- **Do not** use transparency (`rgba`) on text — use the defined hex text colours.
- **Do** maintain the existing colour-stepping depth model for any new panels or cards.
- **Do** use `clamp()` for all heading and word display font sizes for responsive scaling.
- **Do** apply `will-change: transform` to any element that has GPU-composited animation.

---

*© 2025 Techscript Limited. Internal use only.*

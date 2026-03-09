# PaceRead — Brand Identity

**Company:** Techscript Limited  
**Product:** PaceRead  
**Document version:** 1.0  
**Status:** Production

---

## 1. Brand Identity Statement

**PaceRead is a precision reading instrument that eliminates the physical overhead of eye movement so that knowledge workers can process text at the speed their mind allows.**

It is not a content platform. It is not a library. It is not a social reading app. It is a cognitive performance tool for people who read to learn, not to be entertained.

---

## 2. Product Positioning

### Category

**Speed-reading utility** — a tool, not a destination.

PaceRead belongs in the same mental category as a text editor or a calculator: a focused instrument with one job, executed precisely.

### Market position

| Dimension | PaceRead | Traditional e-reader | Speed-reading subscription app |
|---|---|---|---|
| Works with user's own files | ✅ | ❌ | ❌ |
| No account required | ✅ | ❌ | ❌ |
| No subscription | ✅ | ❌ | ❌ |
| No data sent to servers | ✅ | ❌ | ❌ |
| Works offline | ✅ | Partial | ❌ |
| PDF support | ✅ | Partial | ❌ |
| EPUB support | ✅ | ✅ | Partial |
| RSVP method | ✅ | ❌ | ✅ |
| Free | ✅ | ❌ | ❌ |

**Competitive wedge:** The combination of RSVP technique + bring-your-own-file + zero data collection + free is not available from any competitor. PaceRead owns this intersection.

### Positioning statement (internal)

> For students, engineers, and knowledge workers who need to read large volumes of text quickly, PaceRead is the only speed-reading tool that works with the PDFs, EPUBs, DOCX, TXT, Markdown, HTML, RTF, and SRT files they already own, requires no account, and sends nothing to the cloud.

---

## 3. Value Proposition

### Primary value proposition

**Read the same document in half the time. No training. No subscription. No account.**

### Supporting proof points

1. **RSVP method** — Rapid Serial Visual Presentation eliminates eye-scanning, the primary speed bottleneck for most adult readers.
2. **Your files, your device** — Drag in any PDF, EPUB, DOCX, TXT, Markdown, HTML, RTF, or SRT file. Processing runs entirely in-browser. No upload, no wait.
3. **Configurable speed** — 60 to 1500 words per minute. Adjustable in real time. Your pace, your control.
4. **Zero friction** — No account creation, no email verification, no onboarding sequence. Open the app, load a file, press play.
5. **Progress memory** — PaceRead saves your position in every document automatically. Close the app, come back tomorrow, resume exactly where you stopped.

### One-line elevator pitch

**PaceRead: one word at a time, at the speed your brain works.**

---

## 4. Technical Identity

| Property | Value |
|---|---|
| Architecture | React Progressive Web App (PWA) |
| Android delivery | Trusted Web Activity (TWA) via Capacitor |
| PDF engine | Mozilla PDF.js (in-browser, WASM-accelerated) |
| EPUB engine | epub.js (in-browser) |
| State persistence | Browser localStorage — on-device only |
| Network requirements at runtime | None (fully offline after install) |
| Backend | None |
| Analytics | None |
| Accounts | None |
| Data collection | None |
| Minimum Android version | Android 7.0 (API 24) |
| Permissions required | Internet (for TWA shell load only) |

**Technical identity in one sentence:** PaceRead is a zero-backend, zero-account, zero-tracking document speed reader that runs entirely in the user's browser.

---

## 5. Tone of Voice

### Character

Precise. Functional. Credible. Dry. Never self-congratulatory.

PaceRead speaks like senior engineering documentation — accurate, minimal, no adjectives that can't be measured. It respects the reader's intelligence and does not over-explain.

### Voice rules

| Use | Avoid |
|---|---|
| Describe what the tool does | Describe how it will make you feel |
| Specific numbers (1500 WPM, 0 accounts) | Superlatives (fastest, best, amazing) |
| "processes locally" | "keeps your data safe" (vague) |
| "no account required" | "completely hassle-free" |
| "configurable" | "powerful" |
| "zero" | "none whatsoever" (redundant) |
| Second person direct ("you read") | Third person passive ("reading is enhanced") |

### Sample copy (correct tone)

> PaceRead displays one word at a time at the exact centre of the screen. Your eyes stop moving. You read faster.

> Load any PDF, EPUB, DOCX, TXT, Markdown, HTML, RTF, or SRT file. No upload. No account. All processing runs on your device.

> Set your speed from 60 to 1500 words per minute. Adjust while reading. Your progress is saved automatically.

### Sample copy (incorrect tone — avoid)

> ❌ Experience a revolutionary new way to read that will transform your relationship with books!
> ❌ Our powerful AI-driven reading platform helps you become the reader you've always wanted to be.
> ❌ Beautifully designed for the modern learner.

---

## 6. Brand Personality

| Axis | PaceRead is | PaceRead is not |
|---|---|---|
| Personality | Precise, minimal, analytical | Enthusiastic, warm, playful |
| Visual language | Dark, high-contrast, typography-led | Colourful, illustrated, icon-heavy |
| Communication | Functional, declarative | Emotive, persuasive |
| User relationship | Tool / instrument | Service / companion |
| Speed | Fast and direct | Thorough and explanatory |

---

## 7. Brand Colour Palette

Derived from the production application UI:

| Token | Hex | Role |
|---|---|---|
| Background | `#060606` | App canvas — near-black, not pure black |
| Surface | `#0f0f0f` | Reading viewport card |
| Panel | `#1a1a1a` | Control areas, panels |
| Input | `#2a2a2a` | Buttons, interactive surfaces |
| Text primary | `#f0f0f0` | All primary text |
| Text muted | `#888888` | Subtitles, metadata |
| Accent red | `#e74c3c` | Focal guide, progress, destructive |
| Accent blue | `#2d6af6` | Primary CTA, reading progress |

---

## 8. Product Name Rationale

**PaceRead** = Read + Swift

- "Read" — the literal action. Unambiguous.
- "Swift" — speed and precision. Connotes both velocity and reliability (Swift programming language reference builds technical credibility with the target audience).
- Compound noun — memorable, two syllables, no special characters.
- Domain-friendly: `readswift.com`, `readswift.app` likely available.
- App Store / Play Store search: "PaceRead" is not a common word — brand recognition transfers to search instantly.

---

*© 2025 Techscript Limited. Internal use only.*

# ReadSwift — GitHub Copilot Instructions

## Project Overview

**ReadSwift** is a production-quality React web application that implements **Rapid Serial Visual Presentation (RSVP)** reading. It is built and maintained by **TechScript Limited** and is deployed at [readswift.techscript.ca](https://readswift.techscript.ca).

Users load a document (PDF, EPUB, DOCX, TXT, MD, HTML, RTF, SRT), and the app displays one word (or a small window of words) at a time at high speed — helping readers consume text faster by eliminating eye movement. All parsing runs entirely in the browser; no files are ever uploaded to a server.

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | React 19 + TypeScript |
| Build tool | Vite 7 |
| PDF parsing | pdfjs-dist |
| EPUB parsing | epubjs |
| Styling | CSS Modules + vanilla CSS |
| State | React Context API |
| PWA | vite-plugin-pwa (Workbox) |
| Mobile wrapper | Capacitor 8 |
| Auth / sync | Supabase (optional) |
| Toasts | react-hot-toast |

---

## Repository Structure

```
.
├── capacitor.config.ts          # Capacitor (mobile) configuration
├── vite.config.ts               # Vite + PWA plugin configuration
├── index.html                   # HTML shell with PWA + mobile meta tags
├── public/
│   ├── icons/                   # App icons (SVG + 192/512 PNG)
│   └── apple-touch-icon.png
├── docs/
│   ├── AUTH_ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── GOOGLE_OAUTH_SETUP.md
│   ├── MIGRATION_GUIDE.md
│   └── SUPABASE_SETUP.md
├── .github/workflows/
│   ├── deploy-web.yml           # GitHub Pages deployment (on push to main)
│   ├── build-android.yml        # Android APK/AAB build (debug on push, release on v* tag)
│   └── build-ios.yml            # iOS build
├── supabase/
│   └── migrations/              # SQL migration files for Supabase schema
└── src/
    ├── App.tsx                  # Root component — 4-layer layout
    ├── version.ts               # App version string
    ├── main.tsx                 # React entry point
    ├── index.css                # Base CSS reset
    ├── assets/                  # Static assets imported by components
    ├── auth/
    │   ├── AuthContext.tsx      # AuthProvider component
    │   ├── authContextDef.ts    # Auth context types + createContext
    │   ├── AuthService.ts       # Supabase auth calls (signIn, signOut, getUser)
    │   ├── SignInPrompt.tsx     # Post-session "sign in to sync" nudge
    │   └── useAuth.ts           # useAuth hook
    ├── components/
    │   ├── Controls.tsx         # Bottom bar: play/pause, speed slider, file upload
    │   ├── PageNavigator.tsx    # Page/chapter jump navigation
    │   ├── WordNavigator.tsx    # Word-level step + jump navigation
    │   ├── ReaderViewport.tsx   # Fixed-position word display (memoised)
    │   ├── ContextPreview.tsx   # Side-by-side paragraph context
    │   ├── InputPanel.tsx       # Paste text / URL fetch panel
    │   ├── BurgerMenu.tsx       # Hamburger menu (settings, history, auth)
    │   ├── Settings.tsx         # All display/reading setting toggles
    │   ├── ReadingHistory.tsx   # History panel with per-file progress
    │   ├── SessionStats.tsx     # Words read, active time, effective WPM display
    │   ├── HelpModal.tsx        # Keyboard shortcuts + usage guide
    │   ├── OnboardingOverlay.tsx# First-run walkthrough overlay
    │   ├── ContinueReadingPrompt.tsx # Prompt to resume last document
    │   ├── ThemeToggle.tsx      # Day/Night theme button
    │   ├── SyncStatusIndicator.tsx  # Cloud sync status icon
    │   ├── UserAvatar.tsx       # Signed-in user avatar / sign-out button
    │   ├── AccountSection.tsx   # Account management section in BurgerMenu
    │   ├── DonateButton.tsx     # "Buy me a coffee" link
    │   ├── FeedbackButton.tsx   # Feedback link
    │   └── AppFooter.tsx        # Footer with version + copyright
    ├── context/
    │   ├── ReaderContext.tsx    # ReaderProvider (all app state)
    │   ├── readerContextDef.ts  # Context types + createContext call
    │   └── useReaderContext.ts  # useReaderContext hook (throws if outside provider)
    ├── hooks/
    │   ├── useRSVPEngine.ts     # RSVP playback engine with drift-corrected timing
    │   ├── useChunkEngine.ts    # Intelligent phrase-based word grouping
    │   └── useAdaptiveSpeed.ts  # Auto-calibrates WPM based on rewinds/completions
    ├── parsers/
    │   ├── pdfParser.ts         # Async generator — yields text page-by-page (pdfjs-dist)
    │   ├── epubParser.ts        # Async generator — yields text chapter-by-chapter (epubjs)
    │   ├── textParser.ts        # Handles TXT, MD, HTML, RTF, SRT, DOCX (sync)
    │   └── urlParser.ts         # Fetches a URL and extracts readable article text
    ├── sync/
    │   ├── SyncService.ts       # Syncs reading records to/from Supabase
    │   ├── IndexedDBService.ts  # Local IndexedDB cache for sync queue
    │   ├── MetadataManager.ts   # Manages per-file sync metadata
    │   ├── deviceDetector.ts    # Detects device type for sync labels
    │   └── fileHasher.ts        # Hashes file name for stable record IDs
    ├── utils/
    │   ├── textUtils.ts         # normalizeText / tokenize helpers
    │   ├── recordsUtils.ts      # load / save / delete reading records in localStorage
    │   ├── contentNormalizer.ts # Strips headers/footers/page-numbers from PDF pages
    │   └── structureUtils.ts    # Builds structural map (headings, paragraphs) from words
    ├── styles/
    │   ├── app.css              # Global layout styles (CSS custom properties, theming)
    │   └── *.module.css         # Component-scoped CSS Modules
    ├── config/                  # App-wide constants and configuration
    ├── types/                   # Shared TypeScript type declarations
    └── workers/                 # Web Workers (e.g. heavy parsing off the main thread)
```

---

## Core Concepts

### App Layout (4 layers)
1. **Top bar** — BurgerMenu (left) · ReadSwift brand (center) · SyncStatusIndicator + UserAvatar + Help + ThemeToggle (right)
2. **Reading main** — `ReaderViewport` + `ContextPreview` (side by side)
3. **Navigation layer** — `PageNavigator` (hidden in focus mode)
4. **Bottom control bar** — `Controls` (always visible; sticky)

An optional **paste/URL panel** (`InputPanel`) slides above the bottom bar.

A **focus mode** (`isFocused` state) hides navigation, context preview, and footer for a distraction-free experience.

### State Management
All reader state lives in `ReaderContext` (defined in `readerContextDef.ts`, provided by `ReaderContext.tsx`). Access it via the `useReaderContext()` hook. The context holds:
- `words` — tokenized word array for the loaded document
- `currentWordIndex` — index of the word currently being displayed
- `isPlaying` — playback state
- `wpm` — reading speed (60–1500)
- `windowSize` — 1–5 words shown at once
- `pageBreaks` / `currentPage` / `totalPages` — pagination
- `structureMap` — `Map<number, StructuralMarker>` mapping word indices to structural elements (heading, paragraph, etc.)
- `records` — `ReadingRecord[]` from localStorage (up to 20 entries)
- Display settings: `highlightColor`, `orientation`, `theme`, `orpEnabled`, `punctuationPause`, `peripheralFade`, `longWordCompensation`, `mainWordFontSize`, `chunkMode`
- `sessionStats` — words read, active time, effective WPM for the current session

### RSVP Engine (`useRSVPEngine`)
- Uses `setInterval` with **drift correction** to advance `currentWordIndex`.
- After each tick, calculates the difference between expected and actual fire time and adjusts the next interval.
- Exports: `wordWindow`, `play`, `pause`, `reset`, `faster`, `slower`, `prevWord`, `nextWord`.

### Chunk Engine (`useChunkEngine`)
- When `chunkMode === 'intelligent'`, groups words into natural phrase chunks rather than fixed windows.
- Returns `chunkWindow` (the words to display) and `chunkHighlightIndex` (ORP position).

### Adaptive Speed (`useAdaptiveSpeed`)
- Tracks rewinds (backward navigation during playback) and session completions.
- On session end, calls `finalizeSession(wpm)` to compute a new baseline WPM.
- The baseline is applied only if the user didn't manually change speed in the session.

### Parsers
- **PDF / EPUB** — async generators; yield one page/chapter of text at a time.
  - Progress is scaled 0–80% during extraction, 80–90% during normalization, 90–100% during tokenization.
  - `normalizePages` (in `contentNormalizer.ts`) removes headers, footers, and page numbers.
- **Text formats** — `parseFile` in `textParser.ts` handles TXT, MD, HTML, RTF, SRT, DOCX synchronously.
- **URL** — `urlParser.ts` fetches a URL and extracts readable article text.

### Reading Records (localStorage)
- Key: `fastread_records`
- Each `ReadingRecord`: `{ name, wordCount, lastWordIndex, lastReadAt, wpm }`
- Saved on pause and when a new file is loaded.
- When the same filename is re-uploaded, `lastWordIndex` is restored automatically.
- Maximum 20 records; oldest are dropped.

### Structural Map
- `buildStructureMap(rawLines, words)` — classifies lines as headers, subheadings, paragraphs, scene separators, or dialogue.
- `buildStructureMapFromWords(words)` — fallback when raw lines are unavailable.
- Used by `ContextPreview` to render richer paragraph context hints.

### Authentication & Sync (Optional)
- Auth via Supabase + Google OAuth.
- `AuthContext` / `AuthProvider` wrap the app; `useAuth()` gives access to `user`, `signIn`, `signOut`.
- `SyncService` syncs reading records to Supabase when the user is signed in.
- The app is **fully functional without authentication**; sync is an optional enhancement.

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Async generators for PDF/EPUB | Non-blocking; shows incremental progress; low memory usage |
| Drift-corrected `setInterval` | Prevents cumulative timing drift at high WPM |
| React Context (not Redux/Zustand) | App state is a single coherent unit; no complex derived state needed |
| CSS Modules | Prevents style leakage between components |
| `React.memo` on `ReaderViewport` | The word display only re-renders when the word changes |
| Refs in RSVP engine | Avoids stale closure values without triggering re-renders |
| `will-change: transform` on word element | Enables GPU compositing for the word-appear animation |
| localStorage for records | Simple, no server required, persists across sessions |
| IndexedDB for sync queue | Handles offline-first sync without data loss |

---

## File Format Support

| Format | Extension(s) | Parser |
|--------|-------------|--------|
| PDF | `.pdf` | pdfjs-dist (async generator) |
| EPUB | `.epub` | epubjs (async generator) |
| DOCX | `.docx` | textParser.ts |
| Plain text | `.txt` | textParser.ts |
| Markdown | `.md` | textParser.ts |
| HTML | `.html`, `.htm` | textParser.ts |
| RTF | `.rtf` | textParser.ts |
| Subtitle | `.srt` | textParser.ts |

Max file size: **100 MB**.

---

## Reading Profiles

| Profile | WPM | Window | Notes |
|---------|-----|--------|-------|
| Max Speed | 700 | 1 word | No pauses — document triage |
| Sprint | 500 | 1 word | No pauses — speed training |
| Balanced (default) | 300 | 3 words | Normal pauses |
| Deep Focus | 180 | 3 words | Strong peripheral fade |
| Zen | 100 | 1 word | Intelligent chunking — meditative |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` | Previous word |
| `→` | Next word |
| `↑` | Faster (+10 WPM) |
| `↓` | Slower (−10 WPM) |
| `Escape` | Close modals / exit focus mode |

---

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Type-check + production build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint

# Sync Capacitor native projects after a web build
npm run cap:sync

# Open Android project in Android Studio
npm run cap:android

# Open iOS project in Xcode
npm run cap:ios
```

---

## CI / CD Workflows

| Workflow | Trigger | Output |
|----------|---------|--------|
| `deploy-web.yml` | Push to `main` | GitHub Pages deployment to `readswift.techscript.ca` |
| `build-android.yml` | Push to `main` | Debug APK artifact (`fast-read-debug-apk`) |
| `build-android.yml` | Push tag `v*` | Signed release AAB (requires 4 repo secrets) |
| `build-ios.yml` | Push to `main` | iOS build on macOS runner |

Android release secrets: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.

---

## Environment Variables

Copy `.env.example` → `.env` and fill in:

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public API key |

Both are optional. Without them the app runs fully offline without auth/sync.

---

## Deployment

- **Web**: GitHub Pages at `readswift.techscript.ca` (CNAME in `public/CNAME`).
- **Android**: Google Play Store, bundle ID `ca.techscript.readswift`.
- **iOS**: Apple App Store, bundle ID `ca.techscript.readswift`.
- **PWA**: Installable from any browser via "Add to Home Screen".

---

## Coding Conventions

- **TypeScript strict mode** — all new code must be fully typed.
- **CSS Modules** — component styles in `ComponentName.module.css`; global structural styles in `src/styles/app.css`.
- **React functional components only** — no class components.
- **Hooks** for shared logic (`useRSVPEngine`, `useChunkEngine`, `useAdaptiveSpeed`).
- **Context + hooks** for state — no external state library.
- **Async generators** for streaming parsers (PDF, EPUB).
- **`React.memo`** for expensive render-heavy components.
- **No analytics, no tracking, no ads** — privacy-first by design.
- **All file parsing runs in-browser** — files are never uploaded.

---

## Package IDs & Branding

| Field | Value |
|-------|-------|
| App name | ReadSwift |
| Bundle ID | `ca.techscript.readswift` |
| Author | TechScript Limited |
| Website | https://techscript.ca |
| Live app | https://readswift.techscript.ca |

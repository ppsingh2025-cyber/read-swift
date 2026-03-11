# AGENT_PACEREAD.md — Architecture Brain

> **Purpose:** Authoritative reference for AI coding agents working in this repository. Read this before writing any code. Cross-reference `/READING_ENGINE.md` for engine details and `/DESIGN_SYSTEM.md` for UI rules.
> **Current version:** v1.3.0

---

## Project Identity

| Field | Value |
|-------|-------|
| App name | **PaceRead** |
| Bundle ID | `ca.techscript.paceread` |
| Author | TechScript Limited |
| Live URL | https://paceread.techscript.ca |
| Description | Browser-only RSVP speed-reader — PDF, EPUB, DOCX, TXT, MD, HTML, RTF, SRT |

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + TypeScript (strict) |
| Build | Vite 7 |
| PDF | pdfjs-dist (async generator, streamed) |
| EPUB | epubjs (async generator, chapter-by-chapter) |
| Styling | CSS Modules + global CSS custom properties |
| State | React Context API (`ReaderContext`) |
| PWA | vite-plugin-pwa (Workbox, auto-update) |
| Mobile | Capacitor 8 (Android + iOS) |
| Auth/Sync | Supabase + Google OAuth (optional) |
| Toasts | react-hot-toast |

> **No Redux, no Zustand, no MobX.** A single coherent `ReaderContext` is the entire state layer.

---

## Repository Layout

```
.
├── index.html                   # PWA shell; meta tags for Capacitor
├── vite.config.ts               # Vite + PWA manifest + localforage alias
├── capacitor.config.ts          # Mobile bundle ID, webDir, server settings
├── .env.example                 # VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
├── public/
│   ├── CNAME                    # paceread.techscript.ca (GitHub Pages)
│   └── icons/                   # icon-day.svg, icon-night.svg, icon-192.png, icon-512.png
├── docs/
│   ├── AUTH_ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── GOOGLE_OAUTH_SETUP.md
│   ├── MIGRATION_GUIDE.md
│   └── SUPABASE_SETUP.md
├── supabase/
│   └── migrations/              # SQL schemas for reading_sessions, user_preferences
├── .github/
│   ├── copilot-instructions.md  # GitHub Copilot custom instructions (auto-injected)
│   └── workflows/
│       ├── deploy-web.yml       # Push to main → GitHub Pages
│       ├── build-android.yml    # Push to main → debug APK; push v* tag → signed AAB
│       └── build-ios.yml        # Push to main → iOS build (macOS runner)
└── src/
    ├── App.tsx                  # Root — 4-layer layout + keyboard shortcuts
    ├── main.tsx                 # React entry point (ReaderProvider wraps App)
    ├── version.ts               # APP_VERSION constant
    ├── index.css                # CSS reset only
    ├── auth/                    # Supabase auth context + Google OAuth
    ├── components/              # All UI components (see Component Map below)
    ├── config/                  # profiles.ts, supabase.ts
    ├── context/                 # ReaderContext, readerContextDef, useReaderContext
    ├── hooks/                   # useRSVPEngine, useChunkEngine, useAdaptiveSpeed
    ├── parsers/                 # pdfParser, epubParser, textParser, urlParser
    ├── styles/                  # app.css (global), *.module.css (per-component)
    ├── sync/                    # SyncService, IndexedDBService, MetadataManager, …
    ├── types/                   # Shared TypeScript interfaces (metadata.ts)
    ├── utils/                   # textUtils, recordsUtils, contentNormalizer, structureUtils
    └── workers/                 # Web Workers (heavy off-main-thread work)
```

---

## Application Layout (4 Layers)

`App.tsx` renders a vertical flex column in this fixed order:

| Layer | Element | Visibility |
|-------|---------|-----------|
| **1 — Top bar** | `<header class="topBar">` — BurgerMenu · "PaceRead" brand · SyncStatus · UserAvatar · Help `?` · ThemeToggle | Always |
| **2 — Reading main** | `<main class="readingMain">` — `ReaderViewport` | Always |
| **Paste area** | `<div class="pasteArea">` — `InputPanel` | Toggled by 📋 button; hidden in focus mode |
| **4 — Controls bar** | `<div class="controlsBar">` — `Controls` | Always |
| **5 — Context strip** | `<div class="contextStrip">` — `ContextPreview` | Hidden in focus mode |
| **6 — Footer (sticky)** | `<AppFooter>` | `position:sticky; bottom:0` — hidden in focus mode |

**Focus mode** (`isFocused` state): sets `appShellFocused` on the shell → `position:fixed; inset:0`. Reading viewport fills all available height. Toggled by the ⊞/⊡ button on the viewport, or the **F** key. On entry, `showFocusHint` state shows an "Esc or F to exit" pill that fades after 3s.

**Landscape mobile** (≤480 px height, landscape): CSS Grid kicks in — viewport 75% left, Controls sidebar 25% right. Nav/paste/footer hidden.

---

## Component Map

| Component | File | Purpose |
|-----------|------|---------|
| `ReaderViewport` | `components/ReaderViewport.tsx` | Word display with ORP split, peripheral fade, focus mode. `React.memo` wrapped. |
| `Controls` | `components/Controls.tsx` | Progress bar, playback buttons, logarithmic WPM slider. |
| `BurgerMenu` | `components/BurgerMenu.tsx` | Slide-in settings drawer: Reading Mode (presets + fine-tune), Display (theme only), Session Analytics, Reset. Layout/font size/key letter color moved to Fine-tune in ReadingModes. |
| `Settings` | `components/Settings.tsx` | Legacy collapsible settings (used inside BurgerMenu). |
| `PageNavigator` | `components/PageNavigator.tsx` | Page/chapter jump (prev/next/direct input). |
| `WordNavigator` | `components/WordNavigator.tsx` | Word-level step controls + jump to specific word. |
| `ContextPreview` | `components/ContextPreview.tsx` | Page Preview panel below controls. Uses fixed `PAGE_SIZE=80` word chunks (not `pageBreaks`). Header has compact `‹ N/total ›` cluster + chevron collapse toggle. When detached, shows `↩ current` button. Threshold-based instant scroll (no smooth). |
| `InputPanel` | `components/InputPanel.tsx` | Paste-text textarea + URL fetch (via `parseUrl`). Async loading state when URL detected. Optional session title auto-populates from first sentence. |
| `ReadingHistory` | `components/ReadingHistory.tsx` | Per-file history list with progress %; deletes individual records. |
| `SessionStats` | `components/SessionStats.tsx` | Words read, active time, effective WPM for current session. |
| `HelpModal` | `components/HelpModal.tsx` | Keyboard shortcuts + usage guide modal. |
| `OnboardingOverlay` | `components/OnboardingOverlay.tsx` | First-run walkthrough (gated by `fastread_onboarding_complete` in localStorage). |
| `ContinueReadingPrompt` | `components/ContinueReadingPrompt.tsx` | Prompt to resume last document. |
| `ThemeToggle` | `components/ThemeToggle.tsx` | Day/Night toggle button (sets `data-theme` on `<html>`). |
| `SyncStatusIndicator` | `components/SyncStatusIndicator.tsx` | Cloud sync icon that reflects `SyncService` status. |
| `UserAvatar` | `components/UserAvatar.tsx` | Shows signed-in user avatar; sign-out on click. |
| `AccountSection` | `components/AccountSection.tsx` | Account management block inside BurgerMenu. |
| `DonateButton` | `components/DonateButton.tsx` | "Buy me a coffee" external link. |
| `FeedbackButton` | `components/FeedbackButton.tsx` | Google Form feedback link. |
| `AppFooter` | `components/AppFooter.tsx` | Version + copyright line. |

---

## ContextPreview ("Page Preview")

- Located in `contextStrip`, **below the controls bar**
- Uses 80-word chunking (`PAGE_SIZE = 80`) — independent of real PDF page breaks
- Real PDF/EPUB page breaks live in `pageBreaks[]` state, used by PageNavigator separately

**Header row** (left to right):
```
[Page Preview label] [↩ current button — only when detached] [‹ N/total ›] [▼ chevron]
```
- When the user navigates away from the current reading page (`isDetached = true`), a
  `↩ current` button appears. Clicking it calls `snapToCurrent`: sets `viewPage = readingPage`
  and clears `isDetached`. The button is `className={styles.returnBtn}` — filled accent background (`var(--color-accent)`), white text, with a mount appear animation (scale + fade in 0.25s).
- `‹` / `›` buttons inside the page cluster call `e.stopPropagation()` — they do NOT
  collapse the panel
- The `▼` chevron is the **only** collapse/expand toggle
- **No bottom navigation bar**

**Scroll behaviour (jitter-free):**
- A `contentRef` (type `useRef<HTMLDivElement>`) is attached to the scrollable content div
- On every `currentWordIndex` change, a `useEffect` checks the active word's position
  relative to the container:
  - If the active word is **past 75% of container height** → instantly snap scroll so
    word sits at 15% from top (word walks down, then snaps back up)
  - If the active word is **above the visible area** → snap to 15% from top
  - If the active word is in the **comfortable middle zone** → do nothing
- **No `scrollIntoView` or `behavior: 'smooth'`** — instant scroll only, no competing
  animations at reading speed

**Why no font-weight change:**
Both `.word` and `.activeWord` use `font-weight: 600`. Active word is differentiated
by `color: var(--color-accent)` and a faint accent background only. Changing font-weight
between states causes text reflow (words shift their rendered width), which was the root
cause of the jitter visible at reading speeds.

---

## State Architecture — `ReaderContext`

**Files:** `src/context/readerContextDef.ts` (types + `createContext`) · `src/context/ReaderContext.tsx` (`ReaderProvider`) · `src/context/useReaderContext.ts` (hook, throws if outside provider)

### State Shape

```typescript
// Reading content
words: string[]                  // Tokenised word array for loaded document
currentWordIndex: number         // Center (highlight) word — 0-based
pageBreaks: number[]             // Word indices where pages/chapters start
currentPage: number              // 1-indexed, derived via binary search
totalPages: number               // equals pageBreaks.length
structureMap: Map<number, StructuralMarker>  // word index → header/para/etc.

// Playback
isPlaying: boolean
wpm: number                      // 60–1500; logarithmic slider

// File
fileMetadata: FileMetadata | null  // { name, size, type }
fileId: string | null              // stable filename for record lookup
isLoading: boolean
loadingProgress: number           // 0–100

// Display settings (all persisted to localStorage)
windowSize: 1 | 2 | 3
highlightColor: string            // CSS color, default '#ff0000'
orientation: 'horizontal' | 'vertical'
theme: 'day' | 'night'
orpEnabled: boolean
punctuationPause: boolean         // default true
peripheralFade: boolean           // default true
longWordCompensation: boolean     // default true
mainWordFontSize: number          // 60–200 (%), default 100
chunkMode: 'fixed' | 'intelligent'

// History & analytics
records: ReadingRecord[]          // up to 20, from localStorage
sessionStats: SessionStats        // { wordsRead, startTime, activeTimeMs, effectiveWpm }
```

### localStorage Keys

| Key | Default |
|-----|---------|
| `fastread_word_index` | `0` |
| `fastread_wpm` | `250` |
| `fastread_window_size` | `3` |
| `fastread_highlight_color` | `#ff0000` |
| `fastread_orientation` | derived from `window.innerWidth < 640` (vertical on mobile) |
| `fastread_theme` | `night` |
| `fastread_orp` | `false` |
| `fastread_punct_pause` | `true` |
| `fastread_peripheral_fade` | `true` |
| `fastread_long_word_comp` | `true` |
| `fastread_main_font_size` | `100` |
| `fastread_chunk_mode` | `fixed` |
| `fastread_session_stats` | JSON of empty `SessionStats` |
| `fastread_session_history` | JSON array of up to 20 `StoredSession[]` — persisted by `saveCurrentSession` |
| `fastread_records` | JSON array of `ReadingRecord[]` |
| `fastread_adaptive_wpm` | set by `useAdaptiveSpeed` |
| `fastread_reading_profile` | `balanced` |
| `fastread_onboarding_complete` | set on onboarding finish |
| `fastread_focus_marker` | `true` |
| `fastread_focal_line` | `false` |

---

## Reading Records

**Managed by** `src/utils/recordsUtils.ts`.

```typescript
interface ReadingRecord {
  name: string;           // filename (used as primary key)
  wordCount: number;
  lastWordIndex: number;
  lastReadAt: string;     // ISO 8601
  wpm: number;
}
```

- Stored in `localStorage` key `fastread_records` as a JSON array.
- **Max 20 records** — oldest dropped when limit is reached.
- Saved on file load (creates/updates), on pause (updates `lastWordIndex`).
- When the same filename is re-uploaded, `lastWordIndex` is auto-restored.

---

## File Ingestion Pipeline

**Managed by** `src/App.tsx` (`handleFileSelect`).

```
File → ext check → parser → normalizePages → tokenize → finaliseWords → ReaderContext
```

| Stage | What happens |
|-------|-------------|
| **Validate** | Size ≤ 100 MB; extension must be in `STREAMING_EXTS` or `TEXT_EXTS` |
| **Stream (PDF/EPUB)** | Async generator yields one page/chapter at a time; `setLoadingProgress(p * 0.8)` |
| **Normalize (PDF/EPUB)** | `normalizePages()` strips headers/footers/page-numbers; progress 80→90% |
| **Tokenize** | `tokenize(normalizeText(pageText))` → `words[]`; `breaks[]` tracks page starts |
| **Text formats** | `parseFile(file)` handles TXT/MD/HTML/RTF/SRT/DOCX synchronously; progress 50→100% |
| **Finalize** | `buildStructureMap(rawLines, words)` (or `buildStructureMapFromWords` fallback) → `setWords`, `setPageBreaks`, `setStructureMap`, save record, restore `lastWordIndex` |

### Parser Files

| Parser | File | Format | Yields |
|--------|------|--------|--------|
| `parsePDF` | `parsers/pdfParser.ts` | PDF | page text (pdfjs-dist, `hasEOL` for line breaks); spatial diagram detection via `isDiagramSymbol()` — see constants `X_SPREAD_MIN=75`, `ZONE_MERGE_GAP=20`, `ZONE_EXPAND_GAP=40`; known benign false positive: TOC pages with garbled `¢` characters (stripped by `contentNormalizer.ts`) |
| `parseEPUB` | `parsers/epubParser.ts` | EPUB | chapter text (epubjs) |
| `parseFile` | `parsers/textParser.ts` | TXT MD HTML RTF SRT DOCX | `{ words, rawLines? }` |
| `fetchUrl` | `parsers/urlParser.ts` | URL | article text |

---

## Hooks

### `useRSVPEngine` (`hooks/useRSVPEngine.ts`)
Core playback driver. See `/READING_ENGINE.md` for full details.

**Returns:** `{ currentWord, wordWindow, play, pause, reset, faster, slower, prevWord, nextWord }`

### `useChunkEngine` (`hooks/useChunkEngine.ts`)
Phrase-based word grouping layer. Sits on top of `useRSVPEngine`.

**Returns:** `{ chunkWindow, chunkHighlightIndex }`

- In `'fixed'` mode: passthrough (returns `wordWindow` unchanged).
- In `'intelligent'` mode: groups words into natural phrases using conjunction/preposition boundaries. Chunk index rebuilt only when `words` or `windowSize` changes.

### `useAdaptiveSpeed` (`hooks/useAdaptiveSpeed.ts`)
Tracks rewinds + completion %; adjusts WPM baseline on session end.

**Returns:** `{ finalizeSession, getAdaptiveBaseline }`

- Called by `App.tsx` on `isPlaying → false`.
- If user manually changed WPM during the session, adaptive result is discarded.
- Stored in `fastread_adaptive_wpm`.

---

## Reading Profiles (`src/config/profiles.ts`)

| ID | Name | WPM | Window | Chunk | Notes |
|----|------|-----|--------|-------|-------|
| `max-speed` | Max Speed | 700 | 1 | fixed | No pauses |
| `sprint` | Sprint | 500 | 1 | fixed | No pauses |
| `balanced` | Balanced | 300 | 3 | fixed | Default; pauses on |
| `deep-focus` | Deep Focus | 180 | 3 | fixed | Strong fade |
| `zen` | Zen | 100 | 1 | intelligent | Meditative |

Profiles apply a full bundle of settings atomically. Users can still override individual settings after applying a profile.

---

## Authentication & Sync (Optional)

**Files:** `src/auth/`, `src/sync/`, `src/config/supabase.ts`

- Auth via **Supabase** + **Google OAuth**. Both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be set, otherwise `isSupabaseConfigured = false` and all auth/sync is a no-op.
- `AuthProvider` wraps the entire app. `useAuth()` exposes `{ user, session, isLoading, isAuthenticated, signInWithGoogle, signOut }`.
- `SyncService` syncs reading records to Supabase on pause/stop/close (debounced 2 s). Offline-first: unsynced changes queued in IndexedDB (`idb` library).
- `SyncStatusIndicator` shows real-time sync state.
- The app is **fully functional without auth**; sync is purely additive.

---

## CI / CD

| Workflow | Trigger | Output |
|----------|---------|--------|
| `deploy-web.yml` | Push → `main` | Build + deploy to GitHub Pages (`paceread.techscript.ca`) |
| `build-android.yml` | Push → `main` | Debug APK artifact `fast-read-debug-apk` |
| `build-android.yml` | Push tag `v*` | Signed release AAB (4 repo secrets required) |
| `build-ios.yml` | Push → `main` | iOS archive (macOS runner) |

Android release secrets: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.

---

## Development Commands

```bash
npm install          # install dependencies
npm run dev          # dev server at http://localhost:5173
npm run build        # tsc -b && vite build (production)
npm run preview      # serve production build locally
npm run lint         # ESLint (eslint-plugin-react-hooks, react-refresh)
npm run cap:sync     # npx cap sync (after web build)
npm run cap:android  # open Android Studio
npm run cap:ios      # open Xcode
```

---

## Coding Conventions

1. **TypeScript strict mode** — every new symbol must be fully typed.
2. **React functional components only** — never class components.
3. **CSS Modules** — component styles in `src/styles/ComponentName.module.css`; global layout in `src/styles/app.css`.
4. **Context + hooks** for state — never introduce an external state library.
5. **Async generators** for streaming parsers (PDF, EPUB).
6. **`React.memo`** for components where re-renders are expensive (`ReaderViewport`).
7. **Refs for engine values** — values read inside `requestAnimationFrame` callbacks must live in refs to avoid stale closures.
8. **No analytics, no tracking, no ads** — privacy-first by design.
9. **All parsing runs in-browser** — files are never uploaded to any server.

---

## Feature Addition Checklist

Before adding any feature, confirm:

- [ ] Does it improve the reading experience?
- [ ] Does it reduce (not increase) cognitive load?
- [ ] Does it preserve ORP stability and the focal fixation point?
- [ ] Does it maintain the minimal-UI philosophy?
- [ ] Does it work correctly on mobile (touch targets ≥ 44 px)?
- [ ] Does it handle the case where no file is loaded (`words.length === 0`)?
- [ ] Are new settings persisted to localStorage and hydrated on startup?
- [ ] Are new localStorage keys documented in the State Architecture section above?
- [ ] If adding animated/transitioning elements near the reading flow, have you verified there is no layout reflow at 250+ WPM?

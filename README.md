# ⚡ Fast Read — RSVP Reader

**by [TechScript Limited](https://techscript.ca)**

A production-quality React web application that implements **Rapid Serial Visual Presentation (RSVP)** reading for PDF, EPUB, DOCX, TXT, Markdown, HTML, RTF, and SRT files. All processing runs entirely in the browser — no backend required.

---

## Authentication & Sync (Optional)

PaceRead works fully offline without any account. If you want **cross-device reading progress sync**, enable the optional Supabase integration. You'll need two free accounts:

| Account | What it does | Sign up |
|---------|-------------|---------|
| **Supabase** | Stores your reading progress in a managed PostgreSQL database | [supabase.com](https://supabase.com) — free tier |
| **Google Cloud** | Provides the "Sign in with Google" OAuth button | [console.cloud.google.com](https://console.cloud.google.com) — free |

**Setup guides (in order):**
1. [Supabase project + database setup](docs/SUPABASE_SETUP.md)
2. [Google OAuth credentials](docs/GOOGLE_OAUTH_SETUP.md)
3. Copy `.env.example` → `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

Once configured, a **Sign In with Google** button appears in the burger menu. Without configuration, the app behaves exactly as before.

---

## Features

### File Format Support (8 formats)
- **PDF** (.pdf) — Full text extraction via PDF.js
- **EPUB** (.epub) — Chapter-by-chapter parsing via epub.js
- **DOCX** (.docx) — Microsoft Word document support
- **TXT** (.txt) — Plain text files
- **Markdown** (.md) — GitHub-flavored markdown
- **HTML** (.html, .htm) — Web pages and articles
- **RTF** (.rtf) — Rich Text Format
- **SRT** (.srt) — Subtitle files

### Core RSVP Reading
- **Rapid Serial Visual Presentation:** One word at a time at fixed focal point
- **Variable Speed:** 60–1500 WPM with logarithmic slider
- **Multi-Word Window:** Display 1-5 words simultaneously
- **Dual Orientation:** Horizontal or vertical word layout
- **Intelligent Chunking:** Phrase-based grouping for better comprehension
- **ORP Highlighting:** Optimal Recognition Point for faster word recognition
- **Context Preview:** See surrounding paragraph while reading

### Advanced Reading Features
- **Punctuation Pause:** Extra delay after periods, commas
- **Long Word Compensation:** Extended display for words >8 characters
- **Peripheral Fade:** Dim side words for sharper focus
- **Customizable Font Size:** 80% – 180% scaling
- **10+ Highlight Colors:** Preset + custom color picker
- **Day/Night Themes:** Auto-switching dark mode

### Navigation & Progress
- **Page/Chapter Navigation:** Jump to any section instantly
- **Word-Level Controls:** Step forward/backward, jump to specific word
- **Clickable Progress Bar:** Jump to any position in document
- **Auto-Save Progress:** Resume exactly where you left off
- **Reading History:** Track up to 20 documents with progress percentages
- **Session Analytics:** Words read, active time, effective WPM
- **Page Preview:** Jitter-free, threshold-based scroll. Active word walks down, snaps back up. Tap ↩ to return to reading position after browsing.

### Reading Profiles (Quick Presets)
- **Max Speed:** 700 WPM, single word, no pauses — document triage
- **Sprint:** 500 WPM, single word, no pauses — speed training
- **Balanced:** 300 WPM, 3-word window, normal pauses (default)
- **Deep Focus:** 180 WPM, 3-word window, strong peripheral fade
- **Zen:** 100 WPM, single word, intelligent chunking — meditative reading

### Input Methods
- **File Upload:** Drag & drop or click to select (up to 100 MB)
- **Paste Text:** Direct text input via paste panel
- **URL Fetch:** Extract readable content from web articles

### Platform & Deployment
- **Progressive Web App:** Installable on any device
- **Android App:** Available via Google Play (Capacitor)
- **iOS App:** Available via App Store (Capacitor)
- **Fully Offline:** No internet required after installation
- **Local Processing:** All parsing runs in-browser
- **Keyboard shortcuts:** `Space` = Play/Pause, `←/→` = Prev/Next word, `↑/↓` = Faster/Slower

### Authentication & Sync (Optional)
- **Google OAuth:** Sign in with Google
- **Cross-Device Sync:** Resume reading on any device
- **Cloud Backup:** Reading history & preferences backed up to Supabase
- **Offline-First:** Works fully without account
- **Privacy-Respecting:** Data synced only when authenticated

### Privacy & Security
- **No Data Collection:** Zero analytics, no tracking
- **Local Processing:** Files never uploaded to server
- **No Ads:** Completely ad-free
- **No Account Required:** Use immediately without registration (auth optional)
- **Open Source:** Full transparency

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

---

## Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Deployment

### Web — GitHub Pages + Subdomain (`paceread.techscript.ca`)

PaceRead deploys automatically to **`https://paceread.techscript.ca`** on every push to `main`. Your main `techscript.ca` domain is completely untouched.

---

#### ⚠️ One-time setup — do these three things in order

##### 1 · Add one DNS record in GoDaddy

Log in to [GoDaddy DNS Manager](https://dcc.godaddy.com) for `techscript.ca` and add:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| `CNAME` | `paceread` | `ppsk2011.github.io` | 1 Hour |

This is the only record you need. Everything else in your `techscript.ca` DNS is untouched.

##### 2 · Enable GitHub Pages (Source = GitHub Actions)

In this repository:

1. Go to **Settings → Pages**
2. Under **Build and deployment → Source**, select **"GitHub Actions"**
3. Leave the **Custom domain** field blank — the `public/CNAME` file in the repo handles it

Click **Save**.

##### 3 · Trigger a deploy and enable HTTPS

Option A — push any commit to `main` (the workflow runs automatically).  
Option B — go to **Actions → Deploy to GitHub Pages → Run workflow → Run workflow**.

After the workflow finishes (~2 minutes):
1. Go back to **Settings → Pages**
2. You should see **"Your site is published at https://paceread.techscript.ca"**
3. Tick **"Enforce HTTPS"** and click **Save**

> If the "Enforce HTTPS" checkbox is greyed out, wait 10–15 minutes for the Let's Encrypt certificate to be issued, then refresh the page.

---

#### Why the site was returning 404 (and how it's now fixed)

Two things were wrong:

| Problem | Fix applied in this repo |
|---------|--------------------------|
| A `jekyll-gh-pages.yml` workflow was also deploying to GitHub Pages on every `main` push, using the same concurrency group. It raced against the Vite build and sometimes won — deploying raw repo files (no CNAME, no built app). | Deleted `jekyll-gh-pages.yml`. Only `deploy-web.yml` runs now. |
| The PR with the `paceread.techscript.ca` CNAME hadn't been merged to `main` yet, so the deployed site still had the old domain. | Merge this PR → a new deploy runs → `dist/CNAME` becomes `paceread.techscript.ca`. |

---

#### Why a subdomain (not a sub-folder)?

| Approach | Notes |
|----------|-------|
| **Subdomain** `paceread.techscript.ca` ✅ | Each site is a separate repo. One DNS record. PWA installs correctly. `techscript.ca` is free for your company website. |
| Sub-folder `techscript.ca/paceread` | Both sites must be in the same repo (or you need a reverse proxy). PWA `scope`/offline breaks in sub-paths. Not recommended with GitHub Pages. |

---

### PWA — Install on any device

The production build is a fully installable Progressive Web App:
- **Desktop (Chrome/Edge):** click the install icon in the address bar
- **Android (Chrome):** tap the "Add to Home Screen" prompt
- **iOS (Safari):** tap the Share button → "Add to Home Screen"

The service worker caches the app shell for offline use.

---

### Android — Native APK via Capacitor

**Prerequisites:** Android Studio, JDK 17+

```bash
# 1. Build the web app
npm run build

# 2. Add & sync the Android project (first time)
npx cap add android
npx cap sync android

# 3. Open in Android Studio
npm run cap:android
```

Inside Android Studio, run on a device/emulator or use
**Build → Generate Signed Bundle / APK** to produce a release APK for the Play Store.

**Automated CI builds** are produced by `.github/workflows/build-android.yml`:
- Every push to `main` produces a **debug APK** (upload artifact `fast-read-debug-apk`)
- Every tag matching `v*` produces a **release APK** (requires repository secrets below)

Required secrets for signed release builds:

| Secret | Description |
|--------|-------------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded `.jks` keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias inside the keystore |
| `ANDROID_KEY_PASSWORD` | Key password |

---

### iOS — Native App via Capacitor

**Prerequisites:** macOS, Xcode 15+, CocoaPods

```bash
# 1. Build the web app
npm run build

# 2. Add & sync the iOS project (first time)
npx cap add ios
npx cap sync ios

# 3. Open in Xcode
npm run cap:ios
```

Inside Xcode, configure your Team & Bundle ID, then run on a simulator / device or archive for App Store submission.

**Automated CI builds** are produced by `.github/workflows/build-ios.yml` on macOS runners. For signed App Store builds, configure signing certificates as GitHub Actions secrets following the [Xcode deployment guide](https://docs.github.com/en/actions/deployment/deploying-xcode-applications).

---

### After updating the web source

Whenever you change the app, sync the native projects:

```bash
npm run build
npm run cap:sync   # equivalent to: npx cap sync
```

---

## Project Structure

```
.
├── capacitor.config.ts     # Capacitor (mobile) configuration
├── vite.config.ts          # Vite + PWA plugin configuration
├── index.html              # HTML shell with PWA + mobile meta tags
├── public/
│   ├── icons/              # App icons (SVG + 192/512 PNG)
│   └── apple-touch-icon.png
├── .github/workflows/
│   ├── deploy-web.yml      # GitHub Pages deployment
│   ├── build-android.yml   # Android APK build
│   └── build-ios.yml       # iOS build
└── src/
    ├── components/
    │   ├── Controls.tsx         # Playback controls, speed slider, file upload
    │   ├── PageNavigator.tsx    # Page / chapter jump navigation
    │   ├── ReadingHistory.tsx   # Reading history panel with per-file progress
    │   ├── WordNavigator.tsx    # Word-level step + jump navigation
    │   ├── ContextPreview.tsx   # Side-by-side page text preview
    │   └── ReaderViewport.tsx   # Fixed-position word display
    ├── context/
    │   ├── ReaderContext.tsx    # ReaderProvider component (state)
    │   ├── readerContextDef.ts  # Context object + TypeScript types
    │   └── useReaderContext.ts  # useReaderContext hook
    ├── hooks/
    │   └── useRSVPEngine.ts     # RSVP engine with drift-corrected timing
    ├── parsers/
    │   ├── pdfParser.ts         # pdfjs-dist page-by-page async generator
    │   └── epubParser.ts        # epubjs chapter-by-chapter async generator
    ├── utils/
    │   ├── recordsUtils.ts      # load / save / delete reading records in localStorage
    │   └── textUtils.ts         # normalizeText / tokenize helpers
    └── styles/
        ├── app.css              # Global layout styles
        └── *.module.css         # Component-scoped styles
```

---

## Architecture Decisions

### Async generators for parsing
Both `parsePDF` and `parseEPUB` are **async generators** that yield text one page/chapter at a time. This means:
- The UI shows loading progress after each page/chapter
- The main thread is never blocked for more than one page at a time
- Memory usage stays low even for large files (words are small strings)

### Drift-corrected timing
`useRSVPEngine` uses `setInterval` with drift correction. After each tick it calculates the difference between the expected and actual fire time and adjusts the next interval accordingly. This prevents timing drift at high WPM rates.

### React Context for state
All reader state lives in `ReaderContext`. The hook `useRSVPEngine` reads from and writes to the context. Components only re-render when the specific slice of state they consume changes.

### CSS Modules for scoped styles
Each component has its own `.module.css` file preventing style leakage. Global structural styles live in `src/styles/app.css`.

### localStorage persistence
`currentWordIndex` and `wpm` are synced to `localStorage` via `useEffect`, letting users resume reading after a page refresh.

### Reading records
Every time a file is successfully parsed, a `ReadingRecord` is saved to `localStorage` under the key `fastread_records`. Each record stores the file name, total word count, last word index, last read date, and WPM. When the same file is uploaded again, its saved `lastWordIndex` is automatically restored. Progress is also updated whenever reading is paused. Up to 20 records are kept (oldest are dropped). Records are displayed in a **Reading History** panel and can be individually deleted.

---

## Performance Considerations

- **No full-document preload:** PDFs are processed page-by-page using pdfjs-dist streaming API; EPUB chapters are loaded one at a time.
- **`React.memo` on ReaderViewport:** The word display only re-renders when the word changes, not on any other state update.
- **Refs in engine:** The RSVP engine interval callback reads the current word index via a ref (not closure) to avoid stale values without triggering re-renders.
- **`will-change: transform`** on the word element enables GPU compositing for the word-appear animation.

---

## Publishing to the App Stores

For a complete step-by-step guide to publishing PaceRead on **Google Play** and the **Apple App Store** — including keystore creation, signing configuration, GitHub secrets, store listings, and review submission — see **[PUBLISHING.md](./PUBLISHING.md)**.

---

© 2025 TechScript Limited


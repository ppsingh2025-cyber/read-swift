# PaceRead — Android Play Store Deployment Runbook

**Client:** Techscript Limited  
**Product:** PaceRead — RSVP Speed Reader (`ca.techscript.paceread`)  
**Document version:** 1.0  
**Execution model:** Single developer  
**Deployment method:** Trusted Web Activity (TWA) via Capacitor  
**Status:** Production

---

## Overview

PaceRead is a React Progressive Web App wrapped in a native Android shell using [Capacitor](https://capacitorjs.com/). On Android, it runs as a **Trusted Web Activity (TWA)**, which loads the PWA in a full-screen Chrome Custom Tab with no browser chrome. The result is a native-feeling app backed entirely by the web build.

---

## Part 1 — Pre-Requisites

### 1.1 Developer environment

| Tool | Minimum version | Install |
|---|---|---|
| Node.js | 22 LTS | https://nodejs.org |
| npm | 10+ | Bundled with Node |
| JDK | 17 (Temurin recommended) | https://adoptium.net |
| Android Studio | Hedgehog (2023.1.1)+ | https://developer.android.com/studio |
| Android SDK | API 35 | Android Studio SDK Manager |
| Android SDK Build Tools | 35.0.0 | Android Studio SDK Manager |
| `sdkmanager` | Bundled with Android Studio | — |

### 1.2 Required accounts

| Service | URL | Purpose |
|---|---|---|
| Google Play Console | https://play.google.com/console | Android app publishing |
| Techscript Limited Google account | — | Play Console owner |

**Google Play Developer registration fee:** USD $25 (one-time, per Google account).

### 1.3 Repository secrets (for CI signed builds)

Set these in GitHub → Settings → Secrets and variables → Actions:

| Secret name | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded `.jks` keystore file (`base64 -w0 release.jks`) |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias (e.g., `fast-read`) |
| `ANDROID_KEY_PASSWORD` | Key password |

---

## Part 2 — Asset Verification Checklist

Complete this checklist before beginning the submission workflow.

### 2.1 Icon assets

- [ ] `public/icons/icon.svg` — master SVG exists and is square
- [ ] `public/icons/icon-192.png` — 192×192 px, PNG
- [ ] `public/icons/icon-512.png` — 512×512 px, PNG, < 1 MB
- [ ] `public/icons/icon-512-maskable.png` — 512×512 px, solid `#060606` bg, content in central 80%
- [ ] `public/apple-touch-icon.png` — 180×180 px, PNG, solid background
- [ ] `release-package/icons/ic_launcher_foreground.*.png` — all 5 density variants
- [ ] `release-package/icons/ic_launcher_background.*.png` — all 5 density variants

### 2.2 Store assets

- [ ] `release-package/feature-graphic/feature-graphic.png` — 1024×500 px, < 1 MB
- [ ] `release-package/screenshots/phone-01-reader.jpg` — 1080×1920 px, < 8 MB
- [ ] `release-package/screenshots/phone-02-controls.jpg` — 1080×1920 px, < 8 MB
- [ ] `release-package/screenshots/phone-03-history.jpg` — 1080×1920 px, < 8 MB
- [ ] `release-package/screenshots/phone-04-context.jpg` — 1080×1920 px, < 8 MB

### 2.3 Legal

- [ ] Privacy policy published at `https://techscript.ca/privacy`
- [ ] Privacy policy matches the version in `release-package/legal/privacy-policy.html`

### 2.4 Build

- [ ] `npm run build` passes without errors
- [ ] `npm run lint` passes without errors
- [ ] `public/icons/icon.svg` referenced correctly in `index.html`

---

## Part 3 — Generating the Signed Release APK

### Step 1 — Create a signing keystore (first time only)

```bash
keytool -genkeypair \
  -v \
  -keystore release.jks \
  -alias fast-read \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=Techscript Limited, OU=Mobile, O=Techscript Limited, L=Canada, C=CA"
```

> **Critical:** Store `release.jks` securely. Losing it makes it impossible to publish updates to the same Play Store listing. Back it up in a secure location outside the repository.

Encode for CI:
```bash
base64 -w0 release.jks > release.jks.b64
# Copy the contents of release.jks.b64 into the ANDROID_KEYSTORE_BASE64 secret
```

### Step 2 — Build the web app

```bash
npm run build
```

Verify `dist/` contains:
- `index.html`
- `assets/index-*.js`
- `assets/pdf.worker-*.mjs`
- `sw.js` (service worker)
- `manifest.webmanifest`

### Step 3 — Sync Capacitor Android project

```bash
npx cap add android    # first time only
npx cap sync android
```

This copies `dist/` into `android/app/src/main/assets/public/`.

### Step 4 — Deploy adaptive icons to Android project

Copy the density-variant icon files to the correct Android resource directories:

```bash
# Foreground (transparent background)
cp release-package/icons/ic_launcher_foreground.mdpi.png    android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png
cp release-package/icons/ic_launcher_foreground.hdpi.png    android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png
cp release-package/icons/ic_launcher_foreground.xhdpi.png   android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png
cp release-package/icons/ic_launcher_foreground.xxhdpi.png  android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png
cp release-package/icons/ic_launcher_foreground.xxxhdpi.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png

# Background (solid #060606)
cp release-package/icons/ic_launcher_background.mdpi.png    android/app/src/main/res/mipmap-mdpi/ic_launcher_background.png
cp release-package/icons/ic_launcher_background.hdpi.png    android/app/src/main/res/mipmap-hdpi/ic_launcher_background.png
cp release-package/icons/ic_launcher_background.xhdpi.png   android/app/src/main/res/mipmap-xhdpi/ic_launcher_background.png
cp release-package/icons/ic_launcher_background.xxhdpi.png  android/app/src/main/res/mipmap-xxhdpi/ic_launcher_background.png
cp release-package/icons/ic_launcher_background.xxxhdpi.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_background.png
```

Create the adaptive icon XML (see `release-package/icons/README.md` for the XML content):

```bash
mkdir -p android/app/src/main/res/mipmap-anydpi-v26
# Write ic_launcher.xml and ic_launcher_round.xml as specified in icons/README.md
```

### Step 5 — Build signed release APK (local)

```bash
cd android
./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file=../release.jks \
  -Pandroid.injected.signing.store.password=YOUR_STORE_PASSWORD \
  -Pandroid.injected.signing.key.alias=fast-read \
  -Pandroid.injected.signing.key.password=YOUR_KEY_PASSWORD
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

### Step 6 — Build signed release APK (CI/CD)

Push a version tag to trigger the CI workflow:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The `build-android.yml` workflow will:
1. Build the web app
2. Sync Capacitor
3. Decode the keystore from the `ANDROID_KEYSTORE_BASE64` secret
4. Build and sign the release APK
5. Upload it as the `paceread-release-apk` artifact (retained 90 days)

Download the APK from GitHub Actions → Artifacts.

---

## Part 4 — Play Store Submission

### Step 1 — Create the Play Console listing

1. Log in to [Google Play Console](https://play.google.com/console)
2. Click **Create app**
3. Fill in:
   - App name: `PaceRead: RSVP Speed Reader`
   - Default language: `English (United States)`
   - App or game: `App`
   - Free or paid: `Free`
4. Confirm the developer program policies and export laws

### Step 2 — Complete App Content

Navigate to **Policy → App content** and complete:

| Section | Value |
|---|---|
| Privacy policy | `https://techscript.ca/privacy` |
| Ads | Does not contain ads |
| App access | All functionality accessible — no login required |
| Content rating | Complete the questionnaire → select Education/Productivity → answer No to all sensitive content questions → expected result: **Everyone** |
| Target audience | 13 and over |
| Data safety | No data collected, no data shared (complete the form accordingly) |

### Step 3 — Store Listing Content

Navigate to **Grow → Store presence → Main store listing**.

Fill in using content from `release-package/play-store-text/listing.md`:

| Field | Source |
|---|---|
| App name | Section 1 |
| Short description | Section 2 |
| Full description | Section 3 |
| App icon (512×512) | `release-package/icons/icon-512.png` (or from `public/icons/`) |
| Feature graphic | `release-package/feature-graphic/feature-graphic.png` |
| Phone screenshots (2–8) | `release-package/screenshots/phone-0*.jpg` |

### Step 4 — Upload the Release APK

1. Navigate to **Release → Production → Create new release**
2. Click **Upload** and select the signed `app-release.apk`
3. In **Release name**, enter `1.0.0`
4. In **Release notes**, enter the text from `release-package/play-store-text/listing.md` Section 9
5. Click **Save**

### Step 5 — Pre-launch report review

After uploading, Google runs automated pre-launch tests on Firebase Test Lab. Review results:
- Crashes: must be zero
- ANR (Application Not Responding): must be zero
- Accessibility issues: review and address any flagged items

### Step 6 — Submit for review

1. Review the release summary
2. Click **Send [n] countries / regions for review**
3. Initial review takes 1–3 business days for new accounts

---

## Part 5 — Common Rejection Causes & Mitigations

| Rejection reason | Mitigation |
|---|---|
| Icon does not meet Play Store requirements | Verify 512×512, no raster artefacts, content fills ~70% of canvas |
| Privacy policy URL returns 404 | Publish privacy policy before submitting. Test the URL from mobile. |
| Data safety form incomplete | Read policy carefully — even "no data collected" requires completing the form |
| App crashes on launch | Test on an emulator at minimum API 24 (Android 7.0) |
| Metadata does not match app functionality | Screenshots must show the actual app, not wireframes |
| App name contains "free" or competitor names | Remove any such terms from title and description |
| Short description exceeds 80 characters | Recount including punctuation and spaces |
| Feature graphic dimensions incorrect | Must be exactly 1024×500 px — no tolerance |
| Content rating not completed | Complete the questionnaire before submitting for review |
| App requests unnecessary permissions | Capacitor default manifest requests permissions not needed; audit `AndroidManifest.xml` |

### AndroidManifest.xml permission audit

After `npx cap sync android`, review `android/app/src/main/AndroidManifest.xml`. Remove any permission not required by the app. PaceRead requires:

```xml
<!-- Required for TWA/service worker -->
<uses-permission android:name="android.permission.INTERNET" />
```

No other permissions are required. Remove any additional permissions inserted by Capacitor plugins not in use.

---

## Part 6 — Update Strategy

### Minor updates (bug fixes, content)

1. Increment `version` in `package.json` (e.g., `1.0.1`)
2. Increment `versionCode` in `android/app/build.gradle` (integer, must always increase)
3. Run `npm run build && npx cap sync android`
4. Push a new version tag: `git tag v1.0.1 && git push origin v1.0.1`
5. CI builds the signed APK
6. Upload to Play Console → Production → Create new release
7. Update release notes with a summary of changes

### Version code convention

```
versionCode = major * 10000 + minor * 100 + patch
1.0.0 → 10000
1.0.1 → 10001
1.1.0 → 10100
2.0.0 → 20000
```

### Rollout strategy

For significant changes, use a **staged rollout**:
- 10% rollout → monitor crash rate for 48 hours → expand to 50% → expand to 100%
- Abort rollout if crash rate exceeds 1% of sessions

---

## Part 7 — Post-Submission Monitoring

After the app is live:

1. Monitor Play Console → Android Vitals for crash rate and ANR rate (target: < 1%)
2. Monitor Play Console → Ratings & Reviews weekly
3. Verify the privacy policy URL (`https://techscript.ca/privacy`) remains accessible
4. Run `npm audit` monthly and update vulnerable dependencies

---

## Appendix A — Release Package Directory

```
release-package/
├── README.md                           ← This file (deployment runbook)
├── branding/
│   ├── brand-identity-brief.md         ← Colour palette, typography, UI principles
│   └── asset-validation-report.md      ← Asset audit, missing asset specs
├── tokens/
│   └── design-tokens.json              ← MUI-compatible design tokens
├── play-store-text/
│   └── listing.md                      ← Title, descriptions, feature bullets
├── legal/
│   └── privacy-policy.html             ← Production privacy policy (publish to /privacy)
├── icons/
│   ├── README.md                       ← Icon naming, dimensions, safe zones, export commands
│   ├── ic_launcher_foreground.*.png    ← Adaptive icon foreground (all densities) — TO GENERATE
│   └── ic_launcher_background.*.png    ← Adaptive icon background (all densities) — TO GENERATE
├── screenshots/
│   ├── README.md                       ← Screenshot standards, naming, workflow
│   ├── phone-01-reader.jpg             ← TO GENERATE
│   ├── phone-02-controls.jpg           ← TO GENERATE
│   ├── phone-03-history.jpg            ← TO GENERATE
│   └── phone-04-context.jpg            ← TO GENERATE
└── feature-graphic/
    ├── README.md                       ← Feature graphic design spec
    └── feature-graphic.png             ← 1024×500 px — TO GENERATE
```

---

*© 2025 Techscript Limited. Internal use only.*

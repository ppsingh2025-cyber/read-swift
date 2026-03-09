# Publishing PaceRead to the App Stores

This guide walks through everything needed to publish **PaceRead** (`ca.techscript.paceread`) as a native app on **Google Play** and the **Apple App Store**.

---

## Table of Contents

1. [Google Play Store (Android)](#google-play-store-android)
   - [Prerequisites](#prerequisites)
   - [Step 1 — Create a Google Play Developer account](#step-1--create-a-google-play-developer-account)
   - [Step 2 — Create a signing keystore](#step-2--create-a-signing-keystore)
   - [Step 3 — Add secrets to GitHub](#step-3--add-secrets-to-github)
   - [Step 4 — Build a signed release AAB](#step-4--build-a-signed-release-aab)
   - [Step 5 — Create the Play Store listing](#step-5--create-the-play-store-listing)
   - [Step 6 — Upload and publish](#step-6--upload-and-publish)
2. [Apple App Store (iOS)](#apple-app-store-ios)
   - [Prerequisites](#prerequisites-1)
   - [Step 1 — Enrol in the Apple Developer Program](#step-1--enrol-in-the-apple-developer-program)
   - [Step 2 — Configure the Xcode project](#step-2--configure-the-xcode-project)
   - [Step 3 — Create an App Store Connect listing](#step-3--create-an-app-store-connect-listing)
   - [Step 4 — Archive and upload with Xcode](#step-4--archive-and-upload-with-xcode)
   - [Step 5 — Submit for review](#step-5--submit-for-review)
3. [After each update](#after-each-update)
4. [Common questions](#common-questions)

---

## Google Play Store (Android)

### Prerequisites

| Tool | Where to get it |
|------|----------------|
| Android Studio | https://developer.android.com/studio |
| JDK 21 | Bundled with Android Studio, or https://adoptium.net |
| `keytool` | Included with the JDK (`keytool` command in your terminal) |

---

### Step 1 — Create a Google Play Developer account

1. Go to <https://play.google.com/console> and sign in with a Google account.
2. Pay the **one-time USD $25 registration fee**.
3. Fill in your developer name, email, and phone number.
4. Agree to the Developer Distribution Agreement.

> Your account will be active within a few hours. You only need to do this once.

---

### Step 2 — Create a signing keystore

Every Android app published to the Play Store must be signed with a private key that **you keep safe forever**. Losing this key means you can never update the app under the same listing.

Run this command in your terminal (replace the values in angle brackets):

```bash
keytool -genkey -v \
  -keystore paceread-release.jks \
  -alias paceread \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass <CHOOSE_A_STRONG_PASSWORD> \
  -keypass  <CHOOSE_A_STRONG_PASSWORD>
```

You will be asked for your name and organisation details — these appear in the certificate but not in the app listing.

> **Keep `paceread-release.jks` and both passwords safe** (e.g. in a password manager). Back it up somewhere secure — if you lose it you cannot update your app.

---

### Step 3 — Add secrets to GitHub

The CI workflow (`.github/workflows/build-android.yml`) automatically signs and builds a release APK when you push a `v*` tag, **if** four repository secrets are set.

1. Base64-encode your keystore file:

   ```bash
   # macOS / Linux
   base64 -i paceread-release.jks | pbcopy   # copies to clipboard (macOS)
   base64 -i paceread-release.jks            # print, then copy (Linux)
   ```

2. In GitHub, go to your repository → **Settings → Secrets and variables → Actions → New repository secret** and add:

   | Secret name | Value |
   |-------------|-------|
   | `ANDROID_KEYSTORE_BASE64` | The base64 output from above |
   | `ANDROID_KEYSTORE_PASSWORD` | Your keystore password |
   | `ANDROID_KEY_ALIAS` | `paceread` (or whatever alias you chose) |
   | `ANDROID_KEY_PASSWORD` | Your key password |

---

### Step 4 — Build a signed release AAB

Google Play now prefers the **Android App Bundle (`.aab`)** format over a plain APK because it lets Google optimise the download for each device.

#### Option A — Using CI (recommended)

Tag a release in git and push:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The `build-android.yml` workflow will:
1. Build the web app (`npm run build`)
2. Sync with Capacitor (`npx cap sync android`)
3. Decode the keystore from the secret
4. Run `./gradlew bundleRelease` with signing flags
5. Upload the signed **AAB** as a workflow artifact

Download the artifact from the **Actions** tab → select the run → **Artifacts** section.

> The workflow uses `bundleRelease` (AAB) by default, which is what Google Play requires. The debug build uses `assembleDebug` (APK) for quick local testing.

#### Option B — Locally with Android Studio

```bash
npm run build
npx cap sync android
npx cap open android        # opens Android Studio
```

In Android Studio:
1. **Build → Generate Signed Bundle / APK**
2. Choose **Android App Bundle**
3. Select your `paceread-release.jks` keystore, enter passwords and alias
4. Choose **release** build variant
5. Click **Finish** — the `.aab` file is saved under `android/app/release/`

---

### Step 5 — Create the Play Store listing

1. In the [Play Console](https://play.google.com/console), click **Create app**.
2. Fill in:
   - **App name:** PaceRead
   - **Default language:** English (or your preference)
   - **App or game:** App
   - **Free or paid:** Free
3. Accept the declarations and click **Create app**.

You will be taken to the app dashboard. Before you can publish you need to complete:

#### Store listing

- **Short description** (80 chars): e.g. *RSVP speed reader — read PDFs & EPUBs up to 1000 WPM.*
- **Full description** (4000 chars): explain the features.
- **Screenshots**: at least 2 phone screenshots (1080×1920 or similar). You can capture these from an emulator in Android Studio.
- **Feature graphic**: a 1024×500 JPG/PNG banner.
- **App icon**: 512×512 PNG (use your existing `public/icons/icon-512.png`).
- **Category**: Books & Reference (or Productivity).
- **Email address**: your support email.

#### Content rating

Go to **Policy → App content → Content rating** and complete the questionnaire. PaceRead has no user-generated content, no ads, no violence — you will receive an **Everyone** rating.

#### Data safety

Under **Policy → App content → Data safety**, declare:
- No data collected (PaceRead processes files locally, nothing is transmitted).

#### App access

If your app requires login (PaceRead does not), you would provide test credentials here. Leave this as **All functionality is accessible without special access**.

---

### Step 6 — Upload and publish

1. In the Play Console, go to **Release → Production → Create new release**.
2. Upload your signed `.aab` (or `.apk`) file.
3. Enter a **Release name** (e.g. `1.0.0`) and **Release notes** (what's new).
4. Click **Save → Review release → Start rollout to Production**.

Google reviews new apps. The first review typically takes **1–3 business days**. After approval the app goes live on the Play Store.

> **Tip:** For your first submission, consider releasing to **Internal testing** first (instant, no review) to verify the build installs correctly on a real device.

---

## Apple App Store (iOS)

### Prerequisites

| Tool | Notes |
|------|-------|
| Mac with macOS 14+ | Required for Xcode 16 |
| Xcode 16 | Free from the Mac App Store |
| Apple Developer Program | USD $99/year — see Step 1 |

---

### Step 1 — Enrol in the Apple Developer Program

1. Go to <https://developer.apple.com/programs/enroll/> and sign in with your Apple ID.
2. Choose **Individual** (or Organisation if publishing under a company name).
3. Pay the **USD $99/year** fee.
4. Enrolment is usually approved within 48 hours.

---

### Step 2 — Configure the Xcode project

```bash
npm run build
npx cap add ios      # only needed once
npx cap sync ios
npx cap open ios     # opens Xcode
```

In Xcode:

1. Select the **App** target in the Project Navigator.
2. Under **Signing & Capabilities**, select your **Team** (your Apple Developer account).
3. Set the **Bundle Identifier** to `ca.techscript.paceread` (must match `capacitor.config.ts`).
4. Set the **Version** (e.g. `1.0`) and **Build** number (e.g. `1`).
5. Xcode will automatically create a **provisioning profile** — wait for "Signing Certificate: Apple Development" to appear.

---

### Step 3 — Create an App Store Connect listing

1. Go to <https://appstoreconnect.apple.com> and sign in.
2. Click **+** → **New App**.
3. Fill in:
   - **Platforms:** iOS
   - **Name:** PaceRead
   - **Primary language:** English
   - **Bundle ID:** `ca.techscript.paceread` (select from the dropdown — Xcode registered it)
   - **SKU:** any unique string, e.g. `paceread-1`
4. Click **Create**.

Complete the listing:
- **Description**, **Keywords**, **Support URL**
- **App previews and screenshots** — capture from the iOS Simulator in Xcode (Cmd+S)
- **App icon** — provided automatically from the Xcode asset catalogue
- **Category**: Books (or Productivity)
- **Age rating**: complete the questionnaire (PaceRead will get 4+)
- **Privacy policy URL**: required; host a simple page on your site explaining no data is collected

---

### Step 4 — Archive and upload with Xcode

1. In Xcode, select **Any iOS Device** (not a simulator) as the destination.
2. **Product → Archive** — this builds a release archive (takes a few minutes).
3. The **Organizer** window opens automatically. Select your archive.
4. Click **Distribute App → App Store Connect → Upload**.
5. Follow the wizard (keep default options). Xcode will sign, validate, and upload the build.

After a few minutes the build will appear in App Store Connect under **TestFlight** (for testing) and **Builds** on your app listing.

---

### Step 5 — Submit for review

1. In App Store Connect, go to your app → **+** next to iOS App to add a new version.
2. Select the build you just uploaded.
3. Fill in **What's New** text.
4. Click **Save → Add for Review → Submit to App Review**.

Apple's review takes **1–3 business days** for first submissions (often 24 hours). You will receive an email when approved.

---

## After each update

Whenever you change the app source:

```bash
# 1. Bump the version in capacitor.config.ts (or Android/iOS project files)
# 2. Rebuild the web assets
npm run build

# 3. Sync native projects
npx cap sync

# 4. For Play Store: build new AAB and upload to a new release in Play Console
# 5. For App Store: archive in Xcode and upload via Organizer
```

> **Important:** increment the **version code** (Android) or **build number** (iOS) with every submission — stores reject builds with duplicate version numbers.

---

## Common questions

**Do I need to pay to publish?**  
- Google Play: **$25 one-time** registration fee.  
- Apple App Store: **$99/year** Developer Program membership.

**Can I publish for free without a developer account?**  
Yes, as a PWA. Users can already install PaceRead directly from the browser via the "Add to Home Screen" prompt — no store account needed.

**Can I keep the app free?**  
Yes. Both stores allow free apps with no monetisation. The "Buy me a coffee" link in the app is not considered in-app purchase and does not need any special configuration.

**How long does review take?**  
- Google Play: 1–3 business days for the first release; subsequent updates are often reviewed within hours.  
- Apple App Store: 1–3 business days; Apple provides a reason if rejected.

**Do I need to update my app when Capacitor releases a new version?**  
No, but it is good practice to stay within 1–2 major versions to keep up with OS security updates.

**Where is my app ID?**  
`ca.techscript.paceread` — defined in `capacitor.config.ts`. This must remain the same for the lifetime of the app on each store.

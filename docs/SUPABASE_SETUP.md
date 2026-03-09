# Complete Auth Setup Guide

Everything you need to enable **Sign in with Google** and **cross-device sync** in one place. Both services are free. Total time: ~15 minutes.

> **Security reminder:** Never share your passwords, API keys, or OAuth secrets with anyone — including in GitHub issues or chat.

---

## Overview

You need two free accounts:

| # | Service | What it does | Time |
|---|---------|-------------|------|
| 1 | **Supabase** | Hosts the database and handles OAuth | ~5 min |
| 2 | **Google Cloud** | Provides the "Sign in with Google" button | ~8 min |

Then you paste two values into a `.env` file (~2 min).

---

## Step 1 — Create a Supabase project (~5 min)

1. Go to [supabase.com](https://supabase.com) and click **Start your project** (free tier, no credit card)
2. Sign up with GitHub or email
3. Click **New project**, enter a name (e.g. `paceread`), choose any region, set a database password, click **Create new project**
4. Wait ~1 minute for provisioning

### Run the database migration

1. In the Supabase dashboard sidebar, click **SQL Editor**
2. Click **New query**
3. Open `supabase/migrations/001_initial_schema.sql` from this repository, copy the entire contents, paste it into the editor, and click **Run**

This creates three tables (all protected by Row Level Security — users only ever see their own data):
- `user_files` — per-file reading progress
- `user_preferences` — display and reading settings
- `reading_sessions` — session history per device

### Copy your Supabase credentials (you'll need these in Step 3)

1. In the sidebar click **Settings → API**
2. Note down your **Project URL** (looks like `https://abcdefgh.supabase.co`)
3. Note down the **anon public** key (long string under "Project API keys")

---

## Step 2 — Set up Google OAuth (~8 min)

### 2a. Create a Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and sign in with your Google account (free)
2. In the top bar, click the project dropdown → **New Project** → give it a name (e.g. `PaceRead`) → **Create**
3. Make sure the new project is selected in the top bar

### 2b. Configure the OAuth consent screen

1. In the left sidebar go to **APIs & Services → OAuth consent screen**
2. Choose **External**, click **Create**
3. Fill in:
   - **App name:** `PaceRead`
   - **User support email:** your email
   - **Developer contact email:** your email
4. Click **Save and Continue** through the remaining screens (Scopes and Test users can be left at defaults)

### 2c. Create OAuth credentials

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Under **Authorized redirect URIs**, click **+ Add URI** and paste:
   ```
   https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
   ```
   Replace `YOUR-PROJECT-REF` with the subdomain from your Supabase Project URL (e.g. `abcdefgh`)
5. Click **Create**
6. A dialog shows your **Client ID** and **Client Secret** — copy both

### 2d. Enable Google provider in Supabase

1. Back in the Supabase dashboard, go to **Authentication → Providers**
2. Find **Google**, toggle it **on**
3. Paste your **Client ID** and **Client Secret** from the previous step
4. Click **Save**

### 2e. Add your app URL to Supabase redirect allowlist

1. In Supabase go to **Authentication → URL Configuration**
2. Under **Redirect URLs**, click **Add URL** and add:
   - `http://localhost:5173` (for local development)
   - `https://paceread.techscript.ca` (for the deployed site)
3. Click **Save**

---

## Step 3 — Configure environment variables (~2 min)

In the root of this repository:

```bash
cp .env.example .env
```

Open `.env` and fill in the two Supabase values you noted in Step 1:

```env
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...your-anon-key...
```

Save the file.

---

## Step 4 — Verify

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), click the ☰ menu, and you should see an **Account** section with a **Sign In with Google** button. Click it to complete a test sign-in.

---

## Notes

- The app works fully without this setup — auth features are simply not shown
- File contents are **never** uploaded; only metadata (progress, filename, word count) is synced
- Row Level Security means your data is private even if someone knows your Supabase URL

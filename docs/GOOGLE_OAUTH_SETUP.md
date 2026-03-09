# Google OAuth Setup

This guide walks through enabling Google OAuth for PaceRead via Supabase.

## Steps

### 1. Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Navigate to **APIs & Services → Credentials**

### 2. Configure OAuth Consent Screen

1. Click **OAuth consent screen**
2. Choose **External** user type
3. Fill in the required fields (App name, support email, developer email)
4. Add the scope `email` and `profile`
5. Save

### 3. Create OAuth 2.0 Credentials

1. Click **Create Credentials → OAuth 2.0 Client ID**
2. Application type: **Web application**
3. Add an **Authorized redirect URI**:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
   (Find your project ref in the Supabase dashboard URL)
4. Save and copy the **Client ID** and **Client Secret**

### 4. Enable Google Provider in Supabase

1. In the Supabase dashboard, go to **Authentication → Providers**
2. Find **Google** and toggle it on
3. Paste your Client ID and Client Secret
4. Save

### 5. Add Allowed Redirect URLs

In Supabase **Authentication → URL Configuration**, add your app's URL to **Redirect URLs**:
- For local dev: `http://localhost:5173`
- For production: `https://your-domain.com`

## Testing

Sign in through the burger menu. On success, your Google profile picture should appear in the top bar.

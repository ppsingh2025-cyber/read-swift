# Migration Guide

This guide covers upgrading PaceRead from versions without auth/sync to the version with Supabase integration.

## For Existing Users (No Supabase)

**Nothing changes.** The app works exactly as before when Supabase environment variables are not configured. All existing features, localStorage-based reading history, and settings continue to work unchanged.

## Enabling Auth and Sync

If you want to enable cross-device sync:

1. Follow [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to create a Supabase project and run the schema migration
2. Follow [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) to enable Google OAuth
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your environment

Once configured, the app will show:
- A **👤** avatar icon in the header (click to sign in via the burger menu)
- An **Account** section in the burger menu
- A **☁️** sync status indicator when authenticated

## Database Schema

The schema migration is at `supabase/migrations/001_initial_schema.sql`. Run it once in your Supabase project's SQL editor.

## Data Compatibility

- Existing localStorage reading history is **not** automatically migrated to Supabase
- After signing in, new progress updates will sync to Supabase
- Local IndexedDB data is always the source of truth; Supabase is additive

## Rollback

To disable sync features, simply remove `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your environment. The app will revert to local-only mode automatically.

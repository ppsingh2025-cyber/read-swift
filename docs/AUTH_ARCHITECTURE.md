# Authentication & Sync Architecture

## Overview

PaceRead uses an **offline-first** architecture. All data is stored locally in IndexedDB first; Supabase is used for cross-device sync and is entirely optional.

## Component Map

```
App
└── AuthProvider (AuthContext.tsx)
    ├── UserAvatar           — header, shows sign-in state
    ├── SyncStatusIndicator  — header, shows sync status
    ├── BurgerMenu
    │   └── AccountSection   — sign-in / sign-out / manual sync
    └── SignInPrompt         — post-session prompt (one-time)
```

## Data Flow

```
File loaded
    │
    ▼
MetadataManager.getOrCreateFileMetadata()
    │  hashes file via Web Worker (hash.worker.ts)
    │  checks IndexedDB first
    ▼
IndexedDBService  ◄──────────────────────────────┐
    │                                             │
    │ on pause/stop/close                         │
    ▼                                             │
SyncService.triggerSync()                         │
    │  debounced 2s (instant on page close)       │
    │  compares local vs server timestamps        │
    │  last-write-wins per record                 │
    ▼                                             │
Supabase (user_files / user_preferences) ─────────┘
         (reading_sessions — append-only)
```

## Key Design Decisions

### Offline-first
IndexedDB is the single source of truth. The app works fully without network access. Supabase sync only happens when the user is online and authenticated.

### Conservative sync triggers
Sync is only triggered on explicit events (pause, stop, page close, manual "Sync Now"). There is no polling or real-time subscription to avoid unnecessary battery/network usage.

### Graceful degradation
Every auth and sync code path checks `isSupabaseConfigured` first and returns a no-op when Supabase is not set up. The app is fully functional without any environment variables.

### File identity
Files are identified by a SHA-256 hash of the first 1MB + file size. This is computed in a Web Worker to avoid blocking the UI. The same file on two devices will get the same hash.

### Last-write-wins
When both local and server copies exist, the one with the most recent `updatedAt` timestamp wins. This is simple and sufficient for a single-user reading app.

## Services

| File | Responsibility |
|------|---------------|
| `src/config/supabase.ts` | Supabase client (null when unconfigured) |
| `src/auth/AuthService.ts` | Auth operations (sign in/out, session) |
| `src/auth/AuthContext.tsx` | React context for auth state |
| `src/sync/IndexedDBService.ts` | All local IndexedDB reads/writes |
| `src/sync/SyncService.ts` | Orchestrates IndexedDB ↔ Supabase sync |
| `src/sync/MetadataManager.ts` | High-level facade for metadata ops |
| `src/sync/fileHasher.ts` | Web Worker wrapper for file hashing |
| `src/sync/deviceDetector.ts` | User-agent based device name |

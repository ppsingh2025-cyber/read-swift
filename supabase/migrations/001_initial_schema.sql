-- PaceRead initial database schema
-- Run this in your Supabase project's SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── user_files ───────────────────────────────────────────────────────────────
-- Tracks per-file reading progress for each user.

create table if not exists public.user_files (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  file_hash     text not null,
  file_name     text not null,
  file_type     text not null check (file_type in ('pdf', 'epub', 'txt')),
  file_size     bigint not null default 0,
  last_word_index integer not null default 0,
  last_page     integer not null default 0,
  total_pages   integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, file_hash)
);

alter table public.user_files enable row level security;

create policy "Users can manage their own files"
  on public.user_files
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── user_preferences ─────────────────────────────────────────────────────────
-- Stores display and reading preferences per user.

create table if not exists public.user_preferences (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null unique references auth.users(id) on delete cascade,
  theme           text not null default 'night' check (theme in ('day', 'night')),
  font_size       integer not null default 32,
  word_window     integer not null default 1 check (word_window between 1 and 5),
  highlight_color text not null default '#f9c74f',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "Users can manage their own preferences"
  on public.user_preferences
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── reading_sessions ─────────────────────────────────────────────────────────
-- Append-only log of reading sessions per device.

create table if not exists public.reading_sessions (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  file_id          uuid references public.user_files(id) on delete set null,
  session_start    timestamptz not null,
  session_end      timestamptz,
  words_read       integer not null default 0,
  start_word_index integer not null default 0,
  end_word_index   integer,
  device_name      text not null default '',
  created_at       timestamptz not null default now()
);

alter table public.reading_sessions enable row level security;

create policy "Users can manage their own sessions"
  on public.reading_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── updated_at trigger ────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_user_files_updated_at
  before update on public.user_files
  for each row execute procedure public.set_updated_at();

create trigger set_user_preferences_updated_at
  before update on public.user_preferences
  for each row execute procedure public.set_updated_at();

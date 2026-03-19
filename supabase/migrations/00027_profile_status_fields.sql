-- Add missing status fields to profiles table
-- These columns are referenced by getBoxMembers, getAuthUser, and the status API
-- but were never added via migration, causing queries to fail silently.

alter table public.profiles
  add column if not exists status_text text,
  add column if not exists status_emoji text,
  add column if not exists status_expires_at timestamptz;

-- Contact nicknames: users can set a custom display name for other users
-- This is private to the user who sets it (only they see the nickname)
create table if not exists contact_nicknames (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, contact_user_id)
);

-- RLS: users can only see/edit their own nicknames
alter table contact_nicknames enable row level security;

create policy "Users can view own nicknames"
  on contact_nicknames for select
  using (auth.uid() = user_id);

create policy "Users can insert own nicknames"
  on contact_nicknames for insert
  with check (auth.uid() = user_id);

create policy "Users can update own nicknames"
  on contact_nicknames for update
  using (auth.uid() = user_id);

create policy "Users can delete own nicknames"
  on contact_nicknames for delete
  using (auth.uid() = user_id);

-- Index for fast lookups
create index idx_contact_nicknames_user on contact_nicknames(user_id);

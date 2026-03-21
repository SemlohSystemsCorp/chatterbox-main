-- Sherlock AI chat persistence
create table if not exists sherlock_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  box_id uuid references boxes(id) on delete cascade,
  mode text not null default 'workspace' check (mode in ('workspace', 'general')),
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sherlock_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references sherlock_chats(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_sherlock_chats_user_box on sherlock_chats(user_id, box_id, mode);
create index idx_sherlock_messages_chat on sherlock_messages(chat_id, created_at);

-- RLS
alter table sherlock_chats enable row level security;
alter table sherlock_messages enable row level security;

-- Users can only access their own chats
create policy "Users can view own chats"
  on sherlock_chats for select
  using (auth.uid() = user_id);

create policy "Users can create own chats"
  on sherlock_chats for insert
  with check (auth.uid() = user_id);

create policy "Users can update own chats"
  on sherlock_chats for update
  using (auth.uid() = user_id);

create policy "Users can delete own chats"
  on sherlock_chats for delete
  using (auth.uid() = user_id);

-- Users can only access messages in their own chats
create policy "Users can view own chat messages"
  on sherlock_messages for select
  using (exists (
    select 1 from sherlock_chats where sherlock_chats.id = chat_id and sherlock_chats.user_id = auth.uid()
  ));

create policy "Users can create messages in own chats"
  on sherlock_messages for insert
  with check (exists (
    select 1 from sherlock_chats where sherlock_chats.id = chat_id and sherlock_chats.user_id = auth.uid()
  ));

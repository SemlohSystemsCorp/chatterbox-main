-- Migration: Thread Subscriptions
-- Allows users to subscribe to message threads and receive updates.
-- Automatically subscribes users when they reply to a thread,
-- and auto-subscribes the original message author when someone replies.

-- 1. Create thread_subscriptions table
create table public.thread_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  parent_message_id uuid references public.messages(id) on delete cascade not null,
  last_read_at timestamptz not null default now(),
  subscribed_at timestamptz not null default now(),
  unique(user_id, parent_message_id)
);

create index idx_thread_subs_user on public.thread_subscriptions(user_id);
create index idx_thread_subs_parent on public.thread_subscriptions(parent_message_id);

-- 2. Enable RLS and create policies
alter table public.thread_subscriptions enable row level security;

create policy "Users can select their own thread subscriptions"
  on public.thread_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own thread subscriptions"
  on public.thread_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own thread subscriptions"
  on public.thread_subscriptions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own thread subscriptions"
  on public.thread_subscriptions for delete
  using (auth.uid() = user_id);

-- 3. Auto-subscribe replier to thread on reply
create or replace function public.auto_subscribe_thread()
returns trigger as $$
begin
  if NEW.parent_message_id is not null then
    insert into public.thread_subscriptions (user_id, parent_message_id)
    values (NEW.sender_id, NEW.parent_message_id)
    on conflict (user_id, parent_message_id) do nothing;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_thread_reply_subscribe
  after insert on public.messages
  for each row
  execute function public.auto_subscribe_thread();

-- 4. Auto-subscribe original message author when someone replies to their message
create or replace function public.auto_subscribe_parent_author()
returns trigger as $$
declare
  parent_sender uuid;
begin
  if NEW.parent_message_id is not null then
    select sender_id into parent_sender from public.messages where id = NEW.parent_message_id;
    if parent_sender is not null then
      insert into public.thread_subscriptions (user_id, parent_message_id)
      values (parent_sender, NEW.parent_message_id)
      on conflict (user_id, parent_message_id) do nothing;
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_thread_reply_subscribe_parent
  after insert on public.messages
  for each row
  execute function public.auto_subscribe_parent_author();

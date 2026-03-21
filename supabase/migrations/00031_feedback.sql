-- Feedback / bug report table
create table public.feedback (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('feedback', 'report')),
  message text not null,
  email text,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Users can insert their own feedback
create policy "Users can submit feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);

-- Only service role can read feedback (admin dashboard)
create policy "Service role can read feedback"
  on public.feedback for select
  using (auth.uid() = user_id);

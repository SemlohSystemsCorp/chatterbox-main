-- ============================================================
-- ADMIN AUDIT LOGS — tracks admin actions for the admin dashboard
-- e.g. "Alice changed Bob's role to admin", "Charlie updated box settings"
-- ============================================================

create table public.admin_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  box_id uuid references public.boxes(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text,          -- 'member', 'channel', 'box', 'invite'
  target_id text,            -- id of the affected entity
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_audit_logs_box
  on public.admin_audit_logs(box_id, created_at desc);

create index idx_audit_logs_actor
  on public.admin_audit_logs(actor_id, created_at desc);

alter table public.admin_audit_logs enable row level security;

-- Only box admins/owners can view audit logs
create policy "Audit logs visible to box admins"
  on public.admin_audit_logs for select
  using (
    exists (
      select 1 from public.box_members bm
      where bm.box_id = admin_audit_logs.box_id
      and bm.user_id = auth.uid()
      and bm.role in ('owner', 'admin')
    )
  );

-- Any authenticated user can insert (server-side inserts from API routes)
create policy "Authenticated users can insert audit logs"
  on public.admin_audit_logs for insert
  with check (auth.role() = 'authenticated');

-- ── Integrations Marketplace & Zoom Integration ──

-- Catalog of available integrations
create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_name text not null,
  description text not null,
  icon_url text,
  brand_color text not null default '#000000',
  category text not null check (category in ('communication', 'project_management', 'notifications')),
  auth_type text not null default 'oauth2' check (auth_type in ('oauth2', 'api_key', 'webhook')),
  oauth_authorize_url text,
  oauth_token_url text,
  scopes text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seed Zoom as the first integration
insert into public.integrations (name, display_name, description, brand_color, category, auth_type, oauth_authorize_url, oauth_token_url, scopes)
values (
  'zoom',
  'Zoom',
  'Start and share Zoom meetings directly from any channel. One admin connects the workspace Zoom account and all members can create meetings instantly.',
  '#2D8CFF',
  'communication',
  'oauth2',
  'https://zoom.us/oauth/authorize',
  'https://zoom.us/oauth/token',
  'meeting:write:meeting meeting:read:meeting user:read:user'
);

-- Seed placeholder integrations for marketplace display
insert into public.integrations (name, display_name, description, brand_color, category, auth_type, is_available)
values
  ('jira', 'Jira', 'Create and track Jira issues from chat. Get notifications when tickets are updated.', '#0052CC', 'project_management', 'oauth2', false),
  ('github', 'GitHub', 'Link pull requests, get commit notifications, and manage issues from Chatterbox.', '#24292F', 'project_management', 'oauth2', false),
  ('google-calendar', 'Google Calendar', 'See upcoming meetings, get reminders, and schedule events from chat.', '#4285F4', 'notifications', 'oauth2', false),
  ('linear', 'Linear', 'Create issues, track sprints, and get updates on project progress.', '#5E6AD2', 'project_management', 'oauth2', false),
  ('notion', 'Notion', 'Search and share Notion pages. Get notified when docs are updated.', '#000000', 'project_management', 'oauth2', false);

-- Workspace-level connected integrations (stores encrypted tokens)
create table public.workspace_integrations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.boxes(id) on delete cascade,
  integration_id uuid not null references public.integrations(id) on delete cascade,
  enabled boolean not null default true,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  connected_by uuid references auth.users(id),
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, integration_id)
);

-- Integration events log
create table public.integration_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.boxes(id) on delete cascade,
  integration_id uuid not null references public.integrations(id) on delete cascade,
  actor_id uuid references auth.users(id),
  event_type text not null,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- Zoom meetings tracking
create table public.zoom_meetings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.boxes(id) on delete cascade,
  channel_id uuid references public.channels(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  created_by uuid not null references auth.users(id),
  zoom_meeting_id text not null,
  join_url text not null,
  topic text,
  duration integer default 60,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── RLS Policies ──

alter table public.integrations enable row level security;
alter table public.workspace_integrations enable row level security;
alter table public.integration_events enable row level security;
alter table public.zoom_meetings enable row level security;

-- Integrations catalog: anyone can read
create policy "Anyone can view integrations"
  on public.integrations for select
  using (true);

-- Workspace integrations: box members can read, admins can write
create policy "Box members can view workspace integrations"
  on public.workspace_integrations for select
  using (
    exists (
      select 1 from public.box_members
      where box_members.box_id = workspace_integrations.workspace_id
        and box_members.user_id = auth.uid()
    )
  );

create policy "Box admins can insert workspace integrations"
  on public.workspace_integrations for insert
  with check (
    exists (
      select 1 from public.box_members
      where box_members.box_id = workspace_integrations.workspace_id
        and box_members.user_id = auth.uid()
        and box_members.role in ('owner', 'admin')
    )
  );

create policy "Box admins can update workspace integrations"
  on public.workspace_integrations for update
  using (
    exists (
      select 1 from public.box_members
      where box_members.box_id = workspace_integrations.workspace_id
        and box_members.user_id = auth.uid()
        and box_members.role in ('owner', 'admin')
    )
  );

create policy "Box admins can delete workspace integrations"
  on public.workspace_integrations for delete
  using (
    exists (
      select 1 from public.box_members
      where box_members.box_id = workspace_integrations.workspace_id
        and box_members.user_id = auth.uid()
        and box_members.role in ('owner', 'admin')
    )
  );

-- Integration events: box members can read, system/admins can insert
create policy "Box members can view integration events"
  on public.integration_events for select
  using (
    exists (
      select 1 from public.box_members
      where box_members.box_id = integration_events.workspace_id
        and box_members.user_id = auth.uid()
    )
  );

create policy "Box admins can insert integration events"
  on public.integration_events for insert
  with check (
    exists (
      select 1 from public.box_members
      where box_members.box_id = integration_events.workspace_id
        and box_members.user_id = auth.uid()
        and box_members.role in ('owner', 'admin')
    )
  );

-- Zoom meetings: box members can read, any member can insert (create meetings)
create policy "Box members can view zoom meetings"
  on public.zoom_meetings for select
  using (
    exists (
      select 1 from public.box_members
      where box_members.box_id = zoom_meetings.workspace_id
        and box_members.user_id = auth.uid()
    )
  );

create policy "Box members can create zoom meetings"
  on public.zoom_meetings for insert
  with check (
    exists (
      select 1 from public.box_members
      where box_members.box_id = zoom_meetings.workspace_id
        and box_members.user_id = auth.uid()
    )
  );

-- Enable realtime for workspace_integrations so UI updates live
alter publication supabase_realtime add table public.workspace_integrations;

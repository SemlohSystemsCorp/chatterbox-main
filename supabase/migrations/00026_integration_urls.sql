-- Add website_url column to integrations
alter table public.integrations add column if not exists website_url text;

-- Update all integrations with hardcoded OAuth URLs, website URLs, and CDN icon URLs
update public.integrations set
  oauth_authorize_url = 'https://zoom.us/oauth/authorize',
  oauth_token_url = 'https://zoom.us/oauth/token',
  website_url = 'https://zoom.us',
  icon_url = 'https://cdn.simpleicons.org/zoom/white',
  scopes = 'meeting:write:meeting meeting:read:meeting user:read:user'
where name = 'zoom';

update public.integrations set
  oauth_authorize_url = 'https://auth.atlassian.com/authorize',
  oauth_token_url = 'https://auth.atlassian.com/oauth/token',
  website_url = 'https://www.atlassian.com/software/jira',
  icon_url = 'https://cdn.simpleicons.org/jira/white',
  scopes = 'read:jira-work write:jira-work read:jira-user'
where name = 'jira';

update public.integrations set
  oauth_authorize_url = 'https://github.com/login/oauth/authorize',
  oauth_token_url = 'https://github.com/login/oauth/access_token',
  website_url = 'https://github.com',
  icon_url = 'https://cdn.simpleicons.org/github/white',
  scopes = 'repo read:org notifications'
where name = 'github';

update public.integrations set
  oauth_authorize_url = 'https://accounts.google.com/o/oauth2/v2/auth',
  oauth_token_url = 'https://oauth2.googleapis.com/token',
  website_url = 'https://calendar.google.com',
  icon_url = 'https://cdn.simpleicons.org/googlecalendar/white',
  scopes = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events'
where name = 'google-calendar';

update public.integrations set
  oauth_authorize_url = 'https://linear.app/oauth/authorize',
  oauth_token_url = 'https://api.linear.app/oauth/token',
  website_url = 'https://linear.app',
  icon_url = 'https://cdn.simpleicons.org/linear/white',
  scopes = 'read write issues:create'
where name = 'linear';

update public.integrations set
  oauth_authorize_url = 'https://api.notion.com/v1/oauth/authorize',
  oauth_token_url = 'https://api.notion.com/v1/oauth/token',
  website_url = 'https://www.notion.so',
  icon_url = 'https://cdn.simpleicons.org/notion/white',
  scopes = 'read_content insert_content'
where name = 'notion';

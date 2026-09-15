-- TPLabs private ContentOps schema for Supabase/PostgreSQL
create extension if not exists pgcrypto;
create schema if not exists private;

create type public.member_role as enum ('owner','admin','content_manager','scriptwriter','editor','reviewer','viewer');
create type public.content_status as enum ('idea','script','editing','review','approved','scheduled','published','failed','removed');

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role public.member_role not null default 'viewer',
  channel_scope uuid[] not null default '{}',
  status text not null default 'active' check (status in ('active','invited','suspended')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- Bảng này không nằm trong Data API. Xóa email tại đây sẽ khóa quyền ngay lập tức.
create table private.authorized_users (
  email text primary key check (email = lower(trim(email))),
  active boolean not null default true,
  added_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.channels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  external_key text,
  name text not null,
  platform text not null check (platform in ('YouTube','TikTok','Instagram','Facebook','Other')),
  handle text,
  channel_url text,
  external_channel_id text,
  color text default '#7357e8',
  followers bigint not null default 0,
  total_views bigint not null default 0,
  post_count integer not null default 0,
  active boolean not null default true,
  connected boolean not null default false,
  created_at timestamptz not null default now(),
  unique(workspace_id, external_key)
);

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  external_key text,
  title text not null,
  brief text,
  script text,
  content_pillar text,
  primary_channel_id uuid references public.channels(id) on delete set null,
  primary_platform text,
  status public.content_status not null default 'idea',
  owner_id uuid references auth.users(id) on delete set null,
  owner_name text,
  due_date date,
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, external_key)
);

create table public.published_posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  content_id uuid not null references public.content_items(id) on delete cascade,
  channel_id uuid references public.channels(id) on delete set null,
  platform text not null,
  post_url text not null,
  external_post_id text,
  caption text,
  thumbnail_url text,
  status text not null default 'published' check (status in ('scheduled','published','failed','removed','unavailable')),
  published_at timestamptz,
  views bigint not null default 0,
  reach bigint,
  impressions bigint,
  unique_viewers bigint,
  likes bigint not null default 0,
  comments bigint not null default 0,
  shares bigint,
  saves bigint,
  total_watch_seconds bigint,
  average_watch_seconds numeric(12,2),
  completion_rate numeric(6,3),
  retention_rate numeric(6,3),
  link_clicks bigint,
  ctr numeric(6,3),
  profile_visits bigint,
  followers_gained bigint,
  revenue numeric(14,2),
  rpm numeric(10,2),
  conversions bigint,
  engagement_rate numeric(6,3),
  view_growth numeric(8,3),
  performance_score numeric(5,2),
  last_synced_at timestamptz,
  next_sync_at timestamptz,
  sync_error text,
  created_at timestamptz not null default now(),
  unique(platform, external_post_id)
);

create table public.metric_snapshots (
  id bigint generated always as identity primary key,
  published_post_id uuid not null references public.published_posts(id) on delete cascade,
  captured_at timestamptz not null default now(),
  views bigint,
  reach bigint,
  impressions bigint,
  likes bigint,
  comments bigint,
  shares bigint,
  saves bigint,
  average_watch_seconds numeric(12,2),
  retention_rate numeric(6,3),
  completion_rate numeric(6,3),
  engagement_rate numeric(6,3),
  performance_score numeric(5,2),
  raw_metrics jsonb not null default '{}'
);

create table public.automations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  external_key text,
  title text not null,
  trigger_type text not null,
  conditions jsonb not null default '{}',
  actions jsonb not null default '[]',
  enabled boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(workspace_id, external_key)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role public.member_role not null,
  channel_scope uuid[] not null default '{}',
  invited_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table private.authorized_users enable row level security;

create or replace function private.is_authorized()
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from private.authorized_users a
    join auth.users u on lower(u.email) = a.email
    where u.id = (select auth.uid()) and a.active
  )
$$;

create or replace function private.has_role(target_workspace uuid, allowed_roles public.member_role[])
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_authorized() and exists (
    select 1 from public.workspace_members m
    where m.workspace_id = target_workspace
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = any(allowed_roles)
  )
$$;

create or replace function private.is_member(target_workspace uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.has_role(target_workspace, array['owner','admin','content_manager','scriptwriter','editor','reviewer','viewer']::public.member_role[])
$$;

create or replace function private.can_access_channel(target_workspace uuid, target_channel uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_authorized() and exists (
    select 1 from public.workspace_members m
    where m.workspace_id = target_workspace
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and (m.role in ('owner','admin') or cardinality(m.channel_scope) = 0 or target_channel = any(m.channel_scope))
  )
$$;

revoke all on function private.is_authorized() from public;
revoke all on function private.has_role(uuid, public.member_role[]) from public;
revoke all on function private.is_member(uuid) from public;
revoke all on function private.can_access_channel(uuid, uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_authorized() to authenticated;
grant execute on function private.has_role(uuid, public.member_role[]) to authenticated;
grant execute on function private.is_member(uuid) to authenticated;
grant execute on function private.can_access_channel(uuid, uuid) to authenticated;

-- Chỉ Edge Function dùng service_role được phép thêm hoặc thu hồi Gmail.
create or replace function public.set_authorized_user(target_email text, is_active boolean, actor uuid default null)
returns void language plpgsql security definer set search_path = ''
as $$
declare normalized_email text := lower(trim(target_email));
begin
  if normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Invalid email';
  end if;
  insert into private.authorized_users(email,active,added_by)
  values(normalized_email,is_active,actor)
  on conflict(email) do update set active=excluded.active,added_by=excluded.added_by;
end;
$$;
revoke all on function public.set_authorized_user(text,boolean,uuid) from public,anon,authenticated;
grant execute on function public.set_authorized_user(text,boolean,uuid) to service_role;

create or replace function private.handle_authorized_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare invite_row public.invitations%rowtype;
begin
  if not exists (select 1 from private.authorized_users a where a.email = lower(new.email) and a.active) then
    return new;
  end if;

  select i.* into invite_row
  from public.invitations i
  where lower(i.email) = lower(new.email)
    and i.accepted_at is null
    and i.expires_at > now()
  order by i.created_at desc limit 1;

  if invite_row.id is null then return new; end if;

  insert into public.workspace_members(workspace_id,user_id,email,display_name,role,channel_scope,status)
  values(invite_row.workspace_id,new.id,lower(new.email),coalesce(new.raw_user_meta_data->>'full_name',new.email),invite_row.role,invite_row.channel_scope,'active')
  on conflict(workspace_id,user_id) do update set status='active', role=excluded.role, channel_scope=excluded.channel_scope;

  update public.workspaces set created_by = new.id where id = invite_row.workspace_id and created_by is null and invite_row.role = 'owner';
  update public.invitations set accepted_at = now() where id = invite_row.id;
  return new;
end;
$$;
revoke all on function private.handle_authorized_user() from public;

drop trigger if exists on_authorized_user_created on auth.users;
create trigger on_authorized_user_created after insert on auth.users for each row execute function private.handle_authorized_user();

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.channels enable row level security;
alter table public.content_items enable row level security;
alter table public.published_posts enable row level security;
alter table public.metric_snapshots enable row level security;
alter table public.automations enable row level security;
alter table public.invitations enable row level security;
alter table public.media_assets enable row level security;
alter table public.activity_logs enable row level security;

create policy "no client access" on private.authorized_users for all to authenticated using (false) with check (false);

create policy "members read workspaces" on public.workspaces for select to authenticated using (private.is_member(id));
create policy "owners update workspaces" on public.workspaces for update to authenticated using (private.has_role(id,array['owner']::public.member_role[])) with check (private.has_role(id,array['owner']::public.member_role[]));
create policy "owners delete workspaces" on public.workspaces for delete to authenticated using (private.has_role(id,array['owner']::public.member_role[]));

create policy "members read memberships" on public.workspace_members for select to authenticated using (private.is_member(workspace_id));
create policy "owners insert memberships" on public.workspace_members for insert to authenticated with check (private.has_role(workspace_id,array['owner']::public.member_role[]));
create policy "owners update memberships" on public.workspace_members for update to authenticated using (private.has_role(workspace_id,array['owner']::public.member_role[])) with check (private.has_role(workspace_id,array['owner']::public.member_role[]));
create policy "owners delete memberships" on public.workspace_members for delete to authenticated using (private.has_role(workspace_id,array['owner']::public.member_role[]));

create policy "scoped members read channels" on public.channels for select to authenticated using (private.can_access_channel(workspace_id,id));
create policy "channel managers insert channels" on public.channels for insert to authenticated with check (private.has_role(workspace_id,array['owner','admin']::public.member_role[]));
create policy "channel managers update channels" on public.channels for update to authenticated using (private.has_role(workspace_id,array['owner','admin']::public.member_role[])) with check (private.has_role(workspace_id,array['owner','admin']::public.member_role[]));
create policy "channel managers delete channels" on public.channels for delete to authenticated using (private.has_role(workspace_id,array['owner','admin']::public.member_role[]));

create policy "scoped members read content" on public.content_items for select to authenticated using (private.is_member(workspace_id) and (primary_channel_id is null or private.can_access_channel(workspace_id,primary_channel_id)));
create policy "creators insert content" on public.content_items for insert to authenticated with check (private.has_role(workspace_id,array['owner','admin','content_manager','scriptwriter']::public.member_role[]));
create policy "production team updates content" on public.content_items for update to authenticated using (private.has_role(workspace_id,array['owner','admin','content_manager','scriptwriter','editor','reviewer']::public.member_role[])) with check (private.has_role(workspace_id,array['owner','admin','content_manager','scriptwriter','editor','reviewer']::public.member_role[]));
create policy "admins delete content" on public.content_items for delete to authenticated using (private.has_role(workspace_id,array['owner','admin']::public.member_role[]));

create policy "scoped members read posts" on public.published_posts for select to authenticated using (private.is_member(workspace_id) and (channel_id is null or private.can_access_channel(workspace_id,channel_id)));
create policy "publishers insert posts" on public.published_posts for insert to authenticated with check (private.has_role(workspace_id,array['owner','admin','content_manager']::public.member_role[]));
create policy "publishers update posts" on public.published_posts for update to authenticated using (private.has_role(workspace_id,array['owner','admin','content_manager']::public.member_role[])) with check (private.has_role(workspace_id,array['owner','admin','content_manager']::public.member_role[]));
create policy "admins delete posts" on public.published_posts for delete to authenticated using (private.has_role(workspace_id,array['owner','admin']::public.member_role[]));

create policy "members read metrics" on public.metric_snapshots for select to authenticated using (exists(select 1 from public.published_posts p where p.id=published_post_id and private.is_member(p.workspace_id) and (p.channel_id is null or private.can_access_channel(p.workspace_id,p.channel_id))));
create policy "owners insert metrics" on public.metric_snapshots for insert to authenticated with check (exists(select 1 from public.published_posts p where p.id=published_post_id and private.has_role(p.workspace_id,array['owner']::public.member_role[])));
create policy "owners update metrics" on public.metric_snapshots for update to authenticated using (exists(select 1 from public.published_posts p where p.id=published_post_id and private.has_role(p.workspace_id,array['owner']::public.member_role[]))) with check (exists(select 1 from public.published_posts p where p.id=published_post_id and private.has_role(p.workspace_id,array['owner']::public.member_role[])));
create policy "owners delete metrics" on public.metric_snapshots for delete to authenticated using (exists(select 1 from public.published_posts p where p.id=published_post_id and private.has_role(p.workspace_id,array['owner']::public.member_role[])));

create policy "members read automations" on public.automations for select to authenticated using (private.is_member(workspace_id));
create policy "admins insert automations" on public.automations for insert to authenticated with check (private.has_role(workspace_id,array['owner','admin']::public.member_role[]));
create policy "admins update automations" on public.automations for update to authenticated using (private.has_role(workspace_id,array['owner','admin']::public.member_role[])) with check (private.has_role(workspace_id,array['owner','admin']::public.member_role[]));
create policy "admins delete automations" on public.automations for delete to authenticated using (private.has_role(workspace_id,array['owner','admin']::public.member_role[]));
create policy "admins read invitations" on public.invitations for select to authenticated using (private.has_role(workspace_id,array['owner','admin']::public.member_role[]));
create policy "owners delete invitations" on public.invitations for delete to authenticated using (private.has_role(workspace_id,array['owner']::public.member_role[]));
create policy "members read assets" on public.media_assets for select to authenticated using (private.is_member(workspace_id));
create policy "production team inserts assets" on public.media_assets for insert to authenticated with check (private.has_role(workspace_id,array['owner','admin','content_manager','editor']::public.member_role[]));
create policy "production team updates assets" on public.media_assets for update to authenticated using (private.has_role(workspace_id,array['owner','admin','content_manager','editor']::public.member_role[])) with check (private.has_role(workspace_id,array['owner','admin','content_manager','editor']::public.member_role[]));
create policy "admins delete assets" on public.media_assets for delete to authenticated using (private.has_role(workspace_id,array['owner','admin']::public.member_role[]));
create policy "members read activity" on public.activity_logs for select to authenticated using (private.is_member(workspace_id));
create policy "members add activity" on public.activity_logs for insert to authenticated with check (private.is_member(workspace_id) and actor_id=(select auth.uid()));
create policy "owners delete activity" on public.activity_logs for delete to authenticated using (private.has_role(workspace_id,array['owner']::public.member_role[]));

revoke all on all tables in schema public from anon;
grant select,insert,update,delete on public.workspaces,public.workspace_members,public.channels,public.content_items,public.published_posts,public.metric_snapshots,public.automations,public.invitations,public.media_assets,public.activity_logs to authenticated;
grant usage,select on all sequences in schema public to authenticated;

create index workspace_members_user_status_idx on public.workspace_members(user_id,status);
create index workspace_members_workspace_role_idx on public.workspace_members(workspace_id,role);
create index invitations_email_active_idx on public.invitations(lower(email),accepted_at,expires_at desc);
create index content_items_workspace_status_idx on public.content_items(workspace_id,status);
create index published_posts_workspace_channel_idx on public.published_posts(workspace_id,channel_id);
create index published_posts_sync_idx on public.published_posts(next_sync_at) where status='published';
create index metric_snapshots_post_time_idx on public.metric_snapshots(published_post_id,captured_at desc);
create index activity_logs_workspace_time_idx on public.activity_logs(workspace_id,created_at desc);
create index authorized_users_added_by_idx on private.authorized_users(added_by);
create index workspaces_created_by_idx on public.workspaces(created_by);
create index content_items_primary_channel_idx on public.content_items(primary_channel_id);
create index content_items_owner_idx on public.content_items(owner_id);
create index content_items_created_by_idx on public.content_items(created_by);
create index published_posts_content_idx on public.published_posts(content_id);
create index published_posts_channel_idx on public.published_posts(channel_id);
create index automations_created_by_idx on public.automations(created_by);
create index invitations_workspace_idx on public.invitations(workspace_id);
create index invitations_invited_by_idx on public.invitations(invited_by);
create index media_assets_workspace_idx on public.media_assets(workspace_id);
create index media_assets_uploaded_by_idx on public.media_assets(uploaded_by);
create index activity_logs_actor_idx on public.activity_logs(actor_id);

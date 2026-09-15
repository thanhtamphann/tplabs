-- TPLabs ContentOps database schema for Supabase/PostgreSQL
create extension if not exists pgcrypto;

create type public.member_role as enum ('owner','admin','content_manager','scriptwriter','editor','reviewer','viewer');
create type public.content_status as enum ('idea','script','editing','review','approved','scheduled','published','failed','removed');

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  created_by uuid not null references auth.users(id) on delete restrict,
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
  invited_by uuid not null references auth.users(id) on delete cascade,
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

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.workspace_members where workspace_id = target_workspace and user_id = auth.uid() and status = 'active') $$;

create or replace function public.is_workspace_admin(target_workspace uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.workspace_members where workspace_id = target_workspace and user_id = auth.uid() and status = 'active' and role in ('owner','admin')) $$;

create or replace function public.create_personal_workspace(workspace_name text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.workspaces(name, created_by) values (workspace_name, auth.uid()) returning id into new_id;
  insert into public.workspace_members(workspace_id, user_id, email, display_name, role)
  values (new_id, auth.uid(), coalesce(auth.jwt()->>'email',''), coalesce(auth.jwt()->'user_metadata'->>'full_name', auth.jwt()->>'email'), 'owner');
  return new_id;
end;
$$;

create or replace function public.handle_invited_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare target_workspace uuid;
declare target_role public.member_role;
begin
  target_workspace := nullif(new.raw_user_meta_data->>'workspace_id','')::uuid;
  if target_workspace is null then return new; end if;
  target_role := coalesce(nullif(new.raw_user_meta_data->>'role','')::public.member_role, 'viewer');
  insert into public.workspace_members(workspace_id,user_id,email,display_name,role,status)
  values(target_workspace,new.id,coalesce(new.email,''),coalesce(new.raw_user_meta_data->>'full_name',new.email),target_role,'active')
  on conflict(workspace_id,user_id) do update set status='active', role=excluded.role;
  update public.invitations set accepted_at=now() where workspace_id=target_workspace and lower(email)=lower(new.email) and accepted_at is null;
  return new;
end;
$$;

drop trigger if exists on_invited_user_created on auth.users;
create trigger on_invited_user_created after insert on auth.users for each row execute function public.handle_invited_user();

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

create policy "members read workspaces" on public.workspaces for select using (public.is_workspace_member(id));
create policy "owners update workspaces" on public.workspaces for update using (public.is_workspace_admin(id));
create policy "members read memberships" on public.workspace_members for select using (public.is_workspace_member(workspace_id));
create policy "admins manage memberships" on public.workspace_members for all using (public.is_workspace_admin(workspace_id)) with check (public.is_workspace_admin(workspace_id));

create policy "members read channels" on public.channels for select using (public.is_workspace_member(workspace_id));
create policy "managers write channels" on public.channels for all using (public.is_workspace_admin(workspace_id)) with check (public.is_workspace_admin(workspace_id));
create policy "members read content" on public.content_items for select using (public.is_workspace_member(workspace_id));
create policy "members create content" on public.content_items for insert with check (public.is_workspace_member(workspace_id));
create policy "members update content" on public.content_items for update using (public.is_workspace_member(workspace_id));
create policy "admins delete content" on public.content_items for delete using (public.is_workspace_admin(workspace_id));
create policy "members read posts" on public.published_posts for select using (public.is_workspace_member(workspace_id));
create policy "members write posts" on public.published_posts for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members read metrics" on public.metric_snapshots for select using (exists(select 1 from public.published_posts p where p.id = published_post_id and public.is_workspace_member(p.workspace_id)));
create policy "members read automations" on public.automations for select using (public.is_workspace_member(workspace_id));
create policy "admins manage automations" on public.automations for all using (public.is_workspace_admin(workspace_id)) with check (public.is_workspace_admin(workspace_id));
create policy "admins manage invitations" on public.invitations for all using (public.is_workspace_admin(workspace_id)) with check (public.is_workspace_admin(workspace_id));
create policy "members read assets" on public.media_assets for select using (public.is_workspace_member(workspace_id));
create policy "members add assets" on public.media_assets for insert with check (public.is_workspace_member(workspace_id));
create policy "members read activity" on public.activity_logs for select using (public.is_workspace_member(workspace_id));

create index content_items_workspace_status_idx on public.content_items(workspace_id, status);
create index published_posts_sync_idx on public.published_posts(next_sync_at) where status = 'published';
create index metric_snapshots_post_time_idx on public.metric_snapshots(published_post_id, captured_at desc);
create index activity_logs_workspace_time_idx on public.activity_logs(workspace_id, created_at desc);

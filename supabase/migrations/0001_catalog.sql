-- Selly catalog schema.
--
-- Authorization lives in row level security, because the browser talks to
-- Postgres directly with the anon key and there is no application server in
-- between. Hiding the admin interface is not a control; these policies are.
--
-- Safe to run more than once.

-- ─── Administrators ─────────────────────────────────────────────────────────
-- Seeded by hand. No policy grants insert, update or delete, so no client path
-- can promote an account; only the service role — the SQL editor, or the seed
-- script — can add an administrator.

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  added_at timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists "Users read their own administrator record" on public.admins;
create policy "Users read their own administrator record"
  on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

-- security definer so the lookup is not itself subject to the policy above,
-- which would recurse when other policies call this function.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;

-- ─── Catalog ────────────────────────────────────────────────────────────────
-- `id` is a slug. It is the public URL segment and the key every analytics
-- counter is recorded against, so it cannot be renamed in place.

create table if not exists public.games (
  id text primary key
    constraint games_id_is_slug check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null
    constraint games_name_length check (char_length(name) between 2 and 120),
  short_description text not null
    constraint games_short_description_length
      check (char_length(short_description) between 10 and 200),
  full_description text not null
    constraint games_full_description_length
      check (char_length(full_description) >= 20),
  learning_objectives text[] not null default '{}',
  audience text not null default '',
  min_players integer not null
    constraint games_min_players_positive check (min_players >= 1),
  max_players integer not null,
  duration_minutes integer not null
    constraint games_duration_positive check (duration_minutes >= 1),
  categories text[] not null default '{}',
  tags text[] not null default '{}',
  resources jsonb not null default '[]'::jsonb,
  thumbnail jsonb,
  screenshots jsonb not null default '[]'::jsonb,
  launch_url text not null
    constraint games_launch_url_is_https check (launch_url like 'https://%'),
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint games_player_range check (max_players >= min_players)
);

create index if not exists games_catalog_order_idx
  on public.games (published, sort_order, name);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists games_touch_updated_at on public.games;
create trigger games_touch_updated_at
  before update on public.games
  for each row execute function public.touch_updated_at();

alter table public.games enable row level security;

-- Unpublished entries are invisible to the public. Unlike a document database,
-- Postgres filters rows itself, so the catalog query needs no special shape.
drop policy if exists "Published games are readable by everyone" on public.games;
create policy "Published games are readable by everyone"
  on public.games for select
  using (published or (select public.is_admin()));

drop policy if exists "Administrators create games" on public.games;
create policy "Administrators create games"
  on public.games for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Administrators update games" on public.games;
create policy "Administrators update games"
  on public.games for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Administrators delete games" on public.games;
create policy "Administrators delete games"
  on public.games for delete to authenticated
  using ((select public.is_admin()));

-- ─── Anonymous click analytics ──────────────────────────────────────────────
-- One row per game per hour. No visitor identifier is stored: not a name,
-- email, account id, cookie, session or address.
--
-- There is deliberately no foreign key to `games`: counters outlive the entries
-- they describe, so deleting a game never rewrites history.

create table if not exists public.click_counts (
  game_id text not null,
  hour timestamptz not null,
  click_count integer not null default 0,
  primary key (game_id, hour)
);

create index if not exists click_counts_hour_idx on public.click_counts (hour);

alter table public.click_counts enable row level security;

-- Counters are write-only to the public: visitors can cause an increment
-- through record_game_click(), but cannot read, set or delete one. No insert,
-- update or delete policy exists, so that function is the only way in.
drop policy if exists "Administrators read click counts" on public.click_counts;
create policy "Administrators read click counts"
  on public.click_counts for select to authenticated
  using ((select public.is_admin()));

-- Abuse throttling state. Unreachable from any client: row level security is on
-- and no policy grants anything, so only the security definer function below
-- can touch it.
create table if not exists public.click_rate_limit (
  ip_hash text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (ip_hash, window_start)
);

create index if not exists click_rate_limit_window_idx
  on public.click_rate_limit (window_start);

alter table public.click_rate_limit enable row level security;

-- A random salt, generated once here so the hashes in click_rate_limit cannot
-- be reversed into addresses by anyone who somehow reads the table.
create table if not exists public.analytics_secrets (
  singleton boolean primary key default true
    constraint analytics_secrets_single_row check (singleton),
  ip_salt text not null default gen_random_uuid()::text
);

insert into public.analytics_secrets (singleton) values (true)
  on conflict (singleton) do nothing;

alter table public.analytics_secrets enable row level security;

-- The only way a click is ever recorded.
--
-- Runs as the definer so it can write tables no client may touch, and is
-- written so the only effect an anonymous caller can have is "+1 for a
-- published game, in the current hour". It cannot be made to set an arbitrary
-- value, backdate a counter, or record anything about the caller.
--
-- Throttling keeps a salted one-way hash of the caller's address for a few
-- minutes, bucketed by minute. It is never written to click_counts and never
-- joined to it, so the analytics themselves stay anonymous.
--
-- The address itself prefers cf-connecting-ip, which Cloudflare sets from its
-- own view of the connection and overwrites on the way in, so a client cannot
-- forge it. Falling back to x-forwarded-for, the rightmost element is used
-- rather than the leftmost: proxies append to that header, so the last entry
-- is the address the nearest trusted proxy actually observed, while the first
-- is whatever the caller claimed and is trivial to spoof.
create or replace function public.record_game_click(p_game_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hour timestamptz;
  v_window timestamptz;
  v_headers json;
  v_xff_parts text[];
  v_client text;
  v_salt text;
  v_ip_hash text;
  v_hits integer;
  v_game_hash text;
  v_game_hits integer;
begin
  if not exists (
    select 1 from public.games where id = p_game_id and published
  ) then
    return;
  end if;

  v_hour := timezone('utc', date_trunc('hour', timezone('utc', now())));
  v_window := date_trunc('minute', now());

  v_headers := current_setting('request.headers', true)::json;
  v_xff_parts := string_to_array(coalesce(v_headers ->> 'x-forwarded-for', ''), ',');

  v_client := coalesce(
    nullif(v_headers ->> 'cf-connecting-ip', ''),
    nullif(trim(v_xff_parts[array_length(v_xff_parts, 1)]), ''),
    'unknown'
  );

  select ip_salt into v_salt from public.analytics_secrets limit 1;
  v_ip_hash := encode(sha256(convert_to(v_client || v_salt, 'UTF8')), 'hex');
  v_game_hash := encode(sha256(convert_to('game:' || p_game_id || v_salt, 'UTF8')), 'hex');

  -- Pruned occasionally rather than on every call: the table is tiny and a
  -- delete on each click would cost more than the rows it removes.
  if random() < 0.01 then
    delete from public.click_rate_limit
     where window_start < now() - interval '10 minutes';
  end if;

  insert into public.click_rate_limit as rl (ip_hash, window_start, hits)
  values (v_ip_hash, v_window, 1)
  on conflict (ip_hash, window_start)
    do update set hits = rl.hits + 1
  returning rl.hits into v_hits;

  -- Over the ceiling the call still returns normally, so a throttled client
  -- cannot detect the limit and adapt to it.
  if v_hits > 20 then
    return;
  end if;

  -- A second bucket, keyed by the game rather than the caller, caps how far
  -- any one game's counter can move in a minute even when the flood behind it
  -- is spread across many genuine addresses rather than coming from one.
  --
  -- It is reached only by callers already inside their own ceiling, which is
  -- what stops it becoming an easier attack than the one it defends against:
  -- were every request counted here, a single address could spend its rejected
  -- calls pushing this bucket over the edge and suppress everyone else's clicks
  -- for the rest of the minute.
  insert into public.click_rate_limit as rl (ip_hash, window_start, hits)
  values (v_game_hash, v_window, 1)
  on conflict (ip_hash, window_start)
    do update set hits = rl.hits + 1
  returning rl.hits into v_game_hits;

  if v_game_hits > 600 then
    return;
  end if;

  insert into public.click_counts as cc (game_id, hour, click_count)
  values (p_game_id, v_hour, 1)
  on conflict (game_id, hour)
    do update set click_count = cc.click_count + 1;
end;
$$;

-- The dashboard reads its figures through these two aggregates rather than
-- fetching raw click_counts rows into the browser and summing them there.
-- Supabase caps API responses at 1000 rows and truncates silently, and
-- because the raw rows would be ordered oldest first, a truncated read would
-- understate exactly the most recent traffic instead of erroring.
create or replace function public.click_totals_by_game(p_days integer default 30)
returns table (game_id text, click_count bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_days integer;
  v_since timestamptz;
begin
  if not (select public.is_admin()) then
    raise exception 'only administrators may read click analytics'
      using errcode = '42501';
  end if;

  v_days := least(greatest(coalesce(p_days, 30), 1), 365);
  v_since := timezone('utc', date_trunc('hour', timezone('utc', now())))
    - (v_days || ' days')::interval;

  return query
    select cc.game_id, sum(cc.click_count)::bigint
      from public.click_counts cc
     where cc.hour >= v_since
     group by cc.game_id
     order by 2 desc;
end;
$$;

create or replace function public.click_series_hourly(p_hours integer default 48)
returns table (hour timestamptz, click_count bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_hours integer;
  v_current_hour timestamptz;
begin
  if not (select public.is_admin()) then
    raise exception 'only administrators may read click analytics'
      using errcode = '42501';
  end if;

  v_hours := least(greatest(coalesce(p_hours, 48), 1), 720);
  v_current_hour := timezone('utc', date_trunc('hour', timezone('utc', now())));

  -- generate_series supplies the dense hourly spine so an hour with no clicks
  -- is returned as a zero rather than a gap; a gap in the chart would read as
  -- no data rather than no traffic.
  return query
    select spine.hour, coalesce(sum(cc.click_count), 0)::bigint
      from generate_series(
             v_current_hour - ((v_hours - 1) || ' hours')::interval,
             v_current_hour,
             interval '1 hour'
           ) as spine(hour)
      left join public.click_counts cc on cc.hour = spine.hour
     group by spine.hour
     order by 1;
end;
$$;

-- ─── Grants ─────────────────────────────────────────────────────────────────
-- Row level security decides which rows are visible; these decide which verbs
-- exist at all.

grant usage on schema public to anon, authenticated, service_role;

grant select on public.games to anon, authenticated;
grant insert, update, delete on public.games to authenticated;
grant select on public.admins to authenticated;
grant select on public.click_counts to authenticated;

-- service_role is the trusted server-side identity, used by the seed script and
-- anything else holding the secret key. It bypasses row level security, so its
-- table privileges are what decide its reach — without these it cannot read or
-- write the catalog at all.
grant select, insert, update, delete on public.games to service_role;
grant select, insert, update, delete on public.admins to service_role;
grant select on public.click_counts to service_role;

-- The throttling state and the hashing salt stay unreachable from every API
-- role. record_game_click() is security definer, so it reaches them as the
-- owner and needs no grant here.
revoke all on public.click_rate_limit from anon, authenticated, service_role;
revoke all on public.analytics_secrets from anon, authenticated, service_role;

grant execute on function public.record_game_click(text) to anon, authenticated;

-- anon needs this too: the catalog's select policy evaluates is_admin(), and a
-- caller without execute permission would error instead of reading the catalog.
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- These are security definer and carry their own admin check in the body, so
-- the grant only needs to reach authenticated callers; Postgres grants execute
-- on new functions to PUBLIC by default, so that default is revoked first.
revoke all on function public.click_totals_by_game(integer) from public, anon;
grant execute on function public.click_totals_by_game(integer) to authenticated;

revoke all on function public.click_series_hourly(integer) from public, anon;
grant execute on function public.click_series_hourly(integer) to authenticated;

-- Verifies the access rules actually hold. Paste into the Supabase SQL editor
-- and run it after applying the migrations.
--
-- Everything happens inside a transaction that is rolled back, so it leaves no
-- fixtures behind. It raises an exception on the first failure; reaching the
-- final notice means every check passed.

begin;

-- ─── Fixtures (created as the owning role, which bypasses RLS) ──────────────

insert into public.games (
  id, name, short_description, full_description,
  min_players, max_players, duration_minutes, launch_url, published
) values
  ('verify-published', 'Published Fixture', 'A published catalog fixture.',
   'A published fixture used only by the verification script.',
   2, 4, 60, 'https://example.com/published', true),
  ('verify-draft', 'Draft Fixture', 'An unpublished catalog fixture.',
   'An unpublished fixture used only by the verification script.',
   2, 4, 60, 'https://example.com/draft', false);

-- ─── An anonymous visitor ───────────────────────────────────────────────────

set local role anon;

do $$
declare
  v_count integer;
  v_blocked boolean;
begin
  select count(*) into v_count from public.games where id like 'verify-%';
  if v_count <> 1 then
    raise exception 'anon should see exactly the 1 published fixture, saw %', v_count;
  end if;

  select count(*) into v_count from public.games where id = 'verify-draft';
  if v_count <> 0 then
    raise exception 'anon can read an unpublished game';
  end if;

  v_blocked := false;
  begin
    insert into public.games (
      id, name, short_description, full_description,
      min_players, max_players, duration_minutes, launch_url, published
    ) values ('verify-injected', 'Injected', 'Should never be written.',
              'Should never be written by an anonymous client.',
              1, 1, 1, 'https://example.com/x', true);
  exception when others then v_blocked := true;
  end;
  if not v_blocked then raise exception 'anon can create a game'; end if;

  v_blocked := false;
  begin
    update public.games set published = true where id = 'verify-draft';
    if not found then v_blocked := true; end if;
  exception when others then v_blocked := true;
  end;
  if not v_blocked then raise exception 'anon can publish a game'; end if;

  v_blocked := false;
  begin
    delete from public.games where id = 'verify-published';
    if not found then v_blocked := true; end if;
  exception when others then v_blocked := true;
  end;
  if not v_blocked then raise exception 'anon can delete a game'; end if;

  v_blocked := false;
  begin
    perform 1 from public.click_counts;
  exception when others then v_blocked := true;
  end;
  if not v_blocked then raise exception 'anon can read the click counters'; end if;

  v_blocked := false;
  begin
    perform 1 from public.admins;
  exception when others then v_blocked := true;
  end;
  if not v_blocked then raise exception 'anon can read the administrator list'; end if;

  v_blocked := false;
  begin
    perform 1 from public.click_rate_limit;
  exception when others then v_blocked := true;
  end;
  if not v_blocked then raise exception 'anon can read the rate limit table'; end if;

  v_blocked := false;
  begin
    perform 1 from public.analytics_secrets;
  exception when others then v_blocked := true;
  end;
  if not v_blocked then raise exception 'anon can read the analytics salt'; end if;

  v_blocked := false;
  begin
    perform public.click_totals_by_game(30);
  exception when others then v_blocked := true;
  end;
  if not v_blocked then raise exception 'anon can call click_totals_by_game'; end if;

  v_blocked := false;
  begin
    perform public.click_series_hourly(48);
  exception when others then v_blocked := true;
  end;
  if not v_blocked then raise exception 'anon can call click_series_hourly'; end if;

  raise notice 'anonymous access: OK';
end $$;

-- ─── Recording clicks ───────────────────────────────────────────────────────
-- Still acting as anon: an anonymous visitor must be able to call the function.
-- The counters themselves are unreadable at this role, so the assertions run
-- after switching back.

do $$
begin
  perform public.record_game_click('verify-published');
  perform public.record_game_click('verify-published');
  perform public.record_game_click('verify-draft');
  perform public.record_game_click('verify-does-not-exist');
end $$;

reset role;

do $$
declare
  v_count integer;
  v_hour timestamptz := timezone('utc', date_trunc('hour', timezone('utc', now())));
begin
  select click_count into v_count
    from public.click_counts where game_id = 'verify-published' and hour = v_hour;
  if coalesce(v_count, 0) <> 2 then
    raise exception 'two anonymous clicks should leave the counter at 2, got %',
      coalesce(v_count, 0);
  end if;

  select count(*) into v_count from public.click_counts where game_id = 'verify-draft';
  if v_count <> 0 then raise exception 'a click was recorded for an unpublished game'; end if;

  select count(*) into v_count
    from public.click_counts where game_id = 'verify-does-not-exist';
  if v_count <> 0 then raise exception 'a click was recorded for an unknown game'; end if;

  raise notice 'click recording: OK';
end $$;

-- ─── Per-game click ceiling ─────────────────────────────────────────────────
-- A flood spread across many genuine addresses would clear the per-caller
-- ceiling one bucket at a time, so a second ceiling caps how far any single
-- game's counter can move in a minute regardless of how many callers are
-- behind it. Pre-loading that game's bucket to the ceiling and issuing one
-- more call — well within the per-caller ceiling on its own — proves it is
-- the game bucket, not the caller bucket, doing the blocking.

insert into public.games (
  id, name, short_description, full_description,
  min_players, max_players, duration_minutes, launch_url, published
) values
  ('verify-game-ceiling', 'Game Ceiling Fixture', 'A fixture for the per-game ceiling.',
   'A published fixture used only to verify the per-game click ceiling.',
   2, 4, 60, 'https://example.com/game-ceiling', true);

do $$
declare
  v_salt text;
  v_game_hash text;
begin
  select ip_salt into v_salt from public.analytics_secrets limit 1;
  v_game_hash := encode(
    sha256(convert_to('game:verify-game-ceiling' || v_salt, 'UTF8')), 'hex'
  );

  insert into public.click_rate_limit (ip_hash, window_start, hits)
  values (v_game_hash, date_trunc('minute', now()), 600);
end $$;

set local role anon;

do $$
begin
  perform public.record_game_click('verify-game-ceiling');
end $$;

reset role;

do $$
declare
  v_count integer;
  v_hour timestamptz := timezone('utc', date_trunc('hour', timezone('utc', now())));
begin
  select click_count into v_count
    from public.click_counts where game_id = 'verify-game-ceiling' and hour = v_hour;
  if coalesce(v_count, 0) <> 0 then
    raise exception 'the per-game ceiling did not engage: click was recorded anyway';
  end if;

  raise notice 'per-game ceiling: OK';
end $$;

-- ─── Rate limiting ──────────────────────────────────────────────────────────

set local role anon;

do $$
begin
  for i in 1..40 loop
    perform public.record_game_click('verify-published');
  end loop;
end $$;

reset role;

do $$
declare
  v_count integer;
  v_hour timestamptz := timezone('utc', date_trunc('hour', timezone('utc', now())));
begin
  select click_count into v_count
    from public.click_counts where game_id = 'verify-published' and hour = v_hour;

  -- 42 calls were made in total. The ceiling is 20 per minute, so the count
  -- must be well below 42 — not exactly 20, because the run can straddle a
  -- minute boundary and open a second window.
  if v_count >= 42 then
    raise exception 'rate limit did not hold: every one of 42 attempts was counted';
  end if;

  if v_count > 40 then
    raise exception 'rate limit barely applied: % of 42 attempts were counted', v_count;
  end if;

  raise notice 'rate limiting: OK (% of 42 attempts counted)', v_count;
end $$;

-- ─── A signed-in visitor who is not an administrator ────────────────────────

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

do $$
declare
  v_count integer;
  v_blocked boolean;
begin
  if public.is_admin() then raise exception 'a random signed-in user reads as admin'; end if;

  select count(*) into v_count from public.games where id = 'verify-draft';
  if v_count <> 0 then
    raise exception 'a non-administrator can read an unpublished game';
  end if;

  v_blocked := false;
  begin
    insert into public.games (
      id, name, short_description, full_description,
      min_players, max_players, duration_minutes, launch_url, published
    ) values ('verify-user-injected', 'Injected', 'Should never be written.',
              'Should never be written by a signed-in non-administrator.',
              1, 1, 1, 'https://example.com/x', true);
  exception when others then v_blocked := true;
  end;
  if not v_blocked then raise exception 'a non-administrator can create a game'; end if;

  v_blocked := false;
  begin
    insert into public.admins (user_id, email)
    values ('11111111-1111-1111-1111-111111111111', 'attacker@example.com');
  exception when others then v_blocked := true;
  end;
  if not v_blocked then raise exception 'a user can promote themselves to administrator'; end if;

  select count(*) into v_count from public.click_counts;
  if v_count <> 0 then
    raise exception 'a non-administrator can read the click counters';
  end if;

  v_blocked := false;
  begin
    perform public.click_totals_by_game(30);
  exception when others then v_blocked := true;
  end;
  if not v_blocked then
    raise exception 'a non-administrator can call click_totals_by_game';
  end if;

  v_blocked := false;
  begin
    perform public.click_series_hourly(48);
  exception when others then v_blocked := true;
  end;
  if not v_blocked then
    raise exception 'a non-administrator can call click_series_hourly';
  end if;

  raise notice 'signed-in non-administrator: OK';
end $$;

reset role;

-- ─── An administrator ───────────────────────────────────────────────────────
-- admins.user_id carries a foreign key to auth.users, so the fixture needs a
-- matching row there too; the owning role used to paste this script in can
-- write to the auth schema directly, and the insert rolls back with everything
-- else.

insert into auth.users (id) values ('22222222-2222-2222-2222-222222222222');

insert into public.admins (user_id, email)
values ('22222222-2222-2222-2222-222222222222', 'verify-admin@example.com');

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

do $$
declare
  v_hour timestamptz := timezone('utc', date_trunc('hour', timezone('utc', now())));
  v_series_count integer;
  v_last_hour timestamptz;
  v_series_sum bigint;
  v_totals_sum bigint;
  v_published_count bigint;
  v_expected_count bigint;
begin
  if not public.is_admin() then
    raise exception 'the seeded administrator does not read as admin';
  end if;

  select count(*), max(hour) into v_series_count, v_last_hour
    from public.click_series_hourly(48);
  if v_series_count <> 48 then
    raise exception 'click_series_hourly(48) should return 48 rows, got %', v_series_count;
  end if;
  if v_last_hour <> v_hour then
    raise exception 'click_series_hourly(48) should end on the current UTC hour';
  end if;

  select coalesce(sum(click_count), 0) into v_series_sum from public.click_series_hourly(48);
  select coalesce(sum(click_count), 0) into v_totals_sum from public.click_totals_by_game(30);
  if v_series_sum <> v_totals_sum then
    raise exception
      'click_series_hourly and click_totals_by_game disagree: % vs %',
      v_series_sum, v_totals_sum;
  end if;

  select coalesce(sum(click_count), 0) into v_expected_count
    from public.click_counts where game_id = 'verify-published';
  select click_count into v_published_count
    from public.click_totals_by_game(30) where game_id = 'verify-published';
  if v_published_count <> v_expected_count then
    raise exception
      'click_totals_by_game reported % clicks for verify-published, expected %',
      v_published_count, v_expected_count;
  end if;

  if (select count(*) from public.click_series_hourly(100000)) <> 720 then
    raise exception 'click_series_hourly(100000) should clamp to 720 rows';
  end if;

  if (select count(*) from public.click_series_hourly(0)) <> 1 then
    raise exception 'click_series_hourly(0) should clamp to 1 row';
  end if;

  raise notice 'administrator analytics: OK';
end $$;

reset role;

rollback;

do $$ begin raise notice 'All access rule checks passed.'; end $$;

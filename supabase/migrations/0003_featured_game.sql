-- The featured game.
--
-- An administrator picks at most one catalog entry to feature. The landing page
-- and the catalog list it first, on the accented tile; with none picked, no
-- tile is accented. Both rules — at most one, and only a published entry — are
-- held by the database rather than by the admin portal.
--
-- Run after 0001_catalog.sql. Safe to run more than once.

alter table public.games
  add column if not exists featured boolean not null default false;

-- A draft is invisible to the public, so featuring one would accent nothing.
alter table public.games drop constraint if exists games_featured_is_published;
alter table public.games
  add constraint games_featured_is_published check (published or not featured);

-- A unique index over the featured rows alone admits a single `true`, so "one
-- at a time" holds however the row is written.
create unique index if not exists games_single_featured_idx
  on public.games (featured) where featured;

-- The public catalog sorts the featured entry first, then by sort order.
drop index if exists public.games_catalog_order_idx;
create index games_catalog_order_idx
  on public.games (published, featured desc, sort_order, name);

-- Unpublishing the featured game un-features it in the same write, so the check
-- above never turns an ordinary unpublish into an error.
create or replace function public.unfeature_unpublished()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not new.published then
    new.featured := false;
  end if;
  return new;
end;
$$;

drop trigger if exists games_unfeature_unpublished on public.games;
create trigger games_unfeature_unpublished
  before insert or update on public.games
  for each row execute function public.unfeature_unpublished();

-- How the admin portal changes the featured game. Pass null to feature nothing.
--
-- The old choice is cleared and the new one set in one transaction, so no
-- reader ever sees two featured games, or none in between. It takes two
-- statements rather than one because the unique index is checked row by row:
-- a single update flipping both rows could trip it, depending on the order the
-- rows are visited.
--
-- security invoker, so the update policy on games still decides who may write.
-- The explicit check only turns a non-administrator's silent no-op into an
-- error, and the published check turns a draft into a clear refusal rather
-- than a constraint violation.
create or replace function public.set_featured_game(p_game_id text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'only administrators may choose the featured game'
      using errcode = '42501';
  end if;

  if p_game_id is not null and not exists (
    select 1 from public.games where id = p_game_id and published
  ) then
    raise exception 'only a published game can be featured'
      using errcode = '22023';
  end if;

  update public.games set featured = false
   where featured and id is distinct from p_game_id;

  update public.games set featured = true
   where id = p_game_id and not featured;
end;
$$;

revoke all on function public.set_featured_game(text) from public, anon;
grant execute on function public.set_featured_game(text) to authenticated;

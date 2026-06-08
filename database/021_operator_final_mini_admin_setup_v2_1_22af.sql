-- NONSTOP V2.1.22AF – Operator Final + Mini Admin Setup
-- Güvenli tamamlayıcı SQL. Mevcut tabloları silmez.

alter table public.matches
add column if not exists match_kind varchar(30) default 'OFFICIAL',
add column if not exists roster_limit integer default 12,
add column if not exists counts_for_standings boolean default true,
add column if not exists counts_for_season_stats boolean default true,
add column if not exists competition_id bigint references public.competitions(id),
add column if not exists competition_type varchar(30) default 'LEAGUE';

alter table public.match_rosters
add column if not exists roster_type varchar(30) default 'OFFICIAL',
add column if not exists is_special_match boolean default false;

create table if not exists public.operator_assignments (
  id bigserial primary key,
  match_id bigint not null references public.matches(id) on delete cascade,
  operator_id uuid references public.users(id),
  team_id bigint references public.teams(id),
  operator_side varchar(10) not null,
  can_start_clock boolean default false,
  is_active boolean default true,
  created_at timestamp without time zone default now(),
  constraint operator_assignments_side_check check (operator_side in ('HOME','AWAY'))
);

create index if not exists idx_operator_assignments_match on public.operator_assignments(match_id);
create index if not exists idx_matches_venue_datetime on public.matches(venue_id, match_datetime);
create index if not exists idx_matches_competition on public.matches(competition_id);

update public.matches
set roster_limit = 24,
    counts_for_standings = false,
    counts_for_season_stats = false
where match_kind in ('FRIENDLY', 'SPECIAL_MATCH');

update public.matches
set roster_limit = 12
where match_kind in ('OFFICIAL', 'TOURNAMENT') or match_kind is null;

create or replace view public.operator_today_matches
with (security_invoker = true) as
select
  m.id as match_id,
  m.match_datetime,
  m.status,
  m.match_kind,
  m.roster_limit,
  m.counts_for_standings,
  m.counts_for_season_stats,
  c.id as city_id,
  c.name as city_name,
  v.id as venue_id,
  v.name as venue_name,
  ht.id as home_team_id,
  ht.name as home_team_name,
  at.id as away_team_id,
  at.name as away_team_name,
  cmp.id as competition_id,
  cmp.name as competition_name,
  cmp.competition_type,
  cmp.league_level
from public.matches m
left join public.venues v on v.id = m.venue_id
left join public.cities c on c.id = v.city_id
left join public.teams ht on ht.id = m.home_team_id
left join public.teams at on at.id = m.away_team_id
left join public.competitions cmp on cmp.id = m.competition_id
where m.match_datetime::date = current_date
order by m.match_datetime asc;

create or replace view public.mini_admin_recent_matches
with (security_invoker = true) as
select
  m.id as match_id,
  m.match_datetime,
  m.status,
  m.match_kind,
  v.name as venue_name,
  ht.name as home_team_name,
  at.name as away_team_name,
  cmp.name as competition_name
from public.matches m
left join public.venues v on v.id = m.venue_id
left join public.teams ht on ht.id = m.home_team_id
left join public.teams at on at.id = m.away_team_id
left join public.competitions cmp on cmp.id = m.competition_id
order by m.match_datetime desc
limit 50;

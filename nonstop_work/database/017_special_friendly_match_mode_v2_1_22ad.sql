-- NONSTOP V2.1.22AD - Special / Friendly Match Mode
-- Amaç: Hazırlık maçı, özel maç, karma takım maçı gibi organizasyonları
-- lig puan durumuna karıştırmadan kendi içinde istatistik ve şut haritası tutmak.

alter table public.competitions
add column if not exists counts_for_standings boolean default true,
add column if not exists counts_for_season_stats boolean default true,
add column if not exists is_special_roster boolean default false,
add column if not exists supervisor_notes text;

alter table public.matches
add column if not exists counts_for_standings boolean default true,
add column if not exists counts_for_season_stats boolean default true,
add column if not exists is_special_match boolean default false,
add column if not exists supervisor_id uuid,
add column if not exists special_match_notes text;

create table if not exists public.special_match_rosters (
  id bigserial primary key,
  match_id bigint references public.matches(id) on delete cascade,
  competition_id bigint references public.competitions(id) on delete cascade,
  team_side varchar(10) not null default 'HOME',
  team_label varchar(255),
  source_team_id bigint references public.teams(id),
  player_id bigint references public.players(id),
  player_label varchar(255),
  jersey_number varchar(20),
  is_guest_player boolean default false,
  is_starter boolean default false,
  is_active boolean default true,
  created_at timestamp without time zone default now(),
  constraint special_match_rosters_side_check check (team_side in ('HOME','AWAY'))
);

create index if not exists special_match_rosters_match_idx
on public.special_match_rosters(match_id, team_side);

create or replace view public.live_special_matches
with (security_invoker = true) as
select
  m.id as match_id,
  m.competition_id,
  c.name as competition_name,
  c.competition_type,
  m.is_special_match,
  m.counts_for_standings,
  m.counts_for_season_stats,
  m.special_match_notes,
  m.status,
  m.created_at
from public.matches m
left join public.competitions c on c.id = m.competition_id
where coalesce(m.is_special_match, false) = true
   or c.competition_type in ('FRIENDLY', 'SPECIAL_MATCH');

-- NONSTOP V2.1.22AD-2 - Special/Friendly Roster Limit + Separate Stats
-- Resmi maç: maksimum 12 oyuncu
-- Özel/Hazırlık maçı: maksimum 24 oyuncu
-- Özel/Hazırlık maçları sezon ve puan durumuna işlemez; ayrı istatistik bölümünde tutulur.

alter table public.competitions
add column if not exists max_roster_size integer default 12;

alter table public.matches
add column if not exists max_roster_size integer default 12;

-- Özel/hazırlık maçları için varsayılan davranış: puan/sezon tablosuna işlemez, kadro limiti 24 olur.
update public.competitions
set
  counts_for_standings = false,
  counts_for_season_stats = false,
  max_roster_size = 24
where competition_type in ('FRIENDLY', 'SPECIAL_MATCH');

update public.matches
set
  counts_for_standings = false,
  counts_for_season_stats = false,
  max_roster_size = 24
where coalesce(is_special_match, false) = true
   or competition_type in ('FRIENDLY', 'SPECIAL_MATCH');

create table if not exists public.player_special_match_stats (
  id bigserial primary key,
  match_id bigint references public.matches(id) on delete cascade,
  competition_id bigint references public.competitions(id) on delete set null,
  team_id bigint references public.teams(id),
  player_id bigint references public.players(id),

  games_played integer default 1,
  points integer default 0,
  oreb integer default 0,
  dreb integer default 0,
  rebounds integer default 0,
  assists integer default 0,
  steals integer default 0,
  blocks integer default 0,
  turnovers integer default 0,
  fouls integer default 0,

  fgm integer default 0,
  fga integer default 0,
  fg_pct numeric default 0,
  tpm integer default 0,
  tpa integer default 0,
  tp_pct numeric default 0,
  ftm integer default 0,
  fta integer default 0,
  ft_pct numeric default 0,

  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now(),

  constraint player_special_match_stats_unique unique (match_id, team_id, player_id)
);

create table if not exists public.team_special_match_stats (
  id bigserial primary key,
  match_id bigint references public.matches(id) on delete cascade,
  competition_id bigint references public.competitions(id) on delete set null,
  team_id bigint references public.teams(id),

  games_played integer default 1,
  points integer default 0,
  oreb integer default 0,
  dreb integer default 0,
  rebounds integer default 0,
  assists integer default 0,
  steals integer default 0,
  blocks integer default 0,
  turnovers integer default 0,
  fouls integer default 0,

  fgm integer default 0,
  fga integer default 0,
  fg_pct numeric default 0,
  tpm integer default 0,
  tpa integer default 0,
  tp_pct numeric default 0,
  ftm integer default 0,
  fta integer default 0,
  ft_pct numeric default 0,

  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now(),

  constraint team_special_match_stats_unique unique (match_id, team_id)
);

create or replace view public.live_special_player_stats
with (security_invoker = true) as
select
  ps.match_id,
  ps.competition_id,
  ps.team_id,
  ps.player_id,
  p.full_name as player_name,
  ps.points,
  ps.rebounds,
  ps.assists,
  ps.steals,
  ps.blocks,
  ps.turnovers,
  ps.fouls,
  ps.fg_pct,
  ps.tp_pct,
  ps.ft_pct,
  ps.updated_at
from public.player_special_match_stats ps
left join public.players p on p.id = ps.player_id;

create or replace view public.live_special_team_stats
with (security_invoker = true) as
select
  ts.match_id,
  ts.competition_id,
  ts.team_id,
  t.name as team_name,
  ts.points,
  ts.rebounds,
  ts.assists,
  ts.steals,
  ts.blocks,
  ts.turnovers,
  ts.fouls,
  ts.fg_pct,
  ts.tp_pct,
  ts.ft_pct,
  ts.updated_at
from public.team_special_match_stats ts
left join public.teams t on t.id = ts.team_id;

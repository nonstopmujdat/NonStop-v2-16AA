-- NONSTOP V2.1.22AE-1 - Player & Team Career Cards Foundation
-- Oyuncu ve takım kartlarında Resmi / Özel-Hazırlık / Turnuva sekmeleri için güvenli altyapı.

-- 1) Maç ve şut istatistik kolonları yoksa tamamla.
alter table public.player_game_stats
  add column if not exists team_id bigint references public.teams(id),
  add column if not exists oreb integer default 0,
  add column if not exists dreb integer default 0,
  add column if not exists fgm integer default 0,
  add column if not exists fga integer default 0,
  add column if not exists tpm integer default 0,
  add column if not exists tpa integer default 0,
  add column if not exists ftm integer default 0,
  add column if not exists fta integer default 0,
  add column if not exists updated_at timestamp without time zone default now();

alter table public.team_game_stats
  add column if not exists oreb integer default 0,
  add column if not exists dreb integer default 0,
  add column if not exists fgm integer default 0,
  add column if not exists fga integer default 0,
  add column if not exists tpm integer default 0,
  add column if not exists tpa integer default 0,
  add column if not exists ftm integer default 0,
  add column if not exists fta integer default 0,
  add column if not exists fg_pct numeric default 0,
  add column if not exists tp_pct numeric default 0,
  add column if not exists ft_pct numeric default 0,
  add column if not exists updated_at timestamp without time zone default now();

-- 2) Sezon istatistik tabloları: resmi maçlar için ayrı tutulur.
create table if not exists public.player_season_stats (
  id bigserial primary key,
  season_id bigint references public.seasons(id),
  competition_id bigint references public.competitions(id),
  team_id bigint references public.teams(id),
  player_id bigint references public.players(id),
  games_played integer default 0,
  games_started integer default 0,
  minutes_played numeric default 0,
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
  ppg numeric default 0,
  rpg numeric default 0,
  apg numeric default 0,
  spg numeric default 0,
  bpg numeric default 0,
  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now(),
  constraint player_season_stats_unique_ae1 unique (season_id, competition_id, team_id, player_id)
);

create table if not exists public.team_season_stats (
  id bigserial primary key,
  season_id bigint references public.seasons(id),
  competition_id bigint references public.competitions(id),
  team_id bigint references public.teams(id),
  games_played integer default 0,
  wins integer default 0,
  losses integer default 0,
  points_for integer default 0,
  points_against integer default 0,
  point_diff integer default 0,
  league_points integer default 0,
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
  constraint team_season_stats_unique_ae1 unique (season_id, competition_id, team_id)
);

-- 3) Özel/hazırlık istatistik tabloları yoksa kur.
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
  constraint player_special_match_stats_unique_ae1 unique (match_id, team_id, player_id)
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
  constraint team_special_match_stats_unique_ae1 unique (match_id, team_id)
);

-- 4) Oyuncu kariyer kartı: Resmi / Özel-Hazırlık / Turnuva / Toplam.
create or replace view public.player_career_sections
with (security_invoker = true) as
with base as (
  select
    'RESMI'::text as section_code,
    'Resmi Maçlar'::text as section_name,
    pgs.player_id,
    pgs.team_id,
    count(distinct pgs.match_id)::integer as games_played,
    coalesce(sum(pgs.points),0)::integer as points,
    coalesce(sum(pgs.rebounds),0)::integer as rebounds,
    coalesce(sum(pgs.assists),0)::integer as assists,
    coalesce(sum(pgs.steals),0)::integer as steals,
    coalesce(sum(pgs.blocks),0)::integer as blocks,
    coalesce(sum(pgs.turnovers),0)::integer as turnovers,
    coalesce(sum(pgs.fouls),0)::integer as fouls,
    coalesce(sum(pgs.fgm),0)::integer as fgm,
    coalesce(sum(pgs.fga),0)::integer as fga,
    coalesce(sum(pgs.tpm),0)::integer as tpm,
    coalesce(sum(pgs.tpa),0)::integer as tpa,
    coalesce(sum(pgs.ftm),0)::integer as ftm,
    coalesce(sum(pgs.fta),0)::integer as fta
  from public.player_game_stats pgs
  left join public.matches m on m.id = pgs.match_id
  left join public.competitions cmp on cmp.id = m.competition_id
  where coalesce(cmp.competition_type, 'LEAGUE') in ('LEAGUE','SEASON')
    and coalesce(cmp.counts_for_season_stats, true) = true
  group by pgs.player_id, pgs.team_id

  union all

  select
    'OZEL_HAZIRLIK'::text,
    'Özel / Hazırlık Maçları'::text,
    ps.player_id,
    ps.team_id,
    coalesce(sum(ps.games_played),0)::integer,
    coalesce(sum(ps.points),0)::integer,
    coalesce(sum(ps.rebounds),0)::integer,
    coalesce(sum(ps.assists),0)::integer,
    coalesce(sum(ps.steals),0)::integer,
    coalesce(sum(ps.blocks),0)::integer,
    coalesce(sum(ps.turnovers),0)::integer,
    coalesce(sum(ps.fouls),0)::integer,
    coalesce(sum(ps.fgm),0)::integer,
    coalesce(sum(ps.fga),0)::integer,
    coalesce(sum(ps.tpm),0)::integer,
    coalesce(sum(ps.tpa),0)::integer,
    coalesce(sum(ps.ftm),0)::integer,
    coalesce(sum(ps.fta),0)::integer
  from public.player_special_match_stats ps
  left join public.competitions cmp on cmp.id = ps.competition_id
  where coalesce(cmp.competition_type, 'FRIENDLY') in ('FRIENDLY','SPECIAL_MATCH')
  group by ps.player_id, ps.team_id

  union all

  select
    'TURNUVA'::text,
    'Turnuvalar'::text,
    pgs.player_id,
    pgs.team_id,
    count(distinct pgs.match_id)::integer,
    coalesce(sum(pgs.points),0)::integer,
    coalesce(sum(pgs.rebounds),0)::integer,
    coalesce(sum(pgs.assists),0)::integer,
    coalesce(sum(pgs.steals),0)::integer,
    coalesce(sum(pgs.blocks),0)::integer,
    coalesce(sum(pgs.turnovers),0)::integer,
    coalesce(sum(pgs.fouls),0)::integer,
    coalesce(sum(pgs.fgm),0)::integer,
    coalesce(sum(pgs.fga),0)::integer,
    coalesce(sum(pgs.tpm),0)::integer,
    coalesce(sum(pgs.tpa),0)::integer,
    coalesce(sum(pgs.ftm),0)::integer,
    coalesce(sum(pgs.fta),0)::integer
  from public.player_game_stats pgs
  join public.matches m on m.id = pgs.match_id
  join public.competitions cmp on cmp.id = m.competition_id
  where cmp.competition_type = 'TOURNAMENT'
  group by pgs.player_id, pgs.team_id
), totals as (
  select * from base
  union all
  select
    'TOPLAM'::text,
    'Toplam'::text,
    player_id,
    team_id,
    coalesce(sum(games_played),0)::integer,
    coalesce(sum(points),0)::integer,
    coalesce(sum(rebounds),0)::integer,
    coalesce(sum(assists),0)::integer,
    coalesce(sum(steals),0)::integer,
    coalesce(sum(blocks),0)::integer,
    coalesce(sum(turnovers),0)::integer,
    coalesce(sum(fouls),0)::integer,
    coalesce(sum(fgm),0)::integer,
    coalesce(sum(fga),0)::integer,
    coalesce(sum(tpm),0)::integer,
    coalesce(sum(tpa),0)::integer,
    coalesce(sum(ftm),0)::integer,
    coalesce(sum(fta),0)::integer
  from base
  group by player_id, team_id
)
select
  t.section_code,
  t.section_name,
  t.player_id,
  trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')) as player_name,
  t.team_id,
  tm.name as team_name,
  t.games_played,
  t.points,
  t.rebounds,
  t.assists,
  t.steals,
  t.blocks,
  t.turnovers,
  t.fouls,
  t.fgm,
  t.fga,
  case when t.fga > 0 then round((t.fgm::numeric / t.fga::numeric) * 100, 1) else 0 end as fg_pct,
  t.tpm,
  t.tpa,
  case when t.tpa > 0 then round((t.tpm::numeric / t.tpa::numeric) * 100, 1) else 0 end as tp_pct,
  t.ftm,
  t.fta,
  case when t.fta > 0 then round((t.ftm::numeric / t.fta::numeric) * 100, 1) else 0 end as ft_pct,
  case when t.games_played > 0 then round(t.points::numeric / t.games_played, 1) else 0 end as ppg,
  case when t.games_played > 0 then round(t.rebounds::numeric / t.games_played, 1) else 0 end as rpg,
  case when t.games_played > 0 then round(t.assists::numeric / t.games_played, 1) else 0 end as apg
from totals t
left join public.players p on p.id = t.player_id
left join public.teams tm on tm.id = t.team_id;

-- 5) Takım kariyer kartı: Resmi / Özel-Hazırlık / Turnuva / Toplam.
create or replace view public.team_career_sections
with (security_invoker = true) as
with base as (
  select
    'RESMI'::text as section_code,
    'Resmi Maçlar'::text as section_name,
    tgs.team_id,
    count(distinct tgs.match_id)::integer as games_played,
    coalesce(sum(tgs.points),0)::integer as points,
    coalesce(sum(tgs.rebounds),0)::integer as rebounds,
    coalesce(sum(tgs.assists),0)::integer as assists,
    coalesce(sum(tgs.steals),0)::integer as steals,
    coalesce(sum(tgs.blocks),0)::integer as blocks,
    coalesce(sum(tgs.turnovers),0)::integer as turnovers,
    coalesce(sum(tgs.fouls),0)::integer as fouls,
    coalesce(sum(tgs.fgm),0)::integer as fgm,
    coalesce(sum(tgs.fga),0)::integer as fga,
    coalesce(sum(tgs.tpm),0)::integer as tpm,
    coalesce(sum(tgs.tpa),0)::integer as tpa,
    coalesce(sum(tgs.ftm),0)::integer as ftm,
    coalesce(sum(tgs.fta),0)::integer as fta
  from public.team_game_stats tgs
  left join public.matches m on m.id = tgs.match_id
  left join public.competitions cmp on cmp.id = m.competition_id
  where coalesce(cmp.competition_type, 'LEAGUE') in ('LEAGUE','SEASON')
    and coalesce(cmp.counts_for_season_stats, true) = true
  group by tgs.team_id

  union all

  select
    'OZEL_HAZIRLIK'::text,
    'Özel / Hazırlık Maçları'::text,
    ts.team_id,
    coalesce(sum(ts.games_played),0)::integer,
    coalesce(sum(ts.points),0)::integer,
    coalesce(sum(ts.rebounds),0)::integer,
    coalesce(sum(ts.assists),0)::integer,
    coalesce(sum(ts.steals),0)::integer,
    coalesce(sum(ts.blocks),0)::integer,
    coalesce(sum(ts.turnovers),0)::integer,
    coalesce(sum(ts.fouls),0)::integer,
    coalesce(sum(ts.fgm),0)::integer,
    coalesce(sum(ts.fga),0)::integer,
    coalesce(sum(ts.tpm),0)::integer,
    coalesce(sum(ts.tpa),0)::integer,
    coalesce(sum(ts.ftm),0)::integer,
    coalesce(sum(ts.fta),0)::integer
  from public.team_special_match_stats ts
  left join public.competitions cmp on cmp.id = ts.competition_id
  where coalesce(cmp.competition_type, 'FRIENDLY') in ('FRIENDLY','SPECIAL_MATCH')
  group by ts.team_id

  union all

  select
    'TURNUVA'::text,
    'Turnuvalar'::text,
    tgs.team_id,
    count(distinct tgs.match_id)::integer,
    coalesce(sum(tgs.points),0)::integer,
    coalesce(sum(tgs.rebounds),0)::integer,
    coalesce(sum(tgs.assists),0)::integer,
    coalesce(sum(tgs.steals),0)::integer,
    coalesce(sum(tgs.blocks),0)::integer,
    coalesce(sum(tgs.turnovers),0)::integer,
    coalesce(sum(tgs.fouls),0)::integer,
    coalesce(sum(tgs.fgm),0)::integer,
    coalesce(sum(tgs.fga),0)::integer,
    coalesce(sum(tgs.tpm),0)::integer,
    coalesce(sum(tgs.tpa),0)::integer,
    coalesce(sum(tgs.ftm),0)::integer,
    coalesce(sum(tgs.fta),0)::integer
  from public.team_game_stats tgs
  join public.matches m on m.id = tgs.match_id
  join public.competitions cmp on cmp.id = m.competition_id
  where cmp.competition_type = 'TOURNAMENT'
  group by tgs.team_id
), totals as (
  select * from base
  union all
  select
    'TOPLAM'::text,
    'Toplam'::text,
    team_id,
    coalesce(sum(games_played),0)::integer,
    coalesce(sum(points),0)::integer,
    coalesce(sum(rebounds),0)::integer,
    coalesce(sum(assists),0)::integer,
    coalesce(sum(steals),0)::integer,
    coalesce(sum(blocks),0)::integer,
    coalesce(sum(turnovers),0)::integer,
    coalesce(sum(fouls),0)::integer,
    coalesce(sum(fgm),0)::integer,
    coalesce(sum(fga),0)::integer,
    coalesce(sum(tpm),0)::integer,
    coalesce(sum(tpa),0)::integer,
    coalesce(sum(ftm),0)::integer,
    coalesce(sum(fta),0)::integer
  from base
  group by team_id
)
select
  t.section_code,
  t.section_name,
  t.team_id,
  tm.name as team_name,
  t.games_played,
  t.points,
  t.rebounds,
  t.assists,
  t.steals,
  t.blocks,
  t.turnovers,
  t.fouls,
  t.fgm,
  t.fga,
  case when t.fga > 0 then round((t.fgm::numeric / t.fga::numeric) * 100, 1) else 0 end as fg_pct,
  t.tpm,
  t.tpa,
  case when t.tpa > 0 then round((t.tpm::numeric / t.tpa::numeric) * 100, 1) else 0 end as tp_pct,
  t.ftm,
  t.fta,
  case when t.fta > 0 then round((t.ftm::numeric / t.fta::numeric) * 100, 1) else 0 end as ft_pct,
  case when t.games_played > 0 then round(t.points::numeric / t.games_played, 1) else 0 end as ppg,
  case when t.games_played > 0 then round(t.rebounds::numeric / t.games_played, 1) else 0 end as rpg,
  case when t.games_played > 0 then round(t.assists::numeric / t.games_played, 1) else 0 end as apg
from totals t
left join public.teams tm on tm.id = t.team_id;

-- 6) Hızlı kontrol mesajı.
select 'NONSTOP V2.1.22AE-1 kariyer kartı altyapısı hazır' as status;

-- NONSTOP V2.1.22AE-2
-- Operator page special/friendly/tournament entry support + career tab views

alter table public.competitions
add column if not exists roster_limit integer default 12,
add column if not exists counts_for_standings boolean default true,
add column if not exists counts_for_season_stats boolean default true;

update public.competitions
set roster_limit = 24,
    counts_for_standings = false,
    counts_for_season_stats = false
where competition_type in ('FRIENDLY', 'SPECIAL_MATCH');

update public.competitions
set roster_limit = 12,
    counts_for_standings = true,
    counts_for_season_stats = false
where competition_type = 'TOURNAMENT';

create or replace view public.player_official_career_summary
with (security_invoker = true) as
select
  pgs.player_id,
  pgs.team_id,
  count(distinct pgs.match_id) as games_played,
  sum(coalesce(pgs.points,0)) as points,
  sum(coalesce(pgs.rebounds,0)) as rebounds,
  sum(coalesce(pgs.assists,0)) as assists,
  sum(coalesce(pgs.steals,0)) as steals,
  sum(coalesce(pgs.blocks,0)) as blocks,
  sum(coalesce(pgs.turnovers,0)) as turnovers,
  sum(coalesce(pgs.fouls,0)) as fouls
from public.player_game_stats pgs
left join public.matches m on m.id = pgs.match_id
left join public.competitions c on c.id = m.competition_id
where coalesce(c.competition_type, 'LEAGUE') = 'LEAGUE'
group by pgs.player_id, pgs.team_id;

create or replace view public.player_tournament_career_summary
with (security_invoker = true) as
select
  pgs.player_id,
  pgs.team_id,
  count(distinct pgs.match_id) as games_played,
  sum(coalesce(pgs.points,0)) as points,
  sum(coalesce(pgs.rebounds,0)) as rebounds,
  sum(coalesce(pgs.assists,0)) as assists,
  sum(coalesce(pgs.steals,0)) as steals,
  sum(coalesce(pgs.blocks,0)) as blocks,
  sum(coalesce(pgs.turnovers,0)) as turnovers,
  sum(coalesce(pgs.fouls,0)) as fouls
from public.player_game_stats pgs
join public.matches m on m.id = pgs.match_id
join public.competitions c on c.id = m.competition_id
where c.competition_type = 'TOURNAMENT'
group by pgs.player_id, pgs.team_id;

create or replace view public.player_special_career_summary
with (security_invoker = true) as
select
  ps.player_id,
  ps.team_id,
  count(distinct ps.match_id) as games_played,
  sum(coalesce(ps.points,0)) as points,
  sum(coalesce(ps.rebounds,0)) as rebounds,
  sum(coalesce(ps.assists,0)) as assists,
  sum(coalesce(ps.steals,0)) as steals,
  sum(coalesce(ps.blocks,0)) as blocks,
  sum(coalesce(ps.turnovers,0)) as turnovers,
  sum(coalesce(ps.fouls,0)) as fouls
from public.player_special_match_stats ps
group by ps.player_id, ps.team_id;

create or replace view public.team_official_career_summary
with (security_invoker = true) as
select
  tgs.team_id,
  count(distinct tgs.match_id) as games_played,
  sum(coalesce(tgs.points,0)) as points,
  sum(coalesce(tgs.rebounds,0)) as rebounds,
  sum(coalesce(tgs.assists,0)) as assists,
  sum(coalesce(tgs.steals,0)) as steals,
  sum(coalesce(tgs.blocks,0)) as blocks,
  sum(coalesce(tgs.turnovers,0)) as turnovers,
  sum(coalesce(tgs.fouls,0)) as fouls
from public.team_game_stats tgs
left join public.matches m on m.id = tgs.match_id
left join public.competitions c on c.id = m.competition_id
where coalesce(c.competition_type, 'LEAGUE') = 'LEAGUE'
group by tgs.team_id;

create or replace view public.team_tournament_career_summary
with (security_invoker = true) as
select
  tgs.team_id,
  count(distinct tgs.match_id) as games_played,
  sum(coalesce(tgs.points,0)) as points,
  sum(coalesce(tgs.rebounds,0)) as rebounds,
  sum(coalesce(tgs.assists,0)) as assists,
  sum(coalesce(tgs.steals,0)) as steals,
  sum(coalesce(tgs.blocks,0)) as blocks,
  sum(coalesce(tgs.turnovers,0)) as turnovers,
  sum(coalesce(tgs.fouls,0)) as fouls
from public.team_game_stats tgs
join public.matches m on m.id = tgs.match_id
join public.competitions c on c.id = m.competition_id
where c.competition_type = 'TOURNAMENT'
group by tgs.team_id;

create or replace view public.team_special_career_summary
with (security_invoker = true) as
select
  ts.team_id,
  count(distinct ts.match_id) as games_played,
  sum(coalesce(ts.points,0)) as points,
  sum(coalesce(ts.rebounds,0)) as rebounds,
  sum(coalesce(ts.assists,0)) as assists,
  sum(coalesce(ts.steals,0)) as steals,
  sum(coalesce(ts.blocks,0)) as blocks,
  sum(coalesce(ts.turnovers,0)) as turnovers,
  sum(coalesce(ts.fouls,0)) as fouls
from public.team_special_match_stats ts
group by ts.team_id;

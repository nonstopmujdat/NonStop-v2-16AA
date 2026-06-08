-- NONSTOP V2.1.24 PATCH
-- Puan durumu hatası düzeltmesi + Kız/Erkek kategori temel verileri
-- Hata: public.live_league_standings schema cache içinde bulunamadı

-- 1) Kız / Erkek kategori temel kayıtları
insert into public.categories(name, gender)
values
  ('U10', 'ERKEK'), ('U11', 'ERKEK'), ('U12', 'ERKEK'), ('U14', 'ERKEK'),
  ('U16', 'ERKEK'), ('U18', 'ERKEK'), ('GENÇ', 'ERKEK'), ('BÜYÜK', 'ERKEK'),
  ('U10', 'KIZ'), ('U11', 'KIZ'), ('U12', 'KIZ'), ('U14', 'KIZ'),
  ('U16', 'KIZ'), ('U18', 'KIZ'), ('GENÇ', 'KIZ'), ('BÜYÜK', 'KIZ')
on conflict (name, gender) do nothing;

-- 2) Puan durumu view'i
-- Not: Özel/hazırlık maçları counts_for_standings=false olduğu için puan durumuna girmez.
drop view if exists public.live_league_standings cascade;

create view public.live_league_standings
with (security_invoker = true) as
with base_teams as (
  select
    ct.competition_id,
    ct.team_id,
    cmp.city_id,
    cmp.season_id,
    cmp.category_id,
    coalesce(ct.league_level, cmp.league_level, 'NONE') as league_level,
    city.name as city_name,
    season.name as season_name,
    cat.name as category_name,
    cat.gender::text as gender,
    cmp.name as competition_name,
    cmp.competition_type,
    cmp.name as league_name,
    team.name as team_name
  from public.competition_teams ct
  left join public.competitions cmp on cmp.id = ct.competition_id
  left join public.cities city on city.id = cmp.city_id
  left join public.seasons season on season.id = cmp.season_id
  left join public.categories cat on cat.id = cmp.category_id
  left join public.teams team on team.id = ct.team_id
  where coalesce(ct.is_active, true) = true
), match_rows as (
  select
    m.competition_id,
    m.home_team_id as team_id,
    1 as o,
    case when coalesce(m.home_score,0) > coalesce(m.away_score,0) then 1 else 0 end as g,
    case when coalesce(m.home_score,0) < coalesce(m.away_score,0) then 1 else 0 end as mglp,
    coalesce(m.home_score,0) as asayi,
    coalesce(m.away_score,0) as ysayi,
    case when coalesce(m.home_score,0) > coalesce(m.away_score,0) then 2 else 1 end as p
  from public.matches m
  where coalesce(m.counts_for_standings, true) = true
    and coalesce(m.match_type::text, 'RESMI') = 'RESMI'
    and coalesce(m.status::text, 'PLANLANDI') in ('TAMAMLANDI','BITTI','COMPLETED','FINISHED')

  union all

  select
    m.competition_id,
    m.away_team_id as team_id,
    1 as o,
    case when coalesce(m.away_score,0) > coalesce(m.home_score,0) then 1 else 0 end as g,
    case when coalesce(m.away_score,0) < coalesce(m.home_score,0) then 1 else 0 end as mglp,
    coalesce(m.away_score,0) as asayi,
    coalesce(m.home_score,0) as ysayi,
    case when coalesce(m.away_score,0) > coalesce(m.home_score,0) then 2 else 1 end as p
  from public.matches m
  where coalesce(m.counts_for_standings, true) = true
    and coalesce(m.match_type::text, 'RESMI') = 'RESMI'
    and coalesce(m.status::text, 'PLANLANDI') in ('TAMAMLANDI','BITTI','COMPLETED','FINISHED')
), agg as (
  select
    bt.*,
    coalesce(sum(mr.o),0)::integer as o,
    coalesce(sum(mr.g),0)::integer as g,
    coalesce(sum(mr.mglp),0)::integer as m,
    coalesce(sum(mr.asayi),0)::integer as asayi,
    coalesce(sum(mr.ysayi),0)::integer as ysayi,
    (coalesce(sum(mr.asayi),0) - coalesce(sum(mr.ysayi),0))::integer as av,
    coalesce(sum(mr.p),0)::integer as p,
    0::integer as h2h_points,
    0::integer as h2h_point_diff
  from base_teams bt
  left join match_rows mr
    on mr.competition_id = bt.competition_id
   and mr.team_id = bt.team_id
  group by
    bt.competition_id, bt.team_id, bt.city_id, bt.season_id, bt.category_id,
    bt.league_level, bt.city_name, bt.season_name, bt.category_name, bt.gender,
    bt.competition_name, bt.competition_type, bt.league_name, bt.team_name
)
select
  dense_rank() over (
    partition by competition_id
    order by p desc, h2h_points desc, h2h_point_diff desc, av desc, asayi desc, team_name asc
  )::integer as rank,
  city_name,
  season_name,
  category_name,
  gender,
  competition_name,
  competition_type,
  league_name,
  league_level,
  team_name,
  o,
  g,
  m,
  asayi,
  ysayi,
  av,
  p,
  h2h_points,
  h2h_point_diff
from agg
order by city_name, season_name, category_name, gender, competition_name, rank;

-- NONSTOP V2.1.22AA - Clubs + Competitions Revision
-- Amaç: Kulüp -> Takım bağlantısını netleştirmek; lig, sezon, turnuva ve özel maç organizasyonlarını tek competition yapısında toplamak.
-- Not: Bu dosya V2.1.22A üzerine çalıştırılır. Supabase SQL Editor içinde tek parça çalıştırılabilir.

-- 1) Temel tablolar güvenli alanlar
alter table public.clubs
  add column if not exists updated_at timestamp without time zone default now(),
  add column if not exists is_active boolean default true;

alter table public.teams
  add column if not exists city_id bigint references public.cities(id),
  add column if not exists team_code varchar(50),
  add column if not exists display_name varchar(255),
  add column if not exists is_active boolean default true,
  add column if not exists updated_at timestamp without time zone default now();

-- Mevcut teams.city_id boşsa kulüp şehrinden doldur.
update public.teams t
set city_id = c.city_id
from public.clubs c
where t.club_id = c.id
  and t.city_id is null
  and c.city_id is not null;

-- 2) Genel organizasyon/competition tablosu
-- competition_type:
-- LEAGUE        = Lig
-- SEASON_GROUP = Sadece sezon/grup organizasyonu
-- TOURNAMENT   = Turnuva
-- FRIENDLY     = Hazırlık/özel maç organizasyonu
-- SPECIAL_MATCH= Tekil özel maç
create table if not exists public.competitions (
  id bigserial primary key,
  city_id bigint not null references public.cities(id),
  season_id bigint references public.seasons(id),
  category_id bigint references public.categories(id),
  parent_competition_id bigint references public.competitions(id),

  name varchar(255) not null,
  competition_type varchar(30) not null default 'LEAGUE',
  league_level varchar(10) not null default 'NONE', -- A / B / NONE
  is_independent boolean default true,
  status varchar(30) default 'ACTIVE',

  start_date date,
  end_date date,
  notes text,

  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now(),

  constraint competitions_type_check check (competition_type in ('LEAGUE', 'SEASON_GROUP', 'TOURNAMENT', 'FRIENDLY', 'SPECIAL_MATCH')),
  constraint competitions_level_check check (league_level in ('A', 'B', 'NONE'))
);

create unique index if not exists competitions_unique_main
on public.competitions (city_id, coalesce(season_id, 0), coalesce(category_id, 0), name, competition_type, league_level);

-- 3) Competition takım kayıtları
-- A Ligi ve B Ligi burada tamamen bağımsız takım listesine sahip olur.
create table if not exists public.competition_teams (
  id bigserial primary key,
  competition_id bigint not null references public.competitions(id) on delete cascade,
  city_id bigint not null references public.cities(id),
  season_id bigint references public.seasons(id),
  category_id bigint references public.categories(id),
  team_id bigint not null references public.teams(id) on delete cascade,
  club_id bigint references public.clubs(id),
  league_level varchar(10) default 'NONE',
  is_active boolean default true,
  joined_at timestamp without time zone default now(),
  constraint competition_teams_level_check check (league_level in ('A', 'B', 'NONE')),
  constraint competition_teams_unique unique (competition_id, team_id)
);

-- 4) Mevcut leagues yapısını competition ile bağla
alter table public.leagues
  add column if not exists competition_id bigint references public.competitions(id),
  add column if not exists competition_type varchar(30) default 'LEAGUE';

-- Mevcut ligler için competition kaydı oluştur.
insert into public.competitions (
  city_id, season_id, category_id, name, competition_type, league_level, is_independent, status, created_at, updated_at
)
select
  l.city_id,
  l.season_id,
  l.category_id,
  l.name,
  'LEAGUE',
  coalesce(l.league_level, 'A'),
  coalesce(l.is_independent, true),
  case when coalesce(l.is_active, true) then 'ACTIVE' else 'PASSIVE' end,
  now(),
  now()
from public.leagues l
where l.competition_id is null
on conflict do nothing;

update public.leagues l
set competition_id = c.id,
    competition_type = 'LEAGUE'
from public.competitions c
where l.competition_id is null
  and c.city_id = l.city_id
  and coalesce(c.season_id, 0) = coalesce(l.season_id, 0)
  and coalesce(c.category_id, 0) = coalesce(l.category_id, 0)
  and c.name = l.name
  and c.competition_type = 'LEAGUE'
  and c.league_level = coalesce(l.league_level, 'A');

-- Mevcut league_teams kayıtlarını competition_teams içine taşı.
insert into public.competition_teams (
  competition_id, city_id, season_id, category_id, team_id, club_id, league_level, is_active, joined_at
)
select
  l.competition_id,
  lt.city_id,
  lt.season_id,
  lt.category_id,
  lt.team_id,
  t.club_id,
  coalesce(lt.league_level, l.league_level, 'A'),
  coalesce(lt.is_active, true),
  coalesce(lt.joined_at, now())
from public.league_teams lt
join public.leagues l on l.id = lt.league_id
left join public.teams t on t.id = lt.team_id
where l.competition_id is not null
on conflict (competition_id, team_id) do update set
  club_id = excluded.club_id,
  is_active = excluded.is_active,
  league_level = excluded.league_level;

-- 5) Maç ve sezon tablolarına competition_id ekle
alter table public.matches
  add column if not exists competition_id bigint references public.competitions(id),
  add column if not exists competition_type varchar(30) default 'LEAGUE';

alter table public.team_season_stats
  add column if not exists competition_id bigint references public.competitions(id),
  add column if not exists competition_type varchar(30) default 'LEAGUE';

alter table public.player_season_stats
  add column if not exists competition_id bigint references public.competitions(id),
  add column if not exists competition_type varchar(30) default 'LEAGUE';

alter table public.league_standings
  add column if not exists competition_id bigint references public.competitions(id),
  add column if not exists competition_type varchar(30) default 'LEAGUE';

alter table public.head_to_head_results
  add column if not exists competition_id bigint references public.competitions(id),
  add column if not exists competition_type varchar(30) default 'LEAGUE';

-- Mevcut kayıtların competition_id alanını ligden doldur.
update public.matches m
set competition_id = l.competition_id,
    competition_type = 'LEAGUE'
from public.leagues l
where m.competition_id is null
  and l.id in (
    select lt.league_id
    from public.league_teams lt
    where lt.team_id in (m.home_team_id, m.away_team_id)
    group by lt.league_id
    having count(distinct lt.team_id) >= 1
  )
  and l.competition_id is not null;

update public.team_season_stats tss
set competition_id = l.competition_id,
    competition_type = 'LEAGUE'
from public.leagues l
where tss.league_id = l.id
  and tss.competition_id is null
  and l.competition_id is not null;

update public.player_season_stats pss
set competition_id = l.competition_id,
    competition_type = 'LEAGUE'
from public.leagues l
where pss.league_id = l.id
  and pss.competition_id is null
  and l.competition_id is not null;

update public.league_standings ls
set competition_id = l.competition_id,
    competition_type = 'LEAGUE'
from public.leagues l
where ls.league_id = l.id
  and ls.competition_id is null
  and l.competition_id is not null;

update public.head_to_head_results h2h
set competition_id = l.competition_id,
    competition_type = 'LEAGUE'
from public.leagues l
where h2h.league_id = l.id
  and h2h.competition_id is null
  and l.competition_id is not null;

-- 6) Maç bağlamı artık competition bilgisi de döndürür.
create or replace function public.get_match_competition_context(p_match_id bigint)
returns table (
  match_id bigint,
  city_id bigint,
  season_id bigint,
  category_id bigint,
  competition_id bigint,
  competition_type varchar,
  league_id bigint,
  league_level varchar,
  home_team_id bigint,
  away_team_id bigint,
  home_score integer,
  away_score integer
)
language sql
stable
as $$
  select
    m.id as match_id,
    coalesce(cmp.city_id, l.city_id, s.city_id, ht.city_id, at.city_id, org.city_id) as city_id,
    coalesce(cmp.season_id, l.season_id, ms.id, ht.season_id, at.season_id, org.season_id) as season_id,
    coalesce(cmp.category_id, l.category_id, ht.category_id, at.category_id, org.category_id) as category_id,
    coalesce(m.competition_id, l.competition_id, cmp.id) as competition_id,
    coalesce(cmp.competition_type, m.competition_type, l.competition_type, 'LEAGUE') as competition_type,
    l.id as league_id,
    coalesce(cmp.league_level, l.league_level, 'A') as league_level,
    m.home_team_id,
    m.away_team_id,
    coalesce(m.home_score, 0) as home_score,
    coalesce(m.away_score, 0) as away_score
  from public.matches m
  left join public.competitions cmp on cmp.id = m.competition_id
  left join public.teams ht on ht.id = m.home_team_id
  left join public.teams at on at.id = m.away_team_id
  left join public.organizations org on org.id = m.organization_id
  left join public.seasons ms on ms.id = coalesce(ht.season_id, at.season_id, org.season_id)
  left join public.competition_teams cth on cth.team_id = m.home_team_id and cth.is_active = true
  left join public.competition_teams cta on cta.team_id = m.away_team_id and cta.is_active = true and cta.competition_id = cth.competition_id
  left join public.competitions ctc on ctc.id = coalesce(m.competition_id, cth.competition_id)
  left join public.leagues l on l.competition_id = coalesce(m.competition_id, cth.competition_id)
  left join public.seasons s on s.id = coalesce(ctc.season_id, l.season_id)
  where m.id = p_match_id
  limit 1;
$$;

-- 7) Eski fonksiyon adını koru; lig bağlamı isteyen kodlar bozulmasın.
create or replace function public.get_match_league_context(p_match_id bigint)
returns table (
  match_id bigint,
  city_id bigint,
  season_id bigint,
  category_id bigint,
  league_id bigint,
  league_level varchar,
  home_team_id bigint,
  away_team_id bigint,
  home_score integer,
  away_score integer
)
language sql
stable
as $$
  select
    gcc.match_id,
    gcc.city_id,
    gcc.season_id,
    gcc.category_id,
    gcc.league_id,
    gcc.league_level,
    gcc.home_team_id,
    gcc.away_team_id,
    gcc.home_score,
    gcc.away_score
  from public.get_match_competition_context(p_match_id) gcc;
$$;

-- 8) Canlı competition listesi
create or replace view public.live_competitions
with (security_invoker = true) as
select
  cmp.id,
  c.name as city_name,
  s.name as season_name,
  cat.name as category_name,
  cat.gender,
  cmp.name as competition_name,
  cmp.competition_type,
  cmp.league_level,
  cmp.is_independent,
  cmp.status,
  count(ct.team_id) as team_count,
  cmp.updated_at
from public.competitions cmp
left join public.cities c on c.id = cmp.city_id
left join public.seasons s on s.id = cmp.season_id
left join public.categories cat on cat.id = cmp.category_id
left join public.competition_teams ct on ct.competition_id = cmp.id and ct.is_active = true
group by cmp.id, c.name, s.name, cat.name, cat.gender;

-- 9) Puan durumu view'ı competition alanlarıyla yenile.
drop view if exists public.live_league_standings;
create view public.live_league_standings
with (security_invoker = true) as
select
  ls.rank,
  c.name as city_name,
  s.name as season_name,
  cat.name as category_name,
  cat.gender,
  coalesce(cmp.name, l.name) as competition_name,
  coalesce(cmp.competition_type, ls.competition_type, 'LEAGUE') as competition_type,
  l.name as league_name,
  coalesce(cmp.league_level, l.league_level, ls.league_level) as league_level,
  t.name as team_name,
  cl.name as club_name,
  ls.city_id,
  ls.season_id,
  ls.category_id,
  ls.competition_id,
  ls.league_id,
  ls.team_id,
  ls.games_played as o,
  ls.wins as g,
  ls.losses as m,
  ls.points_for as asayi,
  ls.points_against as ysayi,
  ls.point_diff as av,
  ls.league_points as p,
  ls.h2h_points,
  ls.h2h_point_diff,
  ls.updated_at
from public.league_standings ls
left join public.cities c on c.id = ls.city_id
left join public.seasons s on s.id = ls.season_id
left join public.categories cat on cat.id = ls.category_id
left join public.leagues l on l.id = ls.league_id
left join public.competitions cmp on cmp.id = coalesce(ls.competition_id, l.competition_id)
left join public.teams t on t.id = ls.team_id
left join public.clubs cl on cl.id = t.club_id;

select 'V2.1.22AA competitions_clubs_structure_sql_ok' as result;

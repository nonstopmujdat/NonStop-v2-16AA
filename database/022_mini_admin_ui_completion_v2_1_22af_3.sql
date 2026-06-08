-- NONSTOP V2.1.22AF-3 – Mini Admin UI Completion
-- Amaç: Mini Admin ekranının kullandığı view/fonksiyonları tek parça ve güvenli hale getirmek.
-- Mevcut verileri silmez.

-- 1) Güvenli kolon tamamlamaları
alter table public.competitions
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists roster_limit integer default 12,
  add column if not exists counts_for_standings boolean default true,
  add column if not exists counts_for_season_stats boolean default true,
  add column if not exists updated_at timestamp without time zone default now();

alter table public.competition_teams
  add column if not exists city_id bigint,
  add column if not exists season_id bigint,
  add column if not exists category_id bigint,
  add column if not exists club_id bigint,
  add column if not exists league_level varchar(10) default 'NONE',
  add column if not exists is_active boolean default true,
  add column if not exists joined_at timestamp without time zone default now();

alter table public.matches
  add column if not exists competition_id bigint,
  add column if not exists competition_type varchar(30) default 'LEAGUE',
  add column if not exists match_kind varchar(30) default 'OFFICIAL',
  add column if not exists match_date date,
  add column if not exists match_time time without time zone,
  add column if not exists match_order integer default 1,
  add column if not exists roster_limit integer default 12,
  add column if not exists counts_for_standings boolean default true,
  add column if not exists counts_for_season_stats boolean default true,
  add column if not exists requires_min_five boolean default true;

-- 2) Eski kayıtları güvenli doldur
update public.matches
set
  match_date = coalesce(match_date, match_datetime::date),
  match_time = coalesce(match_time, match_datetime::time)
where match_datetime is not null;

update public.matches
set
  match_kind = case
    when match_type::text = 'OZEL' then 'SPECIAL_MATCH'
    when match_kind is null then 'OFFICIAL'
    else match_kind
  end,
  roster_limit = case
    when match_type::text = 'OZEL' or match_kind in ('FRIENDLY','SPECIAL_MATCH','OZEL') then 24
    else 12
  end,
  counts_for_standings = case
    when match_type::text = 'OZEL' or match_kind in ('FRIENDLY','SPECIAL_MATCH','OZEL') then false
    else true
  end,
  counts_for_season_stats = case
    when match_type::text = 'OZEL' or match_kind in ('FRIENDLY','SPECIAL_MATCH','OZEL') then false
    else true
  end;

update public.competitions
set
  roster_limit = case when competition_type in ('FRIENDLY','SPECIAL_MATCH') then 24 else 12 end,
  counts_for_standings = case when competition_type in ('FRIENDLY','SPECIAL_MATCH') then false else true end,
  counts_for_season_stats = case when competition_type in ('FRIENDLY','SPECIAL_MATCH') then false else true end,
  updated_at = coalesce(updated_at, now());

-- 3) Indexler
create index if not exists idx_matches_venue_date_af3 on public.matches(venue_id, match_date);
create index if not exists idx_matches_competition_af3 on public.matches(competition_id);
create index if not exists idx_competition_teams_comp_team_af3 on public.competition_teams(competition_id, team_id);

-- 4) Mini Admin organizasyon listesi
create or replace view public.live_competitions
with (security_invoker = true) as
select
  cmp.id,
  cmp.city_id,
  c.name as city_name,
  cmp.season_id,
  s.name as season_name,
  cmp.category_id,
  cat.name as category_name,
  cat.gender,
  cmp.name as competition_name,
  cmp.competition_type,
  cmp.league_level,
  cmp.is_independent,
  cmp.status,
  cmp.start_date,
  cmp.end_date,
  cmp.roster_limit,
  cmp.counts_for_standings,
  cmp.counts_for_season_stats,
  count(ct.team_id) filter (where coalesce(ct.is_active, true) = true) as team_count,
  cmp.updated_at
from public.competitions cmp
left join public.cities c on c.id = cmp.city_id
left join public.seasons s on s.id = cmp.season_id
left join public.categories cat on cat.id = cmp.category_id
left join public.competition_teams ct on ct.competition_id = cmp.id
group by cmp.id, c.name, s.name, cat.name, cat.gender;

-- 5) Mini Admin organizasyondaki takımlar listesi
create or replace view public.mini_admin_competition_teams
with (security_invoker = true) as
select
  ct.id as competition_team_id,
  ct.competition_id,
  cmp.name as competition_name,
  ct.city_id,
  city.name as city_name,
  ct.season_id,
  season.name as season_name,
  ct.category_id,
  cat.name as category_name,
  ct.club_id,
  club.name as club_name,
  ct.team_id,
  team.name as team_name,
  ct.league_level,
  ct.is_active,
  ct.joined_at
from public.competition_teams ct
left join public.competitions cmp on cmp.id = ct.competition_id
left join public.cities city on city.id = ct.city_id
left join public.seasons season on season.id = ct.season_id
left join public.categories cat on cat.id = ct.category_id
left join public.clubs club on club.id = ct.club_id
left join public.teams team on team.id = ct.team_id
order by cmp.name, team.name;

-- 6) Operatör ekranı maç kuyruğu
create or replace view public.operator_match_queue
with (security_invoker = true) as
select
  m.id as match_id,
  m.match_date,
  coalesce(to_char(m.match_time, 'HH24:MI'), to_char(m.match_datetime, 'HH24:MI')) as match_time,
  coalesce(m.match_order, 1) as match_order,
  m.venue_id,
  v.name as venue_name,
  v.city_id,
  city.name as city_name,
  m.home_team_id,
  ht.name as home_team_name,
  m.away_team_id,
  at.name as away_team_name,
  m.competition_id,
  cmp.name as competition_name,
  coalesce(m.competition_type, cmp.competition_type, 'LEAGUE') as competition_type,
  coalesce(m.match_kind, case when m.match_type::text = 'OZEL' then 'SPECIAL_MATCH' else 'OFFICIAL' end) as match_kind,
  cat.name as category_name,
  coalesce(m.roster_limit, cmp.roster_limit, 12) as roster_limit,
  coalesce(m.counts_for_standings, cmp.counts_for_standings, true) as counts_for_standings,
  coalesce(m.counts_for_season_stats, cmp.counts_for_season_stats, true) as counts_for_season_stats,
  m.status,
  m.current_quarter,
  m.clock_seconds,
  m.home_score,
  m.away_score
from public.matches m
left join public.venues v on v.id = m.venue_id
left join public.cities city on city.id = v.city_id
left join public.teams ht on ht.id = m.home_team_id
left join public.teams at on at.id = m.away_team_id
left join public.competitions cmp on cmp.id = m.competition_id
left join public.categories cat on cat.id = cmp.category_id
where coalesce(m.status::text, 'PLANLANDI') not in ('IPTAL','CANCELLED')
order by m.match_date, coalesce(m.match_order, 1), m.match_time, m.id;

-- Eski isimle kullanan ekranlar için aynı içerik
create or replace view public.operator_match_feed
with (security_invoker = true) as
select * from public.operator_match_queue;

-- 7) Mini Admin resmi maç oluşturma fonksiyonu
create or replace function public.create_official_match_from_admin(
  p_competition_id bigint,
  p_venue_id bigint,
  p_match_date date,
  p_match_time time without time zone,
  p_home_team_id bigint,
  p_away_team_id bigint
)
returns bigint
language plpgsql
as $$
declare
  v_comp public.competitions%rowtype;
  v_match_id bigint;
  v_order integer;
begin
  if p_home_team_id = p_away_team_id then
    raise exception 'Ev sahibi ve misafir takım aynı olamaz';
  end if;

  select * into v_comp from public.competitions where id = p_competition_id;
  if not found then
    raise exception 'Organizasyon bulunamadı';
  end if;

  if coalesce(v_comp.competition_type, 'LEAGUE') in ('FRIENDLY','SPECIAL_MATCH') then
    raise exception 'Özel/hazırlık maçları resmi maç oluşturma ekranından açılmaz';
  end if;

  if not exists (
    select 1 from public.competition_teams
    where competition_id = p_competition_id and team_id = p_home_team_id and coalesce(is_active, true) = true
  ) then
    raise exception 'Ev sahibi takım bu organizasyona ekli değil';
  end if;

  if not exists (
    select 1 from public.competition_teams
    where competition_id = p_competition_id and team_id = p_away_team_id and coalesce(is_active, true) = true
  ) then
    raise exception 'Misafir takım bu organizasyona ekli değil';
  end if;

  select coalesce(max(match_order), 0) + 1 into v_order
  from public.matches
  where venue_id = p_venue_id and match_date = p_match_date;

  insert into public.matches(
    competition_id,
    competition_type,
    match_kind,
    venue_id,
    match_date,
    match_time,
    match_datetime,
    match_order,
    home_team_id,
    away_team_id,
    status,
    match_type,
    roster_limit,
    counts_for_standings,
    counts_for_season_stats,
    requires_min_five,
    current_quarter,
    clock_seconds,
    home_score,
    away_score,
    stats_mode,
    clock_owner_role
  ) values (
    p_competition_id,
    coalesce(v_comp.competition_type, 'LEAGUE'),
    case when coalesce(v_comp.competition_type, 'LEAGUE') = 'TOURNAMENT' then 'TOURNAMENT' else 'OFFICIAL' end,
    p_venue_id,
    p_match_date,
    p_match_time,
    (p_match_date + p_match_time),
    v_order,
    p_home_team_id,
    p_away_team_id,
    'PLANLANDI',
    'RESMI',
    12,
    coalesce(v_comp.counts_for_standings, true),
    coalesce(v_comp.counts_for_season_stats, true),
    true,
    1,
    600,
    0,
    0,
    'DUAL_OPERATOR',
    'HOME_OPERATOR'
  ) returning id into v_match_id;

  return v_match_id;
end;
$$;

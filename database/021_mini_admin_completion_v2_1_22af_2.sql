-- NONSTOP V2.1.22AF-2 – Mini Admin Completion
-- Amaç: Mini Admin üzerinden lig/turnuva oluşturma, takımları organizasyona ekleme,
-- resmi maç oluşturma ve maçların operatör ekranına otomatik düşmesi.

-- 1) Güvenli kolon tamamlamaları
alter table public.competitions
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists roster_limit integer default 12,
  add column if not exists counts_for_standings boolean default true,
  add column if not exists counts_for_season_stats boolean default true,
  add column if not exists updated_at timestamp without time zone default now();

alter table public.competition_teams
  add column if not exists city_id bigint references public.cities(id),
  add column if not exists season_id bigint references public.seasons(id),
  add column if not exists category_id bigint references public.categories(id),
  add column if not exists club_id bigint references public.clubs(id),
  add column if not exists league_level varchar(10) default 'NONE',
  add column if not exists is_active boolean default true;

alter table public.matches
  add column if not exists competition_id bigint references public.competitions(id),
  add column if not exists competition_type varchar(30) default 'LEAGUE',
  add column if not exists venue_id bigint references public.venues(id),
  add column if not exists match_date date,
  add column if not exists match_time time without time zone,
  add column if not exists match_order integer default 1,
  add column if not exists home_team_id bigint references public.teams(id),
  add column if not exists away_team_id bigint references public.teams(id),
  add column if not exists requires_min_five boolean default true,
  add column if not exists counts_for_standings boolean default true,
  add column if not exists counts_for_season_stats boolean default true,
  add column if not exists roster_limit integer default 12;

-- Eski kurulumda match_datetime varsa yeni alanları ondan besle.
update public.matches
set
  match_date = coalesce(match_date, match_datetime::date),
  match_time = coalesce(match_time, match_datetime::time)
where match_datetime is not null;

-- 2) Organizasyon tip kuralları
update public.competitions
set
  roster_limit = case when competition_type in ('FRIENDLY','SPECIAL_MATCH') then 24 else 12 end,
  counts_for_standings = case when competition_type in ('FRIENDLY','SPECIAL_MATCH') then false else true end,
  counts_for_season_stats = case when competition_type in ('FRIENDLY','SPECIAL_MATCH','TOURNAMENT') then false else true end;

-- 3) Mini Admin ekranlarının ihtiyaç duyduğu görünüm
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

-- 4) Operatör ekranı için salon/gün maç kuyruğu
create or replace view public.operator_match_queue
with (security_invoker = true) as
select
  m.id as match_id,
  m.match_date,
  coalesce(to_char(m.match_time, 'HH24:MI'), to_char(m.match_datetime, 'HH24:MI')) as match_time,
  m.match_order,
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
order by m.match_date, m.match_order, m.match_time, m.id;

-- 5) Resmi maç oluşturmayı güvenli yapan fonksiyon
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

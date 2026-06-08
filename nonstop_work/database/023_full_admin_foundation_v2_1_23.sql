-- NONSTOP V2.1.23 – Full Admin Foundation
-- Amaç: Supabase'e girmeden temel kayıtları web panelinden yönetmek için güvenli altyapı.
-- Mevcut verileri silmez.

-- 1) Temel tablolar için güvenli kolonlar
alter table public.cities
  add column if not exists is_active boolean default true;

alter table public.venues
  add column if not exists is_active boolean default true,
  add column if not exists updated_at timestamp without time zone default now();

alter table public.clubs
  add column if not exists is_active boolean default true,
  add column if not exists updated_at timestamp without time zone default now();

alter table public.teams
  add column if not exists city_id bigint,
  add column if not exists team_code varchar(50),
  add column if not exists display_name varchar(255),
  add column if not exists is_active boolean default true,
  add column if not exists updated_at timestamp without time zone default now();

alter table public.players
  add column if not exists city_id bigint,
  add column if not exists notes text;

-- 2) Full Admin giriş/yetki istekleri
create table if not exists public.admin_access_requests (
  id bigserial primary key,
  full_name varchar(255) not null,
  email varchar(255) not null,
  phone varchar(50),
  city_id bigint references public.cities(id),
  club_id bigint references public.clubs(id),
  requested_role varchar(50) not null default 'CLUB_ADMIN',
  request_note text,
  status varchar(30) not null default 'PENDING',
  reviewed_by uuid references public.users(id),
  reviewed_at timestamp without time zone,
  created_at timestamp without time zone default now(),
  constraint admin_access_requests_role_check check (requested_role in ('SUPER_ADMIN','CITY_ADMIN','LEAGUE_ADMIN','CLUB_ADMIN','NONSTOP_OPERATOR','VIEWER')),
  constraint admin_access_requests_status_check check (status in ('PENDING','APPROVED','REJECTED','CANCELLED'))
);

create index if not exists idx_admin_access_requests_status on public.admin_access_requests(status);
create index if not exists idx_admin_access_requests_city on public.admin_access_requests(city_id);

-- 3) Yönetim ekranı sayıları
create or replace view public.full_admin_counts
with (security_invoker = true) as
select
  (select count(*) from public.cities where coalesce(is_active, true) = true) as city_count,
  (select count(*) from public.venues where coalesce(is_active, true) = true) as venue_count,
  (select count(*) from public.clubs where coalesce(is_active, true) = true) as club_count,
  (select count(*) from public.teams where coalesce(is_active, true) = true) as team_count,
  (select count(*) from public.players where coalesce(active, true) = true) as player_count,
  (select count(*) from public.admin_access_requests where status = 'PENDING') as pending_admin_request_count;

-- 4) Admin istekleri listesi
create or replace view public.full_admin_access_requests
with (security_invoker = true) as
select
  r.id,
  r.full_name,
  r.email,
  r.phone,
  r.requested_role,
  r.status,
  r.request_note,
  r.created_at,
  c.name as city_name,
  cl.name as club_name
from public.admin_access_requests r
left join public.cities c on c.id = r.city_id
left join public.clubs cl on cl.id = r.club_id
order by r.created_at desc;

-- 5) Takım / oyuncu yönetim listeleri
create or replace view public.full_admin_teams
with (security_invoker = true) as
select
  t.id,
  t.name,
  coalesce(t.display_name, t.name) as display_name,
  t.team_code,
  t.club_id,
  cl.name as club_name,
  coalesce(t.city_id, cl.city_id) as city_id,
  city.name as city_name,
  t.category_id,
  cat.name as category_name,
  cat.gender,
  t.season_id,
  s.name as season_name,
  t.is_active,
  t.created_at
from public.teams t
left join public.clubs cl on cl.id = t.club_id
left join public.cities city on city.id = coalesce(t.city_id, cl.city_id)
left join public.categories cat on cat.id = t.category_id
left join public.seasons s on s.id = t.season_id
order by city.name, cl.name, t.name;

create or replace view public.full_admin_players
with (security_invoker = true) as
select
  p.id,
  p.license_no,
  p.jersey_no,
  p.first_name,
  p.last_name,
  concat(p.first_name, ' ', p.last_name) as full_name,
  p.birth_date,
  p.position,
  p.active,
  ptr.team_id,
  t.name as team_name,
  t.club_id,
  cl.name as club_name,
  coalesce(p.city_id, t.city_id, cl.city_id) as city_id,
  city.name as city_name,
  ptr.season_id,
  s.name as season_name
from public.players p
left join public.player_team_registrations ptr on ptr.player_id = p.id and coalesce(ptr.is_active, true) = true
left join public.teams t on t.id = ptr.team_id
left join public.clubs cl on cl.id = t.club_id
left join public.cities city on city.id = coalesce(p.city_id, t.city_id, cl.city_id)
left join public.seasons s on s.id = ptr.season_id
order by p.created_at desc;

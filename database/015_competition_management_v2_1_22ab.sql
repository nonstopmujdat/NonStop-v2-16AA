-- NONSTOP V2.1.22AB - Competition Management
-- Bu dosya V2.1.22AA üzerine güvenli yönetim ekleri yapar.
-- Leagues tablosu kullanmaz; ana yapı competitions tablosudur.

create table if not exists public.competitions (
  id bigserial primary key,
  city_id bigint references public.cities(id),
  season_id bigint references public.seasons(id),
  category_id bigint references public.categories(id),
  name varchar(255) not null,
  competition_type varchar(30) not null default 'LEAGUE',
  league_level varchar(10) not null default 'NONE',
  is_independent boolean default true,
  status varchar(30) default 'ACTIVE',
  start_date date,
  end_date date,
  notes text,
  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now()
);

create table if not exists public.competition_teams (
  id bigserial primary key,
  competition_id bigint not null references public.competitions(id) on delete cascade,
  city_id bigint references public.cities(id),
  season_id bigint references public.seasons(id),
  category_id bigint references public.categories(id),
  team_id bigint not null references public.teams(id) on delete cascade,
  club_id bigint references public.clubs(id),
  league_level varchar(10) default 'NONE',
  is_active boolean default true,
  joined_at timestamp without time zone default now(),
  constraint competition_teams_unique unique (competition_id, team_id)
);

alter table public.competitions
  add column if not exists updated_at timestamp without time zone default now(),
  add column if not exists is_independent boolean default true,
  add column if not exists status varchar(30) default 'ACTIVE',
  add column if not exists competition_type varchar(30) default 'LEAGUE',
  add column if not exists league_level varchar(10) default 'NONE';

alter table public.competition_teams
  add column if not exists is_active boolean default true,
  add column if not exists club_id bigint references public.clubs(id),
  add column if not exists league_level varchar(10) default 'NONE';

create unique index if not exists competition_teams_unique_idx
on public.competition_teams (competition_id, team_id);

alter table public.matches
  add column if not exists competition_id bigint references public.competitions(id),
  add column if not exists competition_type varchar(30) default 'LEAGUE';

create or replace view public.live_competitions
with (security_invoker = true) as
select
  cmp.id,
  c.name as city_name,
  s.name as season_name,
  cat.name as category_name,
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
left join public.competition_teams ct
  on ct.competition_id = cmp.id
  and ct.is_active = true
group by
  cmp.id,
  c.name,
  s.name,
  cat.name;

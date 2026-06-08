-- NONSTOP V2.1.22AC - Operator Match Flow
-- Amaç: Operatör maç/takım seçmez; salon seçer, o günkü maçlar sırayla gelir.
-- İki operatör uyumu: HOME süreyi başlatabilir, AWAY başlatamaz.

create table if not exists public.operator_assignments (
  id bigserial primary key,
  match_id bigint not null references public.matches(id) on delete cascade,
  operator_id uuid,
  team_id bigint references public.teams(id),
  operator_side varchar(10) not null,
  can_start_clock boolean default false,
  is_active boolean default true,
  device_label varchar(100),
  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now(),
  constraint operator_assignments_side_check check (operator_side in ('HOME','AWAY')),
  constraint operator_assignments_unique unique (match_id, operator_side)
);

alter table public.matches
  add column if not exists venue_id bigint references public.venues(id),
  add column if not exists match_date date,
  add column if not exists match_order integer default 1,
  add column if not exists home_team_id bigint references public.teams(id),
  add column if not exists away_team_id bigint references public.teams(id),
  add column if not exists forfeit_team_id bigint references public.teams(id),
  add column if not exists forfeit_reason text,
  add column if not exists requires_min_five boolean default true;

alter table public.match_rosters
  add column if not exists operator_side varchar(10),
  add column if not exists is_selected boolean default true,
  add column if not exists is_starter boolean default false,
  add column if not exists is_on_court boolean default false,
  add column if not exists unavailable_reason text;

create or replace view public.operator_match_queue
with (security_invoker = true) as
select
  m.id as match_id,
  m.match_date,
  m.match_order,
  m.venue_id,
  v.name as venue_name,
  m.home_team_id,
  ht.name as home_team_name,
  m.away_team_id,
  at.name as away_team_name,
  m.competition_id,
  cmp.name as competition_name,
  m.status,
  m.current_quarter,
  m.clock_seconds,
  m.home_score,
  m.away_score
from public.matches m
left join public.venues v on v.id = m.venue_id
left join public.teams ht on ht.id = m.home_team_id
left join public.teams at on at.id = m.away_team_id
left join public.competitions cmp on cmp.id = m.competition_id
order by m.match_date, m.match_order, m.id;

create or replace function public.validate_match_min_five(p_match_id bigint)
returns table(team_side text, starter_count integer, can_start boolean)
language sql
as $$
  select
    coalesce(operator_side, 'UNKNOWN')::text as team_side,
    count(*) filter (where is_starter = true)::integer as starter_count,
    (count(*) filter (where is_starter = true) >= 5) as can_start
  from public.match_rosters
  where match_id = p_match_id
  group by coalesce(operator_side, 'UNKNOWN')
  order by team_side;
$$;

create or replace function public.mark_forfeit_if_less_than_five(
  p_match_id bigint,
  p_team_id bigint,
  p_reason text default 'Maç başlangıcında 5 oyuncu yok'
)
returns void
language plpgsql
as $$
begin
  update public.matches
  set
    status = 'FORFEITED',
    forfeit_team_id = p_team_id,
    forfeit_reason = p_reason,
    locked = true,
    locked_at = now()
  where id = p_match_id;
end;
$$;

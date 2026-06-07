-- NONSTOP V2.1.21A - Game Clock + Period + Overtime Foundation
-- Supabase SQL Editor içinde çalıştırılacak güvenli ekleme dosyasıdır.

alter table public.matches
  add column if not exists quarter_count integer default 4,
  add column if not exists quarter_duration_minutes integer default 10,
  add column if not exists overtime_enabled boolean default true,
  add column if not exists running_clock boolean default false,
  add column if not exists auto_lock_at timestamp without time zone,
  add column if not exists locked_at timestamp without time zone,
  add column if not exists locked boolean default false;

-- Demo maç başlangıcını güvenli hale getirir: 1. periyot, 10:00, 0-0.
-- Bunu yalnızca demo/test maçı için kullanıyoruz.
update public.matches
set
  current_quarter = coalesce(nullif(current_quarter, 0), 1),
  clock_seconds = case when clock_seconds is null or clock_seconds < 0 then 600 else clock_seconds end,
  quarter_count = 4,
  quarter_duration_minutes = 10,
  overtime_enabled = true,
  running_clock = false
where id = 1;

-- Canlı skor view yoksa tekrar oluşturur. updated_at kolonu olmayan eski kurulumları da korur.
alter table public.team_game_stats
  add column if not exists updated_at timestamp without time zone default now();

create or replace view public.live_match_score as
select
  match_id,
  team_id,
  points,
  oreb,
  dreb,
  rebounds,
  assists,
  steals,
  blocks,
  turnovers,
  fouls,
  fgm,
  fga,
  fg_pct,
  tpm,
  tpa,
  tp_pct,
  ftm,
  fta,
  ft_pct,
  updated_at
from public.team_game_stats;

select 'V2.1.21A clock_period_overtime_sql_ok' as result;

-- NONSTOP V2.1.21B - Player/Team Period Stats Foundation
-- Supabase SQL Editor içinde çalıştırılacak güvenli ekleme dosyasıdır.
-- Amaç: Her maç için periyot bazlı oyuncu ve takım istatistiklerini ayrı tutmak.

create table if not exists public.player_period_stats (
  id bigserial primary key,
  match_id bigint not null,
  quarter integer not null,
  player_id bigint not null,
  team_id bigint,

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

  constraint player_period_stats_unique unique (match_id, quarter, player_id)
);

create table if not exists public.team_period_stats (
  id bigserial primary key,
  match_id bigint not null,
  quarter integer not null,
  team_id bigint not null,

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

  constraint team_period_stats_unique unique (match_id, quarter, team_id)
);

-- Eski/yarım kurulmuş tablolara güvenli kolon tamamlama
alter table public.player_period_stats
  add column if not exists team_id bigint,
  add column if not exists points integer default 0,
  add column if not exists oreb integer default 0,
  add column if not exists dreb integer default 0,
  add column if not exists rebounds integer default 0,
  add column if not exists assists integer default 0,
  add column if not exists steals integer default 0,
  add column if not exists blocks integer default 0,
  add column if not exists turnovers integer default 0,
  add column if not exists fouls integer default 0,
  add column if not exists fgm integer default 0,
  add column if not exists fga integer default 0,
  add column if not exists fg_pct numeric default 0,
  add column if not exists tpm integer default 0,
  add column if not exists tpa integer default 0,
  add column if not exists tp_pct numeric default 0,
  add column if not exists ftm integer default 0,
  add column if not exists fta integer default 0,
  add column if not exists ft_pct numeric default 0,
  add column if not exists updated_at timestamp without time zone default now();

alter table public.team_period_stats
  add column if not exists points integer default 0,
  add column if not exists oreb integer default 0,
  add column if not exists dreb integer default 0,
  add column if not exists rebounds integer default 0,
  add column if not exists assists integer default 0,
  add column if not exists steals integer default 0,
  add column if not exists blocks integer default 0,
  add column if not exists turnovers integer default 0,
  add column if not exists fouls integer default 0,
  add column if not exists fgm integer default 0,
  add column if not exists fga integer default 0,
  add column if not exists fg_pct numeric default 0,
  add column if not exists tpm integer default 0,
  add column if not exists tpa integer default 0,
  add column if not exists tp_pct numeric default 0,
  add column if not exists ftm integer default 0,
  add column if not exists fta integer default 0,
  add column if not exists ft_pct numeric default 0,
  add column if not exists updated_at timestamp without time zone default now();

create index if not exists idx_player_period_stats_match_quarter
  on public.player_period_stats(match_id, quarter);

create index if not exists idx_team_period_stats_match_quarter
  on public.team_period_stats(match_id, quarter);

create or replace view public.live_period_score as
select
  match_id,
  quarter,
  team_id,
  points,
  fouls,
  rebounds,
  assists,
  steals,
  turnovers,
  blocks,
  updated_at
from public.team_period_stats;

select 'V2.1.21B period_stats_sql_ok' as result;

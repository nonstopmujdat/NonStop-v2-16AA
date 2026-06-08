-- NONSTOP V2.1.21C - Team Fouls + Game Finalization + 5 Foul Rule
-- Supabase SQL Editor içinde çalıştırılacak güvenli ekleme dosyasıdır.

-- 1) Oyuncu 5 faul kuralı için kalıcı alanlar
alter table public.player_game_stats
  add column if not exists fouled_out boolean default false,
  add column if not exists updated_at timestamp without time zone default now();

alter table public.player_period_stats
  add column if not exists fouled_out boolean default false,
  add column if not exists updated_at timestamp without time zone default now();

-- 2) Maç bitirme / kilitleme güvenliği
alter table public.matches
  add column if not exists current_quarter integer default 1,
  add column if not exists clock_seconds integer default 600,
  add column if not exists home_score integer default 0,
  add column if not exists away_score integer default 0,
  add column if not exists locked boolean default false,
  add column if not exists auto_lock_at timestamp with time zone,
  add column if not exists finished_at timestamp with time zone,
  add column if not exists locked_at timestamp with time zone,
  add column if not exists edit_window_seconds integer default 60;

-- 3) Maç kilit kayıtları: sonra kim ne zaman kilitledi / açtı görebiliriz
create table if not exists public.match_lock_logs (
  id bigserial primary key,
  match_id bigint not null,
  action varchar(50) not null,
  performed_by uuid null,
  notes text null,
  created_at timestamp with time zone default now()
);

-- 4) 5 faul yapan oyuncuları kolay görmek için view
create or replace view public.live_fouled_out_players as
select
  match_id,
  team_id,
  player_id,
  fouls,
  fouled_out,
  updated_at
from public.player_game_stats
where coalesce(fouled_out, false) = true
   or coalesce(fouls, 0) >= 5;

-- 5) Takım faullerini periyota göre canlı takip view'ı
create or replace view public.live_team_period_fouls as
select
  match_id,
  quarter,
  team_id,
  coalesce(fouls, 0) as team_fouls,
  least(coalesce(fouls, 0), 5) as visible_foul_dots,
  updated_at
from public.team_period_stats;

-- 6) Mevcut veride 5 ve üstü faulü olanları işaretle
update public.player_game_stats
set fouled_out = true,
    updated_at = now()
where coalesce(fouls, 0) >= 5;

select 'V2.1.21C team_fouls_game_finalization_sql_ok' as result;

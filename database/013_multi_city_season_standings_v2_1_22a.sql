-- NONSTOP V2.1.22A - Multi City Season & Standings Foundation
-- Amaç: İl bazlı bağımsız A/B ligleri, sezon istatistikleri ve TBF/TFF esaslı puan durumu temeli.
-- Supabase SQL Editor içinde tek parça çalıştırılabilir.

-- 0) Mevcut temel tablolara güvenli alanlar
alter table public.seasons
  add column if not exists city_id bigint references public.cities(id),
  add column if not exists season_code varchar(50),
  add column if not exists updated_at timestamp without time zone default now();

alter table public.categories
  add column if not exists category_code varchar(30),
  add column if not exists sort_order integer default 0,
  add column if not exists is_active boolean default true;

alter table public.teams
  add column if not exists city_id bigint references public.cities(id),
  add column if not exists league_id bigint,
  add column if not exists is_active boolean default true;


-- 0B) Player game stats geniş alanları yoksa ekle. Sezon hesabı bunları kullanır.
alter table public.player_game_stats
  add column if not exists oreb integer default 0,
  add column if not exists dreb integer default 0,
  add column if not exists fgm integer default 0,
  add column if not exists fga integer default 0,
  add column if not exists tpm integer default 0,
  add column if not exists tpa integer default 0,
  add column if not exists ftm integer default 0,
  add column if not exists fta integer default 0,
  add column if not exists updated_at timestamp without time zone default now();

alter table public.team_game_stats
  add column if not exists oreb integer default 0,
  add column if not exists dreb integer default 0,
  add column if not exists fgm integer default 0,
  add column if not exists fga integer default 0,
  add column if not exists tpm integer default 0,
  add column if not exists tpa integer default 0,
  add column if not exists ftm integer default 0,
  add column if not exists fta integer default 0,
  add column if not exists fg_pct numeric default 0,
  add column if not exists tp_pct numeric default 0,
  add column if not exists ft_pct numeric default 0,
  add column if not exists updated_at timestamp without time zone default now();

-- 1) Demo/esas sistem için il kayıtları. İsteyen il sonradan artırılır.
insert into public.cities(name)
values ('Bursa'), ('İstanbul'), ('İzmir'), ('Ankara'), ('Kocaeli')
on conflict (name) do nothing;

-- 2) Yaş kategorileri. Mevcut categories tablosu gender zorunlu olduğu için ERKEK/KIZ ayrı açılır.
insert into public.categories(name, gender, category_code, sort_order)
values
  ('U10', 'ERKEK', 'U10', 10), ('U10', 'KIZ', 'U10', 10),
  ('U11', 'ERKEK', 'U11', 11), ('U11', 'KIZ', 'U11', 11),
  ('U12', 'ERKEK', 'U12', 12), ('U12', 'KIZ', 'U12', 12),
  ('U14', 'ERKEK', 'U14', 14), ('U14', 'KIZ', 'U14', 14),
  ('U16', 'ERKEK', 'U16', 16), ('U16', 'KIZ', 'U16', 16),
  ('U18', 'ERKEK', 'U18', 18), ('U18', 'KIZ', 'U18', 18),
  ('GENÇLER', 'ERKEK', 'GENCLER', 20), ('GENÇLER', 'KIZ', 'GENCLER', 20),
  ('BÜYÜKLER', 'ERKEK', 'BUYUKLER', 30), ('BÜYÜKLER', 'KIZ', 'BUYUKLER', 30)
on conflict (name, gender) do update set
  category_code = excluded.category_code,
  sort_order = excluded.sort_order,
  is_active = true;

-- 3) Ligler: Her il, sezon, kategori ve lig seviyesi kendi başına bağımsızdır.
create table if not exists public.leagues (
  id bigserial primary key,
  city_id bigint not null references public.cities(id),
  season_id bigint not null references public.seasons(id),
  category_id bigint not null references public.categories(id),
  name varchar(255) not null,
  league_level varchar(10) not null default 'A', -- A / B
  is_independent boolean default true,
  standings_rule varchar(50) default 'TBF_TFF_BASIC',
  is_active boolean default true,
  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now(),
  constraint leagues_level_check check (league_level in ('A', 'B')),
  constraint leagues_unique unique (city_id, season_id, category_id, league_level)
);

-- Teams tablosundaki league_id için FK sonradan güvenli eklenir.
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'teams'
      and constraint_name = 'teams_league_id_fkey'
  ) then
    alter table public.teams
      add constraint teams_league_id_fkey foreign key (league_id) references public.leagues(id);
  end if;
end $$;

-- 4) Lig takım kayıtları: A ve B ligleri ayrı takım listesine sahiptir.
create table if not exists public.league_teams (
  id bigserial primary key,
  city_id bigint not null references public.cities(id),
  season_id bigint not null references public.seasons(id),
  category_id bigint not null references public.categories(id),
  league_id bigint not null references public.leagues(id) on delete cascade,
  team_id bigint not null references public.teams(id) on delete cascade,
  league_level varchar(10) not null default 'A',
  is_active boolean default true,
  joined_at timestamp without time zone default now(),
  constraint league_teams_level_check check (league_level in ('A', 'B')),
  constraint league_teams_unique unique (league_id, team_id)
);

-- 5) Oyuncu sezon istatistikleri
create table if not exists public.player_season_stats (
  id bigserial primary key,
  city_id bigint not null references public.cities(id),
  season_id bigint not null references public.seasons(id),
  category_id bigint references public.categories(id),
  league_id bigint references public.leagues(id),
  league_level varchar(10) default 'A',
  team_id bigint not null references public.teams(id),
  player_id bigint not null references public.players(id),

  games_played integer default 0,
  games_started integer default 0,
  minutes_played numeric default 0,

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

  ppg numeric default 0,
  rpg numeric default 0,
  apg numeric default 0,
  spg numeric default 0,
  bpg numeric default 0,

  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now(),
  constraint player_season_stats_unique unique (season_id, league_id, team_id, player_id)
);

-- 6) Takım sezon istatistikleri
create table if not exists public.team_season_stats (
  id bigserial primary key,
  city_id bigint not null references public.cities(id),
  season_id bigint not null references public.seasons(id),
  category_id bigint references public.categories(id),
  league_id bigint references public.leagues(id),
  league_level varchar(10) default 'A',
  team_id bigint not null references public.teams(id),

  games_played integer default 0,
  wins integer default 0,
  losses integer default 0,
  forfeits integer default 0,

  points_for integer default 0,
  points_against integer default 0,
  point_diff integer default 0,
  league_points integer default 0, -- Galibiyet 2, mağlubiyet 1, hükmen/çıkmama 0

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
  constraint team_season_stats_unique unique (season_id, league_id, team_id)
);

-- 7) Eşitlik bozma / head-to-head temeli
create table if not exists public.head_to_head_results (
  id bigserial primary key,
  city_id bigint not null references public.cities(id),
  season_id bigint not null references public.seasons(id),
  category_id bigint references public.categories(id),
  league_id bigint references public.leagues(id),
  team_id bigint not null references public.teams(id),
  opponent_team_id bigint not null references public.teams(id),

  games_played integer default 0,
  wins integer default 0,
  losses integer default 0,
  points_for integer default 0,
  points_against integer default 0,
  point_diff integer default 0,
  league_points integer default 0,

  updated_at timestamp without time zone default now(),
  constraint h2h_unique unique (season_id, league_id, team_id, opponent_team_id),
  constraint h2h_not_self check (team_id <> opponent_team_id)
);

-- 8) Puan durumu tablosu
create table if not exists public.league_standings (
  id bigserial primary key,
  city_id bigint not null references public.cities(id),
  season_id bigint not null references public.seasons(id),
  category_id bigint references public.categories(id),
  league_id bigint not null references public.leagues(id),
  league_level varchar(10) default 'A',
  team_id bigint not null references public.teams(id),

  rank integer,
  games_played integer default 0,
  wins integer default 0,
  losses integer default 0,
  forfeits integer default 0,
  points_for integer default 0,
  points_against integer default 0,
  point_diff integer default 0,
  league_points integer default 0,

  h2h_points integer default 0,
  h2h_point_diff integer default 0,
  h2h_points_for integer default 0,

  sort_note text,
  updated_at timestamp without time zone default now(),
  constraint league_standings_unique unique (season_id, league_id, team_id)
);

-- 9) Yardımcı: maçtan lig bilgisini bul
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
    m.id as match_id,
    coalesce(l.city_id, s.city_id, ht.city_id, at.city_id, o.city_id) as city_id,
    coalesce(l.season_id, m_season.id, ht.season_id, at.season_id, o.season_id) as season_id,
    coalesce(l.category_id, ht.category_id, at.category_id, o.category_id) as category_id,
    l.id as league_id,
    coalesce(l.league_level, 'A') as league_level,
    m.home_team_id,
    m.away_team_id,
    coalesce(m.home_score, 0) as home_score,
    coalesce(m.away_score, 0) as away_score
  from public.matches m
  left join public.teams ht on ht.id = m.home_team_id
  left join public.teams at on at.id = m.away_team_id
  left join public.organizations o on o.id = m.organization_id
  left join public.seasons m_season on m_season.id = coalesce(ht.season_id, at.season_id, o.season_id)
  left join public.league_teams lth on lth.team_id = m.home_team_id and lth.is_active = true
  left join public.league_teams lta on lta.team_id = m.away_team_id and lta.is_active = true and lta.league_id = lth.league_id
  left join public.leagues l on l.id = coalesce(lth.league_id, ht.league_id, at.league_id)
  left join public.seasons s on s.id = l.season_id
  where m.id = p_match_id
  limit 1;
$$;

-- 10) Takım sezon istatistiği ve puan durumu hesapla
create or replace function public.recalculate_team_season_stats(p_match_id bigint)
returns void
language plpgsql
as $$
declare
  ctx record;
  home_stats record;
  away_stats record;
  home_pts integer;
  away_pts integer;
  home_win boolean;
  away_win boolean;
begin
  select * into ctx from public.get_match_league_context(p_match_id);
  if ctx.match_id is null or ctx.city_id is null or ctx.season_id is null or ctx.league_id is null then
    raise notice 'Lig bağlamı eksik. league_teams, teams.city_id/season_id veya leagues kayıtlarını kontrol edin. match_id=%', p_match_id;
    return;
  end if;

  select * into home_stats from public.team_game_stats where match_id = p_match_id and team_id = ctx.home_team_id limit 1;
  select * into away_stats from public.team_game_stats where match_id = p_match_id and team_id = ctx.away_team_id limit 1;

  home_pts := coalesce(home_stats.points, ctx.home_score, 0);
  away_pts := coalesce(away_stats.points, ctx.away_score, 0);
  home_win := home_pts > away_pts;
  away_win := away_pts > home_pts;

  insert into public.team_season_stats (
    city_id, season_id, category_id, league_id, league_level, team_id,
    games_played, wins, losses, points_for, points_against, point_diff, league_points,
    rebounds, assists, steals, blocks, turnovers, fouls,
    fgm, fga, fg_pct, tpm, tpa, tp_pct, ftm, fta, ft_pct, updated_at
  ) values (
    ctx.city_id, ctx.season_id, ctx.category_id, ctx.league_id, ctx.league_level, ctx.home_team_id,
    1, case when home_win then 1 else 0 end, case when away_win then 1 else 0 end,
    home_pts, away_pts, home_pts - away_pts, case when home_win then 2 when away_win then 1 else 1 end,
    coalesce(home_stats.rebounds,0), coalesce(home_stats.assists,0), coalesce(home_stats.steals,0), coalesce(home_stats.blocks,0), coalesce(home_stats.turnovers,0), coalesce(home_stats.fouls,0),
    coalesce(home_stats.fgm,0), coalesce(home_stats.fga,0), case when coalesce(home_stats.fga,0)>0 then round((coalesce(home_stats.fgm,0)::numeric / home_stats.fga) * 100, 2) else 0 end,
    coalesce(home_stats.tpm,0), coalesce(home_stats.tpa,0), case when coalesce(home_stats.tpa,0)>0 then round((coalesce(home_stats.tpm,0)::numeric / home_stats.tpa) * 100, 2) else 0 end,
    coalesce(home_stats.ftm,0), coalesce(home_stats.fta,0), case when coalesce(home_stats.fta,0)>0 then round((coalesce(home_stats.ftm,0)::numeric / home_stats.fta) * 100, 2) else 0 end,
    now()
  ) on conflict (season_id, league_id, team_id) do update set
    games_played = excluded.games_played,
    wins = excluded.wins,
    losses = excluded.losses,
    points_for = excluded.points_for,
    points_against = excluded.points_against,
    point_diff = excluded.point_diff,
    league_points = excluded.league_points,
    rebounds = excluded.rebounds,
    assists = excluded.assists,
    steals = excluded.steals,
    blocks = excluded.blocks,
    turnovers = excluded.turnovers,
    fouls = excluded.fouls,
    fgm = excluded.fgm,
    fga = excluded.fga,
    fg_pct = excluded.fg_pct,
    tpm = excluded.tpm,
    tpa = excluded.tpa,
    tp_pct = excluded.tp_pct,
    ftm = excluded.ftm,
    fta = excluded.fta,
    ft_pct = excluded.ft_pct,
    updated_at = now();

  insert into public.team_season_stats (
    city_id, season_id, category_id, league_id, league_level, team_id,
    games_played, wins, losses, points_for, points_against, point_diff, league_points,
    rebounds, assists, steals, blocks, turnovers, fouls,
    fgm, fga, fg_pct, tpm, tpa, tp_pct, ftm, fta, ft_pct, updated_at
  ) values (
    ctx.city_id, ctx.season_id, ctx.category_id, ctx.league_id, ctx.league_level, ctx.away_team_id,
    1, case when away_win then 1 else 0 end, case when home_win then 1 else 0 end,
    away_pts, home_pts, away_pts - home_pts, case when away_win then 2 when home_win then 1 else 1 end,
    coalesce(away_stats.rebounds,0), coalesce(away_stats.assists,0), coalesce(away_stats.steals,0), coalesce(away_stats.blocks,0), coalesce(away_stats.turnovers,0), coalesce(away_stats.fouls,0),
    coalesce(away_stats.fgm,0), coalesce(away_stats.fga,0), case when coalesce(away_stats.fga,0)>0 then round((coalesce(away_stats.fgm,0)::numeric / away_stats.fga) * 100, 2) else 0 end,
    coalesce(away_stats.tpm,0), coalesce(away_stats.tpa,0), case when coalesce(away_stats.tpa,0)>0 then round((coalesce(away_stats.tpm,0)::numeric / away_stats.tpa) * 100, 2) else 0 end,
    coalesce(away_stats.ftm,0), coalesce(away_stats.fta,0), case when coalesce(away_stats.fta,0)>0 then round((coalesce(away_stats.ftm,0)::numeric / away_stats.fta) * 100, 2) else 0 end,
    now()
  ) on conflict (season_id, league_id, team_id) do update set
    games_played = excluded.games_played,
    wins = excluded.wins,
    losses = excluded.losses,
    points_for = excluded.points_for,
    points_against = excluded.points_against,
    point_diff = excluded.point_diff,
    league_points = excluded.league_points,
    rebounds = excluded.rebounds,
    assists = excluded.assists,
    steals = excluded.steals,
    blocks = excluded.blocks,
    turnovers = excluded.turnovers,
    fouls = excluded.fouls,
    fgm = excluded.fgm,
    fga = excluded.fga,
    fg_pct = excluded.fg_pct,
    tpm = excluded.tpm,
    tpa = excluded.tpa,
    tp_pct = excluded.tp_pct,
    ftm = excluded.ftm,
    fta = excluded.fta,
    ft_pct = excluded.ft_pct,
    updated_at = now();

  -- Head-to-head iki yönlü kayıt
  insert into public.head_to_head_results (
    city_id, season_id, category_id, league_id, team_id, opponent_team_id,
    games_played, wins, losses, points_for, points_against, point_diff, league_points, updated_at
  ) values (
    ctx.city_id, ctx.season_id, ctx.category_id, ctx.league_id, ctx.home_team_id, ctx.away_team_id,
    1, case when home_win then 1 else 0 end, case when away_win then 1 else 0 end,
    home_pts, away_pts, home_pts - away_pts, case when home_win then 2 when away_win then 1 else 1 end, now()
  ) on conflict (season_id, league_id, team_id, opponent_team_id) do update set
    games_played = excluded.games_played,
    wins = excluded.wins,
    losses = excluded.losses,
    points_for = excluded.points_for,
    points_against = excluded.points_against,
    point_diff = excluded.point_diff,
    league_points = excluded.league_points,
    updated_at = now();

  insert into public.head_to_head_results (
    city_id, season_id, category_id, league_id, team_id, opponent_team_id,
    games_played, wins, losses, points_for, points_against, point_diff, league_points, updated_at
  ) values (
    ctx.city_id, ctx.season_id, ctx.category_id, ctx.league_id, ctx.away_team_id, ctx.home_team_id,
    1, case when away_win then 1 else 0 end, case when home_win then 1 else 0 end,
    away_pts, home_pts, away_pts - home_pts, case when away_win then 2 when home_win then 1 else 1 end, now()
  ) on conflict (season_id, league_id, team_id, opponent_team_id) do update set
    games_played = excluded.games_played,
    wins = excluded.wins,
    losses = excluded.losses,
    points_for = excluded.points_for,
    points_against = excluded.points_against,
    point_diff = excluded.point_diff,
    league_points = excluded.league_points,
    updated_at = now();

  perform public.refresh_league_standings(ctx.league_id);
end;
$$;

-- 11) Oyuncu sezon istatistiği hesapla
create or replace function public.recalculate_player_season_stats(p_match_id bigint)
returns void
language plpgsql
as $$
declare
  ctx record;
begin
  select * into ctx from public.get_match_league_context(p_match_id);
  if ctx.match_id is null or ctx.city_id is null or ctx.season_id is null or ctx.league_id is null then
    raise notice 'Oyuncu sezon hesabı için lig bağlamı eksik. match_id=%', p_match_id;
    return;
  end if;

  insert into public.player_season_stats (
    city_id, season_id, category_id, league_id, league_level, team_id, player_id,
    games_played, minutes_played, points, oreb, dreb, rebounds, assists, steals, blocks, turnovers, fouls,
    fgm, fga, fg_pct, tpm, tpa, tp_pct, ftm, fta, ft_pct,
    ppg, rpg, apg, spg, bpg, updated_at
  )
  select
    ctx.city_id, ctx.season_id, ctx.category_id, ctx.league_id, ctx.league_level,
    pgs.team_id, pgs.player_id,
    1,
    coalesce(pgs.minutes_played,0),
    coalesce(pgs.points,0),
    coalesce(pgs.oreb,0),
    coalesce(pgs.dreb,0),
    coalesce(pgs.rebounds,0),
    coalesce(pgs.assists,0),
    coalesce(pgs.steals,0),
    coalesce(pgs.blocks,0),
    coalesce(pgs.turnovers,0),
    coalesce(pgs.fouls,0),
    coalesce(pgs.fgm,0),
    coalesce(pgs.fga,0), case when coalesce(pgs.fga,0)>0 then round((coalesce(pgs.fgm,0)::numeric / pgs.fga) * 100, 2) else 0 end,
    coalesce(pgs.tpm,0),
    coalesce(pgs.tpa,0), case when coalesce(pgs.tpa,0)>0 then round((coalesce(pgs.tpm,0)::numeric / pgs.tpa) * 100, 2) else 0 end,
    coalesce(pgs.ftm,0),
    coalesce(pgs.fta,0), case when coalesce(pgs.fta,0)>0 then round((coalesce(pgs.ftm,0)::numeric / pgs.fta) * 100, 2) else 0 end,
    coalesce(pgs.points,0), coalesce(pgs.rebounds,0), coalesce(pgs.assists,0), coalesce(pgs.steals,0), coalesce(pgs.blocks,0), now()
  from public.player_game_stats pgs
  where pgs.match_id = p_match_id
    and pgs.team_id is not null
    and pgs.player_id is not null
  on conflict (season_id, league_id, team_id, player_id) do update set
    games_played = excluded.games_played,
    minutes_played = excluded.minutes_played,
    points = excluded.points,
    oreb = excluded.oreb,
    dreb = excluded.dreb,
    rebounds = excluded.rebounds,
    assists = excluded.assists,
    steals = excluded.steals,
    blocks = excluded.blocks,
    turnovers = excluded.turnovers,
    fouls = excluded.fouls,
    fgm = excluded.fgm,
    fga = excluded.fga,
    fg_pct = excluded.fg_pct,
    tpm = excluded.tpm,
    tpa = excluded.tpa,
    tp_pct = excluded.tp_pct,
    ftm = excluded.ftm,
    fta = excluded.fta,
    ft_pct = excluded.ft_pct,
    ppg = excluded.ppg,
    rpg = excluded.rpg,
    apg = excluded.apg,
    spg = excluded.spg,
    bpg = excluded.bpg,
    updated_at = now();
end;
$$;

-- 12) Lig puan durumu yenile
create or replace function public.refresh_league_standings(p_league_id bigint)
returns void
language plpgsql
as $$
begin
  insert into public.league_standings (
    city_id, season_id, category_id, league_id, league_level, team_id,
    rank, games_played, wins, losses, forfeits, points_for, points_against, point_diff, league_points,
    h2h_points, h2h_point_diff, h2h_points_for, sort_note, updated_at
  )
  select
    tss.city_id, tss.season_id, tss.category_id, tss.league_id, tss.league_level, tss.team_id,
    dense_rank() over (
      partition by tss.league_id
      order by
        tss.league_points desc,
        coalesce(h2h.h2h_points, 0) desc,
        coalesce(h2h.h2h_point_diff, 0) desc,
        tss.point_diff desc,
        tss.points_for desc,
        tss.wins desc
    ) as rank,
    tss.games_played, tss.wins, tss.losses, tss.forfeits, tss.points_for, tss.points_against, tss.point_diff, tss.league_points,
    coalesce(h2h.h2h_points, 0), coalesce(h2h.h2h_point_diff, 0), coalesce(h2h.h2h_points_for, 0),
    'Sıra: Puan > eşit takımlar arası maç/puan > eşit takımlar arası averaj > genel averaj > atılan sayı',
    now()
  from public.team_season_stats tss
  left join (
    select
      league_id,
      team_id,
      sum(league_points) as h2h_points,
      sum(point_diff) as h2h_point_diff,
      sum(points_for) as h2h_points_for
    from public.head_to_head_results
    group by league_id, team_id
  ) h2h on h2h.league_id = tss.league_id and h2h.team_id = tss.team_id
  where tss.league_id = p_league_id
  on conflict (season_id, league_id, team_id) do update set
    rank = excluded.rank,
    games_played = excluded.games_played,
    wins = excluded.wins,
    losses = excluded.losses,
    forfeits = excluded.forfeits,
    points_for = excluded.points_for,
    points_against = excluded.points_against,
    point_diff = excluded.point_diff,
    league_points = excluded.league_points,
    h2h_points = excluded.h2h_points,
    h2h_point_diff = excluded.h2h_point_diff,
    h2h_points_for = excluded.h2h_points_for,
    sort_note = excluded.sort_note,
    updated_at = now();
end;
$$;

-- 13) Maç kilitlenince çağrılacak ana fonksiyon
create or replace function public.recalculate_season_after_match(p_match_id bigint)
returns void
language plpgsql
as $$
begin
  perform public.recalculate_team_season_stats(p_match_id);
  perform public.recalculate_player_season_stats(p_match_id);
end;
$$;

-- 14) Canlı/rapor view'ları. security_invoker uyarısı çıkmasın.
drop view if exists public.live_league_standings;
create view public.live_league_standings
with (security_invoker = true) as
select
  ls.rank,
  c.name as city_name,
  s.name as season_name,
  cat.name as category_name,
  cat.gender,
  l.name as league_name,
  l.league_level,
  t.name as team_name,
  ls.city_id,
  ls.season_id,
  ls.category_id,
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
left join public.teams t on t.id = ls.team_id;

drop view if exists public.live_player_season_stats;
create view public.live_player_season_stats
with (security_invoker = true) as
select
  pss.*,
  p.first_name,
  p.last_name,
  p.jersey_no,
  t.name as team_name
from public.player_season_stats pss
left join public.players p on p.id = pss.player_id
left join public.teams t on t.id = pss.team_id;

drop view if exists public.live_team_season_stats;
create view public.live_team_season_stats
with (security_invoker = true) as
select
  tss.*,
  t.name as team_name
from public.team_season_stats tss
left join public.teams t on t.id = tss.team_id;

select 'V2.1.22A multi_city_season_standings_sql_ok' as result;

-- 15) V2.1.22A kesin hesaplama düzeltmesi:
-- Sezon istatistikleri tek maçtan değil, ilgili ligdeki tüm tamamlanmış/kilitlenmiş maçlardan yeniden hesaplanır.
create or replace function public.recalculate_team_season_stats(p_match_id bigint)
returns void
language plpgsql
as $$
declare
  ctx record;
begin
  select * into ctx from public.get_match_league_context(p_match_id);
  if ctx.match_id is null or ctx.city_id is null or ctx.season_id is null or ctx.league_id is null then
    raise notice 'Lig bağlamı eksik. league_teams, teams.city_id/season_id veya leagues kayıtlarını kontrol edin. match_id=%', p_match_id;
    return;
  end if;

  insert into public.team_season_stats (
    city_id, season_id, category_id, league_id, league_level, team_id,
    games_played, wins, losses, points_for, points_against, point_diff, league_points,
    rebounds, assists, steals, blocks, turnovers, fouls,
    fgm, fga, fg_pct, tpm, tpa, tp_pct, ftm, fta, ft_pct, updated_at
  )
  with league_matches as (
    select m.*
    from public.matches m
    join public.league_teams ht on ht.team_id = m.home_team_id and ht.league_id = ctx.league_id
    join public.league_teams at on at.team_id = m.away_team_id and at.league_id = ctx.league_id
    where coalesce(m.locked, false) = true
       or m.status = 'TAMAMLANDI'
       or m.id = p_match_id
  ), team_rows as (
    select
      lm.id as match_id,
      lm.home_team_id as team_id,
      lm.away_team_id as opponent_team_id,
      coalesce(tgs.points, lm.home_score, 0) as pf,
      coalesce(opp.points, lm.away_score, 0) as pa,
      coalesce(tgs.rebounds,0) rebounds,
      coalesce(tgs.assists,0) assists,
      coalesce(tgs.steals,0) steals,
      coalesce(tgs.blocks,0) blocks,
      coalesce(tgs.turnovers,0) turnovers,
      coalesce(tgs.fouls,0) fouls,
      coalesce(tgs.fgm,0) fgm,
      coalesce(tgs.fga,0) fga,
      coalesce(tgs.tpm,0) tpm,
      coalesce(tgs.tpa,0) tpa,
      coalesce(tgs.ftm,0) ftm,
      coalesce(tgs.fta,0) fta
    from league_matches lm
    left join public.team_game_stats tgs on tgs.match_id = lm.id and tgs.team_id = lm.home_team_id
    left join public.team_game_stats opp on opp.match_id = lm.id and opp.team_id = lm.away_team_id
    union all
    select
      lm.id,
      lm.away_team_id,
      lm.home_team_id,
      coalesce(tgs.points, lm.away_score, 0),
      coalesce(opp.points, lm.home_score, 0),
      coalesce(tgs.rebounds,0), coalesce(tgs.assists,0), coalesce(tgs.steals,0), coalesce(tgs.blocks,0), coalesce(tgs.turnovers,0), coalesce(tgs.fouls,0),
      coalesce(tgs.fgm,0), coalesce(tgs.fga,0), coalesce(tgs.tpm,0), coalesce(tgs.tpa,0), coalesce(tgs.ftm,0), coalesce(tgs.fta,0)
    from league_matches lm
    left join public.team_game_stats tgs on tgs.match_id = lm.id and tgs.team_id = lm.away_team_id
    left join public.team_game_stats opp on opp.match_id = lm.id and opp.team_id = lm.home_team_id
  ), agg as (
    select
      team_id,
      count(*)::integer as games_played,
      sum(case when pf > pa then 1 else 0 end)::integer as wins,
      sum(case when pf < pa then 1 else 0 end)::integer as losses,
      sum(pf)::integer as points_for,
      sum(pa)::integer as points_against,
      sum(pf - pa)::integer as point_diff,
      sum(case when pf > pa then 2 else 1 end)::integer as league_points,
      sum(rebounds)::integer rebounds,
      sum(assists)::integer assists,
      sum(steals)::integer steals,
      sum(blocks)::integer blocks,
      sum(turnovers)::integer turnovers,
      sum(fouls)::integer fouls,
      sum(fgm)::integer fgm,
      sum(fga)::integer fga,
      sum(tpm)::integer tpm,
      sum(tpa)::integer tpa,
      sum(ftm)::integer ftm,
      sum(fta)::integer fta
    from team_rows
    group by team_id
  )
  select
    ctx.city_id, ctx.season_id, ctx.category_id, ctx.league_id, ctx.league_level, a.team_id,
    a.games_played, a.wins, a.losses, a.points_for, a.points_against, a.point_diff, a.league_points,
    a.rebounds, a.assists, a.steals, a.blocks, a.turnovers, a.fouls,
    a.fgm, a.fga, case when a.fga > 0 then round((a.fgm::numeric / a.fga) * 100, 2) else 0 end,
    a.tpm, a.tpa, case when a.tpa > 0 then round((a.tpm::numeric / a.tpa) * 100, 2) else 0 end,
    a.ftm, a.fta, case when a.fta > 0 then round((a.ftm::numeric / a.fta) * 100, 2) else 0 end,
    now()
  from agg a
  on conflict (season_id, league_id, team_id) do update set
    games_played = excluded.games_played,
    wins = excluded.wins,
    losses = excluded.losses,
    points_for = excluded.points_for,
    points_against = excluded.points_against,
    point_diff = excluded.point_diff,
    league_points = excluded.league_points,
    rebounds = excluded.rebounds,
    assists = excluded.assists,
    steals = excluded.steals,
    blocks = excluded.blocks,
    turnovers = excluded.turnovers,
    fouls = excluded.fouls,
    fgm = excluded.fgm,
    fga = excluded.fga,
    fg_pct = excluded.fg_pct,
    tpm = excluded.tpm,
    tpa = excluded.tpa,
    tp_pct = excluded.tp_pct,
    ftm = excluded.ftm,
    fta = excluded.fta,
    ft_pct = excluded.ft_pct,
    updated_at = now();

  delete from public.head_to_head_results where league_id = ctx.league_id and season_id = ctx.season_id;

  insert into public.head_to_head_results (
    city_id, season_id, category_id, league_id, team_id, opponent_team_id,
    games_played, wins, losses, points_for, points_against, point_diff, league_points, updated_at
  )
  with league_matches as (
    select m.*
    from public.matches m
    join public.league_teams ht on ht.team_id = m.home_team_id and ht.league_id = ctx.league_id
    join public.league_teams at on at.team_id = m.away_team_id and at.league_id = ctx.league_id
    where coalesce(m.locked, false) = true
       or m.status = 'TAMAMLANDI'
       or m.id = p_match_id
  ), team_rows as (
    select lm.home_team_id team_id, lm.away_team_id opponent_team_id, coalesce(h.points, lm.home_score, 0) pf, coalesce(a.points, lm.away_score, 0) pa
    from league_matches lm
    left join public.team_game_stats h on h.match_id = lm.id and h.team_id = lm.home_team_id
    left join public.team_game_stats a on a.match_id = lm.id and a.team_id = lm.away_team_id
    union all
    select lm.away_team_id, lm.home_team_id, coalesce(a.points, lm.away_score, 0), coalesce(h.points, lm.home_score, 0)
    from league_matches lm
    left join public.team_game_stats h on h.match_id = lm.id and h.team_id = lm.home_team_id
    left join public.team_game_stats a on a.match_id = lm.id and a.team_id = lm.away_team_id
  )
  select
    ctx.city_id, ctx.season_id, ctx.category_id, ctx.league_id, team_id, opponent_team_id,
    count(*)::integer,
    sum(case when pf > pa then 1 else 0 end)::integer,
    sum(case when pf < pa then 1 else 0 end)::integer,
    sum(pf)::integer,
    sum(pa)::integer,
    sum(pf - pa)::integer,
    sum(case when pf > pa then 2 else 1 end)::integer,
    now()
  from team_rows
  group by team_id, opponent_team_id;

  perform public.refresh_league_standings(ctx.league_id);
end;
$$;

create or replace function public.recalculate_player_season_stats(p_match_id bigint)
returns void
language plpgsql
as $$
declare
  ctx record;
begin
  select * into ctx from public.get_match_league_context(p_match_id);
  if ctx.match_id is null or ctx.city_id is null or ctx.season_id is null or ctx.league_id is null then
    raise notice 'Oyuncu sezon hesabı için lig bağlamı eksik. match_id=%', p_match_id;
    return;
  end if;

  insert into public.player_season_stats (
    city_id, season_id, category_id, league_id, league_level, team_id, player_id,
    games_played, minutes_played, points, oreb, dreb, rebounds, assists, steals, blocks, turnovers, fouls,
    fgm, fga, fg_pct, tpm, tpa, tp_pct, ftm, fta, ft_pct,
    ppg, rpg, apg, spg, bpg, updated_at
  )
  with league_matches as (
    select m.id
    from public.matches m
    join public.league_teams ht on ht.team_id = m.home_team_id and ht.league_id = ctx.league_id
    join public.league_teams at on at.team_id = m.away_team_id and at.league_id = ctx.league_id
    where coalesce(m.locked, false) = true
       or m.status = 'TAMAMLANDI'
       or m.id = p_match_id
  ), agg as (
    select
      pgs.team_id,
      pgs.player_id,
      count(distinct pgs.match_id)::integer games_played,
      sum(coalesce(pgs.minutes_played,0)) minutes_played,
      sum(coalesce(pgs.points,0))::integer points,
      sum(coalesce(pgs.oreb,0))::integer oreb,
      sum(coalesce(pgs.dreb,0))::integer dreb,
      sum(coalesce(pgs.rebounds,0))::integer rebounds,
      sum(coalesce(pgs.assists,0))::integer assists,
      sum(coalesce(pgs.steals,0))::integer steals,
      sum(coalesce(pgs.blocks,0))::integer blocks,
      sum(coalesce(pgs.turnovers,0))::integer turnovers,
      sum(coalesce(pgs.fouls,0))::integer fouls,
      sum(coalesce(pgs.fgm,0))::integer fgm,
      sum(coalesce(pgs.fga,0))::integer fga,
      sum(coalesce(pgs.tpm,0))::integer tpm,
      sum(coalesce(pgs.tpa,0))::integer tpa,
      sum(coalesce(pgs.ftm,0))::integer ftm,
      sum(coalesce(pgs.fta,0))::integer fta
    from public.player_game_stats pgs
    join league_matches lm on lm.id = pgs.match_id
    where pgs.team_id is not null and pgs.player_id is not null
    group by pgs.team_id, pgs.player_id
  )
  select
    ctx.city_id, ctx.season_id, ctx.category_id, ctx.league_id, ctx.league_level,
    a.team_id, a.player_id, a.games_played, a.minutes_played,
    a.points, a.oreb, a.dreb, a.rebounds, a.assists, a.steals, a.blocks, a.turnovers, a.fouls,
    a.fgm, a.fga, case when a.fga > 0 then round((a.fgm::numeric / a.fga) * 100, 2) else 0 end,
    a.tpm, a.tpa, case when a.tpa > 0 then round((a.tpm::numeric / a.tpa) * 100, 2) else 0 end,
    a.ftm, a.fta, case when a.fta > 0 then round((a.ftm::numeric / a.fta) * 100, 2) else 0 end,
    case when a.games_played > 0 then round(a.points::numeric / a.games_played, 2) else 0 end,
    case when a.games_played > 0 then round(a.rebounds::numeric / a.games_played, 2) else 0 end,
    case when a.games_played > 0 then round(a.assists::numeric / a.games_played, 2) else 0 end,
    case when a.games_played > 0 then round(a.steals::numeric / a.games_played, 2) else 0 end,
    case when a.games_played > 0 then round(a.blocks::numeric / a.games_played, 2) else 0 end,
    now()
  from agg a
  on conflict (season_id, league_id, team_id, player_id) do update set
    games_played = excluded.games_played,
    minutes_played = excluded.minutes_played,
    points = excluded.points,
    oreb = excluded.oreb,
    dreb = excluded.dreb,
    rebounds = excluded.rebounds,
    assists = excluded.assists,
    steals = excluded.steals,
    blocks = excluded.blocks,
    turnovers = excluded.turnovers,
    fouls = excluded.fouls,
    fgm = excluded.fgm,
    fga = excluded.fga,
    fg_pct = excluded.fg_pct,
    tpm = excluded.tpm,
    tpa = excluded.tpa,
    tp_pct = excluded.tp_pct,
    ftm = excluded.ftm,
    fta = excluded.fta,
    ft_pct = excluded.ft_pct,
    ppg = excluded.ppg,
    rpg = excluded.rpg,
    apg = excluded.apg,
    spg = excluded.spg,
    bpg = excluded.bpg,
    updated_at = now();
end;
$$;

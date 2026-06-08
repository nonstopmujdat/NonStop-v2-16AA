-- NONSTOP V2.1.20 – Team Stats Foundation
-- Bu dosya Supabase SQL Editor içinde çalıştırılır.
-- Amaç: player_game_stats.team_id + team_game_stats + live_match_score temelini güvenli kurmak.

ALTER TABLE IF EXISTS public.player_game_stats
  ADD COLUMN IF NOT EXISTS team_id BIGINT;

CREATE TABLE IF NOT EXISTS public.team_game_stats (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT NOT NULL,
  team_id BIGINT NOT NULL,
  points INTEGER DEFAULT 0,
  oreb INTEGER DEFAULT 0,
  dreb INTEGER DEFAULT 0,
  rebounds INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  steals INTEGER DEFAULT 0,
  turnovers INTEGER DEFAULT 0,
  blocks INTEGER DEFAULT 0,
  fouls INTEGER DEFAULT 0,
  fgm INTEGER DEFAULT 0,
  fga INTEGER DEFAULT 0,
  fg_pct NUMERIC DEFAULT 0,
  tpm INTEGER DEFAULT 0,
  tpa INTEGER DEFAULT 0,
  tp_pct NUMERIC DEFAULT 0,
  ftm INTEGER DEFAULT 0,
  fta INTEGER DEFAULT 0,
  ft_pct NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  CONSTRAINT team_game_stats_match_team_unique UNIQUE (match_id, team_id)
);

ALTER TABLE public.team_game_stats
  ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS oreb INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dreb INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rebounds INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assists INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS steals INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS turnovers INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blocks INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fouls INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fgm INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fga INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fg_pct NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tpm INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tpa INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tp_pct NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ftm INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fta INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ft_pct NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_player_game_stats_match_team
  ON public.player_game_stats(match_id, team_id);

CREATE INDEX IF NOT EXISTS idx_team_game_stats_match_team
  ON public.team_game_stats(match_id, team_id);

CREATE OR REPLACE FUNCTION public.recalculate_team_game_stats(p_match_id BIGINT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.team_game_stats (
    match_id, team_id,
    points, rebounds, assists, steals, blocks, turnovers, fouls,
    updated_at
  )
  SELECT
    match_id,
    team_id,
    COALESCE(SUM(points), 0),
    COALESCE(SUM(rebounds), 0),
    COALESCE(SUM(assists), 0),
    COALESCE(SUM(steals), 0),
    COALESCE(SUM(blocks), 0),
    COALESCE(SUM(turnovers), 0),
    COALESCE(SUM(fouls), 0),
    now()
  FROM public.player_game_stats
  WHERE match_id = p_match_id
    AND team_id IS NOT NULL
  GROUP BY match_id, team_id
  ON CONFLICT (match_id, team_id)
  DO UPDATE SET
    points = EXCLUDED.points,
    rebounds = EXCLUDED.rebounds,
    assists = EXCLUDED.assists,
    steals = EXCLUDED.steals,
    blocks = EXCLUDED.blocks,
    turnovers = EXCLUDED.turnovers,
    fouls = EXCLUDED.fouls,
    updated_at = now();
END;
$$;

CREATE OR REPLACE VIEW public.live_match_score AS
SELECT
  match_id,
  team_id,
  points,
  oreb,
  dreb,
  rebounds,
  assists,
  steals,
  turnovers,
  blocks,
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
FROM public.team_game_stats;

SELECT 'NONSTOP V2.1.20 Team Stats Foundation ready' AS status;

-- NONSTOP V2.1.20 Team Stats Foundation
-- Bu dosya Supabase SQL Editor içinde çalıştırılabilir.
-- Amaç: team_id, team_game_stats, canlı skor view ve güvenli yeniden hesaplama fonksiyonu.

ALTER TABLE IF EXISTS public.player_game_stats
  ADD COLUMN IF NOT EXISTS team_id BIGINT REFERENCES public.teams(id);

CREATE TABLE IF NOT EXISTS public.team_game_stats (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES public.matches(id) ON DELETE CASCADE,
  team_id BIGINT REFERENCES public.teams(id),
  points INTEGER DEFAULT 0,
  rebounds INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  steals INTEGER DEFAULT 0,
  blocks INTEGER DEFAULT 0,
  turnovers INTEGER DEFAULT 0,
  fouls INTEGER DEFAULT 0,
  two_made INTEGER DEFAULT 0,
  two_attempt INTEGER DEFAULT 0,
  three_made INTEGER DEFAULT 0,
  three_attempt INTEGER DEFAULT 0,
  ft_made INTEGER DEFAULT 0,
  ft_attempt INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(match_id, team_id)
);

ALTER TABLE IF EXISTS public.team_game_stats
  ADD COLUMN IF NOT EXISTS steals INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blocks INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS two_made INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS two_attempt INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS three_made INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS three_attempt INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ft_made INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ft_attempt INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_player_game_stats_match_team
  ON public.player_game_stats(match_id, team_id);

CREATE INDEX IF NOT EXISTS idx_team_game_stats_match_team
  ON public.team_game_stats(match_id, team_id);

CREATE INDEX IF NOT EXISTS idx_match_events_match_team_created
  ON public.match_events(match_id, team_id, created_at DESC);

UPDATE public.player_game_stats pgs
SET team_id = src.team_id
FROM (
  SELECT DISTINCT ON (match_id, player_id)
    match_id,
    player_id,
    team_id
  FROM public.match_events
  WHERE player_id IS NOT NULL
    AND team_id IS NOT NULL
  ORDER BY match_id, player_id, created_at DESC, id DESC
) src
WHERE pgs.match_id = src.match_id
  AND pgs.player_id = src.player_id
  AND pgs.team_id IS NULL;

CREATE OR REPLACE FUNCTION public.recalculate_team_game_stats(p_match_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.team_game_stats (
    match_id,
    team_id,
    points,
    rebounds,
    assists,
    steals,
    blocks,
    turnovers,
    fouls,
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
    NOW()
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
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE VIEW public.live_match_score AS
SELECT
  match_id,
  team_id,
  points,
  rebounds,
  assists,
  steals,
  blocks,
  turnovers,
  fouls,
  updated_at
FROM public.team_game_stats;

-- Demo maç varsa mevcut oyuncu istatistiklerinden takım istatistiğini üretir.
SELECT public.recalculate_team_game_stats(1);

SELECT
  'NONSTOP V2.1.20 team_game_stats + live_match_score ready' AS status;

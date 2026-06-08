-- NONSTOP V2.1.20
-- player_game_stats team_id support + live panel helper indexes

ALTER TABLE IF EXISTS public.player_game_stats
  ADD COLUMN IF NOT EXISTS team_id BIGINT REFERENCES public.teams(id);

CREATE INDEX IF NOT EXISTS idx_player_game_stats_match_team
  ON public.player_game_stats(match_id, team_id);

CREATE INDEX IF NOT EXISTS idx_match_events_match_created
  ON public.match_events(match_id, created_at DESC);

-- Backfill team_id for existing player_game_stats rows using match_events when possible.
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

SELECT
  'NONSTOP V2.1.20 player_game_stats team_id ready' AS status,
  COUNT(*) AS player_game_stats_rows,
  COUNT(*) FILTER (WHERE team_id IS NOT NULL) AS rows_with_team_id
FROM public.player_game_stats;

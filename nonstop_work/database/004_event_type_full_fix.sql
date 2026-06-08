-- NONSTOP V2.1.12 Match Events Full Fix
-- Run this once in Supabase SQL Editor.
-- It adds the stable event_type values used by the operator page.

ALTER TYPE event_type ADD VALUE IF NOT EXISTS '2PA_MADE';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS '3PA_MADE';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'FTA_MADE';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'FOUL';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'FOUL_DRAWN';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'BLK_AGAINST';

-- Optional quick check: shows recent match_events after operator tests.
-- SELECT id, match_id, team_id, player_id, related_player_id, quarter, game_clock, event_type, event_tags, created_at
-- FROM match_events
-- ORDER BY id DESC
-- LIMIT 20;

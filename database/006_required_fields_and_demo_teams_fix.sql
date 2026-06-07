-- NONSTOP V2.1.14 Required Fields + Demo Team Names Fix
-- Run after 001_schema_v1_8.sql and 003_demo_match_data.sql.
-- Purpose:
-- 1) Ensure match_events required demo defaults are safe for operator testing.
-- 2) Ensure event_type enum accepts current operator event names.
-- 3) Change demo home/away teams to Final Spor vs TOFAŞ.

-- Make sure current event names exist in enum.
ALTER TYPE event_type ADD VALUE IF NOT EXISTS '2PA_MADE';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS '2PA_MISS';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS '3PA_MADE';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS '3PA_MISS';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'FTA_MADE';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'FTA_MISS';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'AST';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'OREB';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'DREB';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'STL';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'TOV';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'BLK';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'BLK_AGAINST';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'FOUL';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'FOUL_DRAWN';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'SUBSTITUTION';

-- Update demo team names. IDs stay the same so the operator page remains compatible.
UPDATE clubs
SET name = 'FİNAL SPOR U14', short_name = 'FİNAL'
WHERE id = 1;

UPDATE clubs
SET name = 'TOFAŞ U14', short_name = 'TOFAŞ'
WHERE id = 2;

UPDATE teams
SET name = 'FİNAL SPOR U14'
WHERE id = 1;

UPDATE teams
SET name = 'TOFAŞ U14'
WHERE id = 2;

UPDATE matches
SET home_team_id = 1,
    away_team_id = 2,
    status = 'DEVAM_EDIYOR',
    current_quarter = COALESCE(current_quarter, 1),
    clock_seconds = COALESCE(clock_seconds, 600)
WHERE id = 1;

-- Database-side safety defaults for demo/test operator flow.
-- If the API ever omits these required fields, Supabase will still accept demo events.
ALTER TABLE match_events ALTER COLUMN match_id SET DEFAULT 1;
ALTER TABLE match_events ALTER COLUMN team_id SET DEFAULT 1;
ALTER TABLE match_events ALTER COLUMN quarter SET DEFAULT 1;
ALTER TABLE match_events ALTER COLUMN sync_source SET DEFAULT 'OPERATOR_WEB';
ALTER TABLE match_events ALTER COLUMN operator_side SET DEFAULT 'HOME_OPERATOR';

-- Quick verification output.
SELECT 'NONSTOP V2.1.14 required fields ready' AS status,
       (SELECT name FROM teams WHERE id = 1) AS home_team,
       (SELECT name FROM teams WHERE id = 2) AS away_team,
       (SELECT COUNT(*) FROM matches WHERE id = 1 AND home_team_id = 1 AND away_team_id = 2) AS demo_match_ok;

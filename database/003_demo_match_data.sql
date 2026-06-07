-- NONSTOP V2.1.11 demo data fix
-- Safe to run multiple times in Supabase SQL Editor.
-- Run after database/001_schema_v1_8.sql and database/002_rls_starter.sql.
-- Creates/updates demo data expected by the operator page:
-- match_id=1, team_id=1, player_id=1..12.

DO $$
DECLARE
  v_city_id BIGINT;
  v_season_id BIGINT;
  v_category_id BIGINT;
BEGIN
  -- City: use existing Bursa if present, otherwise create it.
  INSERT INTO cities(name)
  VALUES ('Bursa')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_city_id;

  -- Season: use existing season if present, otherwise create it.
  INSERT INTO seasons(name, start_date, end_date, is_active)
  VALUES ('2026-2027', '2026-09-01', '2027-06-30', true)
  ON CONFLICT (name) DO UPDATE
    SET start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        is_active = EXCLUDED.is_active
  RETURNING id INTO v_season_id;

  -- Category: avoid duplicate (name, gender) crash.
  INSERT INTO categories(name, gender)
  VALUES ('U14', 'ERKEK')
  ON CONFLICT (name, gender) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_category_id;

  -- Organization, venue, clubs, teams: force demo IDs used by operator page.
  INSERT INTO organizations(id, city_id, season_id, category_id, name, organization_type)
  VALUES (1, v_city_id, v_season_id, v_category_id, 'NONSTOP Demo Ligi', 'LIG')
  ON CONFLICT (id) DO UPDATE
    SET city_id = EXCLUDED.city_id,
        season_id = EXCLUDED.season_id,
        category_id = EXCLUDED.category_id,
        name = EXCLUDED.name,
        organization_type = EXCLUDED.organization_type;

  INSERT INTO venues(id, city_id, name)
  VALUES (1, v_city_id, 'Demo Salon')
  ON CONFLICT (id) DO UPDATE
    SET city_id = EXCLUDED.city_id,
        name = EXCLUDED.name;

  INSERT INTO clubs(id, city_id, name, short_name) VALUES
  (1, v_city_id, 'FİNAL SPOR U14', 'FİNAL'),
  (2, v_city_id, 'TOFAŞ U14', 'TOFAŞ')
  ON CONFLICT (id) DO UPDATE
    SET city_id = EXCLUDED.city_id,
        name = EXCLUDED.name,
        short_name = EXCLUDED.short_name;

  INSERT INTO teams(id, club_id, category_id, season_id, name) VALUES
  (1, 1, v_category_id, v_season_id, 'FİNAL SPOR U14'),
  (2, 2, v_category_id, v_season_id, 'TOFAŞ U14')
  ON CONFLICT (id) DO UPDATE
    SET club_id = EXCLUDED.club_id,
        category_id = EXCLUDED.category_id,
        season_id = EXCLUDED.season_id,
        name = EXCLUDED.name;

  -- Avoid license_no conflicts from previous partial demo attempts.
  UPDATE players
  SET license_no = CONCAT('ARCHIVED-', id, '-', license_no)
  WHERE license_no IN (
    'DEMO-7','DEMO-4','DEMO-5','DEMO-6','DEMO-8','DEMO-9',
    'DEMO-10','DEMO-11','DEMO-12','DEMO-13','DEMO-14','DEMO-15'
  )
  AND id NOT BETWEEN 1 AND 12;

  INSERT INTO players(id, license_no, jersey_no, first_name, last_name, position) VALUES
  (1, 'DEMO-7', 7, 'Burak', 'Demo', 'G'),
  (2, 'DEMO-4', 4, 'Ahmet', 'Demo', 'G'),
  (3, 'DEMO-5', 5, 'Mehmet', 'Demo', 'F'),
  (4, 'DEMO-6', 6, 'Ali', 'Demo', 'F'),
  (5, 'DEMO-8', 8, 'Kerem', 'Demo', 'C'),
  (6, 'DEMO-9', 9, 'Ege', 'Demo', 'G'),
  (7, 'DEMO-10', 10, 'Okan', 'Demo', 'G'),
  (8, 'DEMO-11', 11, 'Mert', 'Demo', 'F'),
  (9, 'DEMO-12', 12, 'Can', 'Demo', 'F'),
  (10, 'DEMO-13', 13, 'Tuna', 'Demo', 'C'),
  (11, 'DEMO-14', 14, 'Emir', 'Demo', 'F'),
  (12, 'DEMO-15', 15, 'Arda', 'Demo', 'G')
  ON CONFLICT (id) DO UPDATE
    SET license_no = EXCLUDED.license_no,
        jersey_no = EXCLUDED.jersey_no,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        position = EXCLUDED.position,
        active = true;

  INSERT INTO player_team_registrations(player_id, team_id, season_id, is_active)
  SELECT p.id, 1, v_season_id, true
  FROM players p
  WHERE p.id BETWEEN 1 AND 12
    AND NOT EXISTS (
      SELECT 1
      FROM player_team_registrations r
      WHERE r.player_id = p.id
        AND r.team_id = 1
        AND r.season_id = v_season_id
    );

  INSERT INTO matches(id, organization_id, home_team_id, away_team_id, venue_id, match_datetime, status, match_type, home_score, away_score, current_quarter, clock_seconds, stats_mode)
  VALUES (1, 1, 1, 2, 1, NOW(), 'DEVAM_EDIYOR', 'OZEL', 52, 47, 4, 204, 'SINGLE')
  ON CONFLICT (id) DO UPDATE
    SET organization_id = EXCLUDED.organization_id,
        home_team_id = EXCLUDED.home_team_id,
        away_team_id = EXCLUDED.away_team_id,
        venue_id = EXCLUDED.venue_id,
        status = EXCLUDED.status,
        match_type = EXCLUDED.match_type,
        home_score = EXCLUDED.home_score,
        away_score = EXCLUDED.away_score,
        current_quarter = EXCLUDED.current_quarter,
        clock_seconds = EXCLUDED.clock_seconds,
        stats_mode = EXCLUDED.stats_mode;
END $$;

-- Reset sequences safely if these tables use serial/bigserial IDs.
SELECT setval(pg_get_serial_sequence('organizations','id'), GREATEST((SELECT MAX(id) FROM organizations), 1));
SELECT setval(pg_get_serial_sequence('venues','id'), GREATEST((SELECT MAX(id) FROM venues), 1));
SELECT setval(pg_get_serial_sequence('clubs','id'), GREATEST((SELECT MAX(id) FROM clubs), 1));
SELECT setval(pg_get_serial_sequence('teams','id'), GREATEST((SELECT MAX(id) FROM teams), 1));
SELECT setval(pg_get_serial_sequence('players','id'), GREATEST((SELECT MAX(id) FROM players), 1));
SELECT setval(pg_get_serial_sequence('matches','id'), GREATEST((SELECT MAX(id) FROM matches), 1));

-- Quick verification output.
SELECT 'NONSTOP V2.1.11 demo data ready' AS status,
  (SELECT COUNT(*) FROM teams WHERE id IN (1,2)) AS demo_teams,
  (SELECT COUNT(*) FROM players WHERE id BETWEEN 1 AND 12) AS demo_players,
  (SELECT COUNT(*) FROM matches WHERE id = 1) AS demo_matches;

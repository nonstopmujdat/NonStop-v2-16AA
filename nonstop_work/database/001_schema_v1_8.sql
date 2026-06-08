-- NONSTOP DATABASE V1.8
-- PostgreSQL / Supabase compatible schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN CREATE TYPE gender_type AS ENUM ('ERKEK', 'KIZ'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE organization_type AS ENUM ('LIG', 'TURNUVA', 'HAZIRLIK', 'OKUL', 'OZEL_MAC'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE match_status AS ENUM ('PLANLANDI', 'DEVAM_EDIYOR', 'TAMAMLANDI', 'IPTAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE match_type AS ENUM ('RESMI', 'OZEL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE user_role_code AS ENUM ('SUPER_ADMIN', 'NONSTOP_OPERATOR', 'CITY_ADMIN', 'CLUB_ADMIN', 'VIEWER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE dominant_hand AS ENUM ('SAG', 'SOL', 'CIFT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE operator_role AS ENUM ('SINGLE_OPERATOR', 'HOME_OPERATOR', 'AWAY_OPERATOR', 'SUPERVISOR'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE event_type AS ENUM (
  '2PM','2PA_MADE','2PA_MISS','3PM','3PA_MADE','3PA_MISS','FTM','FTA_MADE','FTA_MISS',
  'AST','OREB','DREB','STL','BLK','BLK_AGAINST','TOV','PF','FOUL','FD','FOUL_DRAWN',
  'CHARGE_DRAWN','BLOCKED','BY','TIMEOUT','SUBSTITUTION'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS cities (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  id BIGSERIAL PRIMARY KEY,
  role_code user_role_code UNIQUE NOT NULL,
  role_name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
  id BIGSERIAL PRIMARY KEY,
  permission_code VARCHAR(100) UNIQUE NOT NULL,
  permission_name VARCHAR(255),
  description TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  city_id BIGINT REFERENCES cities(id),
  is_active BOOLEAN DEFAULT TRUE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id BIGINT REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id BIGINT REFERENCES roles(id) ON DELETE CASCADE,
  permission_id BIGINT REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id BIGINT,
  details JSONB,
  ip_address VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seasons (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  gender gender_type NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, gender)
);

CREATE TABLE IF NOT EXISTS organizations (
  id BIGSERIAL PRIMARY KEY,
  city_id BIGINT REFERENCES cities(id),
  season_id BIGINT REFERENCES seasons(id),
  category_id BIGINT REFERENCES categories(id),
  name VARCHAR(255) NOT NULL,
  organization_type organization_type NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS venues (
  id BIGSERIAL PRIMARY KEY,
  city_id BIGINT REFERENCES cities(id),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  capacity INTEGER,
  court_count INTEGER DEFAULT 1,
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clubs (
  id BIGSERIAL PRIMARY KEY,
  city_id BIGINT REFERENCES cities(id),
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50),
  logo_url TEXT,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schools (
  id BIGSERIAL PRIMARY KEY,
  city_id BIGINT REFERENCES cities(id),
  school_name VARCHAR(255) NOT NULL,
  school_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
  id BIGSERIAL PRIMARY KEY,
  club_id BIGINT REFERENCES clubs(id),
  school_id BIGINT REFERENCES schools(id),
  category_id BIGINT REFERENCES categories(id),
  season_id BIGINT REFERENCES seasons(id),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (club_id IS NOT NULL OR school_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS players (
  id BIGSERIAL PRIMARY KEY,
  license_no VARCHAR(100) UNIQUE,
  jersey_no INTEGER,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  birth_date DATE,
  photo_url TEXT,
  position VARCHAR(20),
  dominant_hand dominant_hand,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_team_registrations (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
  team_id BIGINT REFERENCES teams(id),
  season_id BIGINT REFERENCES seasons(id),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_consents (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT UNIQUE REFERENCES players(id) ON DELETE CASCADE,
  kvkk_approved BOOLEAN DEFAULT FALSE,
  parent_approved BOOLEAN DEFAULT FALSE,
  photo_permission BOOLEAN DEFAULT FALSE,
  video_permission BOOLEAN DEFAULT FALSE,
  stats_permission BOOLEAN DEFAULT FALSE,
  consent_document_url TEXT,
  approval_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_documents (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
  document_type VARCHAR(50),
  document_url TEXT,
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_requests (
  id BIGSERIAL PRIMARY KEY,
  club_id BIGINT REFERENCES clubs(id),
  requested_by UUID REFERENCES users(id),
  player_name VARCHAR(255),
  birth_date DATE,
  jersey_no INTEGER,
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_transfer_requests (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT REFERENCES players(id),
  from_team_id BIGINT REFERENCES teams(id),
  to_team_id BIGINT REFERENCES teams(id),
  requested_by UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_measurements (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL,
  height_cm NUMERIC(5,2),
  weight_kg NUMERIC(5,2),
  wingspan_cm NUMERIC(5,2),
  body_fat NUMERIC(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS athletic_tests (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
  test_date DATE,
  vertical_jump_cm NUMERIC(5,2),
  sprint_20m_sec NUMERIC(5,2),
  shuttle_run_sec NUMERIC(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS basketball_skill_tests (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
  test_date DATE,
  free_throw_score INTEGER,
  right_layup_score INTEGER,
  left_layup_score INTEGER,
  dribbling_score INTEGER,
  passing_score INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scout_reports (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id),
  strengths TEXT,
  weaknesses TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id),
  home_team_id BIGINT REFERENCES teams(id),
  away_team_id BIGINT REFERENCES teams(id),
  venue_id BIGINT REFERENCES venues(id),
  match_datetime TIMESTAMP,
  status match_status DEFAULT 'PLANLANDI',
  match_type match_type DEFAULT 'RESMI',
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  quarter_count INTEGER DEFAULT 4,
  quarter_duration_minutes INTEGER DEFAULT 10,
  running_clock BOOLEAN DEFAULT FALSE,
  overtime_enabled BOOLEAN DEFAULT TRUE,
  current_quarter INTEGER DEFAULT 1,
  clock_seconds INTEGER DEFAULT 600,
  rosters_confirmed BOOLEAN DEFAULT FALSE,
  starters_confirmed BOOLEAN DEFAULT FALSE,
  ready_to_start BOOLEAN DEFAULT FALSE,
  stats_mode VARCHAR(30) DEFAULT 'SINGLE',
  clock_owner_role VARCHAR(50) DEFAULT 'FIELD_OPERATOR',
  finished_at TIMESTAMP,
  auto_lock_at TIMESTAMP,
  locked_at TIMESTAMP,
  locked BOOLEAN DEFAULT FALSE,
  post_match_visible BOOLEAN DEFAULT TRUE,
  edit_window_minutes INTEGER DEFAULT 15,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (home_team_id <> away_team_id)
);

CREATE TABLE IF NOT EXISTS match_operators (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  operator_role operator_role,
  controlled_team_id BIGINT REFERENCES teams(id),
  can_view_only_controlled_team BOOLEAN DEFAULT TRUE,
  can_control_clock BOOLEAN DEFAULT FALSE,
  can_edit_after_finish BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_rosters (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
  player_id BIGINT REFERENCES players(id),
  team_id BIGINT REFERENCES teams(id),
  is_active BOOLEAN DEFAULT TRUE,
  is_starter BOOLEAN DEFAULT FALSE,
  jersey_no INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

CREATE TABLE IF NOT EXISTS substitutions (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
  team_id BIGINT REFERENCES teams(id),
  player_out_id BIGINT REFERENCES players(id),
  player_in_id BIGINT REFERENCES players(id),
  quarter SMALLINT,
  game_clock VARCHAR(10),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_events (
  id BIGSERIAL PRIMARY KEY,
  client_event_id VARCHAR(100) UNIQUE,
  match_id BIGINT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id BIGINT NOT NULL REFERENCES teams(id),
  player_id BIGINT REFERENCES players(id),
  related_player_id BIGINT REFERENCES players(id),
  quarter SMALLINT NOT NULL,
  game_clock VARCHAR(10),
  event_type event_type NOT NULL,
  event_tags VARCHAR(100),
  linked_basket_id VARCHAR(100),
  operator_side VARCHAR(20),
  sync_source VARCHAR(30),
  client_created_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS basket_event_links (
  id BIGSERIAL PRIMARY KEY,
  linked_basket_id VARCHAR(100) UNIQUE NOT NULL,
  match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
  shooter_event_id BIGINT REFERENCES match_events(id) ON DELETE CASCADE,
  shooter_player_id BIGINT REFERENCES players(id),
  assist_player_id BIGINT REFERENCES players(id),
  foul_committed_by_player_id BIGINT REFERENCES players(id),
  assist_status VARCHAR(20) DEFAULT 'PENDING',
  foul_status VARCHAR(20) DEFAULT 'PENDING',
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shot_events (
  id BIGSERIAL PRIMARY KEY,
  match_event_id BIGINT UNIQUE REFERENCES match_events(id) ON DELETE CASCADE,
  x NUMERIC(8,2),
  y NUMERIC(8,2),
  shot_zone VARCHAR(50),
  shot_type VARCHAR(50),
  made BOOLEAN DEFAULT FALSE,
  assisted BOOLEAN DEFAULT FALSE,
  fast_break BOOLEAN DEFAULT FALSE,
  second_chance BOOLEAN DEFAULT FALSE,
  and_one BOOLEAN DEFAULT FALSE,
  is_free_throw BOOLEAN DEFAULT FALSE,
  free_throw_order INTEGER,
  free_throw_total INTEGER,
  label VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS foul_events (
  id BIGSERIAL PRIMARY KEY,
  match_event_id BIGINT UNIQUE REFERENCES match_events(id) ON DELETE CASCADE,
  x NUMERIC(8,2),
  y NUMERIC(8,2),
  foul_type VARCHAR(50),
  committed_by_player_id BIGINT REFERENCES players(id),
  drawn_by_player_id BIGINT REFERENCES players(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_timeouts (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
  team_id BIGINT REFERENCES teams(id),
  quarter INTEGER,
  game_clock VARCHAR(10),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_lock_logs (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
  action VARCHAR(50),
  performed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sync_events (
  id BIGSERIAL PRIMARY KEY,
  event_id VARCHAR(100) UNIQUE NOT NULL,
  match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
  linked_basket_id VARCHAR(100),
  operator_user_id UUID REFERENCES users(id),
  operator_side VARCHAR(20),
  event_payload JSONB NOT NULL,
  client_created_at TIMESTAMP,
  server_received_at TIMESTAMP DEFAULT NOW(),
  sync_status VARCHAR(20) DEFAULT 'RECEIVED'
);

CREATE TABLE IF NOT EXISTS sync_conflicts (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
  event_id VARCHAR(100),
  conflict_type VARCHAR(100),
  local_payload JSONB,
  server_payload JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_game_stats (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
  player_id BIGINT REFERENCES players(id),
  minutes_played NUMERIC(5,2) DEFAULT 0,
  points INTEGER DEFAULT 0,
  rebounds INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  steals INTEGER DEFAULT 0,
  blocks INTEGER DEFAULT 0,
  turnovers INTEGER DEFAULT 0,
  fouls INTEGER DEFAULT 0,
  plus_minus INTEGER DEFAULT 0,
  ts_percentage NUMERIC(6,2),
  efg_percentage NUMERIC(6,2),
  perf40 NUMERIC(8,2),
  mvp_score NUMERIC(8,2),
  UNIQUE(match_id, player_id)
);

CREATE TABLE IF NOT EXISTS team_game_stats (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
  team_id BIGINT REFERENCES teams(id),
  points INTEGER DEFAULT 0,
  rebounds INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  turnovers INTEGER DEFAULT 0,
  steals INTEGER DEFAULT 0,
  blocks INTEGER DEFAULT 0,
  fouls INTEGER DEFAULT 0,
  UNIQUE(match_id, team_id)
);

CREATE TABLE IF NOT EXISTS generated_reports (
  id BIGSERIAL PRIMARY KEY,
  report_type VARCHAR(50),
  report_name VARCHAR(255),
  match_id BIGINT REFERENCES matches(id),
  player_id BIGINT REFERENCES players(id),
  file_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_match_access_logs (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  access_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operator_screen_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  match_id BIGINT REFERENCES matches(id) ON DELETE CASCADE,
  layout_mode VARCHAR(50) DEFAULT 'TEAM_ONLY_OPERATOR',
  show_court BOOLEAN DEFAULT TRUE,
  show_bench BOOLEAN DEFAULT TRUE,
  show_other_matches BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_city ON users(city_id);
CREATE INDEX IF NOT EXISTS idx_organizations_city_season ON organizations(city_id, season_id);
CREATE INDEX IF NOT EXISTS idx_teams_club_category_season ON teams(club_id, category_id, season_id);
CREATE INDEX IF NOT EXISTS idx_player_registrations_player ON player_team_registrations(player_id);
CREATE INDEX IF NOT EXISTS idx_player_registrations_team ON player_team_registrations(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_org_datetime ON matches(organization_id, match_datetime);
CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_match_events_player ON match_events(player_id);
CREATE INDEX IF NOT EXISTS idx_match_events_linked ON match_events(linked_basket_id);
CREATE INDEX IF NOT EXISTS idx_sync_events_event_id ON sync_events(event_id);
CREATE INDEX IF NOT EXISTS idx_sync_events_match ON sync_events(match_id);

INSERT INTO cities(name) VALUES ('Bursa'),('İstanbul'),('Ankara'),('İzmir'),('Antalya') ON CONFLICT (name) DO NOTHING;

INSERT INTO seasons(name, start_date, end_date, is_active)
VALUES ('2026-2027','2026-09-01','2027-06-30', TRUE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories(name, gender) VALUES
('U10','ERKEK'),('U11','ERKEK'),('U12','ERKEK'),('U14','ERKEK'),('U16','ERKEK'),('U18','ERKEK'),('GENÇ','ERKEK'),('BÜYÜK','ERKEK'),
('U10','KIZ'),('U11','KIZ'),('U12','KIZ'),('U14','KIZ'),('U16','KIZ'),('U18','KIZ'),('GENÇ','KIZ'),('BÜYÜK','KIZ')
ON CONFLICT (name, gender) DO NOTHING;

INSERT INTO roles(role_code, role_name) VALUES
('SUPER_ADMIN','Süper Admin'),('NONSTOP_OPERATOR','NONSTOP Operatör'),('CITY_ADMIN','İl Yöneticisi'),('CLUB_ADMIN','Kulüp Admin'),('VIEWER','Görüntüleyici')
ON CONFLICT (role_code) DO NOTHING;

INSERT INTO permissions(permission_code, permission_name, description) VALUES
('MANAGE_USERS','Kullanıcı Yönetimi','Kullanıcı oluşturma ve yönetme'),
('MANAGE_CITIES','İl Yönetimi','İl bazlı sistem yönetimi'),
('MANAGE_ORGANIZATIONS','Organizasyon Yönetimi','Lig, turnuva, okul maçı yönetimi'),
('MANAGE_CLUBS','Kulüp Yönetimi','Kulüp kayıtları ve bilgileri'),
('MANAGE_TEAMS','Takım Yönetimi','Takım ve kadro yönetimi'),
('CREATE_PLAYER','Oyuncu Oluşturma','Oyuncu kartı oluşturma'),
('EDIT_PLAYER','Oyuncu Düzenleme','Oyuncu bilgilerini düzenleme'),
('APPROVE_PLAYER','Oyuncu Onaylama','Oyuncu taleplerini onaylama'),
('APPROVE_TRANSFER','Transfer Onaylama','Transfer taleplerini onaylama'),
('MANAGE_KVKK','KVKK Yönetimi','KVKK ve izin belgelerini yönetme'),
('MANAGE_MATCHES','Maç Yönetimi','Maç oluşturma ve düzenleme'),
('LIVE_STATS','Canlı İstatistik','Canlı maç istatistik girişi'),
('SHOT_CHART','Şut Haritası','Şut haritası görüntüleme/girme'),
('FOUL_CHART','Faul Haritası','Faul haritası görüntüleme/girme'),
('VIEW_REPORTS','Rapor Görüntüleme','Raporları görüntüleme'),
('GENERATE_REPORTS','Rapor Oluşturma','PDF ve analiz raporu üretme')
ON CONFLICT (permission_code) DO NOTHING;

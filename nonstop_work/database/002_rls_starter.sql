-- NONSTOP V1.8 Supabase RLS Starter Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE shot_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE foul_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_players" ON players FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_matches" ON matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_match_events" ON match_events FOR SELECT TO authenticated USING (true);

-- NONSTOP V2.1.24B-0 – Roster & Substitution Save Fix
-- Güvenli kolon garantisi. Mevcut verileri silmez.

alter table public.match_rosters
  add column if not exists operator_side varchar(10),
  add column if not exists is_selected boolean default true,
  add column if not exists is_starter boolean default false,
  add column if not exists is_on_court boolean default false,
  add column if not exists roster_type varchar(30) default 'OFFICIAL',
  add column if not exists is_special_match boolean default false,
  add column if not exists unavailable_reason text;

create index if not exists idx_match_rosters_match_team
on public.match_rosters(match_id, team_id);

create index if not exists idx_match_rosters_on_court
on public.match_rosters(match_id, team_id, is_on_court);

create index if not exists idx_substitutions_match_team
on public.substitutions(match_id, team_id);

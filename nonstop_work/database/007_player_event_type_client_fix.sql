-- NONSTOP V2.1.15 verification helper
-- This file does not change tables. It only helps verify the current database state.

select 'event_type_enum_values' as check_name, unnest(enum_range(null::event_type))::text as value;

select 'demo_matches' as check_name, id::text as value from matches where id = 1;
select 'demo_teams' as check_name, id::text || ' - ' || name as value from teams where id in (1,2);
select 'demo_players' as check_name, id::text || ' - #' || jersey_no::text || ' ' || first_name || ' ' || last_name as value from players where id between 1 and 12 order by id;

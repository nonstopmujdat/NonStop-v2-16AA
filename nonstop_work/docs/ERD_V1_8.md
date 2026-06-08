# NONSTOP ERD V1.8

## Ana ilişkiler

```text
users -> user_roles -> roles -> role_permissions -> permissions
users -> cities
cities -> organizations / clubs / schools / venues
seasons -> organizations / teams
categories -> organizations / teams
clubs or schools -> teams
players -> player_team_registrations -> teams
players -> player_consents / documents / measurements / tests / scout_reports
matches -> organizations / home_team / away_team / venues
matches -> match_operators / match_rosters / substitutions / match_events
match_events -> shot_events / foul_events / basket_event_links
matches -> sync_events / sync_conflicts / player_game_stats / team_game_stats / reports
```

## Kritik kararlar

- Oyuncu doğrudan takıma bağlı değildir; `player_team_registrations` ile farklı yaş kategorisi ve transfer desteklenir.
- Basket sonrası asist/faul/yok akışı `basket_event_links` ile tek zincire bağlanır.
- Serbest atışlar `match_events` + `shot_events.is_free_throw` ile tutulur.
- Offline kayıtlar `sync_events.event_id UNIQUE` ile tekrar kaydı engeller.
- Operatör sadece `controlled_team_id` takımını görür.

# NONSTOP V1.7 API Endpoint Listesi

## Health

`GET /health`

## Match Events

`POST /api/match-events`

Genel olay ekleme.

Örnek:
```json
{
  "client_event_id": "evt_001",
  "match_id": 1,
  "team_id": 1,
  "player_id": 7,
  "quarter": 3,
  "game_clock": "05:23",
  "event_type": "DREB"
}
```

## Basket Events

`POST /api/basket-events`

Basket + asist/faul/yok zinciri.

Örnek:
```json
{
  "match_id": 1,
  "team_id": 1,
  "shooter_player_id": 7,
  "points": 2,
  "assist_player_id": null,
  "foul_committed_by_player_id": 12,
  "quarter": 3,
  "game_clock": "05:23",
  "shot_x": 24.5,
  "shot_y": 42.1,
  "shot_zone": "PAINT",
  "shot_type": "LAYUP"
}
```

## Free Throws

`POST /api/free-throws`

Örnek:
```json
{
  "match_id": 1,
  "team_id": 1,
  "player_id": 7,
  "quarter": 3,
  "game_clock": "05:23",
  "made": true,
  "free_throw_order": 1,
  "free_throw_total": 2
}
```

## Sync Events

`POST /api/sync-events`

Offline cihaz kuyruğunu sunucuya gönderir.

## Match Finish

`POST /api/matches/:matchId/finish`

Maçı tamamlar ve otomatik kilit süresini başlatır.

## Match Lock

`POST /api/matches/:matchId/lock`

Maçı kilitler.

## Match Unlock

`POST /api/matches/:matchId/unlock`

Sadece SUPER_ADMIN / NONSTOP_OPERATOR.

## Match Report

`GET /api/matches/:matchId/report`

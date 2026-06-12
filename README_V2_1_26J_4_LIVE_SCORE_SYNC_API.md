# NONSTOP V2.1.26J-4 – Live Score Sync API

Bu patch canlı skor okumak için yeni API ekler.

## Eklenen dosya

- app/api/live-score/route.ts

## Test adresi

https://nonstop-v2-16aa.onrender.com/api/live-score?match_id=5

## Beklenen sonuç

```json
{
  "ok": true,
  "match_id": 5,
  "home_score": 79,
  "away_score": 0
}
```

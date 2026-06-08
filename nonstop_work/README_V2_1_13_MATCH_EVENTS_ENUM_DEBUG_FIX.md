# NONSTOP V2.1.13 Match Events Enum + Debug Fix

Bu sürüm V2.1.12 sonrası görülen şu kayıt hataları için hazırlandı:

- 2PA_MADE
- 3PA_MADE
- AST
- SUBSTITUTION
- FOUL

## Değişiklikler

1. `/api/match-events` artık her olayda şu alanları garanti göndermeye çalışır:
   - match_id
   - team_id
   - player_id
   - related_player_id
   - quarter
   - game_clock
   - event_type
   - event_tags
   - notes

2. Event tipi önce stabil adla denenir:
   - 2PA_MADE
   - 3PA_MADE
   - FTA_MADE
   - FOUL_DRAWN

3. Supabase enum eskiyse otomatik eski tipe düşer:
   - 2PA_MADE -> 2PM
   - 3PA_MADE -> 3PM
   - FTA_MADE -> FTM
   - FOUL -> PF
   - FOUL_DRAWN -> FD
   - BLK_AGAINST -> BY

4. Hata olursa API artık detaylı hata döndürür.

## Supabase SQL

GitHub'a yükledikten sonra Supabase SQL Editor'da şunu çalıştır:

`database/005_match_events_enum_and_debug_fix.sql`

## Render

GitHub'a yükledikten sonra Render'da:

Manual Deploy -> Clear build cache & deploy

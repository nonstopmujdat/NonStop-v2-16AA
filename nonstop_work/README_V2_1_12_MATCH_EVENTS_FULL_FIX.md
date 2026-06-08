# NONSTOP V2.1.12 Match Events Full Fix

Bu sürümün amacı, operatör ekranından gelen tüm olayların `match_events` tablosuna eksiksiz yazılmasıdır.

## Düzeltilenler

- `2PM` artık `2PA_MADE` olarak kaydedilir.
- `3PM` artık `3PA_MADE` olarak kaydedilir.
- `FTM` artık `FTA_MADE` olarak kaydedilir.
- `FD` artık `FOUL_DRAWN` olarak kaydedilir.
- `PF` artık `FOUL` olarak kaydedilir.
- `BY` artık `BLK_AGAINST` olarak kaydedilir.
- `quarter` operatör ekranından gönderilir.
- `game_clock` operatör ekranından gönderilir.
- `SUBSTITUTION` için:
  - `player_id` = çıkan oyuncu
  - `related_player_id` = giren oyuncu
- `AST` için:
  - `player_id` = asist yapan oyuncu
  - `related_player_id` = sayı atan oyuncu

## Render Environment Variables

Render içinde şu 3 değişken olmalı:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

## Supabase SQL

Mevcut Supabase veritabanında eski `event_type` enum varsa, şu dosyayı SQL Editor'da bir kez çalıştır:

```text
database/004_event_type_full_fix.sql
```

## Test sırası

Operatör ekranından şu olayları tek tek dene ve Supabase `match_events` tablosunda kontrol et:

1. +1 tek tık → `FTA_MISS`
2. +1 çift tık → `FTA_MADE`
3. +2 tek tık → `2PA_MISS`
4. +2 çift tık → `2PA_MADE`
5. +3 tek tık → `3PA_MISS`
6. +3 çift tık → `3PA_MADE`
7. Rib.H → `OREB`
8. Rib.S → `DREB`
9. Top Çalma → `STL`
10. Top Kaybı → `TOV`
11. Faul → `FOUL`
12. Faul Aldı → `FOUL_DRAWN`
13. Blok → `BLK`
14. Blok Yedi → `BLK_AGAINST`
15. Asist → `AST`
16. Oyuncu değişikliği → `SUBSTITUTION`

Her kayıtta şu alanlar dolu olmalı:

```text
match_id
team_id
player_id
quarter
game_clock
event_type
created_at
```

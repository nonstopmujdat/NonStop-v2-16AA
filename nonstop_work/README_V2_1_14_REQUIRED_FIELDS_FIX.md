# NONSTOP V2.1.14 Required Fields Fix

Bu sürümün amacı `match_events` kayıt hatalarını azaltmaktır.

## Düzeltilenler

- Her operatör olayında zorunlu alanlar boş gitmez:
  - `match_id`
  - `team_id`
  - `quarter`
  - `event_type`
- `game_clock` boşsa `10:00` gönderilir.
- Demo takım isimleri güncellendi:
  - Ev sahibi: `FİNAL SPOR U14`
  - Rakip: `TOFAŞ U14`
- Supabase SQL dosyası eklendi:
  - `database/006_required_fields_and_demo_teams_fix.sql`

## Kurulum

1. ZIP içeriğini GitHub repo içine yükle.
2. Render üzerinde `Manual Deploy -> Clear build cache & deploy` yap.
3. Supabase SQL Editor'da şunu çalıştır:
   - `database/006_required_fields_and_demo_teams_fix.sql`
4. Operatör ekranında test et:
   - `+2` çift tık -> `2PA_MADE`
   - `+3` çift tık -> `3PA_MADE`
   - Faul -> `FOUL`
   - Faul Aldı -> `FOUL_DRAWN`

## Beklenen sonuç

`match_events` tablosunda yeni satırlar oluşmalı ve en az şu alanlar dolu görünmelidir:

- `match_id = 1`
- `team_id = 1`
- `quarter = 1 veya aktif periyot`
- `game_clock`
- `event_type`

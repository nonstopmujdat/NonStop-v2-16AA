# NONSTOP V2.1.15 Player + Event Type Fix

Bu sürümün amacı:

- Operatör ekranındaki kısa event adlarını Supabase'in kabul ettiği tam adlara çevirmek.
- Oyuncu seçildiğinde `player_id` bilgisini API'ye garanti göndermek.
- Oyuncu ID uyuşmazlığı varsa kaydın tamamen düşmesini engellemek.
- Render/operatör ekranında Supabase hatasını daha açıklayıcı göstermek.

Önemli düzeltmeler:

- `2PM` → `2PA_MADE`
- `2PA` → `2PA_MISS`
- `3PM` → `3PA_MADE`
- `3PA` → `3PA_MISS`
- `FTM` → `FTA_MADE`
- `FTA` → `FTA_MISS`
- `FD` → `FOUL_DRAWN`
- `PF` → `FOUL`

Test sırası:

1. GitHub'a yükle.
2. Render'da clear build cache ile deploy et.
3. Operatör ekranında oyuncu seç.
4. `+2` çift tık yap.
5. Supabase `match_events` son satırında şunları kontrol et:
   - `match_id = 1`
   - `team_id = 1`
   - `quarter = 1 veya aktif periyot`
   - `event_type = 2PA_MADE`
   - `player_id` dolu olmalı; eğer demo ID uyuşmazlığı varsa `notes` içinde oyuncu bilgisi kalır.

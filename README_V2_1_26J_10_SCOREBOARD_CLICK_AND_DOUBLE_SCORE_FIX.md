# NONSTOP V2.1.26J-10 – Scoreboard Click + Double Score Fix

Bu patch iki sorunu düzeltir:

1. Operatör ekranında sayı girilince skorun kısa süre iki kat görünmesi engellenir.
   - Local/iyimser skor artırma kaldırıldı.
   - Skor artık Supabase + `/api/live-score` üzerinden kesin veriyle güncellenir.

2. `/live` sayfasında "Skorboardu Aç" çalışmama sorunu giderilir.
   - Link yerine güvenli buton + `selectedMatchId` state kullanılır.
   - `/live?match_id=...` URL’si korunur.

## Değişen dosyalar
- `app/operator/page.tsx`
- `app/live/page.tsx`

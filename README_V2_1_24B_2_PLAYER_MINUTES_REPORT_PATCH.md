# NONSTOP V2.1.24B-2 – Player Minutes Report Patch

Bu patch, maç istatistik PDF ekranındaki gelişmiş oyuncu istatistik tablosuna **MIN** sütununu ekler.

## Değişen dosya

`app/mini-admin/reports/[matchId]/stats/page.tsx`

## Gereken SQL

Bu patch yeni SQL istemez; ancak Supabase'te daha önce `live_player_minutes` view'i kurulmuş olmalıdır.

## Gelen özellik

- Oyuncu bazlı süre gösterimi
- Örnek: `1:35`, `28:42`, `0:00`
- Süre bilgisi `live_player_minutes` view'inden okunur

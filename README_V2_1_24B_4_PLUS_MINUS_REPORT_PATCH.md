# NONSTOP V2.1.24B-4 – Plus/Minus Report Patch

Bu patch, maç istatistik PDF ekranına oyuncu bazlı +/- sütununu ekler.

## Değişen dosya

`app/mini-admin/reports/[matchId]/stats/page.tsx`

## Gereken SQL

Bu patch yeni SQL istemez. Ancak Supabase'te şu view daha önce kurulmuş olmalıdır:

`public.live_player_plus_minus`

## Eklenen kolon

- MIN
- +/-

## Kontrol

Mini Admin → Raporlar → İstatistik PDF ekranında gelişmiş istatistik tablosunda `+/-` sütunu görünmelidir.

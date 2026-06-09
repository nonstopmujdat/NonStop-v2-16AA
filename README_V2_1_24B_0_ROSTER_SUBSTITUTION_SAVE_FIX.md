# NONSTOP V2.1.24B-0 – Roster & Substitution Save Fix

Bu patch oyuncu süreleri ve plus/minus için temel kayıtları başlatır.

## Önce Supabase SQL
`database/025_roster_substitution_save_fix_v2_1_24b_0.sql`

## GitHub'a yüklenecek dosyalar
- `app/operator/page.tsx`
- `app/api/operator-queue/route.ts`
- `app/api/match-rosters/route.ts`
- `app/api/substitutions/route.ts`

## Ne değişti?
- Kadro onaylanınca `match_rosters` tablosuna kayıt gider.
- İlk 5 `is_starter=true` ve `is_on_court=true` olarak kaydedilir.
- Oyuncu değişikliği yapılınca `substitutions` tablosuna kayıt gider.
- Giren/çıkan oyuncu için `match_rosters.is_on_court` güncellenir.

## Sonraki adım
V2.1.24B-1: Oyuncu süreleri görünümü.

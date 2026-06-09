# NONSTOP V2.1.24B-0 FULL PATCH

Amaç: Maç kadrosu, ilk 5 ve oyuncu değişikliği kayıtlarının Supabase'e yazılması.

## 1) Supabase SQL
Eğer daha önce çalıştırdıysan tekrar çalıştırmana gerek yok.

Çalıştırılacak dosya:

`database/025_roster_substitution_save_fix_v2_1_24b_0.sql`

## 2) GitHub'a yüklenecek dosyalar
Bu ZIP içindeki dosyaları GitHub'a aynı klasör yapısıyla yükle.

- `app/operator/page.tsx`
- `app/api/operator-queue/route.ts`
- `app/api/match-rosters/route.ts`
- `app/api/substitutions/route.ts`
- `database/025_roster_substitution_save_fix_v2_1_24b_0.sql`

## 3) Beklenen sonuç
- Kadro seçimi `match_rosters` tablosuna yazılacak.
- İlk 5 oyuncular `is_starter=true` ve `is_on_court=true` olarak kaydedilecek.
- Oyuncu değişiklikleri `substitutions` tablosuna yazılacak.
- V2.1.24B-1'de oyuncu süreleri hesaplanabilecek.

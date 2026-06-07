# NONSTOP V2.1.21A – Game Clock + Period + Overtime

Bu sürüm V2.1.20 çalışan temel üzerine güvenli eklemedir.

## Eklenenler

- Maç 1. periyot ve 10:00 başlangıç mantığını korur.
- Süre `00:00` olunca otomatik durur.
- Q1, Q2, Q3 bittiğinde sonraki periyot 10:00 hazır olur.
- Q4 sonunda skor eşitse 5:00 uzatma başlar.
- Uzatma eşit bitmeye devam ederse yeni 5:00 uzatma hazırlanır.
- Maç bittiğinde 1 dakika düzeltme süresi başlar, sonra maç kilitlenir.
- Faul, faul alma, serbest atış, +1, mola ve oyuncu değişikliğinde süre otomatik durur.
- Süre sadece operatör `▶ DEVAM ET` tuşuna basınca tekrar çalışır.
- Reset/sıfırlama butonu operatör ekranında yoktur.

## Supabase

SQL Editor içinde şu dosyadaki kod çalıştırılır:

`database/010_game_clock_period_overtime_v2_1_21a.sql`

## Test

1. Render deploy tamamlanmalı.
2. `/operator` açılmalı.
3. Başlangıç: 1. ÇEYREK / 10:00 / 0-0.
4. ▶ DEVAM ET ile saat başlar.
5. Faul veya oyuncu değişikliği girince saat durur.
6. Süre 00:00 olunca sonraki periyot hazırlanır.

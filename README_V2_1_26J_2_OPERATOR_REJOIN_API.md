# NONSTOP V2.1.26J-2 – Operator Rejoin API

Bu patch operatörün maça giriş / tekrar bağlanma altyapısını ekler.

## Eklenen dosya

- `app/api/operator-rejoin/route.ts`

## API Görevleri

- `JOIN`: operatör maça girince canlı oturum açar.
- `REJOIN`: aynı cihaz aynı maça geri girerse oturumu aktif eder.
- `HEARTBEAT`: sayfa açıkken `last_seen_at` günceller.
- `LEAVE`: operatör çıkınca oturumu pasife alır.

## Gerekli SQL

Önceden kurulan tablo:

- `public.operator_live_sessions`

## Sonraki adım

V2.1.26J-3 ile `app/operator/page.tsx` bu API’ye bağlanacak.

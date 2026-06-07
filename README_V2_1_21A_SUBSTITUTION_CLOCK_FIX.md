# NONSTOP V2.1.21A - Substitution Clock Safety Fix

Bu ara düzeltme V2.1.21A paketine oyuncu değişikliği güvenliğini ekler.

## Değişiklik

- Operatör `Değiş` butonuna bastığı anda maç saati otomatik durur.
- Oyuna girecek oyuncu seçilince `SUBSTITUTION` olayı `match_events` tablosuna kaydedilir.
- Saat kendiliğinden başlamaz.
- Saat sadece operatör `▶ DEVAM ET` butonuna basarsa çalışır.

## Neden?

Oyuncu değişikliği basketbolda oyun durmuşken yapılır. Bu nedenle operatör değişiklik modalını açtığı anda süre durmalıdır.

# NONSTOP V2.1.26H-4B – Real Minutes Operator Integration

Bu patch `app/operator/page.tsx` dosyasını günceller.

## Bağlanan süre işlemleri

- İlk 5 onaylanınca `/api/operator-minutes` üzerinden `OPEN_STARTERS` çağrılır.
- Oyuncu değişikliğinde çıkan oyuncu için `CLOSE_PLAYER` çağrılır.
- Oyuncu değişikliğinde giren oyuncu için `OPEN_PLAYER` çağrılır.
- Periyot bitince sahadaki oyuncuların açık süre kayıtları kapatılır.
- Yeni periyot / uzatma başlarken sahadaki oyuncular için yeni süre kayıtları açılır.
- Maç bitince sahadaki açık süre kayıtları kapatılır.

## Ön koşul

Önce V2.1.26H-4A API patch yüklenmiş olmalı:

`app/api/operator-minutes/route.ts`

## Yükleme

GitHub → Add file → Upload files ile bu klasör yapısını yükleyin:

`app/operator/page.tsx`

Render deploy tamamlanınca operator ekranını test edin.

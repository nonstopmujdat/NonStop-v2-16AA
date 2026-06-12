# NONSTOP V2.1.26J-6B – Resume From Match Status Fix

Bu patch `operator-queue` API'sini düzeltir.

## Amaç

Maçtan çıkan operatör tekrar girdiğinde, yarım kalan maç sadece operator oturumuna göre değil, doğrudan maç durumuna göre bulunur.

## Kural

- `status = DEVAM_EDIYOR`
- `locked = false`

olan her maç `resumeMatches` listesine düşer.

Bu Match ID 5'e özel değildir. Yarın Match ID 565 yarım kalırsa da aynı şekilde görünür.

## Eklenen/Düzenlenen Dosya

- `app/api/operator-queue/route.ts`

## Yükleme

ZIP'i açın. İçindeki `app` klasörünü GitHub ana dizinine yükleyin.

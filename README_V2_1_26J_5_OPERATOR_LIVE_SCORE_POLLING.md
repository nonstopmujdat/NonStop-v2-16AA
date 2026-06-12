# NONSTOP V2.1.26J-5 – Operator Live Score Polling

Bu patch operator ekranını `/api/live-score` kaynağına bağlar.

## Değişen dosya
- app/operator/page.tsx

## Amaç
- HOME sayı girince AWAY ekranında skor güncellensin.
- AWAY sayı girince HOME ekranında skor güncellensin.
- Operator ekranı her 3 saniyede bir canlı skoru okusun.
- Skor, periyot ve saat bilgisi API’den senkron beslensin.

## Yükleme
ZIP'i açın ve içindeki `app` klasörünü GitHub ana dizinine yükleyin.
ZIP klasörünün kendisini yüklemeyin.

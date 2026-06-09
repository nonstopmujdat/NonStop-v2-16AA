# NONSTOP V2.1.24B-3A-2 – Event Integrity Relaxed Fix

Bu küçük düzeltme, operatör ekranında oyuncu seçili olduğu halde FOUL_DRAWN / FOUL gibi olaylarda "Önce geçerli oyuncu seçiniz" hatası alınmasını düzeltir.

## Değişen dosya

`app/operator/page.tsx`

## Ne değişti?

- Oyuncu doğrulamada ana şart artık geçerli `player_id` bulunmasıdır.
- `onCourt.includes(player)` etiketi birebir eşleşmediğinde oluşan yanlış engelleme kaldırıldı.
- FOUL_DRAWN kaydında oyuncu seçiliyse kayıt engellenmez.

## SQL gerekir mi?

Hayır. Bu patch SQL istemez.

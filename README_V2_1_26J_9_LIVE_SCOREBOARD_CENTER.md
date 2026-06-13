# NONSTOP V2.1.26J-9 – Live Scoreboard Center

Bu patch genel canlı skor merkezini ekler.

## Eklenen dosya

- `app/live/page.tsx`

## Sayfalar

- `/live`: DEVAM_EDIYOR durumundaki kilitsiz tüm maçları listeler.
- `/live?match_id=5`: seçilen maçın canlı skorboardunu gösterir.

## Veri kaynakları

- Maç listesi: `/api/operator-queue`
- Skorboard: `/api/live-score?match_id=...`

## Not

Bu yapı Match 5'e özel değildir. Match ID 565, 1200 veya başka bir maç DEVAM_EDIYOR durumunda ise listede görünür.

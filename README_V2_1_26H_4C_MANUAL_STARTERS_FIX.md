# NONSTOP V2.1.26H-4C – Manual Starters Fix

Bu patch, operatör ekranında ilk 5'in otomatik seçilmesini kapatır.

## Değişen dosya
- app/operator/page.tsx

## Düzeltme
- Takım listesi ve maç kadrosu yüklenir.
- Ancak `starterChecked` artık otomatik olarak ilk 5 oyuncuyla doldurulmaz.
- Operatör STARTERS ekranında tam 5 oyuncuyu manuel seçmek zorundadır.
- Tam 5 oyuncu seçilmeden maç ekranına geçilemez.

## Amaç
Real Minutes Session Engine yanlış oyunculara STARTERS session açmasın.

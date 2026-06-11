# NONSTOP V2.1.26B – Operator Real Player Loader

Bu patch operatör ekranındaki sabit demo oyuncu listesini devre dışı bırakır.

## Değişen dosyalar

- app/operator/page.tsx
- app/api/operator-team-players/route.ts

## Amaç

Operatör ekranı artık gerçek `players` tablosundan oyuncu çeker.
Eski #4 Ahmet / #7 Burak demo listesi ve eski player_id eşlemesi kullanılmaz.

## Sonuç

- Kadro seçimi gerçek oyuncularla yapılır.
- İlk 5 gerçek oyuncularla yapılır.
- 2PA_MADE, 3PA_MADE, AST, FOUL gibi olaylar gerçek player_id ile kaydedilir.

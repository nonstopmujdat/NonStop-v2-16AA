# NONSTOP V2.1.26I – Operator Roster Recovery Patch

## Amaç
Operator kadro ekranında görünen `0/12` hatasını düzeltir.

## Ana düzeltme
`app/api/operator-queue/route.ts` artık maç listesinde şu alanları kesin olarak döndürür:

- `homeTeamId`
- `awayTeamId`

Operator ekranındaki oyuncu yükleme bu alanlara bağlı olduğu için, bu patch sonrası `app/operator/page.tsx` içindeki mevcut `homePlayers / awayPlayers` yüklemesi çalışır.

## Değişen dosya
- `app/api/operator-queue/route.ts`

## Beklenen sonuç
- Match ID 5 seçilince FİNAL SPOR U14 oyuncuları görünür.
- Misafir seçilince TOFAŞ U14 oyuncuları görünür.
- Kadro ekranı artık `0/12` kalmaz.

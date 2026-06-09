# NONSTOP V2.1.24B-3A – Event Integrity Fix

Bu patch operatör ekranında oyuncuya bağlı istatistiklerin oyuncusuz kaydedilmesini engeller.

## Değişen dosya

`app/operator/page.tsx`

## Ne düzeltir?

- Oyuncu seçilmeden 2PA/3PA/FTA kaydı yapılmaz.
- Oyuncu seçilmeden AST, OREB, DREB, STL, BLK, TOV, FOUL, FOUL_DRAWN kaydı yapılmaz.
- Sahada olmayan oyuncuya kendi takım istatistiği yazılmaz.
- 5 faul yapan oyuncuya yeni istatistik yazılmaz.
- Rakip faulü gibi özel kayıtlar için istisna korunur.

## SQL

Yeni SQL gerekmez.

## Kontrol

Supabase SQL Editor:

```sql
select event_type, count(*) as toplam, count(player_id) as player_dolu
from public.match_events
group by event_type
order by event_type;
```

Yeni testlerden sonra oyuncuya bağlı olaylarda `toplam = player_dolu` olmalı.

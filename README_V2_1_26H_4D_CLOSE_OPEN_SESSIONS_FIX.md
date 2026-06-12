# NONSTOP V2.1.26H-4D – Close Open Sessions Fix

Bu patch, açık kalan oyuncu süre kayıtlarının `null` görünmesini engeller.

## Değişen dosyalar

- `app/api/operator-minutes/route.ts`
- `app/operator/page.tsx`

## Ne düzeltir?

- `player_time_sessions` içinde açık kalan kayıtları takım bazında kapatır.
- Periyot bitince sahadaki oyuncuların açık session kayıtlarını kapatır.
- Maç bitince açık kalan session kayıtlarını kapatır.
- Maç ekranına geçerken eski açık session kalmışsa önce kapatır, sonra yeni ilk 5 session açar.

## Yeni API action

`/api/operator-minutes` artık şunu destekler:

```text
CLOSE_TEAM_OPEN
```

Bu action aynı maç ve aynı takım için `end_clock_seconds is null` olan tüm kayıtları kapatır.

## Beklenen sonuç

Aşağıdaki sorguda `total_seconds` artık `null` kalmamalıdır:

```sql
select
  player_id,
  sum(session_seconds) as total_seconds
from player_time_sessions
where match_id = 5
group by player_id
order by total_seconds desc nulls last;
```

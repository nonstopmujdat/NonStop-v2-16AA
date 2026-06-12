# NONSTOP V2.1.26J-3 – Operator Page Rejoin Integration

Bu patch `app/operator/page.tsx` dosyasını operator rejoin API'ye bağlar.

## Değişen dosya
- `app/operator/page.tsx`

## Eklenen davranışlar
- Operatör maça girince `/api/operator-rejoin` API'sine `JOIN` gönderir.
- Sayfa açık kaldığı sürece 15 saniyede bir `HEARTBEAT` gönderir.
- Sayfadan çıkılırsa `LEAVE` gönderir.
- Aynı cihaz tekrar girerse API mevcut oturumu `REJOIN` olarak aktif eder.

## Gerekli önceki parçalar
- `public.operator_live_sessions` tablosu
- `app/api/operator-rejoin/route.ts`

## Test
Supabase SQL Editor:

```sql
select
  match_id,
  team_id,
  operator_side,
  device_id,
  is_active,
  joined_at,
  last_seen_at,
  left_at
from public.operator_live_sessions
where match_id = 5
order by id desc;
```

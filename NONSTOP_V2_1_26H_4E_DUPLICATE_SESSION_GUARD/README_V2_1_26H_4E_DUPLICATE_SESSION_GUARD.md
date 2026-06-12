# NONSTOP V2.1.26H-4E – Duplicate Session Guard

Bu SQL patch, Real Minutes Session Engine için güvenlik katmanı ekler.

## Amaç

- Aynı oyuncuya aynı anda ikinci açık session açılmasını engeller.
- `nonstop_open_starter_sessions()` sadece `match_rosters.is_starter = true` olan ilk 5 oyuncuyu açar.
- Oyuncu zaten oyundaysa tekrar session açmaz.
- `nonstop_close_player_session()` sadece açık olan en son session'ı kapatır.
- `nonstop_close_all_open_sessions()` ile periyot/maç sonunda açık kalan tüm sessionlar kapatılabilir.

## Kurulum

Supabase → SQL Editor → `database/026H_4E_duplicate_session_guard.sql` içeriğini yapıştır → Run.

## Test

Önce temiz test için:

```sql
delete from public.player_time_sessions where match_id = 5;
```

Sonra operator ekranından:

1. Match 5 aç
2. Kadro seç
3. İlk 5'i manuel seç
4. 1. periyodu başlat
5. Oyuncu değişikliği yap
6. Periyodu bitir

Kontrol:

```sql
select
  player_id,
  count(*) as open_count
from public.player_time_sessions
where match_id = 5
  and end_clock_seconds is null
group by player_id;
```

Beklenen: satır dönmemeli veya sadece aktif periyot devam ederken sahadaki oyuncular dönmeli.

Süre toplamları:

```sql
select
  player_id,
  sum(session_seconds) as total_seconds
from public.player_time_sessions
where match_id = 5
group by player_id
order by total_seconds desc nulls last;
```

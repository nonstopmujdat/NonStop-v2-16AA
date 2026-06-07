# NONSTOP V2.1.22AA – Clubs + Competitions Revision

Bu revizyon V2.1.22A üzerine gelir.

## Amaç

NONSTOP içinde sadece lig değil, şu organizasyon türleri desteklenir:

- Lig
- Sezon/grup organizasyonu
- Turnuva
- Hazırlık/özel maç organizasyonu
- Tekil özel maç

## Ana bağlantı

```txt
clubs
  ↓
teams
  ↓
competitions
  ↓
competition_teams
  ↓
matches
  ↓
standings / season stats
```

## A/B ligleri

A ve B ligleri `competitions` içinde bağımsız kayıtlar olarak tutulur.

Örnek:

```txt
Bursa / 2026 / U16 / A Ligi
Bursa / 2026 / U16 / B Ligi
```

Bu iki lig:

- ayrı takım listesi
- ayrı fikstür
- ayrı puan durumu
- ayrı sezon istatistiği

ile çalışır.

## Supabase SQL

Çalıştırılacak dosya:

```txt
database/014_competitions_clubs_structure_v2_1_22aa.sql
```

## Kontrol SQL

```sql
select * from public.live_competitions;
select * from public.live_league_standings;
```

# NONSTOP V2.1.22AB - Competition Management

Bu sürüm V2.1.22AA üzerine organizasyon yönetimi ekler.

## Eklenenler

- /competitions sayfasında organizasyon oluşturma
- Lig / Sezon / Turnuva / Hazırlık / Özel Maç tipi
- A Ligi / B Ligi / NONE ayrımı
- Organizasyon adı değiştirme
- Durum değiştirme: ACTIVE / COMPLETED / CANCELLED / PASSIVE
- Organizasyona takım ekleme
- Organizasyondan takımı pasifleştirme

## Supabase SQL

Supabase SQL Editor'da çalıştırılacak dosya:

```txt
database/015_competition_management_v2_1_22ab.sql
```

## Kontrol sorguları

```sql
select * from public.live_competitions;
```

```sql
select * from public.competition_teams;
```

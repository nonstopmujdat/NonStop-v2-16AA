# NONSTOP V2.1.22A – Multi City Season & Standings Foundation

Bu sürüm demo çalışmasıdır ama esas sistem mimarisine göre hazırlanmıştır.

## Kapsam

- Her il kendi bazında çalışır.
- U10, U11, U12, U14, U16, U18, Gençler, Büyükler kategorileri desteklenir.
- A Ligi ve B Ligi bağımsızdır.
- U16 dahil B ligleri ayrı puan durumu, ayrı takım listesi, ayrı sezon istatistiği ile çalışır.
- Oyuncu sezon istatistikleri: `player_season_stats`
- Takım sezon istatistikleri: `team_season_stats`
- Puan durumu: `league_standings`
- Eşit takımlar arası altyapı: `head_to_head_results`

## Puan Durumu Sıralama

1. Puan
2. Eşit takımlar arası maçlar / puan
3. Eşit takımlar arası averaj
4. Genel averaj
5. Atılan sayı

## Supabase’de çalıştırılacak dosya

```txt
database/013_multi_city_season_standings_v2_1_22a.sql
```

## Kontrol SQL’leri

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
and table_name in (
  'leagues',
  'league_teams',
  'player_season_stats',
  'team_season_stats',
  'league_standings',
  'head_to_head_results'
);
```

```sql
select * from public.live_league_standings;
```

## Yeni sayfa

```txt
/standings
```

Bu sayfa puan durumunu gösterir. Veri yoksa önce lig/takım/sezon bağlantıları kurulmalıdır.

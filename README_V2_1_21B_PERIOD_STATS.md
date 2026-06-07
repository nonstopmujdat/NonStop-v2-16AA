# NONSTOP V2.1.21B - Period Stats Foundation

Bu sürüm V2.1.21B scoreboard/team foul sürümünün üzerine eklenmiştir.

## Eklenenler

- `player_period_stats` tablosu
- `team_period_stats` tablosu
- `live_period_score` view
- Her olay sonrası otomatik periyot istatistiği güncelleme
- Canlı skor ekranında periyot skor tablosu

## Zincir

```txt
match_events
  ↓
player_game_stats
team_game_stats
player_period_stats
team_period_stats
live_period_score
```

## Supabase'de çalıştırılacak dosya

```txt
database/011_period_stats_v2_1_21b.sql
```

## Test

Supabase SQL Editor:

```sql
select * from public.player_period_stats;
select * from public.team_period_stats;
select * from public.live_period_score;
```

Operatör ekranında sayı/ribaunt/asist/faul girildikten sonra bu tablolarda satır oluşmalıdır.

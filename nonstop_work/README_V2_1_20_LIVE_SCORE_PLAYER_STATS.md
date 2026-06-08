# NONSTOP V2.1.20 - Canlı Skor ve Oyuncu İstatistik Paneli

Bu sürüm V2.1.19 üzerine kuruludur.

## Eklenenler

- `/live` sayfası eklendi.
- Canlı skor `match_events` tablosundan hesaplanır.
- Oyuncu istatistik paneli `player_game_stats` tablosundan okunur.
- `player_game_stats` tablosuna `team_id` desteği eklendi.

## Supabase SQL

Render deploy sonrası Supabase SQL Editor içinde şu dosyayı bir kez çalıştırın:

```text
database/008_player_stats_team_id_live_panel.sql
```

## Kontrol

Operatör ekranında olay girildikten sonra:

```sql
select * from player_game_stats order by id desc;
```

ve canlı panel:

```text
/live
```

kontrol edilir.

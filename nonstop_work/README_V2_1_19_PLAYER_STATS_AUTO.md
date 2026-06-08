# NONSTOP V2.1.19 - Player Stats Auto

Bu sürüm V2.1.18 üzerine kuruludur.

## Amaç
`match_events` tablosuna düşen olaylardan otomatik olarak:

- `player_game_stats`
- `team_game_stats`

tablolarını güncellemek.

## Otomatik işlenen olaylar

| Event | Oyuncu istatistiği | Takım istatistiği |
|---|---|---|
| 2PA_MADE / 2PM | points +2 | points +2 |
| 3PA_MADE / 3PM | points +3 | points +3 |
| FTA_MADE / FTM | points +1 | points +1 |
| OREB | rebounds +1 | rebounds +1 |
| DREB | rebounds +1 | rebounds +1 |
| AST | assists +1 | assists +1 |
| STL | steals +1 | steals +1 |
| TOV | turnovers +1 | turnovers +1 |
| BLK | blocks +1 | blocks +1 |
| FOUL / PF | fouls +1 | fouls +1 |

## Test
1. Render deploy sonrası operatör ekranından oyuncu seç.
2. +2, +3, Rib.H, AST, FOUL gibi olayları gir.
3. Supabase SQL Editor'da kontrol et:

```sql
select * from player_game_stats order by id desc;
select * from team_game_stats order by id desc;
```

## Not
Kaçan şutlar henüz `player_game_stats` tablosunda ayrı kolon olmadığı için sayılara eklenmez. İleride FGA/FGM/3PA/3PM/FTA/FTM kolonları eklenirse genişletilecek.

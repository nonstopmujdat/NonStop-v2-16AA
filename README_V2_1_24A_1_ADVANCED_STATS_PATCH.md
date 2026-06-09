# NONSTOP V2.1.24A-1 – Advanced Stats Table Patch

Bu patch, maç istatistik PDF ekranına gelişmiş oyuncu istatistiklerini ekler.

## GitHub'da değiştirilecek dosya

`app/mini-admin/reports/[matchId]/stats/page.tsx`

## Gelen kolonlar

- 2PM / 2PA
- 3PM / 3PA
- FTM / FTA
- PTS
- REB
- AST
- STL
- BLK
- TOV
- PF
- FD
- FG%
- 3P%
- FT%
- TS%
- eFG%
- AST/TOV
- VP
- Perf40
- MVP Score

## Önemli

Bu patch yeni SQL istemez; ama Supabase'te daha önce `live_player_advanced_stats` view'inin kurulmuş olması gerekir.

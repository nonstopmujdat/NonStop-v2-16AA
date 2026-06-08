# NONSTOP V2.1.22AD-2 - Special/Friendly Roster Limit + Separate Stats

Bu sürümde özel/hazırlık maçları resmi maçlardan ayrıldı.

## Kurallar

- Resmi maç kadrosu maksimum 12 oyuncu.
- Özel/hazırlık maç kadrosu maksimum 24 oyuncu.
- Özel/hazırlık maçları puan durumuna işlemez.
- Özel/hazırlık maçları sezon istatistiğine işlemez.
- Oyuncu profilinde ayrı "Özel/Hazırlık Maçları" bölümü için ayrı tablolar hazırlandı.

## Yeni SQL

Supabase SQL Editor'da çalıştırılacak dosya:

```txt
database/018_special_match_roster_limit_stats_v2_1_22ad2.sql
```

## Yeni tablolar

- player_special_match_stats
- team_special_match_stats

## Yeni view'lar

- live_special_player_stats
- live_special_team_stats


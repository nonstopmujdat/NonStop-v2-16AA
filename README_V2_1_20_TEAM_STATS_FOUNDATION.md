# NONSTOP V2.1.20 Team Stats Foundation

Bu paket V2.1.18 ve V2.1.19 üzerine hazırlanmıştır.

## Düzeltilenler

- Operatör ekranı artık demo skorla başlamaz: 0-0.
- Maç artık 4. periyottan başlamaz: 1. periyot, 10:00.
- `player_game_stats.team_id` desteği güçlendirildi.
- `team_game_stats` canlı güncellenir.
- `/live` sayfası skoru önce `team_game_stats` üzerinden okur.
- Supabase için `database/009_team_stats_foundation_live_score.sql` eklendi.

## Kurulum

1. ZIP içeriğini GitHub reposuna yükle.
2. Render otomatik deploy etsin.
3. Supabase SQL Editor içinde şu dosyayı çalıştır:

`database/009_team_stats_foundation_live_score.sql`

4. Render sitesinde kontrol et:

- `/operator`
- `/live`

## Test

Operatörde bir oyuncuya +2 sayı gir.
Sonra Supabase SQL Editor içinde kontrol et:

```sql
select * from public.player_game_stats where match_id = 1;
select * from public.team_game_stats where match_id = 1;
select * from public.live_match_score where match_id = 1;
```

Beklenen sonuç: oyuncu istatistiği ve takım skoru birlikte artar.

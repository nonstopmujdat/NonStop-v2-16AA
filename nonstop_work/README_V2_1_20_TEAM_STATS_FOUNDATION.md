# NONSTOP V2.1.20 – Team Stats Foundation

Bu paket V2.1.18 ve V2.1.19 çalışan yapıyı bozmadan takım istatistik altyapısını güçlendirir.

## Kapsam

- Maç başlangıcı: 1. periyot
- Saat başlangıcı: 10:00
- Demo skor başlangıcı: 0-0
- player_game_stats içine team_id desteği
- team_game_stats tablosu
- live_match_score view
- Operatör olayı kaydolunca player_game_stats ve team_game_stats güncelleme

## Supabase kurulumu

Supabase SQL Editor içinde şu dosyanın içeriğini çalıştır:

`database/009_team_stats_foundation_v2_1_20.sql`

Dosya adını değil, dosyanın içindeki SQL kodunu yapıştırmalısın.

## Kontrol SQL'leri

```sql
select * from public.team_game_stats;
select * from public.live_match_score;
```

## V2.1.21'e bırakılanlar

- Oyuncu istatistik ekranı geliştirme
- Takım istatistik ekranı geliştirme
- Maç sonu raporu

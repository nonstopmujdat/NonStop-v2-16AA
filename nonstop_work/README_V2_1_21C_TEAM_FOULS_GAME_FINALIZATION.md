# NONSTOP V2.1.21C – Team Fouls + Game Finalization

Bu sürüm V2.1.21B üzerine eklenmiştir.

## Eklenenler

- Takım faulleri periyot bazlı takip edilir.
- 5 faul göstergesi korunur.
- Periyot değişince takım faulleri sıfırlanır.
- Oyuncu 5. faulünü alınca oyun dışı kalır.
- 5 faul yapan oyuncu tekrar oyuna alınamaz.
- Oyun dışı kalan oyuncu için zorunlu değişiklik başlar.
- Zorunlu değişiklik yapılmadan saat başlatılamaz.
- Maç bitince 60 saniye düzeltme süresi vardır.
- Süre bitince maç kilitlenir.
- Kilitli maça yeni olay yazılması engellenir.

## Supabase SQL

Supabase SQL Editor içinde şu dosyanın tamamı çalıştırılmalıdır:

```txt
database/012_team_fouls_game_finalization_v2_1_21c.sql
```

## Test

1. Aynı oyuncuya 5 kez `Faul` gir.
2. Saat durmalı.
3. Oyuncu değişikliği penceresi açılmalı.
4. 5 faullü oyuncu tekrar oyuna alınmamalı.
5. Supabase kontrol:

```sql
select * from public.live_fouled_out_players;
```

6. Takım faul kontrol:

```sql
select * from public.live_team_period_fouls;
```

# NONSTOP V2.1.11 Demo SQL Fix

Bu sürüm V2.1.10 üzerine hazırlanmıştır.

## Amaç
Supabase'de daha önce bazı kayıtlar oluştuysa `003_demo_match_data.sql` hata verip duruyordu. Özellikle:

```text
ERROR: duplicate key value violates unique constraint "categories_name_gender_key"
Key (name, gender)=(U14, ERKEK) already exists.
```

Bu sürümde `database/003_demo_match_data.sql` güvenli hale getirildi.
Aynı dosya birden fazla kez çalıştırılabilir.

## Supabase'de çalıştırma sırası

Supabase → SQL Editor içinde sırasıyla:

```text
1) database/001_schema_v1_8.sql
2) database/002_rls_starter.sql
3) database/003_demo_match_data.sql
```

Daha önce ilk iki dosya çalıştıysa sadece şunu çalıştırman yeterli olabilir:

```text
database/003_demo_match_data.sql
```

## Oluşturulan demo kayıtlar

Operatör ekranı için beklenen ana kayıtlar:

```text
match_id = 1
home team_id = 1
away team_id = 2
player_id = 1..12
```

## Kontrol
SQL çalışınca en altta şu sonucu görmen gerekir:

```text
NONSTOP V2.1.11 demo data ready
```

ve yaklaşık olarak:

```text
demo_teams = 2
demo_players = 12
demo_matches = 1
```

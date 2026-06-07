# NONSTOP V2.1.18 Force API Post Fix

Amaç: Operatör ekranındaki her online olayın `/api/match-events` adresine zorunlu POST göndermesi.

## Değişiklikler
- API env eksikse artık `demo-no-db` başarı dönmez; görünür hata döner.
- Operatör ekranında başarılı kayıt için `SİSTEM: Supabase kayıt OK (...) id:X` yazar.
- Başarısız kayıt için gerçek hata mesajı ekranda görünür.
- `cache: no-store` ile API çağrısı zorlanır.

## Render gerekli ortam değişkenleri
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NODE_VERSION=22

## Render komutları
Build Command:
```bash
corepack enable && corepack prepare yarn@1.22.22 --activate && yarn install --network-timeout 600000 && yarn build
```
Start Command:
```bash
yarn start
```

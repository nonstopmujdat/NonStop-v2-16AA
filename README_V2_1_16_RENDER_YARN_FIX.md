# NONSTOP V2.1.16 Render Yarn Stable Fix

Bu sürüm V2.1.15 üzerine kuruldu. Kod tarafındaki player_id/event_type düzeltmeleri korunur.

Amaç: Render üzerinde npm internal hatasını (`Exit handler never called`) atlatmak için build sistemini Yarn 1.22.22 ile sabitlemek.

Render Settings:

Build Command:
```
corepack enable && corepack prepare yarn@1.22.22 --activate && yarn install --network-timeout 600000 && yarn build
```

Start Command:
```
yarn start
```

Environment:
```
NODE_VERSION=22
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Not: package-lock.json kullanılmaz.

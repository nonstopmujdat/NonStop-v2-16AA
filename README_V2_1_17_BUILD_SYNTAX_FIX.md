# NONSTOP V2.1.17 Build Syntax Fix

Bu paket V2.1.16/V2.1.15 üstüne küçük build düzeltmesidir.

## Düzeltilen hata
Render build hatası:

```text
Function declarations are not allowed inside blocks in strict mode when targeting ES5
async function tryInsertWithSafePlayer(...)
```

## Yapılan düzeltme
`app/api/match-events/route.ts` içinde blok içinde tanımlanan `tryInsertWithSafePlayer` fonksiyonu dosya seviyesine taşındı.

## Render önerilen ayar

Build Command:

```text
corepack enable && corepack prepare yarn@1.22.22 --activate && yarn install --network-timeout 600000 && yarn build
```

Start Command:

```text
yarn start
```

Environment:

```text
NODE_VERSION=22
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

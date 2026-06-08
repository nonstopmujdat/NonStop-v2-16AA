# NONSTOP Entegrasyon Notları

## Ana karar

V1.9 silinmedi; ana proje olarak korundu. V1.8 SQL mimarisi ve V1.7 API mantığı V1.9 içine taşındı.

## Taşınan parçalar

- V1.8 `NONSTOP_DATABASE_V1_8.sql` -> `database/001_schema_v1_8.sql`
- V1.8 RLS starter -> `database/002_rls_starter.sql`
- V1.7 endpoint mantıkları -> `app/api/**/route.ts`
- V1.7 score/id helper mantığı -> `lib/score.ts`, `lib/ids.ts`

## Bilerek dokunulmayanlar

- Operatör ekranı arayüzü şimdilik V1.9 haliyle bırakıldı.
- V1.0-V1.6 HTML demoları ayrı kaynak olarak tutuldu, doğrudan Next.js içine kopyalanmadı.
- Auth henüz gerçek Supabase Auth ile zorunlu yapılmadı; API route'larında geçici `x-nonstop-user-id` header desteği var.

## Supabase bağlı değilken

Endpointler `demo-no-db` modunda döner. Bu, yayına alma ve arayüz testini kolaylaştırır.

## Supabase bağlandıktan sonra

`match_id`, `team_id`, `player_id` gibi gerçek tablo id'leri gönderilmelidir.

# NONSTOP V2.0 Beta Integrated

Bu paket, önceki NONSTOP sürümlerinin birleştirilmiş beta temelidir.

## Birleştirme Kararı

- Ana kod tabanı: `NONSTOP_V1_9_Working_MVP_Code`
- Veritabanı mimarisi: `NONSTOP_V1_8_Database_Architecture`
- Backend/API mantığı: `NONSTOP_V1_7_Backend_API`
- Operatör UX mantığı: V1.6 + V1.9 operatör ekranı
- Offline Queue mantığı: V1.4 + V1.9 `lib/offlineQueue.ts`

## Yeni Eklenenler

### Database

Supabase SQL dosyaları projeye eklendi:

```text
database/001_schema_v1_8.sql
database/002_rls_starter.sql
```

Supabase SQL Editor içinde önce `001_schema_v1_8.sql`, sonra `002_rls_starter.sql` çalıştırılmalıdır.

### API Route'ları

V1.7 Express endpoint mantığı Next.js API route formatına çevrildi:

```text
POST /api/match-events
POST /api/sync-events
POST /api/basket-events
POST /api/free-throws
POST /api/matches/[matchId]/finish
POST /api/matches/[matchId]/lock
POST /api/matches/[matchId]/unlock
GET  /api/matches/[matchId]/report
```

Supabase bilgileri yoksa API'ler `demo-no-db` modunda cevap verir. Böylece proje önce Vercel/localhost üzerinde açılır, sonra Supabase bağlanır.

## Kurulum

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Ortam Değişkenleri

`.env.example` içindeki değerler doldurulmalıdır:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

> Not: `SUPABASE_SERVICE_ROLE_KEY` sadece server API route'larında kullanılır. Client tarafına gönderilmemelidir.

## Yayın

1. Projeyi GitHub'a yükle.
2. Vercel'e import et.
3. Environment Variables bölümüne Supabase bilgilerini gir.
4. Supabase SQL Editor'da `database` klasöründeki SQL dosyalarını çalıştır.

## Mevcut Durum

Çalışanlar:

- Next.js 14 proje iskeleti
- Dashboard
- Operatör ekranı
- Skor/süre kontrolü
- Basket sonrası asist/faul/yok zinciri
- Oyuncu değişikliği akışı
- Offline Queue
- V1.8 Supabase/PostgreSQL şema dosyaları
- V1.7 API mantığının Next.js route karşılıkları

Sıradaki işler:

- Supabase Auth entegrasyonu
- Rol bazlı giriş
- Gerçek takım/oyuncu ekranları
- Operatör A / Operatör B ayrı route yapısı
- Realtime canlı skor
- PDF/Excel raporları

## Supabase event insert test
Operator page now posts events to `/api/match-events` when ONLINE.
Required environment variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

Run `database/003_demo_match_data.sql` in Supabase SQL Editor after the schema files. It creates demo match_id=1, team_id=1, and player ids used by the operator page.

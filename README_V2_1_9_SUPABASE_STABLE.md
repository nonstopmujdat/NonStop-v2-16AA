# NONSTOP V2.1.9 Supabase Stable Fix

Bu paket V2.1.8 temel alınarak hazırlandı. Operatör ekranı tasarımına dokunulmadı; sadece Supabase bağlantısı ve API insert tarafı güvenli hale getirildi.

## Netlify Environment Variables

Netlify > Site configuration > Environment variables bölümünde şu 3 değişken olmalı:

```text
NEXT_PUBLIC_SUPABASE_URL=https://skutsiuxrnlnsvwmpfdv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=Supabase anon public key
SUPABASE_SERVICE_ROLE_KEY=Supabase service_role key
```

Notlar:
- `NEXT_PUBLIC_SUPABASE_URL` içinde `/rest/v1/` olmayacak.
- URL mutlaka `https://` ile başlayacak.
- `SUPABASE_SERVICE_ROLE_KEY` kullanıcıya gösterilmez; sadece Netlify server ortamında kalır.
- Eski `SUPABASE_KEY` kullanılmaz. Varsa silinebilir.

## Supabase SQL

Önceden kurulmadıysa sırayla çalıştır:

```text
database/001_schema_v1_8.sql
database/002_rls_starter.sql
database/003_demo_match_data.sql
```

## Deploy

GitHub'a yükle, sonra Netlify'da:

```text
Deploys > Trigger deploy > Deploy project without cache
```

## Test

1. Operatör sayfasını aç: `/operator`
2. Bir oyuncu seç
3. `+2`, `Rib.H` veya `Faul` işlemi yap
4. Supabase > Table Editor > `match_events` tablosunu aç
5. Sayfayı F5 ile yenile
6. Yeni satır gelmeli

## Düzeltilen Teknik Sorun

Önceki hata:

```text
Error: Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.
Failed to collect page data for /api/free-throws
```

V2.1.9'da Supabase client artık build sırasında hatalı URL yüzünden uygulamayı düşürmez. Server API route'ları istem geldiğinde client oluşturur.

# NONSTOP V2.1.22AF-4 – Mini Admin React UI

Bu paket AF-3 veritabanı kurulumunun üzerine gelir.

## Önce gerekli SQL
Supabase SQL Editor içinde daha önce şu dosya başarıyla çalışmış olmalı:

`database/022_mini_admin_ui_completion_v2_1_22af_3.sql`

AF-4 için ekstra SQL zorunlu değildir. Bu sürüm arayüz paketidir.

## Yeni / Güncellenen Ekranlar

- `/mini-admin` Mini Admin ana menü
- `/competitions` Lig / Turnuva / Takım Ekle / Resmi Maç Oluştur ekranı
- `/dashboard` Mini Admin bağlantısı güncellendi

## Mini Admin Akışı

1. Render sitesini aç.
2. Dashboard ekranından Mini Admin'e gir.
3. Lig veya turnuva oluştur.
4. Organizasyona takım ekle.
5. Resmi maç oluştur.
6. Maç operatör ekranına otomatik düşer.

## Kurallar

- Resmi / turnuva maçları 12 kişilik kadro kullanır.
- Özel / hazırlık maçları 24 kişilik kadro kullanır.
- Özel / hazırlık maçları puan durumuna işlemez.
- HOME operatörü süreyi başlatabilir.
- AWAY operatörü süreyi başlatamaz.

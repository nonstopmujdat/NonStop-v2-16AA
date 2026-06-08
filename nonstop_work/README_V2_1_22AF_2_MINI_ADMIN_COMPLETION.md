# NONSTOP V2.1.22AF-2 – Mini Admin Completion

Bu paket, V2.1.22AE-2 zip dosyasının üzerine hazırlanmıştır. Amaç Mini Admin Setup eksiklerini tamamlamaktır.

## Eklenenler

- `database/021_mini_admin_completion_v2_1_22af_2.sql`
- Mini Admin organizasyon ekranına resmi / turnuva maç oluşturma bölümü
- Oluşturulan maçları listeleyen Mini Admin tablosu
- `app/api/operator-queue/route.ts` operatör maç kuyruğu API yolu
- Operatör ekranında Mini Admin’den gelen salon/gün maçlarını otomatik okuma

## Kurulum Sırası

1. Supabase SQL Editor açılır.
2. `database/021_mini_admin_completion_v2_1_22af_2.sql` dosyasının tamamı çalıştırılır.
3. Proje Render’a yeniden yüklenir.
4. `/competitions` sayfasından:
   - Lig veya turnuva oluşturulur.
   - Takımlar organizasyona eklenir.
   - Resmi / turnuva maçı oluşturulur.
5. `/operator` sayfasında İl → Salon → Bugünkü Maçlar seçildiğinde oluşturulan maç görünür.

## Kurallar

- Resmi / turnuva maçları 12 kişilik kadro kullanır.
- Özel / hazırlık maçları 24 kişilik kadro kullanır.
- Özel / hazırlık maçları puan durumuna işlemez.
- HOME operatörü süreyi başlatabilir.
- AWAY operatörü süreyi başlatamaz.
- 5 faul yapan oyuncu tekrar oyuna giremez.

## Not

Mini Admin artık V2.1.23 Full Admin Panel öncesi temel akışı tamamlar.

# NONSTOP V2.1.22AF-3 – Mini Admin UI Completion

Bu paket V2.1.22AF-2 üzerine kuruludur.

## Ne eklendi?

- Mini Admin menüsü Dashboard bağlantısına eklendi.
- `/competitions` ekranı Mini Admin ana ekranı olarak düzenlendi.
- `/mini-admin` adresi otomatik `/competitions` ekranına yönlenir.
- Lig / turnuva oluşturma formu kullanılır hale getirildi.
- Organizasyona takım ekleme formu kullanılır hale getirildi.
- Resmi / turnuva maçı oluşturma formu kullanılır hale getirildi.
- Oluşturulan maçlar operatör ekranındaki İl → Salon → Günün Maçları akışına düşer.
- SQL dosyası: `database/022_mini_admin_ui_completion_v2_1_22af_3.sql`

## Kurulum Sırası

1. Supabase → SQL Editor aç.
2. `database/022_mini_admin_ui_completion_v2_1_22af_3.sql` dosyasının tamamını çalıştır.
3. ZIP paketini Render'a yükle.
4. Site açılınca Dashboard → Mini Admin bölümüne gir.

## Kullanım Sırası

1. Mini Admin → Lig veya Turnuva Oluştur.
2. Organizasyona en az 2 takım ekle.
3. Resmi / Turnuva Maçı Oluştur.
4. Operatör ekranına git.
5. İl → Salon seç.
6. Oluşturulan maç bugünkü maçlar listesinde görünür.

## Kurallar

- Resmi / turnuva maçları 12 kişilik kadro kullanır.
- Özel / hazırlık maçları 24 kişilik kadro kullanır.
- Özel / hazırlık maçları puan durumuna işlemez.
- HOME operatörü süreyi başlatabilir.
- AWAY operatörü süreyi başlatamaz.
- 5 faul yapan oyuncu tekrar oyuna giremez.

V2.1.23 Full Admin Panel'e geçmeden önce bu Mini Admin akışı sahada test edilmelidir.

# NONSTOP V2.1.22AC-3 – City First + Roster Pool Fix

Bu sürüm operatör akışını gerçek kullanım mantığına göre düzenler.

## Değişiklikler

- Başlangıçta önce il seçilir.
- Sonra sadece seçilen ile ait salonlar listelenir.
- Salon seçilince o günün maç programı otomatik gelir.
- Takım listesindeki oyuncu sayısı 12 ile sınırlı değildir.
- Maç kadrosu takım başına maksimum 12 oyuncudur.
- Takım havuzundan 26/30 oyuncu arasından 12 kişilik maç kadrosu seçilebilir.
- İlk 5 sadece seçilen maç kadrosu içinden belirlenir.
- Maç kadrosu en az 5 oyuncu olmazsa hükmen uyarısı verir.

## SQL

Yeni SQL gerekmez. Sadece GitHub'a yüklenip Render deploy beklenir.

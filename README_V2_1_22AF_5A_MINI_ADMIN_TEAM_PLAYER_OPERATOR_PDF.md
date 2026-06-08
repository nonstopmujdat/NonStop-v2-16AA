# NONSTOP V2.1.22AF-5A – Mini Admin Team / Player / Operator / PDF

Bu paket SQL zorunlu tutmaz. Daha önce kurulan 022 ve 023 SQL altyapısını kullanır.

## Gelen ekranlar

Mini Admin menüsüne eklendi:

- Takım Ekle
- Oyuncu Ekle
- Operatör Ekle
- PDF Raporlar
- Maç Merkezi mevcut haliyle korunur

## Yeni sayfalar

- `/mini-admin/teams`
- `/mini-admin/players`
- `/mini-admin/operators`
- `/mini-admin/reports`
- `/mini-admin/reports/[matchId]/stats`
- `/mini-admin/reports/[matchId]/shots`

## Operatör email mantığı

Operatör ekleme ekranında email ile kullanıcı kaydı oluşturulur. Sistem bu kullanıcıyı `NONSTOP_OPERATOR` rolüne bağlamaya çalışır.

Not: Tam şifreli Supabase Auth girişi bir sonraki güvenlik sürümünün kapsamındadır. Bu paket email/kullanıcı altyapısını hazırlar.

## PDF mantığı

Rapor sayfaları tarayıcıdan PDF alınacak şekilde hazırlanmıştır:

1. Raporu aç
2. Yazdır butonuna bas
3. Hedef olarak "PDF olarak kaydet" seç

## Render kurulumu

ZIP içindeki dosyaları GitHub deposunun köküne yükle. GitHub kökünde `package.json`, `app`, `lib`, `database` klasörleri görünmelidir.

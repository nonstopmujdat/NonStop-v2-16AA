# NONSTOP V2.1.22AC - Operator Match Flow

Bu sürümde ana sayfa `/` operatör/istatistikçi akışıdır.

## Akış
1. Salon seçilir.
2. O tarihte o salondaki maçlar sırayla gelir.
3. Operatör tarafı seçilir: HOME veya AWAY.
4. Takım oyuncuları işaretlenir.
5. İlk 5 seçilir.
6. Maç ekranına geçilir.

## Kurallar
- Operatör maç ve takım seçmez; salon üzerinden maç sırası gelir.
- HOME operatörü süreyi başlatabilir.
- AWAY operatörü süreyi başlatamaz.
- Faul, faul aldı, serbest atış, oyuncu değişikliği, mola gibi olaylarda saat otomatik durur.
- Her takım ilk 5 çıkaramazsa hükmen yenilgi altyapısı vardır.

## Supabase
Çalıştırılacak SQL:

`database/016_operator_match_flow_v2_1_22ac.sql`

# NONSTOP AF-5B PATCH – PDF Court + Foul Map + Standings Fix

Bu küçük patch şunları düzeltir:

1. Puan durumu hatası için SQL:
   - `database/024_live_league_standings_and_categories_fix.sql`
   - Supabase SQL Editor'da çalıştırılacak.

2. PDF raporları:
   - Basketbol sahası çizimi yenilendi.
   - 3 sayı çizgileri belirginleştirildi.
   - Boyalı alan gösterildi.
   - Faul haritası eklendi.

3. Mini Admin ve Full Admin:
   - PDF rapor sayfaları iki tarafta da bulunur.
   - Takım/Kategori seçiminde KIZ / ERKEK görünür.
   - A/B grubu seçim bilgisi eklenir.

Yükleme:
- GitHub'a ZIP'i değil, içindeki dosyaları aynı klasör yollarıyla yükle.
- Önce Supabase'te SQL dosyasını çalıştır.
- Sonra GitHub commit ve Render deploy.

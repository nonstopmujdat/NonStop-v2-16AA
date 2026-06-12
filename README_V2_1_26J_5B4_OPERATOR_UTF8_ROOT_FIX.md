# NONSTOP V2.1.26J-5B4 – Operator UTF-8 Root Fix

Bu patch sadece `app/operator/page.tsx` dosyasını gerçek UTF-8 olarak kaydeder.

Amaç:
- Operatör sayfasında Türkçe karakterlerin düzgün görünmesi
- "İl Seç", "Salon Seç", "Bugünkü Maç", "Görev Tarafı", "Maç Kadrosu", "İlk 5" gibi yazıların bozulmaması

Yükleme:
1. ZIP'i açın.
2. İçindeki `app` klasörünü GitHub ana dizinine yükleyin.
3. README dosyasını da yükleyebilirsiniz.
4. Render deploy bittikten sonra operator sayfasını yenileyin.

Not: Bu patch canlı skor ve süre mantığını değiştirmez; sadece operator sayfasındaki metin dosyasını UTF-8'e çevirir.

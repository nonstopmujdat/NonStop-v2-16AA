# NONSTOP V2.1.26J-7 – Match State Recovery

Bu patch, devam eden maça geri dönünce maçı baştan başlatma hatasını düzeltir.

## Değişen dosyalar
- `app/operator/page.tsx`
- `app/api/match-resume-state/route.ts`

## Amaç
- Devam eden maçta HOME/AWAY tarafı ayrı seçilir.
- Maç ekranı ROSTER/STARTERS akışına dönmeden doğrudan GAME ekranına açılır.
- Skor, periyot, süre, sahadaki oyuncular ve yedekler geri yüklenir.
- Misafir operatör sayı girdiğinde skor misafir takım tarafına yazılır.
- Operator ekranı `/api/live-score` üzerinden belirli aralıklarla skoru günceller.

## Test
1. Match 5 durumunu `DEVAM_EDIYOR` yap.
2. Operator ekranında `Devam Eden Maça Geri Dön` bölümünden HOME veya AWAY olarak devam et.
3. HOME sayı girince HOME skoru, AWAY sayı girince AWAY skoru artmalıdır.

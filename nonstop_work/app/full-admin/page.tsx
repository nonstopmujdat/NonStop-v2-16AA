import Link from 'next/link';
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type AnyRow = Record<string, any>;

function val(row: AnyRow | null | undefined, key: string) {
  const v = row?.[key];
  return v === null || v === undefined ? '-' : String(v);
}

function SelectOptions({ rows, labelKey = 'name' }: { rows: AnyRow[]; labelKey?: string }) {
  return <>{rows.map((r) => <option key={r.id} value={r.id}>{r[labelKey] || r.name || r.id}</option>)}</>;
}

export default async function FullAdminPage({ searchParams }: { searchParams?: { ok?: string } }) {
  let counts: AnyRow | null = null;
  let cities: AnyRow[] = [];
  let seasons: AnyRow[] = [];
  let categories: AnyRow[] = [];
  let clubs: AnyRow[] = [];
  let teams: AnyRow[] = [];
  let requests: AnyRow[] = [];
  let dbReady = hasSupabaseAdminConfig();

  if (dbReady) {
    const supabase = getSupabaseAdmin();
    const [countsRes, citiesRes, seasonsRes, categoriesRes, clubsRes, teamsRes, requestsRes] = await Promise.all([
      supabase.from('full_admin_counts').select('*').maybeSingle(),
      supabase.from('cities').select('id,name').order('name'),
      supabase.from('seasons').select('id,name,is_active').order('name', { ascending: false }),
      supabase.from('categories').select('id,name,gender').order('name'),
      supabase.from('clubs').select('id,name,city_id').order('name'),
      supabase.from('full_admin_teams').select('*').limit(80),
      supabase.from('full_admin_access_requests').select('*').limit(30),
    ]);

    counts = countsRes.data || null;
    cities = citiesRes.data || [];
    seasons = seasonsRes.data || [];
    categories = categoriesRes.data || [];
    clubs = clubsRes.data || [];
    teams = teamsRes.data || [];
    requests = requestsRes.data || [];
  }

  return (
    <main className="dashboard">
      <div className="topbar">
        <b>NONSTOP Full Admin</b>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/mini-admin">Mini Admin</Link>
          <Link href="/competitions">Competition</Link>
          <Link href="/operator">Operatör</Link>
        </div>
      </div>

      <section className="card">
        <h1>V2.1.23 Full Admin Foundation</h1>
        <p style={{ marginTop: 8 }}>
          Bu ekran Supabase'e girmeden il, salon, kulüp, takım, oyuncu ve admin giriş isteği eklemek için hazırlandı.
        </p>
        {!dbReady ? <p style={{ color: '#b91c1c', marginTop: 10 }}>Supabase servis bağlantısı eksik. Render ortam değişkenlerini kontrol et.</p> : null}
        {searchParams?.ok ? <p style={{ color: '#15803d', marginTop: 10 }}>Kayıt başarıyla eklendi.</p> : null}
      </section>

      <div className="grid three">
        <div className="card"><span>İl</span><b>{val(counts, 'city_count')}</b></div>
        <div className="card"><span>Salon</span><b>{val(counts, 'venue_count')}</b></div>
        <div className="card"><span>Kulüp</span><b>{val(counts, 'club_count')}</b></div>
        <div className="card"><span>Takım</span><b>{val(counts, 'team_count')}</b></div>
        <div className="card"><span>Oyuncu</span><b>{val(counts, 'player_count')}</b></div>
        <div className="card"><span>Bekleyen Admin İsteği</span><b>{val(counts, 'pending_admin_request_count')}</b></div>
      </div>

      <section className="grid two" style={{ marginTop: 18 }}>
        <form className="card" action="/api/full-admin" method="post">
          <input type="hidden" name="entity" value="city" />
          <h2>İl Ekle</h2>
          <label>İl adı</label>
          <input name="name" placeholder="Bursa" required />
          <button type="submit">İli Kaydet</button>
        </form>

        <form className="card" action="/api/full-admin" method="post">
          <input type="hidden" name="entity" value="venue" />
          <h2>Salon Ekle</h2>
          <label>İl</label>
          <select name="city_id" required><option value="">Seç</option><SelectOptions rows={cities} /></select>
          <label>Salon adı</label>
          <input name="name" placeholder="Demo Salon" required />
          <label>Adres</label>
          <input name="address" placeholder="Adres" />
          <label>Saha sayısı</label>
          <input name="court_count" type="number" defaultValue="1" min="1" />
          <button type="submit">Salonu Kaydet</button>
        </form>

        <form className="card" action="/api/full-admin" method="post">
          <input type="hidden" name="entity" value="club" />
          <h2>Kulüp Ekle</h2>
          <label>İl</label>
          <select name="city_id" required><option value="">Seç</option><SelectOptions rows={cities} /></select>
          <label>Kulüp adı</label>
          <input name="name" placeholder="Final Spor" required />
          <label>Kısa ad</label>
          <input name="short_name" placeholder="FINAL" />
          <label>Telefon</label>
          <input name="phone" />
          <label>E-posta</label>
          <input name="email" type="email" />
          <button type="submit">Kulübü Kaydet</button>
        </form>

        <form className="card" action="/api/full-admin" method="post">
          <input type="hidden" name="entity" value="team" />
          <h2>Takım Ekle</h2>
          <label>Kulüp</label>
          <select name="club_id" required><option value="">Seç</option><SelectOptions rows={clubs} /></select>
          <label>Kategori</label>
          <select name="category_id" required><option value="">Seç</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name} {c.gender}</option>)}</select>
          <label>Sezon</label>
          <select name="season_id"><option value="">Seç</option><SelectOptions rows={seasons} /></select>
          <label>Takım adı</label>
          <input name="name" placeholder="Final Spor U14" required />
          <label>Takım kodu</label>
          <input name="team_code" placeholder="FINAL-U14" />
          <button type="submit">Takımı Kaydet</button>
        </form>

        <form className="card" action="/api/full-admin" method="post">
          <input type="hidden" name="entity" value="player" />
          <h2>Oyuncu Ekle</h2>
          <label>Takım</label>
          <select name="team_id" required><option value="">Seç</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.display_name || t.name}</option>)}</select>
          <label>Sezon</label>
          <select name="season_id"><option value="">Seç</option><SelectOptions rows={seasons} /></select>
          <label>Ad</label>
          <input name="first_name" required />
          <label>Soyad</label>
          <input name="last_name" required />
          <label>Forma No</label>
          <input name="jersey_no" type="number" min="0" />
          <label>Doğum tarihi</label>
          <input name="birth_date" type="date" />
          <label>Lisans No</label>
          <input name="license_no" />
          <label>Pozisyon</label>
          <input name="position" placeholder="PG / SG / SF / PF / C" />
          <button type="submit">Oyuncuyu Kaydet</button>
        </form>

        <form className="card" action="/api/full-admin" method="post">
          <input type="hidden" name="entity" value="admin_request" />
          <h2>Admin Giriş İsteği</h2>
          <label>Ad soyad</label>
          <input name="full_name" required />
          <label>E-posta</label>
          <input name="email" type="email" required />
          <label>Telefon</label>
          <input name="phone" />
          <label>İl</label>
          <select name="city_id"><option value="">Seç</option><SelectOptions rows={cities} /></select>
          <label>Kulüp</label>
          <select name="club_id"><option value="">Seç</option><SelectOptions rows={clubs} /></select>
          <label>İstenen yetki</label>
          <select name="requested_role" defaultValue="CLUB_ADMIN">
            <option value="CITY_ADMIN">İl Admini</option>
            <option value="LEAGUE_ADMIN">Lig Admini</option>
            <option value="CLUB_ADMIN">Kulüp Yetkilisi</option>
            <option value="NONSTOP_OPERATOR">Operatör</option>
            <option value="VIEWER">Sadece İzleyici</option>
          </select>
          <label>Not</label>
          <textarea name="request_note" placeholder="Yetki açıklaması" />
          <button type="submit">İsteği Kaydet</button>
        </form>
      </section>

      <section className="grid two" style={{ marginTop: 18 }}>
        <div className="card">
          <h2>Son Takımlar</h2>
          {teams.slice(0, 10).map((t) => <p key={t.id}><b>{t.display_name || t.name}</b> / {t.club_name || '-'} / {t.category_name || '-'}</p>)}
        </div>
        <div className="card">
          <h2>Admin İstekleri</h2>
          {requests.slice(0, 10).map((r) => <p key={r.id}><b>{r.full_name}</b> / {r.requested_role} / {r.status}</p>)}
          {requests.length === 0 ? <p>Bekleyen istek yok.</p> : null}
        </div>
      </section>
    </main>
  );
}

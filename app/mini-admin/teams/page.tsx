import Link from 'next/link';
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type Row = { id: number; name: string };

function OptionList({ rows }: { rows: Row[] }) {
  return <>{rows.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</>;
}

export default async function MiniAdminTeamsPage({ searchParams }: { searchParams?: { ok?: string; error?: string } }) {
  let clubs: Row[] = [];
  let cities: Row[] = [];
  let categories: Row[] = [];
  let seasons: Row[] = [];
  let teams: any[] = [];

  if (hasSupabaseAdminConfig()) {
    const supabase = getSupabaseAdmin();
    const [clubRes, cityRes, catRes, seasonRes, teamRes] = await Promise.all([
      supabase.from('clubs').select('id,name').order('name'),
      supabase.from('cities').select('id,name').order('name'),
      supabase.from('categories').select('id,name').order('name'),
      supabase.from('seasons').select('id,name').order('name'),
      supabase.from('teams').select('id,name,club_id,category_id,season_id,created_at').order('id', { ascending: false }).limit(20),
    ]);
    clubs = (clubRes.data || []) as Row[];
    cities = (cityRes.data || []) as Row[];
    categories = (catRes.data || []) as Row[];
    seasons = (seasonRes.data || []) as Row[];
    teams = teamRes.data || [];
  }

  return (
    <main className="dashboard">
      <div className="topbar"><b>Mini Admin / Takımlar</b><div><Link href="/mini-admin">Mini Admin</Link></div></div>
      <section className="card">
        <h1>🏀 Takım Ekle</h1>
        <p>Kulüp, il, kategori ve sezon seçerek yeni takım oluştur.</p>
        {searchParams?.ok ? <p style={{ color: '#86efac' }}>Takım kaydedildi.</p> : null}
        {searchParams?.error ? <p style={{ color: '#fca5a5' }}>{decodeURIComponent(searchParams.error)}</p> : null}
        <form action="/api/mini-admin/teams" method="post" style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <label>Takım Adı<input name="name" required placeholder="Örn: FİNAL SPOR U14" /></label>
          <label>Kulüp<select name="club_id" required><option value="">Seç</option><OptionList rows={clubs} /></select></label>
          <label>İl<select name="city_id" required><option value="">Seç</option><OptionList rows={cities} /></select></label>
          <label>Kategori<select name="category_id" required><option value="">Seç</option><OptionList rows={categories} /></select></label>
          <label>Sezon<select name="season_id" required><option value="">Seç</option><OptionList rows={seasons} /></select></label>
          <button type="submit">Kaydet</button>
        </form>
      </section>
      <section className="card" style={{ marginTop: 18 }}>
        <h2>Son Takımlar</h2>
        <div style={{ overflowX: 'auto' }}><table><thead><tr><th>ID</th><th>Takım</th><th>Kulüp ID</th><th>Kategori ID</th><th>Sezon ID</th></tr></thead><tbody>{teams.map((t) => <tr key={t.id}><td>{t.id}</td><td>{t.name}</td><td>{t.club_id}</td><td>{t.category_id}</td><td>{t.season_id}</td></tr>)}</tbody></table></div>
      </section>
    </main>
  );
}

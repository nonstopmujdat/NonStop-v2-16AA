import Link from 'next/link';
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
type Row = { id: number; name: string };
function OptionList({ rows }: { rows: Row[] }) { return <>{rows.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</>; }

export default async function MiniAdminPlayersPage({ searchParams }: { searchParams?: { ok?: string; error?: string } }) {
  let teams: Row[] = [];
  let seasons: Row[] = [];
  let players: any[] = [];
  if (hasSupabaseAdminConfig()) {
    const supabase = getSupabaseAdmin();
    const [teamRes, seasonRes, playerRes] = await Promise.all([
      supabase.from('teams').select('id,name').order('name'),
      supabase.from('seasons').select('id,name').order('name'),
      supabase.from('players').select('id,first_name,last_name,jersey_no,license_no,active').order('id', { ascending: false }).limit(30),
    ]);
    teams = (teamRes.data || []) as Row[];
    seasons = (seasonRes.data || []) as Row[];
    players = playerRes.data || [];
  }
  return (
    <main className="dashboard">
      <div className="topbar"><b>Mini Admin / Oyuncular</b><div><Link href="/mini-admin">Mini Admin</Link></div></div>
      <section className="card">
        <h1>👤 Oyuncu Ekle</h1>
        <p>Oyuncu takıma bağlanır. Resmi maç kadrosu 12, özel/hazırlık maçı kadrosu 24 oyuncu sınırını kullanır.</p>
        {searchParams?.ok ? <p style={{ color: '#86efac' }}>Oyuncu kaydedildi.</p> : null}
        {searchParams?.error ? <p style={{ color: '#fca5a5' }}>{decodeURIComponent(searchParams.error)}</p> : null}
        <form action="/api/mini-admin/players" method="post" style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <label>Takım<select name="team_id" required><option value="">Seç</option><OptionList rows={teams} /></select></label>
          <label>Sezon<select name="season_id" required><option value="">Seç</option><OptionList rows={seasons} /></select></label>
          <label>Ad<input name="first_name" required /></label>
          <label>Soyad<input name="last_name" required /></label>
          <label>Doğum Tarihi<input name="birth_date" type="date" /></label>
          <label>Forma No<input name="jersey_no" type="number" min="0" /></label>
          <label>Lisans No<input name="license_no" /></label>
          <label>Pozisyon<input name="position" placeholder="PG / SG / SF / PF / C" /></label>
          <button type="submit">Kaydet</button>
        </form>
      </section>
      <section className="card" style={{ marginTop: 18 }}>
        <h2>Son Oyuncular</h2>
        <div style={{ overflowX: 'auto' }}><table><thead><tr><th>ID</th><th>Oyuncu</th><th>No</th><th>Lisans</th><th>Aktif</th></tr></thead><tbody>{players.map((p) => <tr key={p.id}><td>{p.id}</td><td>{p.first_name} {p.last_name}</td><td>{p.jersey_no || '-'}</td><td>{p.license_no || '-'}</td><td>{p.active ? 'Evet' : 'Hayır'}</td></tr>)}</tbody></table></div>
      </section>
    </main>
  );
}

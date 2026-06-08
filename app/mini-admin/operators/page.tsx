import Link from 'next/link';
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
type Row = { id: number; name: string };
function OptionList({ rows }: { rows: Row[] }) { return <>{rows.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</>; }

export default async function MiniAdminOperatorsPage({ searchParams }: { searchParams?: { ok?: string; error?: string } }) {
  let cities: Row[] = [];
  let operators: any[] = [];
  if (hasSupabaseAdminConfig()) {
    const supabase = getSupabaseAdmin();
    const [cityRes, userRes] = await Promise.all([
      supabase.from('cities').select('id,name').order('name'),
      supabase.from('users').select('id,full_name,email,phone,city_id,is_active').order('created_at', { ascending: false }).limit(30),
    ]);
    cities = (cityRes.data || []) as Row[];
    operators = userRes.data || [];
  }
  return (
    <main className="dashboard">
      <div className="topbar"><b>Mini Admin / Operatörler</b><div><Link href="/mini-admin">Mini Admin</Link></div></div>
      <section className="card">
        <h1>🎯 Operatör Ekle</h1>
        <p>Operatör email ile kaydedilir. Giriş ekranında email eşleştirmesi bu kullanıcı kaydı üzerinden yapılacaktır.</p>
        {searchParams?.ok ? <p style={{ color: '#86efac' }}>Operatör kaydedildi.</p> : null}
        {searchParams?.error ? <p style={{ color: '#fca5a5' }}>{decodeURIComponent(searchParams.error)}</p> : null}
        <form action="/api/mini-admin/operators" method="post" style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <label>Ad Soyad<input name="full_name" required /></label>
          <label>Email<input name="email" type="email" required /></label>
          <label>Telefon<input name="phone" /></label>
          <label>İl<select name="city_id"><option value="">Seç</option><OptionList rows={cities} /></select></label>
          <label>Operatör Yetkisi<select name="operator_mode" defaultValue="BOTH"><option value="HOME">HOME</option><option value="AWAY">AWAY</option><option value="BOTH">BOTH</option></select></label>
          <button type="submit">Kaydet</button>
        </form>
      </section>
      <section className="card" style={{ marginTop: 18 }}>
        <h2>Son Kullanıcı / Operatör Kayıtları</h2>
        <div style={{ overflowX: 'auto' }}><table><thead><tr><th>Ad Soyad</th><th>Email</th><th>Telefon</th><th>İl ID</th><th>Aktif</th></tr></thead><tbody>{operators.map((o) => <tr key={o.id}><td>{o.full_name}</td><td>{o.email}</td><td>{o.phone || '-'}</td><td>{o.city_id || '-'}</td><td>{o.is_active ? 'Evet' : 'Hayır'}</td></tr>)}</tbody></table></div>
      </section>
    </main>
  );
}

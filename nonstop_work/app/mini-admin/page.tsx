import Link from 'next/link';
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type CountResult = { count: number | null };

function countText(result: CountResult) {
  return typeof result.count === 'number' ? result.count : '-';
}

export default async function MiniAdminPage() {
  let competitionCount: CountResult = { count: null };
  let teamCount: CountResult = { count: null };
  let matchCount: CountResult = { count: null };

  if (hasSupabaseAdminConfig()) {
    const supabase = getSupabaseAdmin();
    const [competitions, teams, matches] = await Promise.all([
      supabase.from('live_competitions').select('id', { count: 'exact', head: true }),
      supabase.from('mini_admin_competition_teams').select('competition_team_id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('operator_match_queue').select('match_id', { count: 'exact', head: true }),
    ]);
    competitionCount = { count: competitions.count };
    teamCount = { count: teams.count };
    matchCount = { count: matches.count };
  }

  return (
    <main className="dashboard">
      <div className="topbar">
        <b>NONSTOP Mini Admin</b>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/operator">Operatör</Link>
          <Link href="/live">Canlı Skor</Link>
        </div>
      </div>

      <section className="card">
        <h1>Mini Admin Ana Menü</h1>
        <p style={{ marginTop: 8 }}>
          Lig, turnuva, organizasyon takımları ve resmi maç oluşturma işlemleri buradan yönetilir.
          Mini Admin tamamlanmadan Full Admin Panel'e geçilmez.
        </p>
        {!hasSupabaseAdminConfig() ? (
          <p style={{ color: '#b91c1c', marginTop: 10 }}>Supabase servis bağlantısı eksik. Render ortam değişkenlerini kontrol et.</p>
        ) : null}
      </section>

      <div className="grid three">
        <div className="card"><span>Organizasyon</span><b>{countText(competitionCount)}</b></div>
        <div className="card"><span>Ekli Takım</span><b>{countText(teamCount)}</b></div>
        <div className="card"><span>Operatör Maçı</span><b>{countText(matchCount)}</b></div>
      </div>

      <section className="grid two" style={{ marginTop: 18 }}>
        <Link className="card" href="/competitions#create-competition" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2>Lig Oluştur</h2>
          <p>İl, sezon, kategori, A/B seviyesi ve lig adı seçilerek yeni lig açılır.</p>
        </Link>
        <Link className="card" href="/competitions#create-competition" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2>Turnuva Oluştur</h2>
          <p>Turnuva adı, kategori ve tarih aralığıyla organizasyon kaydı oluşturulur.</p>
        </Link>
        <Link className="card" href="/competitions#add-team" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2>Takımları Organizasyona Ekle</h2>
          <p>competition_teams akışıyla lig veya turnuvaya takım bağlanır.</p>
        </Link>
        <Link className="card" href="/competitions#create-match" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2>Resmi Maç Oluştur</h2>
          <p>Salon, tarih, saat, ev sahibi ve misafir seçilir; maç operatör ekranına düşer.</p>
        </Link>
        <Link className="card" href="/competitions#matches" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2>Oluşturulan Maçlar</h2>
          <p>Operatör maç kuyruğu ve maç durumu kontrol edilir.</p>
        </Link>
        <Link className="card" href="/competitions#teams" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2>Eklenen Takımlar</h2>
          <p>Organizasyondaki takımlar listelenir ve gerekirse pasifleştirilir.</p>
        </Link>
      </section>
    </main>
  );
}

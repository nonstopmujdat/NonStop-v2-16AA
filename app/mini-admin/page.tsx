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
  let playerCount: CountResult = { count: null };
  let operatorCount: CountResult = { count: null };

  if (hasSupabaseAdminConfig()) {
    const supabase = getSupabaseAdmin();
    const [competitions, teams, matches, players, operators] = await Promise.all([
      supabase.from('live_competitions').select('id', { count: 'exact', head: true }),
      supabase.from('teams').select('id', { count: 'exact', head: true }),
      supabase.from('operator_match_queue').select('match_id', { count: 'exact', head: true }),
      supabase.from('players').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ]);
    competitionCount = { count: competitions.count };
    teamCount = { count: teams.count };
    matchCount = { count: matches.count };
    playerCount = { count: players.count };
    operatorCount = { count: operators.count };
  }

  return (
    <main className="dashboard mini-admin-home">
      <div className="topbar">
        <b>NONSTOP Mini Admin</b>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/">Ana Sayfa</Link>
          <Link href="/operator">Maç Merkezi</Link>
          <Link href="/live">Canlı Skor</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </div>

      <section className="card hero-card">
        <span>V2.1.22AF-5A</span>
        <h1>Mini Admin Ana Menü</h1>
        <p style={{ marginTop: 8 }}>
          Bu sürümde Mini Admin içine <b>Takım Ekle</b>, <b>Oyuncu Ekle</b>, <b>Operatör Ekle</b> ve <b>PDF Raporlar</b> girişleri eklendi.
          Mevcut il seç → salon seç → maç akışı <b>Maç Merkezi</b> olarak korunur.
        </p>
        {!hasSupabaseAdminConfig() ? (
          <p style={{ color: '#fca5a5', marginTop: 10 }}>Supabase servis bağlantısı eksik. Render ortam değişkenlerini kontrol et.</p>
        ) : null}
      </section>

      <div className="grid three">
        <div className="card"><span>Organizasyon</span><b>{countText(competitionCount)}</b></div>
        <div className="card"><span>Takım</span><b>{countText(teamCount)}</b></div>
        <div className="card"><span>Oyuncu</span><b>{countText(playerCount)}</b></div>
        <div className="card"><span>Operatör/Kullanıcı</span><b>{countText(operatorCount)}</b></div>
        <div className="card"><span>Operatör Maçı</span><b>{countText(matchCount)}</b></div>
      </div>

      <section className="grid two mini-menu" style={{ marginTop: 18 }}>
        <Link className="card menu-card" href="/competitions#create-competition">
          <h2>🏆 Lig Yönetimi</h2>
          <p>İl, sezon, kategori, A/B seviyesi ve lig adı seçilerek yeni lig oluşturulur.</p>
          <b>Lig oluştur</b>
        </Link>

        <Link className="card menu-card" href="/competitions#create-competition">
          <h2>🏅 Turnuva Yönetimi</h2>
          <p>Turnuva adı, kategori ve tarih aralığıyla turnuva organizasyonu oluşturulur.</p>
          <b>Turnuva oluştur</b>
        </Link>

        <Link className="card menu-card" href="/competitions#add-team">
          <h2>👥 Organizasyona Takım Ekle</h2>
          <p>Lig veya turnuva seçilir, takımlar organizasyona bağlanır veya pasifleştirilir.</p>
          <b>Takım ekle</b>
        </Link>

        <Link className="card menu-card" href="/competitions#create-match">
          <h2>📅 Resmi Maç Oluştur</h2>
          <p>Organizasyon, salon, tarih, saat, ev sahibi ve misafir seçilerek maç oluşturulur.</p>
          <b>Maç oluştur</b>
        </Link>

        <Link className="card menu-card" href="/mini-admin/teams">
          <h2>🏀 Takım Ekle</h2>
          <p>Kulüp, il, kategori ve sezon seçerek yeni takım oluştur.</p>
          <b>Takım ekranı</b>
        </Link>

        <Link className="card menu-card" href="/mini-admin/players">
          <h2>👤 Oyuncu Ekle</h2>
          <p>Takıma oyuncu ekle, forma no ve lisans no kaydet.</p>
          <b>Oyuncu ekranı</b>
        </Link>

        <Link className="card menu-card" href="/mini-admin/operators">
          <h2>🎯 Operatör Ekle</h2>
          <p>Operatörü email ile kaydet. HOME/AWAY/BOTH görev bilgisi ileride maç atamasında kullanılacak.</p>
          <b>Operatör ekranı</b>
        </Link>

        <Link className="card menu-card" href="/mini-admin/reports">
          <h2>📄 PDF Raporlar</h2>
          <p>Maç istatistik raporu ve saha üzeri şut/atış haritası PDF çıktısı al.</p>
          <b>Rapor ekranı</b>
        </Link>

        <Link className="card menu-card" href="/competitions#matches">
          <h2>📋 Oluşturulan Maçlar</h2>
          <p>Planlanan maçlar ve operatör maç kuyruğu kontrol edilir.</p>
          <b>Maçları gör</b>
        </Link>

        <Link className="card menu-card match-center-card" href="/operator">
          <h2>🏀 Maç Merkezi</h2>
          <p>Mevcut il seç → salon seç → resmi maçlar → supervisor özel/hazırlık → operatör akışı burada korunur.</p>
          <b>Maç merkezine git</b>
        </Link>
      </section>
    </main>
  );
}

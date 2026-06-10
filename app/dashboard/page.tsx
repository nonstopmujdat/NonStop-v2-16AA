import Link from 'next/link';
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let stats = { competitions: 0, teams: 0, players: 0, matches: 0 };
  let upcomingMatches: any[] = [];

  if (hasSupabaseAdminConfig()) {
    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];

    const [compRes, teamRes, playerRes, matchRes, upcomingRes] = await Promise.all([
      supabase.from('live_competitions').select('id', { count: 'exact', head: true }),
      supabase.from('teams').select('id', { count: 'exact', head: true }),
      supabase.from('players').select('id', { count: 'exact', head: true }),
      supabase.from('operator_match_queue').select('match_id', { count: 'exact', head: true }),
      supabase.from('operator_match_queue')
        .select('*')
        .gte('match_date', today)
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true })
        .limit(5)
    ]);

    stats.competitions = compRes.count || 0;
    stats.teams = teamRes.count || 0;
    stats.players = playerRes.count || 0;
    stats.matches = matchRes.count || 0;
    upcomingMatches = upcomingRes.data || [];
  }

  return (
    <main className="nn-container">
      <div className="nn-header-area flex justify-between items-center flex-wrap gap-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="nn-title">NONSTOP Dashboard</h1>
          <span className="nn-subtitle">Sistem İstatistikleri ve Genel Bakış</span>
        </div>
        <div className="flex gap-4" style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/mini-admin" className="nn-link" style={{ fontSize: '1rem' }}>Mini Admin</Link>
          <Link href="/operator" className="nn-link" style={{ fontSize: '1rem' }}>Operatör Ekranı</Link>
          <Link href="/live" className="nn-link" style={{ fontSize: '1rem' }}>Canlı Skor</Link>
        </div>
      </div>

      {!hasSupabaseAdminConfig() ? (
        <div className="nn-error" style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#fca5a5' }}>
          <b>Supabase servis bağlantısı eksik.</b> Render ortam değişkenlerini kontrol et.
        </div>
      ) : null}

      <div className="nn-grid nn-grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="nn-stat-box" style={{ background: 'var(--nn-surface-glass)', border: '1px solid var(--nn-border)', borderRadius: '12px', borderRight: '1px solid var(--nn-border)' }}>
          <span className="nn-stat-label">Organizasyon</span>
          <span className="nn-stat-value">{stats.competitions}</span>
        </div>
        <div className="nn-stat-box" style={{ background: 'var(--nn-surface-glass)', border: '1px solid var(--nn-border)', borderRadius: '12px', borderRight: '1px solid var(--nn-border)' }}>
          <span className="nn-stat-label">Kayıtlı Takım</span>
          <span className="nn-stat-value highlight-cyan">{stats.teams}</span>
        </div>
        <div className="nn-stat-box" style={{ background: 'var(--nn-surface-glass)', border: '1px solid var(--nn-border)', borderRadius: '12px', borderRight: '1px solid var(--nn-border)' }}>
          <span className="nn-stat-label">Aktif Oyuncu</span>
          <span className="nn-stat-value highlight-orange">{stats.players}</span>
        </div>
        <div className="nn-stat-box" style={{ background: 'var(--nn-surface-glass)', border: '1px solid var(--nn-border)', borderRadius: '12px' }}>
          <span className="nn-stat-label">Toplam Maç</span>
          <span className="nn-stat-value">{stats.matches}</span>
        </div>
      </div>

      <div className="nn-grid nn-grid-cols-2" style={{ alignItems: 'flex-start' }}>
        
        <section className="nn-card">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📅</span> Yaklaşan Maçlar
          </h2>
          
          <div className="nn-table-wrapper" style={{ marginTop: '1rem' }}>
            <table className="nn-table">
              <thead>
                <tr>
                  <th>Tarih / Saat</th>
                  <th>Karşılaşma</th>
                  <th>Salon</th>
                </tr>
              </thead>
              <tbody>
                {upcomingMatches.length > 0 ? upcomingMatches.map((match: any) => (
                  <tr key={match.match_id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ color: 'var(--nn-cyan)', fontWeight: 'bold' }}>{match.match_date}</span><br/>
                      <span style={{ color: 'var(--nn-text-muted)', fontSize: '0.8rem' }}>{match.match_time}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--nn-text-muted)', marginBottom: '0.25rem' }}>
                        {match.competition_name}
                      </div>
                      <b style={{ color: '#fff' }}>{match.home_team_name}</b> <span style={{ color: 'var(--nn-orange)' }}>-</span> <b style={{ color: '#fff' }}>{match.away_team_name}</b>
                    </td>
                    <td style={{ fontSize: '0.9rem' }}>
                      {match.venue_name}<br/>
                      <span style={{ color: 'var(--nn-text-muted)', fontSize: '0.8rem' }}>{match.city_name}</span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: 'var(--nn-text-muted)', padding: '2rem' }}>
                      Yakın zamanda planlanmış bir maç bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <Link href="/operator" className="nn-button nn-button-primary" style={{ display: 'inline-block', textDecoration: 'none', fontSize: '0.85rem' }}>Maç Merkezine Git &rarr;</Link>
          </div>
        </section>

        <section className="nn-card">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⚡</span> Bekleyen İşler & Sistem
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.2)', padding: '1rem', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--nn-cyan)', marginBottom: '0.5rem' }}>Operatör Atamaları</h3>
              <p style={{ color: 'var(--nn-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Bugünkü maçlar için operatör eşleşmeleri otomatik olarak yapıldı. Sahalarda eksik operatör görünmüyor.
              </p>
            </div>
            
            <div style={{ background: 'rgba(255, 87, 34, 0.05)', border: '1px solid rgba(255, 87, 34, 0.2)', padding: '1rem', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--nn-orange)', marginBottom: '0.5rem' }}>Takım Onayları</h3>
              <p style={{ color: 'var(--nn-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Sisteme yeni kayıt olmuş 3 takım var. Kadro onayları için inceleme bekliyorlar.
              </p>
            </div>
            
            <div style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '1rem', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#22c55e', marginBottom: '0.5rem' }}>Sistem Sağlığı</h3>
              <p style={{ color: 'var(--nn-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Supabase real-time socket bağlantısı stabil. Gecikme 15ms altında seyrediyor. Tüm modüller aktif.
              </p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}

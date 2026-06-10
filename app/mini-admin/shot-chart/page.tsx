import Link from 'next/link';
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type ShotChartRow = {
  event_id: number;
  match_id: number;
  team_id: number;
  team_name: string | null;
  player_id: number;
  player_name: string | null;
  quarter: number;
  game_clock: string | null;
  event_type: string;
  shot_id: number;
  x: number | null;
  y: number | null;
  shot_type: string | null;
  shot_zone: string | null;
  made: boolean;
  is_free_throw: boolean;
  points: number;
  created_at: string;
};

export default async function ShotChartPage() {
  const hasConfig = hasSupabaseAdminConfig();

  if (!hasConfig) {
    return (
      <div className="nn-container">
        <h1 className="nn-title">Şut Haritası</h1>
        <div className="nn-error mt-4">
          <p>Supabase admin konfigürasyonu yapılmamış.</p>
        </div>
      </div>
    );
  }

  let shots: ShotChartRow[] = [];
  let errorMessage = '';

  try {
    const supabase = await getSupabaseAdmin();
    const { data, error } = await supabase
      .from('live_shot_chart')
      .select('*')
      .order('event_id', { ascending: false });

    if (error) {
      errorMessage = error.message;
    } else {
      shots = data || [];
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
  }

  if (errorMessage) {
    return (
      <div className="nn-container">
        <h1 className="nn-title">Şut Haritası</h1>
        <div className="nn-error mt-4">
          <p>Veri yüklenirken hata oluştu: {errorMessage}</p>
        </div>
      </div>
    );
  }

  const totalShots = shots.length;
  const madeShots = shots.filter(s => s.made).length;
  const missedShots = totalShots - madeShots;
  const shotPct = totalShots > 0 ? Math.round((madeShots / totalShots) * 100) : 0;

  const type2P = shots.filter(s => s.shot_type === '2PT' || s.shot_type === '2P' || s.shot_type === '2').length;
  const type3P = shots.filter(s => s.shot_type === '3PT' || s.shot_type === '3P' || s.shot_type === '3').length;
  const typeFT = shots.filter(s => s.is_free_throw).length;

  return (
    <div className="nn-container">
      <div className="nn-header-area flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="nn-title">Şut Haritası</h1>
          <span className="nn-subtitle">Görselleştirme // Court Mapping</span>
        </div>
        <div>
          <Link href="/mini-admin" className="nn-link" style={{ fontSize: '1rem' }}>
            ← Ana Menüye Dön
          </Link>
        </div>
      </div>

      {/* MAÇ ÖZETİ */}
      <div className="nn-grid nn-grid-cols-6 mb-8">
        <div className="nn-stat-box"><span className="nn-stat-label">Deneme</span><span className="nn-stat-value">{totalShots}</span></div>
        <div className="nn-stat-box"><span className="nn-stat-label">İsabet</span><span className="nn-stat-value highlight-cyan">{madeShots}</span></div>
        <div className="nn-stat-box"><span className="nn-stat-label">Kaçan</span><span className="nn-stat-value highlight-orange">{missedShots}</span></div>
        <div className="nn-stat-box"><span className="nn-stat-label">Şut %</span><span className="nn-stat-value">{shotPct}%</span></div>
        <div className="nn-stat-box"><span className="nn-stat-label">2 Sayı</span><span className="nn-stat-value">{type2P}</span></div>
        <div className="nn-stat-box" style={{borderRight: 'none'}}><span className="nn-stat-label">3 Sayı</span><span className="nn-stat-value">{type3P}</span></div>
      </div>

      <div className="nn-grid nn-grid-cols-2">
        {/* TAM SAHA ÇİZİMİ */}
        <div>
          <h2 className="nn-title" style={{fontSize: '2rem'}}>Saha Dağılımı</h2>
          <div className="nn-court-container mt-4">
            {/* Basketbol Sahası Neon Çizgileri */}
            <div className="nn-court-line" style={{top: 0, left: '50%', transform: 'translateX(-50%)', width: '40px', height: '40px', borderRadius: '50%'}} />
            <div className="nn-court-line nn-court-paint" />
            <div className="nn-court-line nn-court-arc" />
            <div className="nn-court-line nn-court-rim" />

            {/* Noktalar */}
            {shots.map((shot) => {
              if (shot.x === null || shot.y === null) return null;
              
              const isMade = shot.made;
              const dotClass = isMade ? 'nn-shot-made' : 'nn-shot-missed';
              return (
                <div
                  key={shot.shot_id}
                  className={`nn-shot-dot ${dotClass}`}
                  style={{ left: `${shot.x}%`, top: `${shot.y}%` }}
                  title={`${shot.player_name || 'Bilinmiyor'} - ${shot.shot_type} - ${isMade ? 'İsabet' : 'Kaçtı'}`}
                />
              );
            })}
          </div>
          <div className="flex gap-6 justify-center mt-6" style={{fontFamily: 'var(--font-mono)'}}>
            <div className="flex items-center gap-2"><span className="nn-shot-dot nn-shot-made" style={{position: 'relative', transform: 'none'}}></span> İsabet</div>
            <div className="flex items-center gap-2"><span className="nn-shot-dot nn-shot-missed" style={{position: 'relative', transform: 'none'}}></span> Kaçan</div>
          </div>
        </div>

        {/* ŞUT LİSTESİ */}
        <div>
          <h2 className="nn-title" style={{fontSize: '2rem'}}>Şut Listesi</h2>
          <div className="nn-table-wrapper mt-4" style={{maxHeight: '600px', overflowY: 'auto'}}>
            <table className="nn-table">
              <thead style={{position: 'sticky', top: 0, zIndex: 10}}>
                <tr>
                  <th>Maç</th>
                  <th>Çeyrek</th>
                  <th>Saat</th>
                  <th>Oyuncu</th>
                  <th>Şut</th>
                  <th>Sonuç</th>
                </tr>
              </thead>
              <tbody>
                {shots.map((s) => (
                  <tr key={s.event_id}>
                    <td>{s.match_id}</td>
                    <td>Q{s.quarter}</td>
                    <td style={{color: 'var(--nn-text-muted)'}}>{s.game_clock || '-'}</td>
                    <td style={{fontFamily: 'var(--font-body)', fontWeight: 500}}>{s.player_name || '-'}</td>
                    <td>{s.shot_type || (s.is_free_throw ? 'FT' : '-')}</td>
                    <td style={{fontWeight: 700}}>
                      {s.made ? (
                        <span style={{color: 'var(--nn-cyan)', textShadow: '0 0 5px rgba(0,240,255,0.4)'}}>İSABET</span>
                      ) : (
                        <span style={{color: 'var(--nn-orange)', textShadow: '0 0 5px rgba(255,87,34,0.4)'}}>KAÇTI</span>
                      )}
                    </td>
                  </tr>
                ))}
                {shots.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{textAlign: 'center', padding: '2rem'}}>Gösterilecek şut bulunamadı.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type OptionRow = { id: number; name?: string | null; gender?: string | null };
type CompetitionRow = {
  id: number;
  city_name: string | null;
  season_name: string | null;
  category_name: string | null;
  gender?: string | null;
  competition_name: string | null;
  competition_type: string | null;
  league_level: string | null;
  is_independent: boolean | null;
  status: string | null;
  team_count: number | null;
};

type CompetitionTeamRow = {
  id: number;
  competition_id: number;
  competition_name: string | null;
  city_name: string | null;
  category_name: string | null;
  team_name: string | null;
  club_name: string | null;
  league_level: string | null;
  is_active: boolean | null;
};

type MatchQueueRow = {
  match_id: number;
  match_date: string | null;
  match_time: string | null;
  venue_name: string | null;
  city_name: string | null;
  home_team_name: string | null;
  away_team_name: string | null;
  competition_name: string | null;
  competition_type: string | null;
  category_name: string | null;
  status: string | null;
};

function safeId(value: FormDataEntryValue | null) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function typeLabel(type?: string | null) {
  switch (type) {
    case 'LEAGUE': return 'Lig';
    case 'SEASON': return 'Sezon';
    case 'SEASON_GROUP': return 'Sezon/Grup';
    case 'TOURNAMENT': return 'Turnuva';
    case 'FRIENDLY': return 'Hazırlık';
    case 'SPECIAL_MATCH': return 'Özel Maç';
    default: return type || '-';
  }
}

async function createCompetition(formData: FormData) {
  'use server';
  const supabase = getSupabaseAdmin();
  const city_id = safeId(formData.get('city_id'));
  const season_id = safeId(formData.get('season_id'));
  const category_id = safeId(formData.get('category_id'));
  const name = String(formData.get('name') || '').trim();
  const competition_type = String(formData.get('competition_type') || 'LEAGUE').trim();
  const league_level = String(formData.get('league_level') || 'NONE').trim();

  if (!city_id || !name) return;

  await supabase.from('competitions').insert({
    city_id,
    season_id,
    category_id,
    name,
    competition_type,
    league_level,
    is_independent: true,
    status: 'ACTIVE',
    updated_at: new Date().toISOString(),
  });
  revalidatePath('/competitions');
}

async function updateCompetition(formData: FormData) {
  'use server';
  const supabase = getSupabaseAdmin();
  const id = safeId(formData.get('competition_id'));
  const name = String(formData.get('name') || '').trim();
  const status = String(formData.get('status') || 'ACTIVE').trim();
  if (!id || !name) return;

  await supabase.from('competitions').update({
    name,
    status,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  revalidatePath('/competitions');
}

async function addTeamToCompetition(formData: FormData) {
  'use server';
  const supabase = getSupabaseAdmin();
  const competition_id = safeId(formData.get('competition_id'));
  const team_id = safeId(formData.get('team_id'));
  const club_id = safeId(formData.get('club_id'));
  if (!competition_id || !team_id) return;

  const { data: competition } = await supabase
    .from('competitions')
    .select('city_id, season_id, category_id, league_level')
    .eq('id', competition_id)
    .single();

  const payload = {
    competition_id,
    team_id,
    club_id,
    city_id: competition?.city_id || null,
    season_id: competition?.season_id || null,
    category_id: competition?.category_id || null,
    league_level: competition?.league_level || 'NONE',
    is_active: true,
  };

  const { data: existing } = await supabase
    .from('competition_teams')
    .select('id')
    .eq('competition_id', competition_id)
    .eq('team_id', team_id)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from('competition_teams').update(payload).eq('id', existing.id);
  } else {
    await supabase.from('competition_teams').insert(payload);
  }
  revalidatePath('/competitions');
}

async function removeTeamFromCompetition(formData: FormData) {
  'use server';
  const supabase = getSupabaseAdmin();
  const id = safeId(formData.get('competition_team_id'));
  if (!id) return;

  await supabase.from('competition_teams').update({ is_active: false }).eq('id', id);
  revalidatePath('/competitions');
}


async function createOfficialMatch(formData: FormData) {
  'use server';
  const supabase = getSupabaseAdmin();
  const competition_id = safeId(formData.get('competition_id'));
  const venue_id = safeId(formData.get('venue_id'));
  const home_team_id = safeId(formData.get('home_team_id'));
  const away_team_id = safeId(formData.get('away_team_id'));
  const match_date = String(formData.get('match_date') || '').trim();
  const match_time = String(formData.get('match_time') || '').trim();

  if (!competition_id || !venue_id || !home_team_id || !away_team_id || !match_date || !match_time) return;

  const { error } = await supabase.rpc('create_official_match_from_admin', {
    p_competition_id: competition_id,
    p_venue_id: venue_id,
    p_match_date: match_date,
    p_match_time: match_time,
    p_home_team_id: home_team_id,
    p_away_team_id: away_team_id,
  });

  if (error) {
    console.error('createOfficialMatch failed', error.message);
    return;
  }
  revalidatePath('/competitions');
  revalidatePath('/operator');
}

function optionLabel(row: OptionRow, fallback: string) {
  return row.name || `${fallback} #${row.id}`;
}

function categoryLabel(row: OptionRow) {
  return `${row.name || `Kategori #${row.id}`}${row.gender ? ` / ${row.gender}` : ''}`;
}

export default async function CompetitionsPage() {
  if (!hasSupabaseAdminConfig()) {
    return (
      <main className="nn-container">
        <div className="nn-header-area flex justify-between items-center flex-wrap gap-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="nn-title">NONSTOP Organizasyonlar</h1>
          </div>
          <div className="flex gap-4" style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/dashboard" className="nn-link" style={{ fontSize: '1rem' }}>Dashboard</Link>
          </div>
        </div>
        <div className="nn-card">Supabase bağlantı ayarları eksik.</div>
      </main>
    );
  }

  const supabase = getSupabaseAdmin();
  const [competitionsRes, citiesRes, seasonsRes, categoriesRes, teamsRes, clubsRes, venuesRes, compTeamsRes, matchesRes] = await Promise.all([
    supabase.from('live_competitions').select('*').order('city_name', { ascending: true }).order('category_name', { ascending: true }).order('competition_name', { ascending: true }),
    supabase.from('cities').select('id,name').order('name', { ascending: true }),
    supabase.from('seasons').select('id,name').order('name', { ascending: false }),
    supabase.from('categories').select('id,name,gender').order('name', { ascending: true }),
    supabase.from('teams').select('id,name').order('name', { ascending: true }),
    supabase.from('clubs').select('id,name').order('name', { ascending: true }),
    supabase.from('venues').select('id,name').order('name', { ascending: true }),
    supabase.from('mini_admin_competition_teams').select('*').eq('is_active', true).order('competition_name', { ascending: true }).order('team_name', { ascending: true }).limit(100),
    supabase.from('operator_match_queue').select('*').order('match_date', { ascending: false }).order('match_order', { ascending: true }).limit(100),
  ]);

  const rows = (competitionsRes.data || []) as CompetitionRow[];
  const cities = (citiesRes.data || []) as OptionRow[];
  const seasons = (seasonsRes.data || []) as OptionRow[];
  const categories = (categoriesRes.data || []) as OptionRow[];
  const teams = (teamsRes.data || []) as OptionRow[];
  const clubs = (clubsRes.data || []) as OptionRow[];
  const venues = (venuesRes.data || []) as OptionRow[];
  const matchRows = (matchesRes.data || []) as MatchQueueRow[];
  const officialCompetitions = rows.filter((row) => row.competition_type === 'LEAGUE' || row.competition_type === 'TOURNAMENT' || row.competition_type === 'SEASON' || row.competition_type === 'SEASON_GROUP');
  const rawCompTeams = (compTeamsRes.data || []) as any[];
  const compTeams: CompetitionTeamRow[] = rawCompTeams.map((item) => ({
    id: item.competition_team_id || item.id,
    competition_id: item.competition_id,
    competition_name: item.competition_name || null,
    city_name: item.city_name || null,
    category_name: item.category_name || null,
    team_name: item.team_name || null,
    club_name: item.club_name || null,
    league_level: item.league_level || null,
    is_active: item.is_active,
  }));

  const formGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end', marginTop: '1rem' };

  return (
    <main className="nn-container" style={{ maxWidth: '1600px' }}>
      <div className="nn-header-area flex justify-between items-center flex-wrap gap-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="nn-title">NONSTOP Organizasyon Yönetimi</h1>
          <span className="nn-subtitle">Lig ve Maç Planlama Merkezi</span>
        </div>
        <div className="flex gap-4" style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/mini-admin" className="nn-link" style={{ fontSize: '1rem' }}>Mini Admin</Link>
          <Link href="/standings" className="nn-link" style={{ fontSize: '1rem' }}>Puan Durumu</Link>
          <Link href="/dashboard" className="nn-link" style={{ fontSize: '1rem' }}>Dashboard</Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Main Content Area */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <section id="create-competition" className="nn-card">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff' }}>🏆 Lig / Turnuva / Özel Maç Oluştur</h2>
            <p style={{ color: 'var(--nn-text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>Her il kendi bazında çalışır. A ve B ligleri birbirinden bağımsızdır. İsim değişse bile kayıtlar ID ile bağlı kalır.</p>
            {competitionsRes.error ? <p style={{ color: '#ef4444' }}>Supabase hata: {competitionsRes.error.message}</p> : null}
            <form action={createCompetition} style={formGrid}>
              <div className="nn-form-group">
                <label className="nn-form-label">İl</label>
                <select name="city_id" required className="nn-select">
                  <option value="">Seç</option>
                  {cities.map((row) => <option key={row.id} value={row.id}>{optionLabel(row, 'İl')}</option>)}
                </select>
              </div>
              <div className="nn-form-group">
                <label className="nn-form-label">Sezon</label>
                <select name="season_id" className="nn-select">
                  <option value="">Seçmeden geç</option>
                  {seasons.map((row) => <option key={row.id} value={row.id}>{optionLabel(row, 'Sezon')}</option>)}
                </select>
              </div>
              <div className="nn-form-group">
                <label className="nn-form-label">Kategori</label>
                <select name="category_id" className="nn-select">
                  <option value="">Seçmeden geç</option>
                  {categories.map((row) => <option key={row.id} value={row.id}>{categoryLabel(row)}</option>)}
                </select>
              </div>
              <div className="nn-form-group">
                <label className="nn-form-label">Tip</label>
                <select name="competition_type" className="nn-select" defaultValue="LEAGUE">
                  <option value="LEAGUE">Lig</option>
                  <option value="SEASON">Sezon</option>
                  <option value="TOURNAMENT">Turnuva</option>
                  <option value="FRIENDLY">Hazırlık Maçı</option>
                  <option value="SPECIAL_MATCH">Özel Maç</option>
                </select>
              </div>
              <div className="nn-form-group">
                <label className="nn-form-label">A/B Grubu</label>
                <select name="league_level" className="nn-select" defaultValue="NONE">
                  <option value="NONE">Yok</option>
                  <option value="A">A Ligi</option>
                  <option value="B">B Ligi</option>
                </select>
              </div>
              <div className="nn-form-group">
                <label className="nn-form-label">Organizasyon Adı</label>
                <input name="name" required placeholder="Bursa U16 A Ligi" className="nn-input" />
              </div>
              <button className="nn-button nn-button-primary" type="submit">Oluştur</button>
            </form>
          </section>

          <section id="update-competition" className="nn-card">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff' }}>✏️ Organizasyon Adı / Durum Değiştir</h2>
            <form action={updateCompetition} style={formGrid}>
              <div className="nn-form-group">
                <label className="nn-form-label">Organizasyon</label>
                <select name="competition_id" required className="nn-select">
                  <option value="">Seç</option>
                  {rows.map((row) => <option key={row.id} value={row.id}>{row.competition_name} / {row.city_name} / {row.league_level}</option>)}
                </select>
              </div>
              <div className="nn-form-group">
                <label className="nn-form-label">Yeni Ad</label>
                <input name="name" required placeholder="Yeni organizasyon adı" className="nn-input" />
              </div>
              <div className="nn-form-group">
                <label className="nn-form-label">Durum</label>
                <select name="status" className="nn-select" defaultValue="ACTIVE">
                  <option value="ACTIVE">Aktif</option>
                  <option value="COMPLETED">Tamamlandı</option>
                  <option value="CANCELLED">İptal</option>
                  <option value="PASSIVE">Pasif</option>
                </select>
              </div>
              <button className="nn-button nn-button-primary" type="submit">Güncelle</button>
            </form>
          </section>

          <section id="add-team" className="nn-card">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff' }}>👥 Organizasyona Takım Ekle</h2>
            <form action={addTeamToCompetition} style={formGrid}>
              <div className="nn-form-group">
                <label className="nn-form-label">Organizasyon</label>
                <select name="competition_id" required className="nn-select">
                  <option value="">Seç</option>
                  {rows.map((row) => <option key={row.id} value={row.id}>{row.competition_name} / {row.city_name} / {row.league_level}</option>)}
                </select>
              </div>
              <div className="nn-form-group">
                <label className="nn-form-label">Takım</label>
                <select name="team_id" required className="nn-select">
                  <option value="">Seç</option>
                  {teams.map((row) => <option key={row.id} value={row.id}>{optionLabel(row, 'Takım')}</option>)}
                </select>
              </div>
              <div className="nn-form-group">
                <label className="nn-form-label">Kulüp</label>
                <select name="club_id" className="nn-select">
                  <option value="">Seçmeden geç</option>
                  {clubs.map((row) => <option key={row.id} value={row.id}>{optionLabel(row, 'Kulüp')}</option>)}
                </select>
              </div>
              <button className="nn-button nn-button-success" type="submit">Takım Ekle</button>
            </form>
          </section>

          <section id="create-match" className="nn-card">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff' }}>📅 Resmi / Turnuva Maçı Oluştur</h2>
            <p style={{ color: 'var(--nn-text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>Buradan oluşturulan maçlar aynı gün ve salonda operatör ekranına otomatik düşer. Resmi ve turnuva maçları 12 kişilik kadro kullanır.</p>
            {matchesRes.error ? <p style={{ color: '#ef4444' }}>Maç listesi hata: {matchesRes.error.message}</p> : null}
            <form action={createOfficialMatch} style={formGrid}>
              <div className="nn-form-group">
                <label className="nn-form-label">Organizasyon</label>
                <select name="competition_id" required className="nn-select">
                  <option value="">Seç</option>
                  {officialCompetitions.map((row) => <option key={row.id} value={row.id}>{row.competition_name} / {row.city_name} / {row.league_level}</option>)}
                </select>
              </div>
              <div className="nn-form-group">
                <label className="nn-form-label">Salon</label>
                <select name="venue_id" required className="nn-select">
                  <option value="">Seç</option>
                  {venues.map((row) => <option key={row.id} value={row.id}>{optionLabel(row, 'Salon')}</option>)}
                </select>
              </div>
              <div className="nn-form-group">
                <label className="nn-form-label">Tarih</label>
                <input name="match_date" required type="date" className="nn-input" />
              </div>
              <div className="nn-form-group">
                <label className="nn-form-label">Saat</label>
                <input name="match_time" required type="time" className="nn-input" />
              </div>
              <div className="nn-form-group">
                <label className="nn-form-label">Ev Sahibi</label>
                <select name="home_team_id" required className="nn-select">
                  <option value="">Seç</option>
                  {teams.map((row) => <option key={row.id} value={row.id}>{optionLabel(row, 'Takım')}</option>)}
                </select>
              </div>
              <div className="nn-form-group">
                <label className="nn-form-label">Misafir</label>
                <select name="away_team_id" required className="nn-select">
                  <option value="">Seç</option>
                  {teams.map((row) => <option key={row.id} value={row.id}>{optionLabel(row, 'Takım')}</option>)}
                </select>
              </div>
              <button className="nn-button" style={{ background: '#7c3aed', borderColor: '#6d28d9', color: 'white' }} type="submit">Maçı Oluştur</button>
            </form>
          </section>

          <section id="list-competitions" className="nn-card">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff' }}>📋 Organizasyon Listesi</h2>
            {!competitionsRes.error && rows.length === 0 ? <p style={{ color: 'var(--nn-text-muted)' }}>Henüz organizasyon kaydı yok.</p> : null}
            <div className="nn-table-wrapper">
              <table className="nn-table">
                <thead>
                  <tr>
                    <th>İl</th><th>Sezon</th><th>Kategori</th><th>Organizasyon</th><th>Tip</th><th>Lig</th><th>Takım</th><th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.city_name || '-'}</td>
                      <td>{row.season_name || '-'}</td>
                      <td>{row.category_name || '-'} {row.gender ? `/${row.gender}` : ''}</td>
                      <td><b style={{ color: 'var(--nn-cyan)' }}>{row.competition_name || '-'}</b></td>
                      <td>{typeLabel(row.competition_type)}</td>
                      <td>{row.league_level || 'NONE'}</td>
                      <td>{row.team_count ?? 0}</td>
                      <td>
                        <span style={{ 
                          color: row.status === 'ACTIVE' ? '#22c55e' : 'var(--nn-text-muted)',
                          background: row.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                          padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem'
                        }}>
                          {row.status || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="matches" className="nn-card">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff' }}>🕒 Oluşturulan Maçlar</h2>
            <p style={{ color: 'var(--nn-text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>Bu listedeki maçlar operatör ekranında İl → Salon → Bugünkü Maçlar akışında görünür.</p>
            <div className="nn-table-wrapper">
              <table className="nn-table">
                <thead>
                  <tr><th>Tarih</th><th>Saat</th><th>İl</th><th>Salon</th><th>Organizasyon</th><th>Maç</th><th>Tip</th><th>Durum</th></tr>
                </thead>
                <tbody>
                  {matchRows.map((row) => (
                    <tr key={row.match_id}>
                      <td>{row.match_date || '-'}</td>
                      <td>{row.match_time || '-'}</td>
                      <td>{row.city_name || '-'}</td>
                      <td>{row.venue_name || '-'}</td>
                      <td>{row.competition_name || '-'}</td>
                      <td><b style={{ color: '#fff' }}>{row.home_team_name || '-'} <span style={{ color: 'var(--nn-orange)' }}>-</span> {row.away_team_name || '-'}</b></td>
                      <td>{typeLabel(row.competition_type)}</td>
                      <td>{row.status || '-'}</td>
                    </tr>
                  ))}
                  {matchRows.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--nn-text-muted)' }}>Henüz maç oluşturulmadı.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>

          <section id="teams" className="nn-card">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff' }}>🏀 Eklenen Takımlar</h2>
            <div className="nn-table-wrapper">
              <table className="nn-table">
                <thead>
                  <tr><th>Organizasyon</th><th>İl</th><th>Kategori</th><th>Takım</th><th>Kulüp</th><th>Lig</th><th>İşlem</th></tr>
                </thead>
                <tbody>
                  {compTeams.map((row) => (
                    <tr key={row.id}>
                      <td>{row.competition_name || '-'}</td>
                      <td>{row.city_name || '-'}</td>
                      <td>{row.category_name || '-'}</td>
                      <td><b style={{ color: '#fff' }}>{row.team_name || '-'}</b></td>
                      <td>{row.club_name || '-'}</td>
                      <td>{row.league_level || 'NONE'}</td>
                      <td>
                        <form action={removeTeamFromCompetition}>
                          <input type="hidden" name="competition_team_id" value={row.id} />
                          <button className="nn-button nn-button-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} type="submit">Pasifleştir</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {compTeams.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--nn-text-muted)' }}>Henüz takım eklenmedi.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>

        </div>

        {/* Right Sticky Sidebar */}
        <aside style={{ width: '320px', flexShrink: '0', position: 'sticky', top: '2rem' }}>
          <div className="nn-card">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--nn-border)', paddingBottom: '0.5rem' }}>Hızlı Menü</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link href="#create-competition" className="nn-button" style={{ textAlign: 'left', background: 'transparent' }}>🏆 Lig Oluştur</Link>
              <Link href="#update-competition" className="nn-button" style={{ textAlign: 'left', background: 'transparent' }}>✏️ Durum Değiştir</Link>
              <Link href="#add-team" className="nn-button" style={{ textAlign: 'left', background: 'transparent' }}>👥 Takım Ekle</Link>
              <Link href="#create-match" className="nn-button" style={{ textAlign: 'left', background: 'transparent' }}>📅 Maç Oluştur</Link>
              <Link href="#list-competitions" className="nn-button" style={{ textAlign: 'left', background: 'transparent' }}>📋 Lig Listesi</Link>
              <Link href="#matches" className="nn-button" style={{ textAlign: 'left', background: 'transparent' }}>🕒 Oluşturulan Maçlar</Link>
              <Link href="#teams" className="nn-button" style={{ textAlign: 'left', background: 'transparent' }}>🏀 Eklenen Takımlar</Link>
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}

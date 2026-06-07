import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type OptionRow = { id: number; name?: string | null };
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

  await supabase.from('competition_teams').upsert({
    competition_id,
    team_id,
    club_id,
    city_id: competition?.city_id || null,
    season_id: competition?.season_id || null,
    category_id: competition?.category_id || null,
    league_level: competition?.league_level || 'NONE',
    is_active: true,
  }, { onConflict: 'competition_id,team_id' });
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

function optionLabel(row: OptionRow, fallback: string) {
  return row.name || `${fallback} #${row.id}`;
}

export default async function CompetitionsPage() {
  if (!hasSupabaseAdminConfig()) {
    return (
      <main className="dashboard">
        <div className="topbar"><b>NONSTOP Organizasyonlar</b><Link href="/dashboard">Dashboard</Link></div>
        <div className="card">Supabase bağlantı ayarları eksik.</div>
      </main>
    );
  }

  const supabase = getSupabaseAdmin();
  const [competitionsRes, citiesRes, seasonsRes, categoriesRes, teamsRes, clubsRes, compTeamsRes] = await Promise.all([
    supabase.from('live_competitions').select('*').order('city_name', { ascending: true }).order('category_name', { ascending: true }).order('competition_name', { ascending: true }),
    supabase.from('cities').select('id,name').order('name', { ascending: true }),
    supabase.from('seasons').select('id,name').order('name', { ascending: false }),
    supabase.from('categories').select('id,name').order('name', { ascending: true }),
    supabase.from('teams').select('id,name').order('name', { ascending: true }),
    supabase.from('clubs').select('id,name').order('name', { ascending: true }),
    supabase.from('competition_teams').select('id, competition_id, is_active, league_level, competitions(name), teams(name), clubs(name), cities(name), categories(name)').eq('is_active', true).order('id', { ascending: false }).limit(100),
  ]);

  const rows = (competitionsRes.data || []) as CompetitionRow[];
  const cities = (citiesRes.data || []) as OptionRow[];
  const seasons = (seasonsRes.data || []) as OptionRow[];
  const categories = (categoriesRes.data || []) as OptionRow[];
  const teams = (teamsRes.data || []) as OptionRow[];
  const clubs = (clubsRes.data || []) as OptionRow[];
  const rawCompTeams = (compTeamsRes.data || []) as any[];
  const compTeams: CompetitionTeamRow[] = rawCompTeams.map((item) => ({
    id: item.id,
    competition_id: item.competition_id,
    competition_name: item.competitions?.name || null,
    city_name: item.cities?.name || null,
    category_name: item.categories?.name || null,
    team_name: item.teams?.name || null,
    club_name: item.clubs?.name || null,
    league_level: item.league_level || null,
    is_active: item.is_active,
  }));

  const formGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'end' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 10 };
  const buttonStyle: React.CSSProperties = { padding: '11px 14px', borderRadius: 10, border: 0, fontWeight: 800, cursor: 'pointer' };

  return (
    <main className="dashboard">
      <div className="topbar">
        <b>NONSTOP Organizasyon Yönetimi</b>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/standings">Puan Durumu</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </div>

      <section className="card">
        <h1>Lig / Turnuva / Özel Maç Oluştur</h1>
        <p style={{ marginTop: 6 }}>Her il kendi bazında çalışır. A ve B ligleri birbirinden bağımsızdır. İsim değişse bile kayıtlar ID ile bağlı kalır.</p>
        {competitionsRes.error ? <p style={{ color: '#b91c1c' }}>Supabase hata: {competitionsRes.error.message}</p> : null}
        <form action={createCompetition} style={{ ...formGrid, marginTop: 16 }}>
          <label>İl
            <select name="city_id" required style={inputStyle}>
              <option value="">Seç</option>
              {cities.map((row) => <option key={row.id} value={row.id}>{optionLabel(row, 'İl')}</option>)}
            </select>
          </label>
          <label>Sezon
            <select name="season_id" style={inputStyle}>
              <option value="">Seçmeden geç</option>
              {seasons.map((row) => <option key={row.id} value={row.id}>{optionLabel(row, 'Sezon')}</option>)}
            </select>
          </label>
          <label>Kategori
            <select name="category_id" style={inputStyle}>
              <option value="">Seçmeden geç</option>
              {categories.map((row) => <option key={row.id} value={row.id}>{optionLabel(row, 'Kategori')}</option>)}
            </select>
          </label>
          <label>Tip
            <select name="competition_type" style={inputStyle} defaultValue="LEAGUE">
              <option value="LEAGUE">Lig</option>
              <option value="SEASON">Sezon</option>
              <option value="TOURNAMENT">Turnuva</option>
              <option value="FRIENDLY">Hazırlık Maçı</option>
              <option value="SPECIAL_MATCH">Özel Maç</option>
            </select>
          </label>
          <label>A/B
            <select name="league_level" style={inputStyle} defaultValue="NONE">
              <option value="NONE">Yok</option>
              <option value="A">A Ligi</option>
              <option value="B">B Ligi</option>
            </select>
          </label>
          <label>Organizasyon Adı
            <input name="name" required placeholder="Bursa U16 A Ligi" style={inputStyle} />
          </label>
          <button style={{ ...buttonStyle, background: '#111827', color: 'white' }} type="submit">Oluştur</button>
        </form>
      </section>

      <section className="card">
        <h2>Organizasyon Adı / Durum Değiştir</h2>
        <form action={updateCompetition} style={{ ...formGrid, marginTop: 16 }}>
          <label>Organizasyon
            <select name="competition_id" required style={inputStyle}>
              <option value="">Seç</option>
              {rows.map((row) => <option key={row.id} value={row.id}>{row.competition_name} / {row.city_name} / {row.league_level}</option>)}
            </select>
          </label>
          <label>Yeni Ad
            <input name="name" required placeholder="Yeni organizasyon adı" style={inputStyle} />
          </label>
          <label>Durum
            <select name="status" style={inputStyle} defaultValue="ACTIVE">
              <option value="ACTIVE">Aktif</option>
              <option value="COMPLETED">Tamamlandı</option>
              <option value="CANCELLED">İptal</option>
              <option value="PASSIVE">Pasif</option>
            </select>
          </label>
          <button style={{ ...buttonStyle, background: '#2563eb', color: 'white' }} type="submit">Güncelle</button>
        </form>
      </section>

      <section className="card">
        <h2>Organizasyona Takım Ekle</h2>
        <form action={addTeamToCompetition} style={{ ...formGrid, marginTop: 16 }}>
          <label>Organizasyon
            <select name="competition_id" required style={inputStyle}>
              <option value="">Seç</option>
              {rows.map((row) => <option key={row.id} value={row.id}>{row.competition_name} / {row.city_name} / {row.league_level}</option>)}
            </select>
          </label>
          <label>Takım
            <select name="team_id" required style={inputStyle}>
              <option value="">Seç</option>
              {teams.map((row) => <option key={row.id} value={row.id}>{optionLabel(row, 'Takım')}</option>)}
            </select>
          </label>
          <label>Kulüp
            <select name="club_id" style={inputStyle}>
              <option value="">Seçmeden geç</option>
              {clubs.map((row) => <option key={row.id} value={row.id}>{optionLabel(row, 'Kulüp')}</option>)}
            </select>
          </label>
          <button style={{ ...buttonStyle, background: '#16a34a', color: 'white' }} type="submit">Takım Ekle</button>
        </form>
      </section>

      <section className="card">
        <h2>Organizasyon Listesi</h2>
        {!competitionsRes.error && rows.length === 0 ? <p>Henüz organizasyon kaydı yok.</p> : null}
        <div className="stats-table-wrap">
          <table className="stats-table">
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
                  <td><b>{row.competition_name || '-'}</b></td>
                  <td>{typeLabel(row.competition_type)}</td>
                  <td>{row.league_level || 'NONE'}</td>
                  <td>{row.team_count ?? 0}</td>
                  <td>{row.status || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Eklenen Takımlar</h2>
        <div className="stats-table-wrap">
          <table className="stats-table">
            <thead>
              <tr><th>Organizasyon</th><th>İl</th><th>Kategori</th><th>Takım</th><th>Kulüp</th><th>Lig</th><th>İşlem</th></tr>
            </thead>
            <tbody>
              {compTeams.map((row) => (
                <tr key={row.id}>
                  <td>{row.competition_name || '-'}</td>
                  <td>{row.city_name || '-'}</td>
                  <td>{row.category_name || '-'}</td>
                  <td><b>{row.team_name || '-'}</b></td>
                  <td>{row.club_name || '-'}</td>
                  <td>{row.league_level || 'NONE'}</td>
                  <td>
                    <form action={removeTeamFromCompetition}>
                      <input type="hidden" name="competition_team_id" value={row.id} />
                      <button style={{ ...buttonStyle, background: '#fee2e2', color: '#991b1b', padding: '7px 10px' }} type="submit">Pasifleştir</button>
                    </form>
                  </td>
                </tr>
              ))}
              {compTeams.length === 0 ? <tr><td colSpan={7}>Henüz takım eklenmedi.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type CareerRow = {
  section_code: string;
  section_name: string;
  team_id: number;
  team_name: string | null;
  games_played: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fg_pct: number;
  tp_pct: number;
  ft_pct: number;
  ppg: number;
  rpg: number;
  apg: number;
};

const tabs = [
  { code: 'RESMI', label: 'Resmi Maçlar' },
  { code: 'OZEL_HAZIRLIK', label: 'Özel / Hazırlık' },
  { code: 'TURNUVA', label: 'Turnuvalar' },
  { code: 'TOPLAM', label: 'Toplam' }
];

export default function TeamCareersPage() {
  const [rows, setRows] = useState<CareerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('RESMI');
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      const { data, error } = await supabase
        .from('team_career_sections')
        .select('*')
        .order('team_name', { ascending: true });

      if (error) setError(error.message);
      setRows((data || []) as CareerRow[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => row.section_code === activeTab && (!q || (row.team_name || '').toLowerCase().includes(q)));
  }, [rows, activeTab, query]);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="space-y-2">
          <p className="text-sm text-emerald-300 font-semibold">NONSTOP V2.1.22AE-1</p>
          <h1 className="text-3xl font-bold">Takım Kariyer Kartları</h1>
          <p className="text-slate-300">Takımın resmi, özel/hazırlık ve turnuva istatistikleri ayrı takip edilir.</p>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.code}
                onClick={() => setActiveTab(tab.code)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold ${activeTab === tab.code ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-200'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Takım ara..."
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-emerald-400"
          />
        </div>

        {loading && <div className="bg-slate-900 rounded-2xl p-6">Yükleniyor...</div>}
        {error && <div className="bg-red-950 border border-red-800 rounded-2xl p-6">Supabase hata: {error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-300">
            Bu sekmede henüz veri yok. Takım istatistikleri girildikçe otomatik dolacak.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((row) => (
            <section key={`${row.section_code}-${row.team_id}`} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div>
                <h2 className="text-xl font-bold">{row.team_name || `Takım #${row.team_id}`}</h2>
                <p className="text-slate-400">{row.section_name}</p>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <Stat label="Maç" value={row.games_played} />
                <Stat label="PPG" value={row.ppg} />
                <Stat label="RPG" value={row.rpg} />
                <Stat label="APG" value={row.apg} />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Sayı" value={row.points} />
                <Stat label="Rib" value={row.rebounds} />
                <Stat label="Ast" value={row.assists} />
                <Stat label="Top Ç." value={row.steals} />
                <Stat label="Blok" value={row.blocks} />
                <Stat label="TK" value={row.turnovers} />
                <Stat label="FG%" value={row.fg_pct} />
                <Stat label="3P%" value={row.tp_pct} />
                <Stat label="FT%" value={row.ft_pct} />
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
      <div className="text-lg font-bold">{value ?? 0}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}

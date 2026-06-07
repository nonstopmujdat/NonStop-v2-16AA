import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main className="dashboard">
      <div className="topbar">
        <b>NONSTOP Dashboard</b>
        <Link href="/operator">Operatör Ekranına Git</Link>
      </div>

      <div className="grid four">
        <div className="card"><span>Bugünkü Maç</span><b>14</b></div>
        <div className="card"><span>Canlı Maç</span><b>3</b></div>
        <div className="card"><span>Oyuncu</span><b>5.821</b></div>
        <div className="card"><span>PDF Rapor</span><b>27</b></div>
      </div>

      <br />

      <div className="grid two">
        <div className="card">
          <h3>Bugünkü Maçlar</h3>
          <p><b>TOFAŞ U14</b> - Gemlik U14 / 18:00</p>
          <p><b>Bursaspor U16</b> - Final Spor U16 / 20:00</p>
        </div>
        <div className="card">
          <h3>Bekleyen İşler</h3>
          <p>📥 Oyuncu talepleri</p>
          <p>🔄 Transfer talepleri</p>
          <p>📄 KVKK eksikleri</p>
        </div>
      </div>
    </main>
  );
}

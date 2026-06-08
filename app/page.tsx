import Link from 'next/link';

export default function Home() {
  return (
    <main className="dashboard">
      <div className="topbar">
        <b>NONSTOP Basketbol ve Lig Yönetimi</b>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/mini-admin">Mini Admin</Link>
          <Link href="/operator">Maç Merkezi</Link>
          <Link href="/live">Canlı Skor</Link>
        </div>
      </div>

      <section className="card">
        <h1>NONSTOP Ana Sayfa</h1>
        <p style={{ marginTop: 8 }}>
          Bu sürümde ana sayfa artık doğrudan operatör akışına gitmez. Önce yönetim menüsü açılır.
        </p>
      </section>

      <section className="grid two" style={{ marginTop: 18 }}>
        <Link className="card menu-card" href="/mini-admin">
          <h2>Mini Admin</h2>
          <p>Lig, turnuva, organizasyona takım ekleme ve resmi maç oluşturma menüsü.</p>
          <b>Aç</b>
        </Link>
        <Link className="card menu-card" href="/operator">
          <h2>Maç Merkezi / Operatör Akışı</h2>
          <p>İl seç, salon seç, resmi maçlar ve supervisor özel/hazırlık maçı akışı.</p>
          <b>Aç</b>
        </Link>
        <Link className="card menu-card" href="/competitions">
          <h2>Organizasyon Yönetimi</h2>
          <p>Lig/turnuva oluştur, takımları organizasyona ekle, resmi maç oluştur.</p>
          <b>Aç</b>
        </Link>
        <Link className="card menu-card" href="/dashboard">
          <h2>Dashboard</h2>
          <p>Genel istatistik ve sistem bağlantıları.</p>
          <b>Aç</b>
        </Link>
      </section>
    </main>
  );
}

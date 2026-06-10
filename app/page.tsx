import Link from 'next/link';

export default function Home() {
  return (
    <main className="nn-container" style={{ maxWidth: '1400px' }}>
      
      {/* Hero Section */}
      <section style={{ 
        marginTop: '2rem',
        marginBottom: '4rem',
        padding: '5rem 2rem', 
        background: 'radial-gradient(ellipse at top, rgba(0, 240, 255, 0.1) 0%, transparent 70%)',
        borderRadius: '24px',
        border: '1px solid rgba(0, 240, 255, 0.2)',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5), inset 0 0 40px rgba(0, 240, 255, 0.05)'
      }}>
        <h1 className="nn-title" style={{ fontSize: '5.5rem', marginBottom: '1rem', textShadow: '0 0 20px rgba(0, 240, 255, 0.5)' }}>
          <span style={{ color: 'var(--nn-cyan)' }}>NON</span>STOP V2.1
        </h1>
        <p className="nn-subtitle" style={{ fontSize: '1.25rem', letterSpacing: '0.2em', color: '#fff' }}>
          Yeni Nesil Basketbol Lig & Maç Yönetim Sistemi
        </p>
        <p style={{ maxWidth: '650px', margin: '1.5rem auto', color: 'var(--nn-text-muted)', lineHeight: '1.6', fontSize: '1.1rem' }}>
          Tüm organizasyonları tek bir ekrandan yönetin. Operatörlere maç atayın, takımları ve oyuncuları düzenleyin, canlı maç içi istatistikleri ve şut haritalarını anlık kaydedin.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2.5rem' }}>
          <Link href="/operator" className="nn-button nn-button-primary" style={{ padding: '14px 36px', fontSize: '1.1rem', borderRadius: '50px' }}>
            🏀 Maç Merkezine Git
          </Link>
          <Link href="/dashboard" className="nn-button" style={{ padding: '14px 36px', fontSize: '1.1rem', borderRadius: '50px', background: 'transparent' }}>
            📊 Sistem Durumu
          </Link>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', letterSpacing: '0.05em', color: '#fff', margin: 0 }}>
          Ana Modüller
        </h2>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)' }}></div>
      </div>
      
      <section className="nn-grid nn-grid-cols-4" style={{ marginBottom: '4rem', alignItems: 'stretch' }}>
        
        <Link href="/mini-admin" className="nn-card" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', textShadow: '0 0 20px rgba(0,240,255,0.5)' }}>⚡</div>
          <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '0.5rem', fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>Mini Admin</h2>
          <p style={{ color: 'var(--nn-text-muted)', fontSize: '0.95rem', lineHeight: '1.6', flex: 1 }}>
            Takımlar, oyuncular ve operatörler eklenebilir. Organizasyonların genel yapılandırmaları ve sistem yetkileri bu merkezden ayarlanır.
          </p>
          <div style={{ marginTop: '1.5rem', color: 'var(--nn-cyan)', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Modülü Aç &rarr;</div>
        </Link>

        <Link href="/operator" className="nn-card" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', borderColor: 'var(--nn-orange)', boxShadow: '0 0 20px rgba(255, 87, 34, 0.15)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', textShadow: '0 0 20px rgba(255,87,34,0.5)' }}>🏀</div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--nn-orange)', marginBottom: '0.5rem', fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>Maç Merkezi</h2>
          <p style={{ color: 'var(--nn-text-muted)', fontSize: '0.95rem', lineHeight: '1.6', flex: 1 }}>
            Maç anında sahada görev yapan operatörlerin kullandığı ekran. Şut atışları, fauller, zaman durdurma ve canlı veri girişi.
          </p>
          <div style={{ marginTop: '1.5rem', color: 'var(--nn-orange)', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Modülü Aç &rarr;</div>
        </Link>

        <Link href="/competitions" className="nn-card" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', textShadow: '0 0 20px rgba(0,240,255,0.5)' }}>🏆</div>
          <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '0.5rem', fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>Organizasyon</h2>
          <p style={{ color: 'var(--nn-text-muted)', fontSize: '0.95rem', lineHeight: '1.6', flex: 1 }}>
            Yeni ligler ve turnuvalar oluşturun. Oluşturduğunuz organizasyonlara takım atayın ve fikstür üzerinden resmi maçları planlayın.
          </p>
          <div style={{ marginTop: '1.5rem', color: 'var(--nn-cyan)', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Modülü Aç &rarr;</div>
        </Link>

        <Link href="/dashboard" className="nn-card" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', textShadow: '0 0 20px rgba(0,240,255,0.5)' }}>📊</div>
          <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '0.5rem', fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>Dashboard</h2>
          <p style={{ color: 'var(--nn-text-muted)', fontSize: '0.95rem', lineHeight: '1.6', flex: 1 }}>
            Tüm sistemin kuşbakışı istatistikleri. Kayıtlı takımlar, bekleyen maçlar ve gerçekleşen operasyonların güncel analizi.
          </p>
          <div style={{ marginTop: '1.5rem', color: 'var(--nn-cyan)', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Modülü Aç &rarr;</div>
        </Link>

      </section>

    </main>
  );
}

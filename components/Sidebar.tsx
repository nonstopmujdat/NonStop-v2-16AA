"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { name: 'Ana Sayfa', path: '/', icon: '🏠' },
    { name: 'Mini Admin', path: '/mini-admin', icon: '⚡' },
    { name: 'Maç Merkezi', path: '/operator', icon: '🏀' },
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Organizasyon', path: '/competitions', icon: '🏆' },
    { name: 'Canlı Skor', path: '/live', icon: '🔴' }
  ];

  const competitionSubLinks = [
    { name: 'Lig / Turnuva Oluştur', hash: '#create-competition' },
    { name: 'Ad / Durum Değiştir', hash: '#update-competition' },
    { name: 'Takım Ekle', hash: '#add-team' },
    { name: 'Maç Oluştur', hash: '#create-match' },
    { name: 'Organizasyon Listesi', hash: '#list-competitions' },
    { name: 'Oluşturulan Maçlar', hash: '#matches' },
    { name: 'Eklenen Takımlar', hash: '#teams' },
  ];

  if (!mounted) return null;

  const isCompetitions = pathname === '/competitions';

  return (
    <aside className="nn-sidebar">
      <div className="nn-sidebar-logo">
        <span className="text-cyan">NON</span>STOP
      </div>
      <nav className="nn-sidebar-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path));
          return (
            <div key={item.path} style={{ display: 'flex', flexDirection: 'column' }}>
              <Link 
                href={item.path} 
                className={`nn-sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="icon">{item.icon}</span>
                <span className="text">{item.name}</span>
              </Link>
              
              {isActive && item.path === '/competitions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '2.5rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                  {competitionSubLinks.map((sub, idx) => (
                    <Link key={idx} href={`/competitions${sub.hash}`} style={{
                      fontSize: '0.85rem',
                      color: 'var(--nn-text-muted)',
                      textDecoration: 'none',
                      padding: '4px 0',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--nn-text-muted)')}
                    >
                      • {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      
      <div className="nn-sidebar-footer">
        <div className="version-badge">V2.1.25C</div>
      </div>
    </aside>
  );
}

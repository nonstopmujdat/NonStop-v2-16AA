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

  if (!mounted) return null;

  return (
    <aside className="nn-sidebar">
      <div className="nn-sidebar-logo">
        <span className="text-cyan">NON</span>STOP
      </div>
      <nav className="nn-sidebar-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              href={item.path} 
              className={`nn-sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="icon">{item.icon}</span>
              <span className="text">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="nn-sidebar-footer">
        <div className="version-badge">V2.1.25C</div>
      </div>
    </aside>
  );
}

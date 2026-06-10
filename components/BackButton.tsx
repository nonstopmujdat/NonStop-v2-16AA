"use client";

import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();
  
  return (
    <button 
      onClick={() => router.back()}
      className="nn-button"
      style={{
        position: 'fixed',
        top: '1rem',
        left: '1rem',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'var(--nn-surface-glass)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--nn-border)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
      }}
    >
      <span>&larr;</span> Geri Dön
    </button>
  );
}

import React from 'react';
import { CheckCircle } from 'lucide-react';

// Visual Helper: Progress Bar
export const Bar = ({ v, c, h = 6 }: { v: number; c?: string; h?: number }) => (
  <div style={{ width: '100%', height: h, background: '#e5e7eb', borderRadius: h, overflow: 'hidden' }}>
    <div style={{ width: `${Math.min(v, 100)}%`, height: '100%', background: c, borderRadius: h, transition: 'width 0.5s' }} />
  </div>
);

// Visual Helper: Loading Ring
export const Ring = ({ v, sz = 70 }: { v: number; sz?: number }) => {
  const r = (sz - 8) / 2;
  const c = r * 2 * Math.PI;
  const off = c - (v / 100) * c;
  return (
    <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={8} />
      <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="#0ea5e9" strokeWidth={8} strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
    </svg>
  );
};

// Visual Helper: Check Row (Health Check)
export const CheckRow = ({ label, done, icon: Icon }: { label: string, done: boolean, icon: any }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 8, marginBottom: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Icon size={18} style={{ color: done ? '#16a34a' : '#94a3b8' }} />
      <span style={{ fontSize: 14, fontWeight: 500, color: done ? '#0f172a' : '#64748b' }}>{label}</span>
    </div>
    {done ? 
      <CheckCircle size={18} style={{ color: '#16a34a' }} className="animate-in zoom-in" /> : 
      <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #cbd5e1', borderTopColor: '#3b82f6' }} className="animate-spin" />
    }
  </div>
);

// Helper Colors & Labels
export const clr = (v: number, m?: number) => {
  const p = (v / (m || 100)) * 100;
  if (p >= 80) return '#10b981';
  if (p >= 60) return '#f59e0b';
  if (p >= 40) return '#f97316';
  return '#ef4444';
};

export const lbl = (v: number) => {
  if (v >= 80) return 'Sangat Baik';
  if (v >= 60) return 'Baik';
  if (v >= 40) return 'Cukup';
  return 'Perlu Perbaikan';
};
import React from 'react';
import { Ring } from './SharedUI';

// Definisi tipe data props
type Stage = {
  id: string;
  name: string;
  w: number;
};

type Log = {
  ts: string;
  type: string;
  msg: string;
};

type Props = {
  progress: number;
  stage: string | null;
  stages: Stage[];
  logs: Log[];
};

export default function AnalysisProgress({ progress, stage, stages, logs }: Props) {
  // Cari index stage saat ini untuk pewarnaan progress bar
  const currentStageIndex = stages.findIndex(s => s.id === stage);

  return (
    <div className="animate-in fade-in zoom-in duration-300" style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      
      {/* 1. Header & Circular Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div style={{ position: 'relative' }}>
          <Ring v={progress} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#0ea5e9' }}>
            {Math.round(progress)}%
          </div>
        </div>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: 16, margin: 0, color: '#0f172a' }}>
            {stage ? stages.find(s => s.id === stage)?.name : 'Initializing...'}
          </h3>
          <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>
            AI sedang menganalisis website Anda...
          </p>
        </div>
      </div>

      {/* 2. Segmented Progress Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {stages.map((s, i) => {
          // Logic warna: Hijau (selesai), Biru (sedang jalan), Abu (belum)
          const isPast = i < currentStageIndex;
          const isActive = i === currentStageIndex;
          const bg = isPast ? '#10b981' : isActive ? '#0ea5e9' : '#e5e7eb';
          
          return (
            <div 
              key={s.id} 
              title={s.name}
              style={{ flex: s.w, height: 4, borderRadius: 2, background: bg, transition: 'background 0.5s ease' }} 
            />
          );
        })}
      </div>

      {/* 3. Live Logs Console */}
      <div style={{ maxHeight: 200, overflowY: 'auto', background: '#0f172a', borderRadius: 8, padding: 12, fontFamily: 'monospace', border: '1px solid #1e293b' }}>
        {logs.length === 0 && (
          <div style={{ color: '#64748b', fontSize: 11, fontStyle: 'italic' }}>Menunggu proses dimulai...</div>
        )}
        {logs.map((l, i) => (
          <div key={i} style={{ fontSize: 11, marginBottom: 4, display: 'flex', lineHeight: '1.4' }}>
            <span style={{ color: '#475569', marginRight: 8, flexShrink: 0, minWidth: 60 }}>[{l.ts}]</span>
            <span style={{ 
              color: l.type === 'error' ? '#f87171' : 
                     l.type === 'success' ? '#4ade80' : 
                     l.type === 'warning' ? '#fbbf24' : '#94a3b8',
              wordBreak: 'break-word'
            }}>
              {l.type === 'info' && '> '}
              {l.msg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
import React from 'react';
import { History, XCircle } from 'lucide-react';
import { AnalysisSession } from '@/lib/supabase';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  history: AnalysisSession[];
  onLoad: (session: AnalysisSession) => void;
};

export default function HistorySidebar({ isOpen, onClose, history, onLoad }: Props) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 300, background: '#fff', borderLeft: '1px solid #e2e8f0', zIndex: 40, padding: 20, boxShadow: '-4px 0 15px rgba(0,0,0,0.05)', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={18} /> Riwayat Analisis
        </h3>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><XCircle size={18} color="#94a3b8" /></button>
      </div>
      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 20, color: '#64748b', fontSize: 13 }}>Belum ada riwayat analisis.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map((h: any) => (
            <div key={h.id} onClick={() => onLoad(h)} style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', background: '#f8fafc', transition: 'background 0.2s' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.domain}</div>
              <div style={{ fontSize: 10, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>{new Date(h.created_at).toLocaleDateString()}</span>
                <span style={{ fontWeight: 700, color: h.webqual_score >= 60 ? '#10b981' : '#f59e0b' }}>WQ: {h.webqual_score.toFixed(0)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
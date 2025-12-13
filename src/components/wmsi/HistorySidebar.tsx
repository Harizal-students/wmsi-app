import React from 'react';
import { History, XCircle, ArrowRight } from 'lucide-react';
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
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 300, background: '#fff', borderLeft: '1px solid #e2e8f0', zIndex: 50, padding: 20, boxShadow: '-4px 0 15px rgba(0,0,0,0.05)', overflowY: 'auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <History size={18} /> Riwayat Analisis
        </h3>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
          <XCircle size={18} color="#94a3b8" />
        </button>
      </div>

      {/* Info Box */}
      <div style={{ background: '#f0f9ff', padding: 12, borderRadius: 8, fontSize: 11, color: '#0369a1', marginBottom: 16, border: '1px solid #bae6fd' }}>
        Riwayat ini disimpan untuk meningkatkan akurasi AI di masa depan.
      </div>

      {/* List */}
      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b', fontSize: 13 }}>
          <p>Belum ada riwayat analisis.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map((h: any) => (
            <div 
              key={h.id} 
              onClick={() => onLoad(h)} 
              className="group"
              style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', background: '#f8fafc', transition: 'all 0.2s', position: 'relative' }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#334155' }}>
                {h.domain}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{new Date(h.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                <span style={{ 
                  fontWeight: 700, 
                  color: h.webqual_score >= 80 ? '#10b981' : h.webqual_score >= 60 ? '#f59e0b' : '#ef4444',
                  background: '#fff', padding: '2px 6px', borderRadius: 4, border: '1px solid #e2e8f0'
                }}>
                  WQ: {h.webqual_score.toFixed(0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
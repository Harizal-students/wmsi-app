import React from 'react';
import { Activity, Database, Brain, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { CheckRow } from './SharedUI';

type Props = {
  bootStatus: 'checking' | 'ready' | 'error';
  health: { supabase: boolean; cloudinary: boolean; claude: boolean };
  error: string | null;
  onRetry: () => void;
};

export default function SystemHealth({ bootStatus, health, error, onRetry }: Props) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', maxWidth: 500, margin: '40px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Activity size={48} style={{ color: bootStatus === 'checking' ? '#3b82f6' : '#ef4444', margin: '0 auto 16px' }} className={bootStatus === 'checking' ? "animate-pulse" : ""} />
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          {bootStatus === 'checking' ? 'System Health Check' : 'Connection Error'}
        </h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          {bootStatus === 'checking' ? 'Memeriksa koneksi ke layanan cloud...' : error || 'Gagal terhubung ke layanan.'}
        </p>
      </div>
      <div style={{ marginBottom: 24 }}>
        <CheckRow label="Supabase Database" done={health.supabase} icon={Database} />
        <CheckRow label="Claude AI Engine" done={health.claude} icon={Brain} />
        <CheckRow label="Cloudinary Storage" done={health.cloudinary} icon={ImageIcon} />
      </div>
      {bootStatus === 'error' && (
        <button onClick={onRetry} style={{ width: '100%', padding: 12, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <RefreshCw size={16} /> Retry Connection
        </button>
      )}
    </div>
  );
}
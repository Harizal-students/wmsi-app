import React from 'react';
import { History, User, LogOut, LogIn, Trash2 } from 'lucide-react';

type Props = {
  user: any;
  onLogout: () => void;
  onDeleteAccount: () => void; // Prop baru
  showHistory: boolean;
  setShowHistory: (v: boolean) => void;
  onShowLogin: () => void;
};

export default function Navbar({ user, onLogout, onDeleteAccount, showHistory, setShowHistory, onShowLogin }: Props) {
  return (
    <div style={{ padding: '10px 20px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>WMSI v1.0</div>
      
      {user ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => setShowHistory(!showHistory)} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 12px', background: showHistory ? '#e0f2fe' : 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#0f172a', fontSize: 13, fontWeight: 600 }}>
            <History size={16} /> History
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#f1f5f9', borderRadius: 20 }}>
            <User size={14} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>{user.email}</span>
          </div>

          <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />

          {/* Tombol Logout */}
          <button onClick={onLogout} title="Logout" style={{ padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#64748b' }}>
            <LogOut size={16} />
          </button>

          {/* Tombol Hapus Akun */}
          <button onClick={onDeleteAccount} title="Hapus Akun & Data Pribadi" style={{ padding: 8, background: '#fee2e2', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#ef4444' }}>
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <button onClick={onShowLogin} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          <LogIn size={14} /> Login
        </button>
      )}
    </div>
  );
}
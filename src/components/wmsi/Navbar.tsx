import React from 'react';
import { History, User, LogOut, LogIn } from 'lucide-react';

type Props = {
  user: any;
  onLogout: () => void;
  showHistory: boolean;
  setShowHistory: (v: boolean) => void;
  onShowLogin: () => void;
};

export default function Navbar({ user, onLogout, showHistory, setShowHistory, onShowLogin }: Props) {
  return (
    <div style={{ padding: '10px 20px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
      {user ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => setShowHistory(!showHistory)} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 12px', background: showHistory ? '#e0f2fe' : 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#0f172a', fontSize: 13, fontWeight: 600 }}>
            <History size={16} /> History
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#f1f5f9', borderRadius: 20 }}>
            <User size={14} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>{user.email}</span>
          </div>
          <button onClick={onLogout} style={{ padding: 6, background: '#fee2e2', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#b91c1c' }}>
            <LogOut size={16} />
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
import React, { useState } from 'react';
import { Lock, Mail, ArrowRight } from 'lucide-react';

type Props = {
  onAuth: (email: string, pass: string, mode: 'login' | 'register') => Promise<void>;
  loading: boolean;
  error: string | null;
  setError: (err: string | null) => void;
};

export default function AuthScreen({ onAuth, loading, error, setError }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAuth(email, pass, mode);
  };

  return (
    <div className="animate-in fade-in zoom-in duration-300" style={{ background: '#fff', borderRadius: 16, padding: 40, boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)', maxWidth: 400, margin: '20px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Lock size={24} color="#0f172a" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{mode === 'login' ? 'Selamat Datang' : 'Buat Akun Baru'}</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
          {mode === 'login' ? 'Masuk untuk mengakses tools analisis' : 'Daftar untuk mulai menganalisis website'}
        </p>
      </div>

      {error && (
        <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#334155' }}>Email Address</label>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
            <input 
              type="email" required placeholder="name@company.com"
              value={email} onChange={e => setEmail(e.target.value)} 
              style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none', fontSize: 14 }} 
            />
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#334155' }}>Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
            <input 
              type="password" required minLength={6} placeholder="••••••••"
              value={pass} onChange={e => setPass(e.target.value)} 
              style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none', fontSize: 14 }} 
            />
          </div>
        </div>
        
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, background: '#0f172a', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? 'Memproses...' : (mode === 'login' ? 'Masuk Sekarang' : 'Daftar Akun')}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
        {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
        <button 
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }} 
          style={{ color: '#0ea5e9', cursor: 'pointer', fontWeight: 700, background: 'none', border: 'none', padding: 0 }}
        >
          {mode === 'login' ? 'Daftar disini' : 'Login disini'}
        </button>
      </div>
    </div>
  );
}
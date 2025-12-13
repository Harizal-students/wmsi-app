import React from 'react';
import { Award, MousePointer, FileText, Shield, Megaphone, Database, RefreshCw } from 'lucide-react';
import { Bar, lbl } from './SharedUI';

type Props = {
  results: any;
  tab: string;
  setTab: (t: string) => void;
  reset: () => void;
  savedToDb: boolean;
  userEmail: string | null;
};

export default function AnalysisResults({ results, tab, setTab, reset, savedToDb, userEmail }: Props) {
  if (!results) return null;

  return (
    <div>
      {savedToDb && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 10, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={16} style={{ color: '#16a34a' }} />
          <span style={{ fontSize: 12, color: '#166534' }}>Saved to Supabase {userEmail ? `(Account: ${userEmail})` : '(Anonymous)'}</span>
        </div>
      )}

      {/* Score Header */}
      <div style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', borderRadius: 14, padding: 20, color: '#fff', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Award size={18} />
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>WebQual 4.0</h2>
            </div>
            <p style={{ opacity: 0.9, fontSize: 13, margin: 0 }}>{results.url}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 44, fontWeight: 800 }}>{results.wq.overall.pct.toFixed(0)}%</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>{lbl(results.wq.overall.pct)}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 16 }}>
          {[
            { k: 'usability', l: 'Usability', icon: MousePointer },
            { k: 'information', l: 'Info', icon: FileText },
            { k: 'service', l: 'Service', icon: Shield },
            { k: 'marketing', l: 'Marketing', icon: Megaphone }
          ].map(d => {
            const Icon = d.icon;
            return (
              <div key={d.k} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                <Icon size={14} style={{ opacity: 0.9 }} />
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{results.wq[d.k].pct.toFixed(0)}%</div>
                <div style={{ fontSize: 10, opacity: 0.8 }}>{d.l}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {['overview', 'seo', 'ui', 'mkt', 'wq'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 14px', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 6, cursor: 'pointer',
            background: tab === t ? '#0ea5e9' : '#fff', color: tab === t ? '#fff' : '#64748b'
          }}>
            {t === 'overview' ? 'Overview' : t === 'seo' ? 'SEO' : t === 'ui' ? 'UI/UX' : t === 'mkt' ? 'Marketing' : 'WebQual'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, minHeight: 200 }}>
        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>SEO</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{results.seo.score}</div>
                <Bar v={results.seo.score} c="#10b981" h={4} />
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>UI</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{results.ui.overall}</div>
                <Bar v={results.ui.overall} c="#3b82f6" h={4} />
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>UX</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>{results.ux.overall}</div>
                <Bar v={results.ux.overall} c="#f59e0b" h={4} />
              </div>
            </div>
          </div>
        )}
        {tab === 'seo' && (
          <div>
            <h3 style={{marginBottom:10}}>SEO Analysis</h3>
            <pre style={{fontSize:11, background:'#f8fafc', padding:10, borderRadius:8, overflow:'auto'}}>{JSON.stringify(results.seo, null, 2)}</pre>
          </div>
        )}
        {tab === 'ui' && (
          <div>
            <h3 style={{marginBottom:10}}>UI/UX Vision Analysis</h3>
            <pre style={{fontSize:11, background:'#f8fafc', padding:10, borderRadius:8, overflow:'auto'}}>{JSON.stringify({ui: results.ui, ux: results.ux}, null, 2)}</pre>
          </div>
        )}
        {tab === 'mkt' && (
          <div>
            <h3 style={{marginBottom:10}}>Marketing Analysis</h3>
            <pre style={{fontSize:11, background:'#f8fafc', padding:10, borderRadius:8, overflow:'auto'}}>{JSON.stringify(results.mkt, null, 2)}</pre>
          </div>
        )}
        {tab === 'wq' && (
          <div>
            <h3 style={{marginBottom:10}}>WebQual 4.0</h3>
            <pre style={{fontSize:11, background:'#f8fafc', padding:10, borderRadius:8, overflow:'auto'}}>{JSON.stringify(results.wq, null, 2)}</pre>
          </div>
        )}
      </div>

      <button onClick={reset} style={{ width: '100%', marginTop: 16, padding: 12, fontSize: 13, fontWeight: 600, background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <RefreshCw size={14} /> New Analysis
      </button>
    </div>
  );
}
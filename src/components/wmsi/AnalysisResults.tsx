import React from 'react';
import { Award, MousePointer, FileText, Shield, Megaphone, Database, RefreshCw, CheckCircle2, Info, Globe, TrendingUp, BookOpen, Users } from 'lucide-react';
import { Bar, lbl } from './SharedUI';
import PdfGenerator from './PdfGenerator';

type Props = {
  results: any;
  tab: string;
  setTab: (t: string) => void;
  reset: () => void;
  savedToDb: boolean;
  userEmail: string | null;
};

// --- SUB COMPONENTS ---
const InfoCard = ({ title, children, color = '#3b82f6', icon: Icon = Info }: { title: string, children: React.ReactNode, color?: string, icon?: any }) => (
  <div style={{ background: '#fff', border: `1px solid ${color}30`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
    <h4 style={{ color: color, fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon size={16} /> {title}
    </h4>
    <div style={{ fontSize: 13, lineHeight: '1.6', color: '#334155' }}>
      {children}
    </div>
  </div>
);

const ComparisonTable = ({ data, competitor }: { data: any, competitor: string }) => (
  <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          <th style={{ padding: 10, textAlign: 'left', width: '20%' }}>7P Mix</th>
          <th style={{ padding: 10, textAlign: 'left', width: '35%', color: '#0ea5e9' }}>Analisis Website Ini</th>
          <th style={{ padding: 10, textAlign: 'left', width: '35%', color: '#ef4444' }}>Vs. {competitor}</th>
          <th style={{ padding: 10, textAlign: 'center', width: '10%' }}>Verdict</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(data).map(([key, val]: any, i) => (
          <tr key={key} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fcfcfc' }}>
            <td style={{ padding: 10, fontWeight: 600, textTransform: 'capitalize' }}>{key}</td>
            <td style={{ padding: 10 }}>{val.us}</td>
            <td style={{ padding: 10 }}>{val.competitor}</td>
            <td style={{ padding: 10, textAlign: 'center', fontWeight: 700, color: val.verdict?.includes('Better') ? '#10b981' : '#f59e0b' }}>{val.verdict}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function AnalysisResults({ results, tab, setTab, reset, savedToDb, userEmail }: Props) {
  if (!results) return null;

  const wq = results.wq || {};
  const seo = results.seo || {};
  const uiux = results.ui_ux || {}; // Struktur baru
  const mkt = results.marketing || {}; // Struktur baru

  // Fallback data jika struktur lama (untuk backward compatibility)
  const seoKeywords = seo.keyword_analysis?.generated_keywords || [];
  const uxTheory = uiux.ux?.academic_analysis || [];
  const mktComp = mkt.competitor_analysis || {};

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        {savedToDb ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={14} style={{ color: '#16a34a' }} />
            <span style={{ fontSize: 11, color: '#166534' }}>Saved</span>
          </div>
        ) : <div />}
        <PdfGenerator elementId="report-printable" filename={`WMSI-Report-${results.domain}`} />
      </div>

      {/* DASHBOARD LAYAR */}
      <div id="screen-dashboard">
        {/* Score Card Hero */}
        <div style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', borderRadius: 16, padding: 24, color: '#fff', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, width: 'fit-content' }}>
                <Award size={14} />
                <span style={{ fontSize: 12, fontWeight: 700 }}>WebQual 4.0 Score</span>
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px 0' }}>{results.domain}</h2>
              <p style={{ opacity: 0.9, fontSize: 13 }}>{results.url}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1 }}>{wq.overall?.pct?.toFixed(0) || 0}<span style={{fontSize:24}}>%</span></div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>{wq.overall?.interpretation || '-'}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {[ { id: 'overview', label: 'Overview' }, { id: 'seo', label: 'SEO & Ranking' }, { id: 'ui', label: 'UI/UX & Theory' }, { id: 'mkt', label: 'Marketing & Competitor' }, { id: 'wq', label: 'WebQual Deep Dive' } ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 20, cursor: 'pointer', flexShrink: 0,
              background: tab === t.id ? '#0f172a' : '#fff', color: tab === t.id ? '#fff' : '#64748b',
              boxShadow: tab === t.id ? '0 4px 12px rgba(15, 23, 42, 0.15)' : 'none', transition: 'all 0.2s'
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', minHeight: 400 }}>
          
          {/* 1. OVERVIEW */}
          {tab === 'overview' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Performance Snapshot</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}><span>SEO Health</span><strong>{seo.overallSEO?.score || 0}/100</strong></div><Bar v={seo.overallSEO?.score || 0} c="#10b981" /></div>
                <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}><span>UI/UX Standard</span><strong>{uiux.ui?.overall || 0}/100</strong></div><Bar v={uiux.ui?.overall || 0} c="#3b82f6" /></div>
                <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}><span>Marketing Power</span><strong>{((mkt.overall || 0) * 20).toFixed(0)}/100</strong></div><Bar v={(mkt.overall || 0) * 20} c="#8b5cf6" /></div>
              </div>
            </div>
          )}

          {/* 2. SEO (KEYWORD RANKING) */}
          {tab === 'seo' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><TrendingUp size={18} color="#10b981" /> Google Search Ranking Simulation</h3>
              
              <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f0fdf4', borderBottom: '2px solid #bbf7d0' }}>
                      <th style={{ padding: 10, textAlign: 'left' }}>Keyword Generated</th>
                      <th style={{ padding: 10, textAlign: 'center' }}>Search Vol</th>
                      <th style={{ padding: 10, textAlign: 'center' }}>Est. Rank</th>
                      <th style={{ padding: 10, textAlign: 'center' }}>Intent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seoKeywords.map((k: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: 10, fontWeight: 600, color: '#166534' }}>{k.keyword}</td>
                        <td style={{ padding: 10, textAlign: 'center' }}>{k.search_volume}</td>
                        <td style={{ padding: 10, textAlign: 'center' }}>
                          <span style={{ background: k.google_rank_est <= 10 ? '#10b981' : '#fcd34d', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>#{k.google_rank_est}</span>
                        </td>
                        <td style={{ padding: 10, textAlign: 'center', fontSize: 11, color: '#64748b' }}>{k.intent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <InfoCard title="Ranking Analysis" color="#10b981">{seo.keyword_analysis?.ranking_analysis || "Analisis ranking tidak tersedia."}</InfoCard>
            </div>
          )}

          {/* 3. UI/UX (ACADEMIC) */}
          {tab === 'ui' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><BookOpen size={18} color="#f59e0b" /> Academic UX Audit</h3>
              
              <div style={{ marginBottom: 20, padding: 16, background: '#fffbeb', borderRadius: 12, border: '1px solid #fcd34d' }}>
                <strong style={{ display: 'block', marginBottom: 4, color: '#92400e' }}>Design Style Identified:</strong>
                <span style={{ fontSize: 14 }}>{uiux.ui?.design_style || "Undetected"}</span>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                {uxTheory.map((t: any, i: number) => (
                  <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <strong style={{ color: '#0f172a' }}>{t.theory}</strong>
                      <span style={{ fontSize: 11, background: '#f1f5f9', padding: '2px 8px', borderRadius: 12, color: '#64748b' }}>Ref: {t.source}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#334155', margin: 0 }}>{t.observation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. MARKETING (COMPETITOR) */}
          {tab === 'mkt' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Users size={18} color="#8b5cf6" /> Competitor Comparison</h3>
              
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 13 }}>Comparing <strong>{results.domain}</strong> vs Leader: </span>
                <span style={{ fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: 4 }}>{mktComp.competitor_name || "Market Leader"}</span>
              </div>

              {mktComp.comparison_7p && <ComparisonTable data={mktComp.comparison_7p} competitor={mktComp.competitor_name} />}
            </div>
          )}

          {/* 5. WEBQUAL (DEEP REASONING) */}
          {tab === 'wq' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Award size={18} color="#0ea5e9" /> WebQual 4.0 Synthesis</h3>
              <div style={{ display: 'grid', gap: 16 }}>
                {['usability', 'information', 'service'].map((dim) => (
                  <div key={dim} style={{ borderLeft: `4px solid ${dim === 'usability' ? '#f59e0b' : dim === 'information' ? '#10b981' : '#3b82f6'}`, background: '#f8fafc', padding: 16, borderRadius: '0 8px 8px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <strong style={{ textTransform: 'capitalize' }}>{dim} Quality</strong>
                      <span style={{ fontWeight: 700 }}>{wq[dim]?.score?.toFixed(2)}/5.0</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: '1.5' }}>{wq[dim]?.deep_reasoning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button onClick={reset} style={{ width: '100%', marginTop: 24, padding: 14, fontSize: 14, fontWeight: 600, background: '#f1f5f9', border: 'none', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#475569' }}>
          <RefreshCw size={16} /> New Analysis
        </button>
      </div>

      {/* === PRINTABLE AREA (FIXED FOR PDF GENERATION) === */}
      {/* Perbaikan Bug PDF Kosong: 
         1. background #fff eksplisit
         2. width fixed A4 (210mm)
         3. Menggunakan z-index negatif agar tidak menutupi layar tapi tetap dirender browser
         4. Text warna hitam eksplisit
      */}
      <div id="report-printable" style={{ 
        position: 'absolute', 
        left: 0, top: 0, 
        width: '210mm', 
        minHeight: '297mm', 
        padding: '20mm', 
        background: '#ffffff', 
        color: '#000000', 
        fontFamily: 'serif', 
        zIndex: -50,
        visibility: 'visible' // Penting! Jangan display:none
      }}>
        {/* Header Laporan */}
        <div style={{ borderBottom: '2px solid #000', paddingBottom: 20, marginBottom: 30 }}>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: '0 0 10px 0' }}>LAPORAN AUDIT WEBSITE (WMSI)</h1>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 12 }}>
            <div>
              <p style={{margin: '2px 0'}}><strong>Domain:</strong> {results.domain}</p>
              <p style={{margin: '2px 0'}}><strong>URL:</strong> {results.url}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{margin: '2px 0'}}><strong>Tanggal:</strong> {new Date().toLocaleDateString('id-ID')}</p>
              <p style={{margin: '2px 0'}}><strong>Auditor:</strong> {userEmail || 'Guest'}</p>
            </div>
          </div>
        </div>

        {/* 1. Score Summary */}
        <div style={{ marginBottom: 30, padding: 15, border: '1px solid #000', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>WebQual 4.0 Score</span>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>{wq.overall?.pct?.toFixed(1)}%</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14 }}><strong>Usability:</strong> {wq.usability?.score?.toFixed(2)}</div>
            <div style={{ fontSize: 14 }}><strong>Information:</strong> {wq.information?.score?.toFixed(2)}</div>
            <div style={{ fontSize: 14 }}><strong>Service:</strong> {wq.service?.score?.toFixed(2)}</div>
          </div>
        </div>

        {/* 2. SEO & Keywords */}
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: 5, fontSize: 14, fontWeight: 'bold' }}>1. SEO & Search Ranking Simulation</h3>
          <p style={{ fontSize: 11, fontStyle: 'italic', marginBottom: 10 }}>Analysis: {seo.keyword_analysis?.ranking_analysis}</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#eee' }}><th style={{padding:5, textAlign:'left'}}>Keyword</th><th style={{padding:5}}>Vol</th><th style={{padding:5}}>Rank</th></tr>
            </thead>
            <tbody>
              {seoKeywords.slice(0, 5).map((k: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{padding:5}}>{k.keyword}</td><td style={{padding:5, textAlign:'center'}}>{k.search_volume}</td><td style={{padding:5, textAlign:'center'}}>#{k.google_rank_est}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. Competitor Analysis */}
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: 5, fontSize: 14, fontWeight: 'bold' }}>2. Competitor Benchmarking (vs {mktComp.competitor_name})</h3>
          <div style={{ fontSize: 11, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {mktComp.comparison_7p && Object.entries(mktComp.comparison_7p).slice(0,4).map(([key, val]: any) => (
              <div key={key}><strong>{key}:</strong> {val.us} <br/><span style={{color:'#555'}}>(vs {val.competitor})</span></div>
            ))}
          </div>
        </div>

        {/* 4. UX Theory */}
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: 5, fontSize: 14, fontWeight: 'bold' }}>3. Academic UX Audit</h3>
          <ul style={{ fontSize: 11, paddingLeft: 15 }}>
            {uxTheory.slice(0, 3).map((t: any, i: number) => (
              <li key={i} style={{ marginBottom: 5 }}>
                <strong>{t.theory} ({t.source}):</strong> {t.observation}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div style={{ position: 'absolute', bottom: 10, width: '100%', textAlign: 'center', fontSize: 9, color: '#888' }}>
          Generated by WMSI AI Intelligence System
        </div>
      </div>

    </div>
  );
}
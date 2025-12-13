import React from 'react';
import { Award, MousePointer, FileText, Shield, Megaphone, Database, RefreshCw, CheckCircle2, Info, Globe, Calendar } from 'lucide-react';
import { Bar, lbl } from './SharedUI';
import PdfGenerator from './PdfGenerator'; // Import modul baru

type Props = {
  results: any;
  tab: string;
  setTab: (t: string) => void;
  reset: () => void;
  savedToDb: boolean;
  userEmail: string | null;
};

const InfoCard = ({ title, children, color = '#3b82f6' }: { title: string, children: React.ReactNode, color?: string }) => (
  <div style={{ background: '#fff', border: `1px solid ${color}30`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
    <h4 style={{ color: color, fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
      <Info size={16} /> {title}
    </h4>
    <div style={{ fontSize: 13, lineHeight: '1.6', color: '#334155' }}>
      {children}
    </div>
  </div>
);

const ListItem = ({ label, value }: { label: string, value: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 13 }}>
    <span style={{ color: '#64748b' }}>{label}</span>
    <span style={{ fontWeight: 600, color: '#0f172a', maxWidth: '60%', textAlign: 'right' }}>{value}</span>
  </div>
);

export default function AnalysisResults({ results, tab, setTab, reset, savedToDb, userEmail }: Props) {
  if (!results) return null;

  const wq = results.wq;
  const seo = results.seo;
  const vision = results.vision_analysis || {};
  const mkt = results.mkt;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* === HEADER ACTION BAR === */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        {savedToDb ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={14} style={{ color: '#16a34a' }} />
            <span style={{ fontSize: 11, color: '#166534' }}>Saved</span>
          </div>
        ) : <div />}
        
        {/* Tombol Download PDF */}
        <PdfGenerator elementId="report-printable" filename={`WMSI-Report-${results.domain}`} />
      </div>

      {/* === INTERACTIVE DASHBOARD (SCREEN ONLY) === */}
      {/* Bagian ini hanya muncul di layar, tidak dicetak ke PDF karena kita punya view khusus di bawah */}
      <div id="screen-dashboard">
        {/* WebQual Score Card */}
        <div style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', borderRadius: 16, padding: 24, color: '#fff', marginBottom: 20, boxShadow: '0 10px 20px -5px rgba(14, 165, 233, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, width: 'fit-content' }}>
                <Award size={14} />
                <span style={{ fontSize: 12, fontWeight: 700 }}>WebQual 4.0 Score</span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px 0' }}>{results.domain}</h2>
              <p style={{ opacity: 0.9, fontSize: 13 }}>{results.url}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1 }}>{wq.overall.pct.toFixed(0)}<span style={{fontSize:24}}>%</span></div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>{wq.overall.interpretation}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 24 }}>
            {[
              { l: 'Usability', v: wq.usability.pct, i: MousePointer, d: 'Quality of Use' },
              { l: 'Info Quality', v: wq.information.pct, i: FileText, d: 'Accuracy & Relevance' },
              { l: 'Service', v: wq.service.pct, i: Shield, d: 'Trust & Interaction' }
            ].map((item, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 12, backdropFilter: 'blur(5px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <item.i size={14} style={{ opacity: 0.8 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.9 }}>{item.l}</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{item.v.toFixed(0)}%</div>
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{item.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {[ { id: 'overview', label: 'Overview' }, { id: 'seo', label: 'SEO Audit' }, { id: 'ui', label: 'UI/UX Vision' }, { id: 'mkt', label: 'Marketing 7P' }, { id: 'wq', label: 'WebQual Science' } ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 20, cursor: 'pointer', flexShrink: 0,
              background: tab === t.id ? '#0f172a' : '#fff', color: tab === t.id ? '#fff' : '#64748b',
              boxShadow: tab === t.id ? '0 4px 12px rgba(15, 23, 42, 0.15)' : 'none', transition: 'all 0.2s'
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', minHeight: 300 }}>
          {tab === 'overview' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#0f172a' }}>Executive Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <InfoCard title="Key Strengths" color="#10b981">
                  <ul style={{ paddingLeft: 16, margin: 0 }}>
                    {vision.key_strengths?.map((s: string, i: number) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>) || <li>Analisis mendalam sedang diproses...</li>}
                  </ul>
                </InfoCard>
                <InfoCard title="Critical Improvements" color="#ef4444">
                  <ul style={{ paddingLeft: 16, margin: 0 }}>
                    {vision.critical_improvements?.map((s: string, i: number) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>) || <li>Tidak ada isu kritikal mayor.</li>}
                  </ul>
                </InfoCard>
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Performance Metrics</h4>
              <div style={{ display: 'grid', gap: 12 }}>
                <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}><span>SEO Performance</span><strong>{seo.overallSEO?.score}/100</strong></div><Bar v={seo.overallSEO?.score || 0} c="#10b981" /></div>
                <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}><span>UI/UX & Vision</span><strong>{vision.ui?.overall}/100</strong></div><Bar v={vision.ui?.overall || 0} c="#3b82f6" /></div>
                <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}><span>Marketing Maturity</span><strong>{((mkt.overall || 0) * 20).toFixed(0)}/100</strong></div><Bar v={(mkt.overall || 0) * 20} c="#8b5cf6" /></div>
              </div>
            </div>
          )}

          {tab === 'seo' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle2 size={18} color="#10b981" /> Technical & Content SEO</h3>
              <div style={{ display: 'grid', gap: 16 }}>
                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#334155' }}>Technical Audit</h4>
                  {seo.technical_audit ? (<div style={{ display: 'grid', gap: 8 }}><ListItem label="Core Web Vitals" value={seo.technical_audit.core_web_vitals_assessment} /><ListItem label="Mobile Friendly" value={seo.technical_audit.mobile_friendliness} /><ListItem label="SSL & Security" value={seo.technical_audit.ssl_security} /></div>) : <p style={{fontSize:12}}>Data tidak tersedia.</p>}
                </div>
                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#334155' }}>Content Strategy</h4>
                  <p style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>{seo.content_semantic_analysis?.keyword_strategy}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{seo.content_semantic_analysis?.keywords?.map((k: any, i: number) => (<span key={i} style={{ background: '#e0f2fe', color: '#0284c7', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{k.keyword}</span>))}</div>
                </div>
              </div>
            </div>
          )}

          {tab === 'ui' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><MousePointer size={18} color="#f59e0b" /> Heuristic Evaluation</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div style={{ background: '#fffbeb', padding: 16, borderRadius: 12, border: '1px solid #fcd34d' }}><div style={{ fontSize: 32, fontWeight: 800, color: '#d97706', marginBottom: 4 }}>{vision.ui?.overall}</div><div style={{ fontSize: 12, fontWeight: 700, color: '#b45309' }}>UI Score</div></div>
                <div style={{ background: '#ecfdf5', padding: 16, borderRadius: 12, border: '1px solid #6ee7b7' }}><div style={{ fontSize: 32, fontWeight: 800, color: '#059669', marginBottom: 4 }}>{vision.ux?.overall}</div><div style={{ fontSize: 12, fontWeight: 700, color: '#047857' }}>UX Score</div></div>
              </div>
              <InfoCard title="Visual Hierarchy Analysis" color="#f59e0b">{vision.ui?.visual_hierarchy?.analysis || "Analisis hierarki visual tidak tersedia."}</InfoCard>
              <h4 style={{ fontSize: 14, fontWeight: 700, margin: '20px 0 12px' }}>Nielsen Heuristics</h4>
              <div style={{ display: 'grid', gap: 10 }}>{vision.ux?.usability_heuristics && Object.entries(vision.ux.usability_heuristics).map(([key, val]: any, i) => (<div key={i} style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span><span style={{ fontSize: 12, fontWeight: 700, color: val.score >= 7 ? '#10b981' : '#ef4444' }}>{val.score}/10</span></div><div style={{ fontSize: 12, color: '#64748b' }}>{val.observation}</div></div>))}</div>
            </div>
          )}

          {tab === 'mkt' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Megaphone size={18} color="#8b5cf6" /> Marketing Mix 7P</h3>
              <div style={{ background: '#f5f3ff', padding: 16, borderRadius: 12, marginBottom: 20 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 600, color: '#5b21b6' }}>Brand Archetype</span><span style={{ background: '#7c3aed', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{mkt.brand_authority?.brand_archetype || "Undetermined"}</span></div><p style={{ fontSize: 13, color: '#4c1d95', margin: 0 }}>{mkt.brand_authority?.analysis}</p></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>{mkt.marketing_mix_7p && Object.entries(mkt.marketing_mix_7p).map(([key, val]: any, i) => (<div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}><div style={{ fontSize: 11, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>{key}</div><div style={{ fontSize: 12, color: '#334155', lineHeight: '1.4' }}>{val}</div></div>))}</div>
            </div>
          )}

          {tab === 'wq' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Award size={18} color="#0ea5e9" /> WebQual 4.0 Science</h3>
              <div style={{ background: '#f0f9ff', padding: 16, borderRadius: 12, marginBottom: 20, borderLeft: '4px solid #0ea5e9' }}><h4 style={{ fontSize: 13, fontWeight: 700, color: '#0369a1', marginBottom: 8 }}>Formula</h4><code style={{ fontSize: 11, background: '#fff', padding: '4px 8px', borderRadius: 4, color: '#0c4a6e', display: 'block' }}>{wq.overall.calc}</code></div>
              <div style={{ display: 'grid', gap: 12 }}><ListItem label="Usability Dimension (33%)" value={`${wq.usability.score.toFixed(2)}/5.0`} /><ListItem label="Information Quality (33%)" value={`${wq.information.score.toFixed(2)}/5.0`} /><ListItem label="Service Interaction (34%)" value={`${wq.service.score.toFixed(2)}/5.0`} /></div>
            </div>
          )}
        </div>

        <button onClick={reset} style={{ width: '100%', marginTop: 24, padding: 14, fontSize: 14, fontWeight: 600, background: '#f1f5f9', border: 'none', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#475569', transition: 'background 0.2s' }}>
          <RefreshCw size={16} /> Mulai Analisis Baru
        </button>
      </div>

      {/* === HIDDEN PRINTABLE REPORT (A4 FORMAT) === */}
      <div id="report-printable" style={{ position: 'fixed', top: -9999, left: -9999, width: '210mm', minHeight: '297mm', background: '#fff', padding: '20mm', color: '#000', fontFamily: 'serif' }}>
        
        {/* Report Header */}
        <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: 20, marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>Laporan Audit Website</h1>
            <span style={{ fontSize: 12, color: '#64748b' }}>WMSI Intelligence</span>
          </div>
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 12 }}>
            <div>
              <div><strong>Domain:</strong> {results.domain}</div>
              <div><strong>URL:</strong> {results.url}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div><strong>Tanggal:</strong> {new Date().toLocaleDateString('id-ID')}</div>
              <div><strong>Dianalisis oleh:</strong> {userEmail || 'Guest User'}</div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: 8, marginBottom: 16 }}>1. Ringkasan Eksekutif</h2>
          <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1, padding: 15, background: '#f1f5f9', borderRadius: 4 }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>WebQual Score</div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{wq.overall.pct.toFixed(0)}%</div>
            </div>
            <div style={{ flex: 1, padding: 15, background: '#f1f5f9', borderRadius: 4 }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>SEO Score</div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{seo.overallSEO?.score}</div>
            </div>
            <div style={{ flex: 1, padding: 15, background: '#f1f5f9', borderRadius: 4 }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Marketing Score</div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{((mkt.overall || 0) * 20).toFixed(0)}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.5 }}>
            <strong>Kekuatan Utama:</strong> {vision.key_strengths?.join(', ')}<br/><br/>
            <strong>Rekomendasi Kritis:</strong> {vision.critical_improvements?.join(', ')}
          </div>
        </div>

        {/* Detailed Analysis (Simplified for Print) */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: 8, marginBottom: 16 }}>2. Analisis Mendalam</h2>
          
          <h3 style={{ fontSize: 14, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Analisis Teknis SEO</h3>
          <p style={{ fontSize: 12, margin: 0 }}>Core Web Vitals: {seo.technical_audit?.core_web_vitals_assessment}</p>
          <p style={{ fontSize: 12, margin: 0 }}>Mobile Friendly: {seo.technical_audit?.mobile_friendliness}</p>

          <h3 style={{ fontSize: 14, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Evaluasi UX Heuristik</h3>
          <p style={{ fontSize: 12 }}>UI Score: {vision.ui?.overall}/100 | UX Score: {vision.ux?.overall}/100</p>
          <ul style={{ fontSize: 12, paddingLeft: 20 }}>
            {vision.ux?.usability_heuristics && Object.entries(vision.ux.usability_heuristics).slice(0,3).map(([k, v]: any) => (
              <li key={k}><strong>{k}:</strong> {v.observation}</li>
            ))}
          </ul>

          <h3 style={{ fontSize: 14, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Strategi Marketing 7P</h3>
          <p style={{ fontSize: 12, fontStyle: 'italic' }}>Brand Archetype: {mkt.brand_authority?.brand_archetype}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
            <div><strong>Product:</strong> {mkt.marketing_mix_7p?.product}</div>
            <div><strong>Price:</strong> {mkt.marketing_mix_7p?.price}</div>
            <div><strong>Promotion:</strong> {mkt.marketing_mix_7p?.promotion}</div>
            <div><strong>Place:</strong> {mkt.marketing_mix_7p?.place}</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, textAlign: 'center', fontSize: 10, color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
          Generated by WMSI - Website Marketing Scan Intelligence on {new Date().toLocaleDateString()}
        </div>
      </div>

    </div>
  );
}
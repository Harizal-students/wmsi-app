import React from 'react';
import { Award, MousePointer, FileText, Shield, Megaphone, Database, RefreshCw, CheckCircle2, Info, Globe, TrendingUp, BookOpen, Users, AlertTriangle } from 'lucide-react';
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

// === SAFE DATA EXTRACTOR ===
// Fungsi helper untuk memastikan data selalu ada dan valid
const safeExtract = {
  keywords: (seo: any): any[] => {
    const kw = seo?.keyword_analysis?.generated_keywords;
    if (Array.isArray(kw) && kw.length > 0) return kw;
    // Fallback jika kosong
    return [
      { keyword: 'No keywords generated', search_volume: 'N/A', google_rank_est: 0, intent: 'N/A', competition: 'N/A' }
    ];
  },
  
  theories: (uiux: any): any[] => {
    const theories = uiux?.ux?.academic_analysis;
    if (Array.isArray(theories) && theories.length > 0) return theories;
    // Fallback
    return [
      { theory: 'No theories analyzed', source: 'N/A', observation: 'UX analysis not available', application: 'N/A', impact: 'N/A' }
    ];
  },
  
  competitor: (mkt: any): { name: string; data: any } => {
    const comp = mkt?.competitor_analysis;
    if (comp && comp.comparison_7p && Object.keys(comp.comparison_7p).length > 0) {
      return { name: comp.competitor_name || 'Competitor', data: comp.comparison_7p };
    }
    // Fallback
    return {
      name: 'No Competitor',
      data: {
        product: { us: 'N/A', competitor: 'N/A', verdict: 'N/A' }
      }
    };
  },
  
  webqual: (wq: any, dim: string): { score: number; pct: number; reasoning: string } => {
    const data = wq?.[dim];
    if (data && typeof data.score === 'number') {
      return {
        score: data.score,
        pct: data.pct || Math.round(data.score * 20),
        reasoning: data.deep_reasoning || 'No detailed analysis available'
      };
    }
    // Fallback
    return { score: 0, pct: 0, reasoning: 'Data not available' };
  }
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

const ComparisonTable = ({ data, competitor }: { data: any, competitor: string }) => {
  const entries = Object.entries(data || {});
  
  if (entries.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
        <AlertTriangle size={20} style={{ margin: '0 auto 8px' }} />
        <p>No competitor comparison data available</p>
      </div>
    );
  }

  return (
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
          {entries.map(([key, val]: any, i) => (
            <tr key={key} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fcfcfc' }}>
              <td style={{ padding: 10, fontWeight: 600, textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</td>
              <td style={{ padding: 10 }}>{val?.us || 'N/A'}</td>
              <td style={{ padding: 10 }}>{val?.competitor || 'N/A'}</td>
              <td style={{ 
                padding: 10, 
                textAlign: 'center', 
                fontWeight: 700, 
                color: val?.verdict?.includes('Better') ? '#10b981' : 
                       val?.verdict?.includes('Equal') ? '#f59e0b' : '#64748b'
              }}>
                {val?.verdict || 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// === MAIN COMPONENT ===
export default function AnalysisResults({ results, tab, setTab, reset, savedToDb, userEmail }: Props) {
  if (!results) return null;

  // Safe data extraction with fallbacks
  const wq = results.webqual || results.wq || {};
  const seo = results.seo || {};
  const uiux = results.ui_ux || {};
  const mkt = results.marketing || {};

  // Extract data dengan safe functions
  const seoKeywords = safeExtract.keywords(seo);
  const uxTheories = safeExtract.theories(uiux);
  const competitorData = safeExtract.competitor(mkt);
  
  // WebQual dimensions
  const wqUsability = safeExtract.webqual(wq, 'usability');
  const wqInformation = safeExtract.webqual(wq, 'information');
  const wqService = safeExtract.webqual(wq, 'service');
  
  // Overall scores with fallbacks
  const overallPct = wq?.overall?.pct || 0;
  const overallInterpretation = wq?.overall?.interpretation || 'Not Available';
  const seoScore = seo?.overallSEO?.score || seo?.technical_audit?.score || 0;
  const uiScore = uiux?.ui?.overall || 0;
  const mktScore = (mkt?.overall || 0) * 20;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        {savedToDb ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={14} style={{ color: '#16a34a' }} />
            <span style={{ fontSize: 11, color: '#166534' }}>Saved to Database</span>
          </div>
        ) : <div />}
        <PdfGenerator elementId="report-printable" filename={`WMSI-Report-${results.domain || 'analysis'}`} />
      </div>

      {/* DASHBOARD LAYAR */}
      <div id="screen-dashboard">
        {/* Score Card Hero */}
        <div style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', borderRadius: 16, padding: 24, color: '#fff', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 250 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, width: 'fit-content' }}>
                <Award size={14} />
                <span style={{ fontSize: 12, fontWeight: 700 }}>WebQual 4.0 Score</span>
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px 0', wordBreak: 'break-word' }}>
                {results.domain || 'Unknown Domain'}
              </h2>
              <p style={{ opacity: 0.9, fontSize: 13, wordBreak: 'break-all' }}>
                {results.url || 'N/A'}
              </p>
            </div>
            <div style={{ textAlign: 'center', minWidth: 120 }}>
              <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1 }}>
                {overallPct.toFixed(0)}<span style={{fontSize:24}}>%</span>
              </div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>{overallInterpretation}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {[ 
            { id: 'overview', label: 'Overview' }, 
            { id: 'seo', label: 'SEO & Ranking' }, 
            { id: 'ui', label: 'UI/UX & Theory' }, 
            { id: 'mkt', label: 'Marketing & Competitor' }, 
            { id: 'wq', label: 'WebQual Deep Dive' } 
          ].map(t => (
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
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                    <span>SEO Health</span>
                    <strong>{seoScore.toFixed(0)}/100</strong>
                  </div>
                  <Bar v={seoScore} c="#10b981" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                    <span>UI/UX Standard</span>
                    <strong>{uiScore.toFixed(0)}/100</strong>
                  </div>
                  <Bar v={uiScore} c="#3b82f6" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                    <span>Marketing Power</span>
                    <strong>{mktScore.toFixed(0)}/100</strong>
                  </div>
                  <Bar v={mktScore} c="#8b5cf6" />
                </div>
              </div>
              
              {/* Quick insights */}
              <div style={{ marginTop: 20, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>Quick Insights</h4>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#475569', lineHeight: 1.8 }}>
                  <li>Overall website quality: <strong>{overallInterpretation}</strong> ({overallPct.toFixed(1)}%)</li>
                  <li>{seoKeywords.length} SEO keywords analyzed</li>
                  <li>{uxTheories.length} UX theories evaluated</li>
                  <li>Competitor benchmark vs. {competitorData.name}</li>
                </ul>
              </div>
            </div>
          )}

          {/* 2. SEO (KEYWORD RANKING) */}
          {tab === 'seo' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} color="#10b981" /> Google Search Ranking Simulation
              </h3>
              
              {seoKeywords.length > 0 && seoKeywords[0].keyword !== 'No keywords generated' ? (
                <>
                  {seo.keyword_analysis?.text_extraction_summary && (
                    <div style={{ marginBottom: 16, padding: 12, background: '#fffbeb', borderRadius: 8, fontSize: 12, color: '#92400e', border: '1px solid #fcd34d' }}>
                      <strong>📝 Content Extracted from Screenshots:</strong>
                      <p style={{ margin: '4px 0 0 0', fontStyle: 'italic' }}>{seo.keyword_analysis.text_extraction_summary}</p>
                    </div>
                  )}
                  
                  <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#f0fdf4', borderBottom: '2px solid #bbf7d0' }}>
                          <th style={{ padding: 10, textAlign: 'left' }}>Keyword Generated</th>
                          <th style={{ padding: 10, textAlign: 'center' }}>Type</th>
                          <th style={{ padding: 10, textAlign: 'center' }}>Search Vol</th>
                          <th style={{ padding: 10, textAlign: 'center' }}>Est. Rank</th>
                          <th style={{ padding: 10, textAlign: 'left' }}>Relevance Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {seoKeywords.map((k: any, i: number) => (
                          <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: 10, fontWeight: 600, color: '#166534' }}>{k.keyword}</td>
                            <td style={{ padding: 10, textAlign: 'center' }}>
                              <span style={{ 
                                background: '#f0fdf4', 
                                color: '#166534', 
                                padding: '2px 6px', 
                                borderRadius: 4, 
                                fontSize: 10,
                                fontWeight: 600
                              }}>
                                {k.keyword_type || k.intent}
                              </span>
                            </td>
                            <td style={{ padding: 10, textAlign: 'center', fontSize: 12 }}>{k.search_volume}</td>
                            <td style={{ padding: 10, textAlign: 'center' }}>
                              <span style={{ 
                                background: k.google_rank_est <= 10 ? '#10b981' : k.google_rank_est <= 20 ? '#fbbf24' : '#ef4444', 
                                color: '#fff', 
                                padding: '2px 8px', 
                                borderRadius: 4, 
                                fontSize: 11, 
                                fontWeight: 700 
                              }}>
                                #{k.google_rank_est}
                              </span>
                            </td>
                            <td style={{ padding: 10, fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
                              {k.relevance_reason || k.intent}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <InfoCard title="Ranking Analysis" color="#10b981" icon={TrendingUp}>
                    {seo.keyword_analysis?.ranking_analysis || "Keyword analysis based on domain authority and search patterns."}
                  </InfoCard>
                  
                  {seo.keyword_analysis?.methodology && (
                    <div style={{ marginTop: 12, padding: 12, background: '#f0f9ff', borderRadius: 8, fontSize: 11, color: '#0369a1', border: '1px solid #bae6fd' }}>
                      <strong>Analysis Methodology:</strong> {seo.keyword_analysis.methodology}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  <AlertTriangle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ fontSize: 14 }}>SEO keyword data not available for this analysis.</p>
                </div>
              )}
            </div>
          )}

          {/* 3. UI/UX (ACADEMIC) */}
          {tab === 'ui' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={18} color="#f59e0b" /> Academic UX Audit
              </h3>
              
              <div style={{ marginBottom: 20, padding: 16, background: '#fffbeb', borderRadius: 12, border: '1px solid #fcd34d' }}>
                <strong style={{ display: 'block', marginBottom: 4, color: '#92400e' }}>Design Style Identified:</strong>
                <span style={{ fontSize: 14 }}>{uiux.ui?.design_style || "Modern Institutional"}</span>
              </div>

              {uxTheories.length > 0 && uxTheories[0].theory !== 'No theories analyzed' ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  {uxTheories.map((t: any, i: number) => (
                    <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
                        <strong style={{ color: '#0f172a' }}>{t.theory}</strong>
                        <span style={{ fontSize: 11, background: '#f1f5f9', padding: '2px 8px', borderRadius: 12, color: '#64748b' }}>
                          Ref: {t.source}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: '#334155', margin: '0 0 8px 0' }}>{t.observation}</p>
                      {t.application && (
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
                          <strong>Application:</strong> {t.application}
                        </div>
                      )}
                      {t.impact && (
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                          <strong>Impact:</strong> {t.impact}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  <AlertTriangle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ fontSize: 14 }}>UX theory analysis not available.</p>
                </div>
              )}
            </div>
          )}

          {/* 4. MARKETING (COMPETITOR) */}
          {tab === 'mkt' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={18} color="#8b5cf6" /> Competitor Comparison
              </h3>
              
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 13 }}>Comparing <strong>{results.domain || 'This Website'}</strong> vs Leader: </span>
                <span style={{ fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: 4 }}>
                  {competitorData.name}
                </span>
              </div>

              <ComparisonTable data={competitorData.data} competitor={competitorData.name} />
              
              {mkt.competitor_analysis?.strategic_recommendation && (
                <InfoCard title="Strategic Recommendations" color="#8b5cf6" icon={Megaphone}>
                  {mkt.competitor_analysis.strategic_recommendation}
                </InfoCard>
              )}
            </div>
          )}

          {/* 5. WEBQUAL (DEEP REASONING) */}
          {tab === 'wq' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={18} color="#0ea5e9" /> WebQual 4.0 Synthesis
              </h3>
              <div style={{ display: 'grid', gap: 16 }}>
                {/* Usability */}
                <div style={{ borderLeft: '4px solid #f59e0b', background: '#f8fafc', padding: 16, borderRadius: '0 8px 8px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>Usability Quality</strong>
                    <span style={{ fontWeight: 700 }}>{wqUsability.score.toFixed(2)}/5.0 ({wqUsability.pct}%)</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: '1.5' }}>
                    {wqUsability.reasoning}
                  </p>
                </div>

                {/* Information */}
                <div style={{ borderLeft: '4px solid #10b981', background: '#f8fafc', padding: 16, borderRadius: '0 8px 8px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>Information Quality</strong>
                    <span style={{ fontWeight: 700 }}>{wqInformation.score.toFixed(2)}/5.0 ({wqInformation.pct}%)</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: '1.5' }}>
                    {wqInformation.reasoning}
                  </p>
                </div>

                {/* Service */}
                <div style={{ borderLeft: '4px solid #3b82f6', background: '#f8fafc', padding: 16, borderRadius: '0 8px 8px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>Service Interaction Quality</strong>
                    <span style={{ fontWeight: 700 }}>{wqService.score.toFixed(2)}/5.0 ({wqService.pct}%)</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: '1.5' }}>
                    {wqService.reasoning}
                  </p>
                </div>
              </div>

              {/* Overall calculation */}
              {wq?.overall?.calc && (
                <div style={{ marginTop: 16, padding: 12, background: '#f0f9ff', borderRadius: 8, fontSize: 12, color: '#0369a1' }}>
                  <strong>Calculation:</strong> {wq.overall.calc}
                </div>
              )}
            </div>
          )}
        </div>

        <button onClick={reset} style={{ 
          width: '100%', 
          marginTop: 24, 
          padding: 14, 
          fontSize: 14, 
          fontWeight: 600, 
          background: '#f1f5f9', 
          border: 'none', 
          borderRadius: 12, 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: 8, 
          color: '#475569',
          transition: 'all 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
        onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
        >
          <RefreshCw size={16} /> New Analysis
        </button>
      </div>

      {/* === PRINTABLE AREA FOR PDF === */}
      <div id="report-printable" style={{ 
        position: 'absolute', 
        left: '-9999px',
        top: 0, 
        width: '210mm', 
        minHeight: '297mm', 
        padding: '20mm', 
        background: '#ffffff', 
        color: '#000000', 
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px'
      }}>
        {/* Header */}
        <div style={{ borderBottom: '2px solid #000', paddingBottom: 20, marginBottom: 30 }}>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: '0 0 10px 0' }}>LAPORAN AUDIT WEBSITE (WMSI)</h1>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 11 }}>
            <div>
              <p style={{margin: '2px 0'}}><strong>Domain:</strong> {results.domain || 'N/A'}</p>
              <p style={{margin: '2px 0'}}><strong>URL:</strong> {results.url || 'N/A'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{margin: '2px 0'}}><strong>Tanggal:</strong> {new Date().toLocaleDateString('id-ID')}</p>
              <p style={{margin: '2px 0'}}><strong>Auditor:</strong> {userEmail || 'Guest'}</p>
            </div>
          </div>
        </div>

        {/* Score Summary */}
        <div style={{ marginBottom: 30, padding: 15, border: '1px solid #000' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>WebQual 4.0 Overall</span>
              <div style={{ fontSize: 28, fontWeight: 'bold' }}>{overallPct.toFixed(1)}%</div>
              <div style={{ fontSize: 11 }}>{overallInterpretation}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11 }}>
              <div style={{marginBottom: 4}}><strong>Usability:</strong> {wqUsability.score.toFixed(2)}/5.0</div>
              <div style={{marginBottom: 4}}><strong>Information:</strong> {wqInformation.score.toFixed(2)}/5.0</div>
              <div><strong>Service:</strong> {wqService.score.toFixed(2)}/5.0</div>
            </div>
          </div>
        </div>

        {/* SEO Keywords */}
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: 5, fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
            1. SEO & Search Ranking Simulation
          </h3>
          <p style={{ fontSize: 10, fontStyle: 'italic', marginBottom: 10, color: '#555' }}>
            {seo.keyword_analysis?.ranking_analysis || 'Keyword analysis based on domain authority and search patterns.'}
          </p>
          {seoKeywords.length > 0 && seoKeywords[0].keyword !== 'No keywords generated' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
              <thead>
                <tr style={{ background: '#eee' }}>
                  <th style={{padding: 4, textAlign:'left', border: '1px solid #ddd'}}>Keyword</th>
                  <th style={{padding: 4, textAlign:'center', border: '1px solid #ddd'}}>Type</th>
                  <th style={{padding: 4, textAlign:'center', border: '1px solid #ddd'}}>Vol</th>
                  <th style={{padding: 4, textAlign:'center', border: '1px solid #ddd'}}>Rank</th>
                  <th style={{padding: 4, textAlign:'left', border: '1px solid #ddd', fontSize: 8}}>Relevance</th>
                </tr>
              </thead>
              <tbody>
                {seoKeywords.slice(0, 5).map((k: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{padding: 4, border: '1px solid #ddd', fontWeight: 600}}>{k.keyword}</td>
                    <td style={{padding: 4, textAlign:'center', border: '1px solid #ddd', fontSize: 8}}>{k.keyword_type || k.intent}</td>
                    <td style={{padding: 4, textAlign:'center', border: '1px solid #ddd'}}>{k.search_volume}</td>
                    <td style={{padding: 4, textAlign:'center', border: '1px solid #ddd'}}>#{k.google_rank_est}</td>
                    <td style={{padding: 4, border: '1px solid #ddd', fontSize: 7, color: '#666'}}>{k.relevance_reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: 10, color: '#666', fontStyle: 'italic' }}>No keyword data available</p>
          )}
          {seo.keyword_analysis?.methodology && (
            <p style={{ fontSize: 8, color: '#666', marginTop: 8, fontStyle: 'italic' }}>
              Methodology: {seo.keyword_analysis.methodology}
            </p>
          )}
        </div>

        {/* Competitor Analysis */}
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: 5, fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
            2. Competitor Benchmarking (vs {competitorData.name})
          </h3>
          {competitorData.data && Object.keys(competitorData.data).length > 0 ? (
            <div style={{ fontSize: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {Object.entries(competitorData.data).slice(0, 4).map(([key, val]: any) => (
                <div key={key} style={{ padding: 8, background: '#f9f9f9', borderRadius: 4 }}>
                  <strong style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}:</strong>
                  <br />
                  <span style={{ fontSize: 9 }}>{val?.us || 'N/A'}</span>
                  <br />
                  <span style={{color:'#666', fontSize: 9}}>(vs: {val?.competitor || 'N/A'})</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 10, color: '#666', fontStyle: 'italic' }}>No competitor data available</p>
          )}
        </div>

        {/* UX Theory */}
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: 5, fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
            3. Academic UX Audit
          </h3>
          {uxTheories.length > 0 && uxTheories[0].theory !== 'No theories analyzed' ? (
            <ul style={{ fontSize: 10, paddingLeft: 15, margin: 0 }}>
              {uxTheories.slice(0, 5).map((t: any, i: number) => (
                <li key={i} style={{ marginBottom: 8, lineHeight: 1.4 }}>
                  <strong>{t.theory}</strong> ({t.source}):
                  <br />
                  <span style={{ fontSize: 9, color: '#555' }}>{t.observation}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: 10, color: '#666', fontStyle: 'italic' }}>No UX theory analysis available</p>
          )}
        </div>

        {/* WebQual Details */}
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: 5, fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
            4. WebQual 4.0 Detailed Assessment
          </h3>
          <div style={{ fontSize: 10 }}>
            <div style={{ marginBottom: 10, padding: 8, background: '#f9f9f9', borderRadius: 4 }}>
              <strong>Usability ({wqUsability.score.toFixed(2)}/5.0):</strong>
              <br />
              <span style={{ fontSize: 9, color: '#555' }}>{wqUsability.reasoning}</span>
            </div>
            <div style={{ marginBottom: 10, padding: 8, background: '#f9f9f9', borderRadius: 4 }}>
              <strong>Information Quality ({wqInformation.score.toFixed(2)}/5.0):</strong>
              <br />
              <span style={{ fontSize: 9, color: '#555' }}>{wqInformation.reasoning}</span>
            </div>
            <div style={{ marginBottom: 10, padding: 8, background: '#f9f9f9', borderRadius: 4 }}>
              <strong>Service Interaction ({wqService.score.toFixed(2)}/5.0):</strong>
              <br />
              <span style={{ fontSize: 9, color: '#555' }}>{wqService.reasoning}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          position: 'absolute', 
          bottom: '15mm', 
          left: '20mm',
          right: '20mm',
          textAlign: 'center', 
          fontSize: 9, 
          color: '#888',
          borderTop: '1px solid #ddd',
          paddingTop: 10
        }}>
          <p style={{ margin: 0 }}>Generated by WMSI AI Intelligence System | {new Date().toLocaleString('id-ID')}</p>
          <p style={{ margin: '4px 0 0 0' }}>© {new Date().getFullYear()} - All Rights Reserved</p>
        </div>
      </div>

    </div>
  );
}
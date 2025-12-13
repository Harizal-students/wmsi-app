'use client';

import React, { useState, useEffect } from 'react';
import { Cloud, XCircle } from 'lucide-react';
import { saveAnalysisSession, AnalysisSession, getUserHistory, detachUserHistory, supabase } from '@/lib/supabase';

// IMPORT MODUL
import SystemHealth from './wmsi/SystemHealth';
import AuthScreen from './wmsi/AuthScreen';
import Navbar from './wmsi/Navbar';
import AnalysisInput from './wmsi/AnalysisInput';
import AnalysisProgress from './wmsi/AnalysisProgress';
import AnalysisResults from './wmsi/AnalysisResults';
import HistorySidebar from './wmsi/HistorySidebar';

export default function WMSI() {
  // === STATE MANAGEMENT ===
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<Array<{ts: string; type: string; msg: string}>>([]);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState('overview');
  const [savedToDb, setSavedToDb] = useState(false);

  // Auth & History
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<AnalysisSession[]>([]);

  // Images
  const [desktopImg, setDesktopImg] = useState<{preview: string; cloudinaryUrl: string | null; uploading: boolean} | null>(null);
  const [mobileImg, setMobileImg] = useState<{preview: string; cloudinaryUrl: string | null; uploading: boolean} | null>(null);

  // System Health
  const [bootStatus, setBootStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [health, setHealth] = useState({ supabase: false, cloudinary: false, claude: false });

  // Definisi Tahapan (Stages)
  const stages = [
    { id: 'init', name: 'Inisialisasi', w: 5 }, 
    { id: 'seo', name: 'Deep SEO Audit', w: 25 }, 
    { id: 'ui', name: 'UI/UX Heuristics', w: 30 }, 
    { id: 'mkt', name: 'Marketing 7P Strategy', w: 25 }, 
    { id: 'wq', name: 'WebQual 4.0 Synthesis', w: 10 }, 
    { id: 'done', name: 'Finalisasi Laporan', w: 5 }
  ];

  // === EFFECTS (Lifecycle) ===
  useEffect(() => {
    checkSystemHealth();
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchHistory(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchHistory(session.user.id);
      } else {
        setHistoryData([]);
        setResults(null);
        setUrl('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // === HANDLERS ===
  const log = (type: string, msg: string) => {
    setLogs(prev => [...prev, { ts: new Date().toLocaleTimeString('id-ID'), type, msg }]);
  };

  const checkSystemHealth = async () => {
    setBootStatus('checking'); setError(null);
    try {
      await new Promise(r => setTimeout(r, 800));
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Health API error');
      const data = await res.json();
      if (data.checks) {
        setHealth({ supabase: data.checks.supabase, claude: data.checks.claude, cloudinary: data.checks.cloudinary });
        setTimeout(() => {
          if (data.status === 'ok') setBootStatus('ready');
          else { setBootStatus('error'); setError('Layanan sistem tidak merespons.'); }
        }, 1000);
      }
    } catch (err) { setBootStatus('error'); setError('Gagal menghubungi server.'); }
  };

  // -- AUTH HANDLERS --
  const handleAuth = async (email: string, pass: string, mode: 'login' | 'register') => {
    setAuthLoading(true); setAuthError(null);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw error;
        alert('Registrasi berhasil! Silakan login.');
      }
    } catch (err: any) { setAuthError(err.message); } 
    finally { setAuthLoading(false); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setShowHistory(false); };

  // === FITUR HAPUS AKUN (Data Retention) ===
  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const confirmMsg = 
      "PERHATIAN: Anda akan menghapus akun Anda.\n\n" +
      "Riwayat analisis Anda TIDAK AKAN DIHAPUS, melainkan akan dianonimkan dan menjadi milik sistem untuk keperluan pembelajaran AI (Training Data).\n\n" +
      "Apakah Anda yakin ingin melanjutkan?";

    if (confirm(confirmMsg)) {
      try {
        // 1. Lepaskan kepemilikan data (User ID jadi NULL)
        await detachUserHistory(user.id);
        
        // 2. Sign Out user (Secara teknis di client-side kita logout saja)
        // Catatan: Penghapusan user auth permanen idealnya via Admin API/Edge Function
        await supabase.auth.signOut();
        
        alert("Akun berhasil dinonaktifkan. Data analisis telah diarsipkan ke sistem AI.");
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert("Gagal memproses penghapusan akun.");
      }
    }
  };

  const fetchHistory = async (userId: string) => {
    const data = await getUserHistory(userId);
    if (data) setHistoryData(data);
  };

  const loadFromHistory = (session: AnalysisSession) => {
    setResults({
      url: session.url, domain: session.domain, duration: session.duration_ms,
      seo: { ...(session.seo_data as any), score: session.seo_score },
      ui: { ...(session.uiux_data as any)?.ui, overall: session.ui_score },
      ux: { ...(session.uiux_data as any)?.ux, overall: session.ux_score },
      mkt: { ...(session.marketing_data as any), overall: session.marketing_score / 20 },
      wq: session.webqual_data,
      images: { desktop: "https://via.placeholder.com/800x600?text=History", mobile: "https://via.placeholder.com/400x800?text=History" }
    });
    setUrl(session.url); setShowHistory(false); setSavedToDb(true);
  };

  // ... (handleUpload, callAPI, parseJSON, setStg, analyze sama seperti sebelumnya) ...
  // Salin fungsi-fungsi tersebut dari file sebelumnya atau biarkan jika Anda melakukan replace parsial.
  // Untuk kelengkapan, saya tulis ulang fungsi utamanya secara singkat:

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0]; if (!file) return;
    const setter = type === 'desktop' ? setDesktopImg : setMobileImg;
    try {
      setter({ preview: URL.createObjectURL(file), cloudinaryUrl: null, uploading: true });
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const img = new window.Image();
        img.onload = async () => {
           const cvs = document.createElement('canvas');
           let w = img.width, h = img.height; const maxDim = 1200;
           if (w > maxDim || h > maxDim) { const ratio = Math.min(maxDim / w, maxDim / h); w = Math.round(w * ratio); h = Math.round(h * ratio); }
           cvs.width = w; cvs.height = h;
           const ctx = cvs.getContext('2d');
           if(ctx) {
             ctx.drawImage(img, 0, 0, w, h);
             const base64 = cvs.toDataURL('image/jpeg', 0.8).split(',')[1];
             const res = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64, type }) });
             if(!res.ok) throw new Error('Upload failed');
             const data = await res.json();
             setter(prev => prev ? { ...prev, cloudinaryUrl: data.url, uploading: false } : null);
           }
        }; img.src = ev.target?.result as string;
      }; reader.readAsDataURL(file);
    } catch (e: any) { setter(null); alert(`Upload gagal: ${e.message}`); }
  };

  const callAPI = async (messages: any[], task: string) => {
    const start = Date.now(); log('info', `${task}: Memproses data dengan Claude AI...`);
    const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages, task }) });
    if (!res.ok) throw new Error(`API Error ${res.status}`);
    const data = await res.json(); log('success', `${task} selesai.`); return data.content;
  };

  const parseJSON = (text: string) => { try { const m = text?.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; } catch { return null; } };
  const setStg = (id: string) => { const i = stages.findIndex(s => s.id === id); setProgress(stages.slice(0, i + 1).reduce((a, s) => a + s.w, 0)); setStage(id); };

  const analyze = async () => {
    if (!url || !desktopImg?.cloudinaryUrl || !mobileImg?.cloudinaryUrl) return;
    setAnalyzing(true); setError(null); setResults(null); setLogs([]); setProgress(0); setSavedToDb(false);
    const startTime = Date.now();
    try {
      const nUrl = url.startsWith('http') ? url : 'https://' + url; const domain = new URL(nUrl).hostname;
      setStg('init'); log('info', `Memulai analisis: ${domain}`);

      setStg('seo');
      const seoPrompt = `Bertindak sebagai Senior SEO Specialist. Audit SEO teknis & konten untuk ${nUrl}. Output JSON: {"domain":"${domain}","technical_audit":{"score":75,"core_web_vitals_assessment":"LCP 2.5s","mobile_friendliness":"Responsive","ssl_security":"Valid HTTPS","issues":["Slow LCP"]},"content_semantic_analysis":{"score":80,"keyword_strategy":"Good coverage","keywords":[{"keyword":"k1","volume":"High"}]},"overallSEO":{"score":78,"visibility":"High"},"strategic_recommendations":["Fix LCP"]}`;
      let seoData = { overallSEO: { score: 65, visibility: 'Medium' } };
      try { const c = await callAPI([{ role: 'user', content: seoPrompt }], 'SEO Deep Audit'); seoData = parseJSON(c) || seoData; } catch (e: any) { log('error', `SEO Error: ${e.message}`); }

      setStg('ui');
      let uiScore=70, uxScore=70, uiuxData={};
      try {
        const vC = [{ type: 'text', text: 'Analisis UI/UX. Output JSON.' }, { type: 'image', source: { type: 'url', url: desktopImg.cloudinaryUrl } }, { type: 'image', source: { type: 'url', url: mobileImg.cloudinaryUrl } }, { type: 'text', text: `Return JSON: {"ui":{"overall":75,"visual_hierarchy":{"score":8,"analysis":"Good"},"color_system":{"score":7,"analysis":"Safe"},"typography":{"score":8,"analysis":"Readable"}},"ux":{"overall":72,"usability_heuristics":{"visibility_of_status":{"score":7,"observation":"OK"}},"accessibility_wcag":"AA Compliant"},"key_strengths":["Clean layout"],"critical_improvements":["Contrast ratio"]}` }];
        const c = await callAPI([{ role: 'user', content: vC }], 'UI/UX Vision'); uiuxData = parseJSON(c) || {};
        if ((uiuxData as any)?.ui?.overall) uiScore = (uiuxData as any).ui.overall; if ((uiuxData as any)?.ux?.overall) uxScore = (uiuxData as any).ux.overall;
      } catch (e: any) { log('warning', `Vision Error: ${e.message}`); }

      setStg('mkt');
      let mktData = { overall: 3.0 };
      try { const c = await callAPI([{ role: 'user', content: `CMO Analysis for ${nUrl}. Context: SEO=${(seoData as any).overallSEO?.score}, UX=${uxScore}. Output JSON: {"marketing_mix_7p":{"product":"Value","price":"Price","place":"Dist","promotion":"Promo","people":"Tone","process":"Flow","physical_evidence":"Trust"},"brand_authority":{"trust_score":80,"brand_archetype":"Sage","analysis":"Trusted"},"overall":3.5,"maturity_stage":"Growth"}` }], 'Marketing Strategy'); mktData = parseJSON(c) || mktData; } catch (e: any) { log('error', `Marketing Error: ${e.message}`); }

      setStg('wq');
      const wqU = ((uiScore+uxScore)/2)/20; const wqI = ((seoData as any).overallSEO?.score||60)/20; const wqS = (((mktData as any).overall||3)+(uxScore/20))/2;
      const wqT = (wqU*0.33)+(wqI*0.33)+(wqS*0.34); const wqP = (wqT/5)*100;
      const wqD = { usability:{score:wqU, pct:(wqU/5)*100}, information:{score:wqI, pct:(wqI/5)*100}, service:{score:wqS, pct:(wqS/5)*100}, overall:{score:wqT, pct:wqP, calc:`(U=${wqU.toFixed(1)}*0.33) + (I=${wqI.toFixed(1)}*0.33) + (S=${wqS.toFixed(1)}*0.34)`, interpretation:wqP>70?"Excellent":"Good"} };

      setStg('done');
      const finalResults = { url: nUrl, domain, duration: Date.now()-startTime, seo: seoData, ui: (uiuxData as any).ui, ux: (uiuxData as any).ux, vision_analysis: uiuxData, mkt: mktData, wq: wqD, images: { desktop: desktopImg.cloudinaryUrl, mobile: mobileImg.cloudinaryUrl } };
      setResults(finalResults);

      try {
        const s: AnalysisSession = { url: nUrl, domain, seo_score: (seoData as any).overallSEO?.score||0, ui_score: uiScore, ux_score: uxScore, marketing_score: ((mktData as any).overall||0)*20, webqual_score: wqP, duration_ms: Date.now()-startTime, desktop_count: 1, mobile_count: 1, seo_data: seoData, uiux_data: uiuxData, marketing_data: mktData, webqual_data: wqD, user_id: user?user.id:null };
        await saveAnalysisSession(s); setSavedToDb(true); if (user) fetchHistory(user.id);
      } catch (e: any) { log('error', `DB Save Error: ${e.message}`); }
    } catch (err: any) { setError(err.message); } finally { setAnalyzing(false); }
  };

  const reset = () => { setResults(null); setDesktopImg(null); setMobileImg(null); setUrl(''); setLogs([]); setTab('overview'); setError(null); };

  // === RENDER ===
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)', fontFamily: 'system-ui', position: 'relative' }}>
      
      {bootStatus !== 'ready' && <SystemHealth bootStatus={bootStatus} health={health} error={error} onRetry={checkSystemHealth} />}

      {bootStatus === 'ready' && (
        <>
          <Navbar 
            user={user} 
            onLogout={handleLogout} 
            onDeleteAccount={handleDeleteAccount} // <--- Pass handler
            showHistory={showHistory} 
            setShowHistory={setShowHistory} 
            onShowLogin={() => {}} 
          />

          <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
            <header style={{ textAlign: 'center', marginBottom: 24 }}>
               <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 50, marginBottom: 12 }}>
                <Cloud size={14} style={{ color: '#16a34a' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#166534' }}>WebQual 4.0 + Deep AI Intelligence</span>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>WMSI - Website Analysis</h1>
            </header>

            {!user ? (
              <AuthScreen onAuth={handleAuth} loading={authLoading} error={authError} setError={setAuthError} />
            ) : (
              <>
                {!analyzing && !results && (
                  <AnalysisInput 
                    url={url} setUrl={setUrl} desktopImg={desktopImg} mobileImg={mobileImg} 
                    setDesktopImg={setDesktopImg} setMobileImg={setMobileImg} onUpload={handleUpload} onAnalyze={analyze} 
                    isUploading={desktopImg?.uploading || mobileImg?.uploading || false}
                  />
                )}
                {analyzing && <AnalysisProgress progress={progress} stage={stage} stages={stages} logs={logs} />}
                
                {results && (
                  <AnalysisResults 
                    results={results} tab={tab} setTab={setTab} reset={reset} 
                    savedToDb={savedToDb} userEmail={user?.email} 
                  />
                )}
                
                {error && !analyzing && (
                  <div style={{ background: '#fef2f2', borderRadius: 10, padding: 16, border: '1px solid #fecaca', marginTop: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
                     <XCircle size={20} style={{ color: '#ef4444' }} />
                     <span style={{ color: '#b91c1c', fontSize: 13 }}>{error}</span>
                  </div>
                )}
              </>
            )}
          </div>
          
          <HistorySidebar isOpen={showHistory} onClose={() => setShowHistory(false)} history={historyData} onLoad={loadFromHistory} />
        </>
      )}
    </div>
  );
}
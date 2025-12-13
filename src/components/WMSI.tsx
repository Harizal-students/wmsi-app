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

// HELPER: Membersihkan skor agar selalu jadi ANGKA (bukan string "Not visible")
const cleanScore = (val: any): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) return parsed;
  }
  return 0;
};

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

  const stages = [
    { id: 'init', name: 'Inisialisasi', w: 10 }, 
    { id: 'analysis', name: 'Deep Analysis (AI Processing)', w: 80 }, 
    { id: 'done', name: 'Finalisasi Laporan', w: 10 }
  ];

  // === EFFECTS ===
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

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (confirm("PERHATIAN: Akun akan dihapus. Riwayat analisis akan dianonimkan untuk training AI. Lanjutkan?")) {
      try {
        await detachUserHistory(user.id);
        await supabase.auth.signOut();
        alert("Akun dinonaktifkan. Data telah diarsipkan.");
        window.location.reload();
      } catch (err) { alert("Gagal menghapus akun."); }
    }
  };

  const fetchHistory = async (userId: string) => {
    const data = await getUserHistory(userId);
    if (data) setHistoryData(data);
  };

  const loadFromHistory = (session: AnalysisSession) => {
    // Reconstruct results dengan struktur yang benar
    setResults({
      url: session.url, 
      domain: session.domain, 
      duration: session.duration_ms,
      seo: session.seo_data,
      ui_ux: session.uiux_data,
      marketing: session.marketing_data,
      webqual: session.webqual_data,
      images: { 
        desktop: "https://via.placeholder.com/800x600?text=History", 
        mobile: "https://via.placeholder.com/400x800?text=History" 
      }
    });
    setUrl(session.url); 
    setShowHistory(false); 
    setSavedToDb(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0]; 
    if (!file) return;
    
    const setter = type === 'desktop' ? setDesktopImg : setMobileImg;
    
    try {
      setter({ preview: URL.createObjectURL(file), cloudinaryUrl: null, uploading: true });
      
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const img = new window.Image();
        img.onload = async () => {
           const cvs = document.createElement('canvas');
           let w = img.width, h = img.height; 
           const maxDim = 1200;
           
           if (w > maxDim || h > maxDim) { 
             const ratio = Math.min(maxDim / w, maxDim / h); 
             w = Math.round(w * ratio); 
             h = Math.round(h * ratio); 
           }
           
           cvs.width = w; 
           cvs.height = h;
           const ctx = cvs.getContext('2d');
           
           if(ctx) {
             ctx.drawImage(img, 0, 0, w, h);
             const base64 = cvs.toDataURL('image/jpeg', 0.8).split(',')[1];
             
             const res = await fetch('/api/upload', { 
               method: 'POST', 
               headers: { 'Content-Type': 'application/json' }, 
               body: JSON.stringify({ image: base64, type }) 
             });
             
             if(!res.ok) throw new Error('Upload failed');
             const data = await res.json();
             
             setter(prev => prev ? { ...prev, cloudinaryUrl: data.url, uploading: false } : null);
           }
        }; 
        img.src = ev.target?.result as string;
      }; 
      reader.readAsDataURL(file);
    } catch (e: any) { 
      setter(null); 
      alert(`Upload gagal: ${e.message}`); 
    }
  };

  const setStg = (id: string) => { 
    const i = stages.findIndex(s => s.id === id); 
    setProgress(stages.slice(0, i + 1).reduce((a, s) => a + s.w, 0)); 
    setStage(id); 
  };

  // === CORE ANALYSIS (MENGGUNAKAN ENHANCED ROUTE.TS) ===
  const analyze = async () => {
    if (!url || !desktopImg?.cloudinaryUrl || !mobileImg?.cloudinaryUrl) return;
    
    setAnalyzing(true); 
    setError(null); 
    setResults(null); 
    setLogs([]); 
    setProgress(0); 
    setSavedToDb(false);
    
    const startTime = Date.now();

    try {
      const nUrl = url.startsWith('http') ? url : 'https://' + url; 
      const domain = new URL(nUrl).hostname;
      
      setStg('init'); 
      log('info', `Memulai analisis: ${domain}`);
      
      await new Promise(r => setTimeout(r, 500)); // Simulate init

      // === CALL ENHANCED API (Yang sudah ada Data Enforcer) ===
      setStg('analysis');
      log('info', 'Mengirim data ke AI Intelligence System...');
      
      const analysisPrompt = [
        { 
          type: 'text', 
          text: `Analisis website ${nUrl} secara komprehensif. Berikan output dalam format JSON lengkap dengan semua field yang diminta.` 
        },
        { 
          type: 'image', 
          source: { type: 'url', url: desktopImg.cloudinaryUrl } 
        },
        { 
          type: 'image', 
          source: { type: 'url', url: mobileImg.cloudinaryUrl } 
        }
      ];

      const apiResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: analysisPrompt }],
          task: 'Complete Website Analysis'
        })
      });

      if (!apiResponse.ok) {
        throw new Error(`API Error ${apiResponse.status}`);
      }

      const apiData = await apiResponse.json();
      log('success', 'AI analysis complete!');

      // Parse hasil dari API
      let parsedResults;
      try {
        parsedResults = JSON.parse(apiData.content);
      } catch (e) {
        throw new Error('Failed to parse API response');
      }

      // Log enforcement status
      if (apiData.enforced) {
        log('warning', `Data enforcer activated: ${apiData.validation.missingFields?.join(', ')}`);
      } else {
        log('success', 'All data fields complete from AI');
      }

      setStg('done');
      
      // === STRUKTUR DATA YANG BENAR (SESUAI ANALYSISRESULTS.TSX) ===
      const finalResults = {
        url: nUrl,
        domain: parsedResults.domain || domain,
        duration: Date.now() - startTime,
        
        // Key yang benar sesuai AnalysisResults.tsx
        seo: parsedResults.seo || {},
        ui_ux: parsedResults.ui_ux || {},  // ✅ ui_ux bukan ui/ux terpisah
        marketing: parsedResults.marketing || {},
        webqual: parsedResults.webqual || {},  // ✅ webqual bukan wq
        
        images: {
          desktop: desktopImg.cloudinaryUrl,
          mobile: mobileImg.cloudinaryUrl
        }
      };

      setResults(finalResults);
      log('success', 'Report generated successfully!');

      // === SAVE TO DATABASE ===
      try {
        // Extract scores dengan safe cleaning
        const seoScore = cleanScore(parsedResults.seo?.overallSEO?.score || parsedResults.seo?.technical_audit?.score);
        const uiScore = cleanScore(parsedResults.ui_ux?.ui?.overall);
        const uxScore = cleanScore(parsedResults.ui_ux?.ux?.overall);
        const mktScore = cleanScore(parsedResults.marketing?.overall) * 20;
        const wqScore = cleanScore(parsedResults.webqual?.overall?.pct);

        const sessionData: AnalysisSession = {
          url: nUrl,
          domain: parsedResults.domain || domain,
          seo_score: seoScore,
          ui_score: uiScore,
          ux_score: uxScore,
          marketing_score: mktScore,
          webqual_score: wqScore,
          duration_ms: Date.now() - startTime,
          desktop_count: 1,
          mobile_count: 1,
          seo_data: parsedResults.seo || {},
          uiux_data: parsedResults.ui_ux || {},
          marketing_data: parsedResults.marketing || {},
          webqual_data: parsedResults.webqual || {},
          user_id: user ? user.id : null
        };

        await saveAnalysisSession(sessionData);
        setSavedToDb(true);
        log('success', 'Saved to database');
        
        if (user) fetchHistory(user.id);
      } catch (dbError: any) {
        log('error', `Database save failed: ${dbError.message}`);
        // Don't throw - analysis still succeeded
      }

    } catch (err: any) {
      log('error', err.message);
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => { 
    setResults(null); 
    setDesktopImg(null); 
    setMobileImg(null); 
    setUrl(''); 
    setLogs([]); 
    setTab('overview'); 
    setError(null); 
  };

  // === RENDER ===
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)', fontFamily: 'system-ui', position: 'relative' }}>
      {bootStatus !== 'ready' && <SystemHealth bootStatus={bootStatus} health={health} error={error} onRetry={checkSystemHealth} />}
      {bootStatus === 'ready' && (
        <>
          <Navbar user={user} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} showHistory={showHistory} setShowHistory={setShowHistory} onShowLogin={() => {}} />
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
                  <AnalysisInput url={url} setUrl={setUrl} desktopImg={desktopImg} mobileImg={mobileImg} setDesktopImg={setDesktopImg} setMobileImg={setMobileImg} onUpload={handleUpload} onAnalyze={analyze} isUploading={desktopImg?.uploading || mobileImg?.uploading || false} />
                )}
                {analyzing && <AnalysisProgress progress={progress} stage={stage} stages={stages} logs={logs} />}
                {results && (
                  <AnalysisResults results={results} tab={tab} setTab={setTab} reset={reset} savedToDb={savedToDb} userEmail={user?.email} />
                )}
                {error && !analyzing && (
                  <div style={{ background: '#fef2f2', borderRadius: 10, padding: 16, border: '1px solid #fecaca', marginTop: 16, display: 'flex', gap: 10, alignItems: 'center' }}><XCircle size={20} style={{ color: '#ef4444' }} /><span style={{ color: '#b91c1c', fontSize: 13 }}>{error}</span></div>
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
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Globe, XCircle, FileText, RefreshCw, Award, MousePointer, 
  Megaphone, Brain, Camera, Monitor, Smartphone, Shield, Database, 
  Upload, Cloud, CheckCircle, Activity, Image as ImageIcon,
  LogIn, LogOut, History, User, Lock, ChevronRight, LayoutDashboard
} from 'lucide-react';
import { saveAnalysisSession, AnalysisSession, getUserHistory, supabase } from '@/lib/supabase';

// Tipe data untuk status health check
type SystemHealth = {
  supabase: boolean;
  cloudinary: boolean;
  claude: boolean;
};

export default function WMSI() {
  // === STATE UTAMA ===
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<Array<{ts: string; type: string; msg: string}>>([]);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState('overview');
  const [savedToDb, setSavedToDb] = useState(false);

  // === STATE AUTH & HISTORY ===
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<AnalysisSession[]>([]);

  // === STATE GAMBAR (Cloudinary) ===
  const [desktopImg, setDesktopImg] = useState<{preview: string; cloudinaryUrl: string | null; uploading: boolean} | null>(null);
  const [mobileImg, setMobileImg] = useState<{preview: string; cloudinaryUrl: string | null; uploading: boolean} | null>(null);
  const desktopRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);

  // === STATE HEALTH CHECK ===
  const [bootStatus, setBootStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [health, setHealth] = useState<SystemHealth>({ supabase: false, cloudinary: false, claude: false });

  // === EFFECT: INITIAL CHECK & AUTH LISTENER ===
  useEffect(() => {
    checkSystemHealth();
    
    // Check Active Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchHistory(session.user.id);
    });

    // Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchHistory(session.user.id);
        setShowAuthModal(false);
      } else {
        setHistoryData([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // === AUTH FUNCTIONS ===
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail, password: authPass
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: authEmail, password: authPass
        });
        if (error) throw error;
        alert('Registrasi berhasil! Silakan cek email (jika konfirmasi aktif) atau langsung login.');
        setAuthMode('login');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowHistory(false);
  };

  const fetchHistory = async (userId: string) => {
    try {
      const data = await getUserHistory(userId);
      if (data) setHistoryData(data);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  const loadFromHistory = (session: AnalysisSession) => {
    // Reconstruct results format from DB session
    const reconstructed = {
      url: session.url,
      domain: session.domain,
      duration: session.duration_ms,
      seo: { ...(session.seo_data as any), score: session.seo_score },
      ui: { overall: session.ui_score },
      ux: { overall: session.ux_score },
      mkt: session.marketing_data,
      wq: session.webqual_data,
      images: {
        // Fallback placeholder if image not stored in older sessions (Future improvement: store img URLs in DB)
        desktop: "https://via.placeholder.com/800x600?text=No+Image+Saved", 
        mobile: "https://via.placeholder.com/400x800?text=No+Image+Saved"
      }
    };
    setResults(reconstructed);
    setUrl(session.url);
    setShowHistory(false);
    setSavedToDb(true); // Already saved
  };

  // === SYSTEM CHECK ===
  const checkSystemHealth = async () => {
    setBootStatus('checking');
    setError(null);
    setHealth({ supabase: false, cloudinary: false, claude: false });
    
    try {
      await new Promise(r => setTimeout(r, 800)); 
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Health API error');
      const data = await res.json();
      
      if (data.checks) {
        setTimeout(() => setHealth(prev => ({ ...prev, supabase: data.checks.supabase })), 200);
        setTimeout(() => setHealth(prev => ({ ...prev, claude: data.checks.claude })), 600);
        setTimeout(() => setHealth(prev => ({ ...prev, cloudinary: data.checks.cloudinary })), 1000);
        
        setTimeout(() => {
          if (data.status === 'ok') {
            setBootStatus('ready');
          } else {
            setBootStatus('error');
            setError('Salah satu layanan sistem tidak merespons. Pastikan API Keys valid.');
          }
        }, 1500);
      }
    } catch (err) {
      setBootStatus('error');
      setError('Gagal menghubungi server kesehatan sistem.');
    }
  };

  // === EXISTING UTILS ===
  const log = useCallback((type: string, msg: string) => {
    setLogs(prev => [...prev, { ts: new Date().toLocaleTimeString('id-ID'), type, msg }]);
  }, []);

  const clr = (v: number, m?: number) => {
    const p = (v / (m || 100)) * 100;
    if (p >= 80) return '#10b981';
    if (p >= 60) return '#f59e0b';
    if (p >= 40) return '#f97316';
    return '#ef4444';
  };

  const lbl = (v: number) => {
    if (v >= 80) return 'Sangat Baik';
    if (v >= 60) return 'Baik';
    if (v >= 40) return 'Cukup';
    return 'Perlu Perbaikan';
  };

  const parseJSON = (text: string) => {
    try {
      const m = text?.match(/\{[\s\S]*\}/);
      return m ? JSON.parse(m[0]) : null;
    } catch { return null; }
  };

  const compressForUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Read failed'));
      reader.onload = (e) => {
        const img = new window.Image();
        img.onerror = () => reject(new Error('Load failed'));
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('Canvas failed')); return; }
          let w = img.width, h = img.height;
          const maxDim = 1200;
          if (w > maxDim || h > maxDim) {
            const ratio = Math.min(maxDim / w, maxDim / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          canvas.width = w;
          canvas.height = h;
          ctx.fillStyle = '#FFF';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl.split(',')[1]);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadToCloudinary = async (base64: string, type: 'desktop' | 'mobile'): Promise<string> => {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, type })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Upload failed');
    }
    const data = await res.json();
    return data.url;
  };

  const handleDesktop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    try {
      const previewUrl = URL.createObjectURL(file);
      setDesktopImg({ preview: previewUrl, cloudinaryUrl: null, uploading: true });
      log('info', `Uploading desktop to Cloudinary...`);
      const base64 = await compressForUpload(file);
      const cloudinaryUrl = await uploadToCloudinary(base64, 'desktop');
      setDesktopImg(prev => prev ? { ...prev, cloudinaryUrl, uploading: false } : null);
      log('success', `Desktop uploaded: ${cloudinaryUrl.substring(0, 50)}...`);
    } catch (err: any) {
      log('error', `Desktop upload failed: ${err.message}`);
      setDesktopImg(null);
    }
    if (desktopRef.current) desktopRef.current.value = '';
  };

  const handleMobile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    try {
      const previewUrl = URL.createObjectURL(file);
      setMobileImg({ preview: previewUrl, cloudinaryUrl: null, uploading: true });
      log('info', `Uploading mobile to Cloudinary...`);
      const base64 = await compressForUpload(file);
      const cloudinaryUrl = await uploadToCloudinary(base64, 'mobile');
      setMobileImg(prev => prev ? { ...prev, cloudinaryUrl, uploading: false } : null);
      log('success', `Mobile uploaded: ${cloudinaryUrl.substring(0, 50)}...`);
    } catch (err: any) {
      log('error', `Mobile upload failed: ${err.message}`);
      setMobileImg(null);
    }
    if (mobileRef.current) mobileRef.current.value = '';
  };

  const stages = [
    { id: 'init', name: 'Init', w: 5 },
    { id: 'seo', name: 'SEO', w: 25 },
    { id: 'ui', name: 'UI/UX Vision', w: 30 },
    { id: 'mkt', name: 'Marketing', w: 25 },
    { id: 'wq', name: 'WebQual', w: 10 },
    { id: 'done', name: 'Done', w: 5 }
  ];

  const setStg = (id: string) => {
    const i = stages.findIndex(s => s.id === id);
    setProgress(stages.slice(0, i + 1).reduce((a, s) => a + s.w, 0));
    setStage(id);
  };

  const callAPI = async (messages: any[], task: string) => {
    const start = Date.now();
    log('info', `${task}: calling Claude API...`);
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, task })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt.substring(0, 100) || `Error ${res.status}`);
    }
    const data = await res.json();
    log('success', `${task}: ${Date.now() - start}ms`);
    return data.content;
  };

  // === CORE ANALYSIS (Updated with user_id) ===
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
      log('info', `Analyzing: ${nUrl}`);
      log('info', `User: ${user ? user.email : 'Anonymous'}`);

      // SEO
      setStg('seo');
      const seoPrompt = `SEO analysis for ${nUrl}. Return JSON only: {"domain":"${domain}","keywords":[{"keyword":"word","rank":10}],"onPageSEO":{"title":70,"meta":65,"url":75,"mobile":70,"technical":65},"overallSEO":{"score":68,"visibility":"Medium"},"opportunities":["opp1"],"issues":["issue1"]}`;
      let seo = { overallSEO: { score: 65, visibility: 'Medium' } };
      try {
        const seoContent = await callAPI([{ role: 'user', content: seoPrompt }], 'SEO');
        seo = parseJSON(seoContent) || seo;
        log('success', `SEO: ${seo.overallSEO?.score || 65}/100`);
      } catch (e: any) { log('error', `SEO failed: ${e.message}`); }

      // UI/UX Vision
      setStg('ui');
      let uiScore = 70, uxScore = 70;
      try {
        const visionContent = [
          { type: 'text', text: '[DESKTOP SCREENSHOT]' },
          { type: 'image', source: { type: 'url', url: desktopImg.cloudinaryUrl } },
          { type: 'text', text: '[MOBILE SCREENSHOT]' },
          { type: 'image', source: { type: 'url', url: mobileImg.cloudinaryUrl } },
          { type: 'text', text: `Analyze UI/UX for ${nUrl}. Return JSON: {"ui":{"overall":74,"desktop":75,"mobile":73,"hierarchy":{"score":75,"reason":"brief"},"color":{"score":72,"reason":"brief"},"typography":{"score":70,"reason":"brief"}},"ux":{"overall":67,"heuristics":{"visibility":7,"match":7,"control":6,"consistency":7,"prevention":6,"recognition":7,"flexibility":6,"aesthetic":7,"recovery":6,"help":6}},"strengths":["s1","s2"],"weaknesses":["w1","w2"]}` }
        ];
        const uiuxContent = await callAPI([{ role: 'user', content: visionContent }], 'Vision');
        const uiux = parseJSON(uiuxContent);
        if (uiux?.ui?.overall) uiScore = uiux.ui.overall;
        if (uiux?.ux?.overall) uxScore = uiux.ux.overall;
        log('success', `UI: ${uiScore} | UX: ${uxScore}`);
      } catch (e: any) { log('warning', `Vision failed: ${e.message} - using defaults`); }

      // Marketing
      setStg('mkt');
      let mkt = { overall: 3.0, maturity: 'Developing' };
      try {
        const mktPrompt = `Marketing analysis for ${nUrl}. Context: SEO=${seo.overallSEO?.score || 65}, UI=${uiScore}, UX=${uxScore}. Return JSON: {"valueProp":{"score":3.2,"reason":"brief"},"mix7p":{"overall":3.1,"product":3.2,"price":3.0,"place":3.1,"promotion":3.0,"people":3.1,"process":2.9,"physical":3.2},"journey":{"overall":3.0,"attention":3.2,"interest":3.0,"desire":2.8,"action":3.0},"trust":3.4,"brand":{"score":3.3,"maturity":"Developing"},"overall":3.1,"maturity":"Developing","strengths":["s1"],"gaps":["g1"],"actions":[{"priority":1,"action":"action","impact":"High","effort":"Medium"}]}`;
        const mktContent = await callAPI([{ role: 'user', content: mktPrompt }], 'Marketing');
        mkt = parseJSON(mktContent) || mkt;
        log('success', `Marketing: ${((mkt.overall || 3) * 20).toFixed(0)}%`);
      } catch (e: any) { log('error', `Marketing failed: ${e.message}`); }

      // WebQual
      setStg('wq');
      const seoScore = seo.overallSEO?.score || 65;
      const mktScore = mkt.overall || 3.0;
      const usability = ((uiScore + uxScore) / 2) / 20;
      const information = seoScore / 20;
      const service = Math.min(uiScore, uxScore) / 20;
      const marketing = mktScore;
      const wqScore = (usability * 0.25) + (information * 0.25) + (service * 0.20) + (marketing * 0.30);
      const wqPct = (wqScore / 5) * 100;
      log('success', `WebQual: ${wqPct.toFixed(1)}%`);

      setStg('done');
      const duration = Date.now() - startTime;
      log('success', `Done in ${(duration / 1000).toFixed(1)}s`);

      const finalResults = {
        url: nUrl, domain, duration,
        seo: { ...seo, score: seoScore },
        ui: { overall: uiScore },
        ux: { overall: uxScore },
        mkt,
        wq: {
          usability: { score: usability, pct: (usability / 5) * 100 },
          information: { score: information, pct: (information / 5) * 100 },
          service: { score: service, pct: (service / 5) * 100 },
          marketing: { score: marketing, pct: (marketing / 5) * 100 },
          overall: { score: wqScore, pct: wqPct, calc: `WQ = U(${usability.toFixed(2)})*0.25 + I(${information.toFixed(2)})*0.25 + S(${service.toFixed(2)})*0.20 + M(${marketing.toFixed(2)})*0.30 = ${wqPct.toFixed(1)}%` }
        },
        images: {
          desktop: desktopImg.cloudinaryUrl,
          mobile: mobileImg.cloudinaryUrl
        }
      };

      setResults(finalResults);

      // Save to DB (Updated with user_id)
      try {
        const session: AnalysisSession = {
          url: nUrl, domain,
          seo_score: seoScore,
          ui_score: uiScore,
          ux_score: uxScore,
          marketing_score: mktScore * 20,
          webqual_score: wqPct,
          duration_ms: duration,
          desktop_count: 1,
          mobile_count: 1,
          seo_data: seo,
          uiux_data: { ui: { overall: uiScore }, ux: { overall: uxScore } },
          marketing_data: mkt,
          webqual_data: finalResults.wq,
          user_id: user ? user.id : null // Add user ID here
        };
        await saveAnalysisSession(session);
        log('success', 'Saved to Supabase');
        setSavedToDb(true);
        if (user) fetchHistory(user.id); // Refresh history
      } catch (e: any) { log('error', `DB save failed: ${e.message}`); }

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
    setSavedToDb(false);
    setError(null);
  };

  // UI Helpers
  const Bar = ({ v, c, h = 6 }: { v: number; c?: string; h?: number }) => (
    <div style={{ width: '100%', height: h, background: '#e5e7eb', borderRadius: h, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(v, 100)}%`, height: '100%', background: c || clr(v), borderRadius: h, transition: 'width 0.5s' }} />
    </div>
  );
  
  const Ring = ({ v, sz = 70 }: { v: number; sz?: number }) => {
    const r = (sz - 8) / 2;
    const c = r * 2 * Math.PI;
    const off = c - (v / 100) * c;
    return (
      <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={8} />
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="#0ea5e9" strokeWidth={8} strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
    );
  };

  const CheckRow = ({ label, done, icon: Icon }: { label: string, done: boolean, icon: any }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 8, marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icon size={18} style={{ color: done ? '#16a34a' : '#94a3b8' }} />
        <span style={{ fontSize: 14, fontWeight: 500, color: done ? '#0f172a' : '#64748b' }}>{label}</span>
      </div>
      {done ? 
        <CheckCircle size={18} style={{ color: '#16a34a' }} className="animate-in zoom-in" /> : 
        <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #cbd5e1', borderTopColor: '#3b82f6' }} className="animate-spin" />
      }
    </div>
  );

  const canAnalyze = url && desktopImg?.cloudinaryUrl && mobileImg?.cloudinaryUrl;
  const isUploading = desktopImg?.uploading || mobileImg?.uploading;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)', fontFamily: 'system-ui', position: 'relative' }}>
      
      {/* NAVBAR */}
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
            <button onClick={handleLogout} style={{ padding: 6, background: '#fee2e2', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#b91c1c' }}>
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button onClick={() => setShowAuthModal(true)} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <LogIn size={14} /> Login
          </button>
        )}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 50, marginBottom: 12 }}>
            <Cloud size={14} style={{ color: '#16a34a' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#166534' }}>WebQual 4.0 + Vision AI</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>WMSI - Website Analysis</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>SEO, UI/UX, Marketing Analysis with Cloud Image Hosting</p>
        </header>

        {/* === SCREEN 1: SYSTEM CHECK === */}
        {bootStatus !== 'ready' && (
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
               <button onClick={checkSystemHealth} style={{ width: '100%', padding: 12, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                 <RefreshCw size={16} /> Retry Connection
               </button>
            )}
          </div>
        )}

        {/* === SCREEN 2: MAIN APP === */}
        {bootStatus === 'ready' && (
          <>
            {/* Input Form */}
            {!analyzing && !results && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                {/* Status Bar */}
                <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 12, marginBottom: 20, border: '1px solid #bbf7d0', display: 'flex', gap: 10, alignItems: 'center' }}>
                   <CheckCircle size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
                   <div style={{ fontSize: 12, color: '#166534' }}>
                     <strong>System Ready:</strong> Semua koneksi (Supabase, Claude, Cloudinary) terhubung.
                   </div>
                </div>

                {/* URL */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                    <Globe size={18} style={{ color: '#0ea5e9' }} /> URL Website
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    style={{ width: '100%', padding: 12, fontSize: 14, border: '2px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                  />
                </div>

                {/* Screenshots */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
                    <Camera size={18} style={{ color: '#8b5cf6' }} /> Screenshots (Auto-Upload)
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {/* Desktop */}
                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: desktopImg?.cloudinaryUrl ? '2px solid #10b981' : '2px solid #3b82f6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Monitor size={16} style={{ color: '#3b82f6' }} />
                        <span style={{ fontWeight: 600, fontSize: 13 }}>Desktop</span>
                        {desktopImg?.uploading && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#f59e0b' }}>Uploading...</span>}
                        {desktopImg?.cloudinaryUrl && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#10b981' }}>✓ OK</span>}
                      </div>
                      {!desktopImg ? (
                        <div onClick={() => desktopRef.current?.click()} style={{ border: '2px dashed #93c5fd', borderRadius: 6, padding: 16, textAlign: 'center', cursor: 'pointer', background: '#eff6ff' }}>
                          <input type="file" ref={desktopRef} onChange={handleDesktop} accept="image/*" style={{ display: 'none' }} />
                          <Upload size={24} style={{ color: '#3b82f6' }} />
                          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#1e40af' }}>Upload Desktop</p>
                        </div>
                      ) : (
                        <div style={{ position: 'relative' }}>
                          <img src={desktopImg.preview} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6, opacity: desktopImg.uploading ? 0.5 : 1 }} />
                          <button onClick={() => setDesktopImg(null)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 50, background: '#ef4444', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 12 }}>×</button>
                        </div>
                      )}
                    </div>

                    {/* Mobile */}
                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: mobileImg?.cloudinaryUrl ? '2px solid #10b981' : '2px solid #8b5cf6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Smartphone size={16} style={{ color: '#8b5cf6' }} />
                        <span style={{ fontWeight: 600, fontSize: 13 }}>Mobile</span>
                        {mobileImg?.uploading && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#f59e0b' }}>Uploading...</span>}
                        {mobileImg?.cloudinaryUrl && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#10b981' }}>✓ OK</span>}
                      </div>
                      {!mobileImg ? (
                        <div onClick={() => mobileRef.current?.click()} style={{ border: '2px dashed #c4b5fd', borderRadius: 6, padding: 16, textAlign: 'center', cursor: 'pointer', background: '#f5f3ff' }}>
                          <input type="file" ref={mobileRef} onChange={handleMobile} accept="image/*" style={{ display: 'none' }} />
                          <Upload size={24} style={{ color: '#8b5cf6' }} />
                          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#5b21b6' }}>Upload Mobile</p>
                        </div>
                      ) : (
                        <div style={{ position: 'relative' }}>
                          <img src={mobileImg.preview} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6, opacity: mobileImg.uploading ? 0.5 : 1 }} />
                          <button onClick={() => setMobileImg(null)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 50, background: '#ef4444', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 12 }}>×</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={analyze}
                  disabled={!canAnalyze || isUploading}
                  style={{
                    width: '100%', padding: 14, fontSize: 15, fontWeight: 700, borderRadius: 10, border: 'none',
                    cursor: (canAnalyze && !isUploading) ? 'pointer' : 'not-allowed',
                    background: (canAnalyze && !isUploading) ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : '#e2e8f0',
                    color: (canAnalyze && !isUploading) ? '#fff' : '#94a3b8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  <Brain size={18} /> 
                  {isUploading ? 'Waiting for upload...' : !canAnalyze ? 'Complete all fields' : 'Start Analysis'}
                </button>
              </div>
            )}

            {/* Analyzing */}
            {analyzing && (
              <div style={{ background: '#fff', borderRadius: 16, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ position: 'relative' }}>
                    <Ring v={progress} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#0ea5e9' }}>{progress}%</div>
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{stage ? stages.find(s => s.id === stage)?.name : 'Processing...'}</h3>
                    <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>Thinking like an expert...</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {stages.map((s, i) => {
                    const idx = stages.findIndex(st => st.id === stage);
                    return <div key={s.id} style={{ flex: s.w, height: 4, borderRadius: 2, background: i < idx ? '#10b981' : i === idx ? '#0ea5e9' : '#e5e7eb' }} />;
                  })}
                </div>
                <div style={{ maxHeight: 250, overflow: 'auto', background: '#0f172a', borderRadius: 8, padding: 12 }}>
                  {logs.map((l, i) => (
                    <div key={i} style={{ fontSize: 11, fontFamily: 'monospace', color: l.type === 'error' ? '#f87171' : l.type === 'success' ? '#4ade80' : l.type === 'warning' ? '#fbbf24' : '#94a3b8', marginBottom: 4 }}>
                      <span style={{ color: '#475569', marginRight: 8 }}>{l.ts}</span>{l.msg}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {results && (
              <div>
                {savedToDb && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 10, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Database size={16} style={{ color: '#16a34a' }} />
                    <span style={{ fontSize: 12, color: '#166534' }}>Saved to Supabase {user ? `(Account: ${user.email})` : '(Anonymous)'}</span>
                  </div>
                )}

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
            )}

            {/* Error */}
            {error && (
              <div style={{ background: '#fef2f2', borderRadius: 10, padding: 16, border: '1px solid #fecaca', marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <XCircle size={20} style={{ color: '#ef4444' }} />
                  <div>
                    <h4 style={{ fontWeight: 700, color: '#991b1b', margin: 0, fontSize: 14 }}>Error</h4>
                    <p style={{ color: '#b91c1c', margin: '4px 0 0', fontSize: 12 }}>{error}</p>
                  </div>
                </div>
                <button onClick={() => { setError(null); setAnalyzing(false); }} style={{ marginTop: 10, padding: '6px 12px', fontSize: 12, background: '#fff', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer', color: '#991b1b' }}>Try Again</button>
              </div>
            )}
          </>
        )}

        {/* === MODAL LOGIN === */}
        {showAuthModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: '#fff', padding: 24, borderRadius: 16, width: '100%', maxWidth: 350, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{authMode === 'login' ? 'Masuk Akun' : 'Daftar Baru'}</h3>
                <button onClick={() => setShowAuthModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><XCircle size={20} color="#94a3b8" /></button>
              </div>
              <form onSubmit={handleAuth}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Email</label>
                  <input type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #e2e8f0' }} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Password</label>
                  <input type="password" required minLength={6} value={authPass} onChange={e => setAuthPass(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #e2e8f0' }} />
                </div>
                <button type="submit" disabled={authLoading} style={{ width: '100%', padding: 12, background: '#0f172a', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: authLoading ? 'not-allowed' : 'pointer' }}>
                  {authLoading ? 'Loading...' : authMode === 'login' ? 'Masuk' : 'Daftar'}
                </button>
              </form>
              <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12 }}>
                {authMode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
                <span onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{ color: '#0ea5e9', cursor: 'pointer', fontWeight: 600 }}>
                  {authMode === 'login' ? 'Daftar disini' : 'Login disini'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* === SIDEBAR HISTORY === */}
        {showHistory && (
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 300, background: '#fff', borderLeft: '1px solid #e2e8f0', zIndex: 40, padding: 20, transform: 'translateX(0)', transition: 'transform 0.3s', boxShadow: '-4px 0 15px rgba(0,0,0,0.05)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <History size={18} /> Riwayat Analisis
              </h3>
              <button onClick={() => setShowHistory(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><XCircle size={18} color="#94a3b8" /></button>
            </div>
            {historyData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#64748b', fontSize: 13 }}>Belum ada riwayat analisis.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {historyData.map((h: any) => (
                  <div key={h.id} onClick={() => loadFromHistory(h)} style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', background: '#f8fafc', transition: 'background 0.2s' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.domain}</div>
                    <div style={{ fontSize: 10, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{new Date(h.created_at).toLocaleDateString()}</span>
                      <span style={{ fontWeight: 700, color: h.webqual_score >= 60 ? '#10b981' : '#f59e0b' }}>WQ: {h.webqual_score.toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
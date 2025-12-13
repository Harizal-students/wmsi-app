'use client';

import React, { useState, useCallback, useRef } from 'react';
import { 
  Globe, Search, XCircle, FileText, Palette, 
  RefreshCw, Award, MousePointer, 
  Megaphone, LayoutGrid, Beaker, Brain, Camera, Monitor, 
  Smartphone, Shield, Database, AlertCircle
} from 'lucide-react';
import { saveAnalysisSession, AnalysisSession } from '@/lib/supabase';

export default function WMSI() {
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<Array<{ts: string; type: string; msg: string}>>([]);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState('overview');
  const [savedToDb, setSavedToDb] = useState(false);

  const [desktopImg, setDesktopImg] = useState<{base64: string; preview: string; sizeKB: number} | null>(null);
  const [mobileImg, setMobileImg] = useState<{base64: string; preview: string; sizeKB: number} | null>(null);
  const desktopRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);

  // EXTREME compression - target 30KB max per image
  const MAX_SIZE_KB = 30;
  const MAX_DIM = 400;

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

  // EXTREME compression function
  const compress = (file: File): Promise<{base64: string; preview: string; sizeKB: number}> => {
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

          // Calculate small dimensions
          let w = img.width, h = img.height;
          const ratio = Math.min(MAX_DIM / w, MAX_DIM / h, 1);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);

          canvas.width = w;
          canvas.height = h;
          ctx.fillStyle = '#FFF';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);

          // Start with low quality and iterate
          let q = 0.4;
          let dataUrl = canvas.toDataURL('image/jpeg', q);
          let sizeKB = (dataUrl.length * 0.75) / 1024;

          // Reduce quality until under target
          while (sizeKB > MAX_SIZE_KB && q > 0.1) {
            q -= 0.05;
            dataUrl = canvas.toDataURL('image/jpeg', q);
            sizeKB = (dataUrl.length * 0.75) / 1024;
          }

          // If still too large, shrink dimensions
          if (sizeKB > MAX_SIZE_KB) {
            canvas.width = Math.round(w * 0.5);
            canvas.height = Math.round(h * 0.5);
            ctx.fillStyle = '#FFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            dataUrl = canvas.toDataURL('image/jpeg', 0.3);
            sizeKB = (dataUrl.length * 0.75) / 1024;
          }

          // Final extreme fallback
          if (sizeKB > MAX_SIZE_KB) {
            canvas.width = 200;
            canvas.height = 150;
            ctx.fillStyle = '#FFF';
            ctx.fillRect(0, 0, 200, 150);
            ctx.drawImage(img, 0, 0, 200, 150);
            dataUrl = canvas.toDataURL('image/jpeg', 0.2);
            sizeKB = (dataUrl.length * 0.75) / 1024;
          }

          resolve({ base64: dataUrl.split(',')[1], preview: dataUrl, sizeKB: Math.round(sizeKB) });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDesktop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    try {
      log('info', `Compressing desktop (${Math.round(file.size/1024)}KB)...`);
      const c = await compress(file);
      log('success', `Desktop ready: ${c.sizeKB}KB`);
      setDesktopImg(c);
    } catch (err: any) { log('error', err.message); }
    if (desktopRef.current) desktopRef.current.value = '';
  };

  const handleMobile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    try {
      log('info', `Compressing mobile (${Math.round(file.size/1024)}KB)...`);
      const c = await compress(file);
      log('success', `Mobile ready: ${c.sizeKB}KB`);
      setMobileImg(c);
    } catch (err: any) { log('error', err.message); }
    if (mobileRef.current) mobileRef.current.value = '';
  };

  const stages = [
    { id: 'init', name: 'Init', w: 5 },
    { id: 'seo', name: 'SEO', w: 25 },
    { id: 'ui', name: 'UI/UX', w: 30 },
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
    const body = JSON.stringify({ messages, task });
    const bodyKB = Math.round(body.length / 1024);
    
    log('info', `${task}: sending ${bodyKB}KB...`);
    
    // Vercel limit check
    if (bodyKB > 4000) {
      throw new Error(`Request too large (${bodyKB}KB). Max 4MB.`);
    }

    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    if (res.status === 413) {
      throw new Error('413: Request too large. Please use smaller images.');
    }

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt.substring(0, 100) || `Error ${res.status}`);
    }

    const data = await res.json();
    log('success', `${task}: ${Date.now() - start}ms`);
    return data.content;
  };

  const analyze = async () => {
    if (!url || !desktopImg || !mobileImg) return;

    // Check total size
    const totalKB = desktopImg.sizeKB + mobileImg.sizeKB;
    const totalBase64KB = Math.round((desktopImg.base64.length + mobileImg.base64.length) / 1024);
    
    if (totalBase64KB > 200) {
      setError(`Images too large (${totalBase64KB}KB base64). Max 200KB total.`);
      return;
    }

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
      log('info', `Images: ${totalBase64KB}KB base64`);

      // SEO Analysis (text only)
      setStg('seo');
      const seoPrompt = `SEO analysis for ${nUrl}. JSON only: {"domain":"${domain}","keywords":[{"keyword":"word","rank":10}],"onPageSEO":{"title":70,"meta":65,"url":75,"mobile":70,"technical":65},"overallSEO":{"score":68,"visibility":"Medium"},"opportunities":["opp1"],"issues":["issue1"]}`;
      
      let seo = { overallSEO: { score: 65, visibility: 'Medium' } };
      try {
        const seoContent = await callAPI([{ role: 'user', content: seoPrompt }], 'SEO');
        seo = parseJSON(seoContent) || seo;
        log('success', `SEO: ${seo.overallSEO?.score || 65}/100`);
      } catch (e: any) {
        log('error', `SEO failed: ${e.message}`);
      }

      // UI/UX Vision Analysis
      setStg('ui');
      let uiScore = 70, uxScore = 70;
      
      try {
        const visionContent = [
          { type: 'text', text: '[DESKTOP]' },
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: desktopImg.base64 } },
          { type: 'text', text: '[MOBILE]' },
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: mobileImg.base64 } },
          { type: 'text', text: `UI/UX for ${nUrl}. JSON: {"ui":{"overall":74},"ux":{"overall":67},"desktop":75,"mobile":73}` }
        ];
        
        const uiuxContent = await callAPI([{ role: 'user', content: visionContent }], 'Vision');
        const uiux = parseJSON(uiuxContent);
        if (uiux?.ui?.overall) uiScore = uiux.ui.overall;
        if (uiux?.ux?.overall) uxScore = uiux.ux.overall;
        log('success', `UI: ${uiScore} | UX: ${uxScore}`);
      } catch (e: any) {
        log('warning', `Vision failed: ${e.message} - using defaults`);
      }

      // Marketing Analysis (text only)
      setStg('mkt');
      let mkt = { overall: 3.0 };
      try {
        const mktPrompt = `Marketing for ${nUrl}. SEO:${seo.overallSEO?.score || 65}, UI:${uiScore}. JSON: {"valueProp":3.2,"mix7p":3.1,"journey":3.0,"trust":3.4,"brand":3.3,"overall":3.1,"maturity":"Developing","strengths":["s1"],"gaps":["g1"],"actions":[{"priority":1,"action":"a1","impact":"High"}]}`;
        const mktContent = await callAPI([{ role: 'user', content: mktPrompt }], 'Marketing');
        mkt = parseJSON(mktContent) || mkt;
        log('success', `Marketing: ${((mkt.overall || 3) * 20).toFixed(0)}%`);
      } catch (e: any) {
        log('error', `Marketing failed: ${e.message}`);
      }

      // WebQual Calculation
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
        meta: { desktopKB: desktopImg.sizeKB, mobileKB: mobileImg.sizeKB, totalBase64KB }
      };

      setResults(finalResults);

      // Save to DB
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
          webqual_data: finalResults.wq
        };
        await saveAnalysisSession(session);
        log('success', 'Saved to Supabase');
        setSavedToDb(true);
      } catch (e: any) {
        log('error', `DB save failed: ${e.message}`);
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
    setSavedToDb(false);
    setError(null);
  };

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

  const totalBase64KB = (desktopImg?.base64.length || 0) / 1024 + (mobileImg?.base64.length || 0) / 1024;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)', fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>

        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 50, marginBottom: 12 }}>
            <Beaker size={14} style={{ color: '#16a34a' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#166534' }}>WebQual 4.0 + Vision AI</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>WMSI - Website Analysis</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>SEO, UI/UX, Marketing Analysis</p>
        </header>

        {/* Input Form */}
        {!analyzing && !results && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>

            {/* Warning */}
            <div style={{ background: '#fef3c7', borderRadius: 8, padding: 12, marginBottom: 20, border: '1px solid #fde68a', display: 'flex', gap: 10 }}>
              <AlertCircle size={18} style={{ color: '#d97706', flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: '#92400e' }}>
                <strong>Vercel Free:</strong> Images auto-compressed to ~30KB. Quality reduced but analysis still works.
              </div>
            </div>

            {/* URL */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                <Globe size={18} style={{ color: '#0ea5e9' }} /> URL
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
                <Camera size={18} style={{ color: '#8b5cf6' }} /> Screenshots (Auto-Compressed)
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Desktop */}
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: desktopImg ? '2px solid #10b981' : '2px solid #3b82f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Monitor size={16} style={{ color: '#3b82f6' }} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>Desktop</span>
                    {desktopImg && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#10b981' }}>{desktopImg.sizeKB}KB ✓</span>}
                  </div>
                  {!desktopImg ? (
                    <div onClick={() => desktopRef.current?.click()} style={{ border: '2px dashed #93c5fd', borderRadius: 6, padding: 16, textAlign: 'center', cursor: 'pointer', background: '#eff6ff' }}>
                      <input type="file" ref={desktopRef} onChange={handleDesktop} accept="image/*" style={{ display: 'none' }} />
                      <Monitor size={24} style={{ color: '#3b82f6' }} />
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#1e40af' }}>Click to upload</p>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <img src={desktopImg.preview} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6 }} />
                      <button onClick={() => setDesktopImg(null)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 50, background: '#ef4444', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 12 }}>×</button>
                    </div>
                  )}
                </div>

                {/* Mobile */}
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: mobileImg ? '2px solid #10b981' : '2px solid #8b5cf6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Smartphone size={16} style={{ color: '#8b5cf6' }} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>Mobile</span>
                    {mobileImg && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#10b981' }}>{mobileImg.sizeKB}KB ✓</span>}
                  </div>
                  {!mobileImg ? (
                    <div onClick={() => mobileRef.current?.click()} style={{ border: '2px dashed #c4b5fd', borderRadius: 6, padding: 16, textAlign: 'center', cursor: 'pointer', background: '#f5f3ff' }}>
                      <input type="file" ref={mobileRef} onChange={handleMobile} accept="image/*" style={{ display: 'none' }} />
                      <Smartphone size={24} style={{ color: '#8b5cf6' }} />
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#5b21b6' }}>Click to upload</p>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <img src={mobileImg.preview} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6 }} />
                      <button onClick={() => setMobileImg(null)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 50, background: '#ef4444', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 12 }}>×</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Size indicator */}
            {(desktopImg || mobileImg) && (
              <div style={{ padding: 8, background: totalBase64KB > 150 ? '#fef2f2' : '#f0fdf4', borderRadius: 6, textAlign: 'center', fontSize: 12, marginBottom: 16, color: totalBase64KB > 150 ? '#991b1b' : '#166534' }}>
                Base64: {Math.round(totalBase64KB)}KB / 200KB max
              </div>
            )}

            {/* Button */}
            <button
              onClick={analyze}
              disabled={!url || !desktopImg || !mobileImg}
              style={{
                width: '100%', padding: 14, fontSize: 15, fontWeight: 700, borderRadius: 10, border: 'none',
                cursor: (url && desktopImg && mobileImg) ? 'pointer' : 'not-allowed',
                background: (url && desktopImg && mobileImg) ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : '#e2e8f0',
                color: (url && desktopImg && mobileImg) ? '#fff' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              <Brain size={18} /> {(!url || !desktopImg || !mobileImg) ? 'Complete all fields' : 'Start Analysis'}
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
                <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>Extreme compression mode</p>
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
                <span style={{ fontSize: 12, color: '#166534' }}>Saved to Supabase</span>
              </div>
            )}

            {/* Score Summary */}
            <div style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', borderRadius: 14, padding: 20, color: '#fff', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Award size={18} />
                    <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>WebQual 4.0</h2>
                  </div>
                  <p style={{ opacity: 0.9, fontSize: 13, margin: 0 }}>{results.url}</p>
                  <p style={{ opacity: 0.7, fontSize: 11, margin: '4px 0 0' }}>{(results.duration/1000).toFixed(1)}s | {results.meta.totalBase64KB}KB</p>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
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
              )}

              {tab === 'seo' && (
                <div>
                  <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 10, padding: 16, color: '#fff', marginBottom: 16 }}>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>SEO Score</div>
                    <div style={{ fontSize: 32, fontWeight: 800 }}>{results.seo.score}/100</div>
                  </div>
                  {results.seo.keywords && (
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                      <h4 style={{ fontSize: 13, marginBottom: 8 }}>Keywords</h4>
                      {results.seo.keywords.slice(0, 5).map((k: any, i: number) => (
                        <div key={i} style={{ padding: 6, borderBottom: '1px solid #e5e7eb', fontSize: 12 }}>
                          {k.keyword} - Rank #{k.rank || k.estimatedRank}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'ui' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: '#eff6ff', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#1e40af' }}>UI Score</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#3b82f6' }}>{results.ui.overall}</div>
                  </div>
                  <div style={{ background: '#fffbeb', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#92400e' }}>UX Score</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b' }}>{results.ux.overall}</div>
                  </div>
                </div>
              )}

              {tab === 'mkt' && (
                <div>
                  <div style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)', borderRadius: 10, padding: 16, color: '#fff' }}>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>Marketing</div>
                    <div style={{ fontSize: 32, fontWeight: 800 }}>{((results.mkt.overall || 3) * 20).toFixed(0)}%</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>{results.mkt.maturity || 'Developing'}</div>
                  </div>
                </div>
              )}

              {tab === 'wq' && (
                <div>
                  <div style={{ background: '#f0f9ff', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                    <h4 style={{ color: '#0369a1', fontSize: 13 }}>WebQual 4.0 Formula</h4>
                    <code style={{ fontSize: 10 }}>{results.wq.overall.calc}</code>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', borderRadius: 10, padding: 20, color: '#fff', textAlign: 'center' }}>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>Final Score</div>
                    <div style={{ fontSize: 48, fontWeight: 800 }}>{results.wq.overall.pct.toFixed(1)}%</div>
                    <div style={{ fontSize: 14 }}>{lbl(results.wq.overall.pct)}</div>
                  </div>
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
            <button onClick={() => { setError(null); setAnalyzing(false); }} style={{ marginTop: 10, padding: '6px 12px', fontSize: 12, background: '#fff', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer', color: '#991b1b' }}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
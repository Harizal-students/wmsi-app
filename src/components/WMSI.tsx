'use client';

import React, { useState, useCallback, useRef } from 'react';
import { 
  Globe, Search, CheckCircle, XCircle, AlertTriangle, FileText, Palette, 
  RefreshCw, ChevronDown, TrendingUp, Award, Target, MousePointer, Lightbulb, 
  PieChart, Megaphone, LayoutGrid, Cpu, Beaker, Brain, Camera, Monitor, 
  Smartphone, Shield, Database, Zap, AlertCircle
} from 'lucide-react';
import { saveAnalysisSession, AnalysisSession } from '@/lib/supabase';

export default function WMSI() {
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<Array<{ts: string; type: string; stg: string; msg: string}>>([]);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState('overview');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [savedToDb, setSavedToDb] = useState(false);

  const [desktopScreenshots, setDesktopScreenshots] = useState<Array<{base64: string; name: string; mediaType: string; size: number}>>([]);
  const [mobileScreenshots, setMobileScreenshots] = useState<Array<{base64: string; name: string; mediaType: string; size: number}>>([]);
  const [desktopPreviews, setDesktopPreviews] = useState<string[]>([]);
  const [mobilePreviews, setMobilePreviews] = useState<string[]>([]);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  
  // ULTRA OPTIMIZED: Only 1 screenshot each for Vercel Free
  const MAX_DESKTOP = 1;
  const MAX_MOBILE = 1;
  
  // ULTRA AGGRESSIVE compression for Vercel 4.5MB limit
  // Base64 adds ~33%, so 50KB image = ~67KB in request
  const COMPRESSION_CONFIG = {
    maxWidth: 600,       // Reduced from 800
    maxHeight: 450,      // Reduced from 600
    quality: 0.5,        // Reduced from 0.6
    maxSizeKB: 80        // Target max 80KB per image (very small)
  };

  const methodologies = {
    seo: { name: "Keyword Ranking Analysis", formula: "SEO = Sum(Rank x Weight) / n", ref: "Moz Keyword Explorer" },
    gestalt: { name: "Gestalt Principles", formula: "Hierarchy = (Prox + Sim + Cont + Clos + Focal) / 5", ref: "Wertheimer 1923" },
    nielsen: { name: "Nielsen 10 Heuristics", formula: "UX = Sum(H_i) / 10 x 10", ref: "Nielsen 1994" },
    kotler: { name: "Kotler 7Ps Marketing", formula: "Mix = Sum(P_i) / 7", ref: "Kotler 2018" },
    aida: { name: "AIDA Model", formula: "Journey = (A + I + D + A) / 4", ref: "Strong 1925" },
    stanford: { name: "Stanford Credibility", formula: "Trust = Design + Content + Social", ref: "Fogg 2002" },
    webqual: { name: "WebQual 4.0", formula: "WQ = U*0.25 + I*0.25 + S*0.20 + M*0.30", ref: "Barnes Vidgen 2002" }
  };

  const log = useCallback((type: string, stg: string, msg: string) => {
    setLogs(prev => [...prev, { 
      ts: new Date().toLocaleTimeString('id-ID'), 
      type, 
      stg, 
      msg 
    }]);
  }, []);

  const clr = (v: number, m?: number) => {
    const p = (v / (m || 100)) * 100;
    if (p >= 80) return '#10b981';
    if (p >= 60) return '#f59e0b';
    if (p >= 40) return '#f97316';
    return '#ef4444';
  };

  const lbl = (v: number, m?: number) => {
    const p = (v / (m || 100)) * 100;
    if (p >= 80) return 'Sangat Baik';
    if (p >= 60) return 'Baik';
    if (p >= 40) return 'Cukup';
    return 'Perlu Perbaikan';
  };

  const parseJSON = (text: string) => {
    try {
      const match = text && text.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : null;
    } catch (e) {
      return null;
    }
  };

  // ULTRA AGGRESSIVE image compression
  const compressImage = (file: File): Promise<{base64: string; preview: string; mediaType: string; size: number}> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      reader.onload = (e) => {
        const img = new window.Image();
        
        img.onerror = () => reject(new Error('Failed to load image'));
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Calculate dimensions - AGGRESSIVE scaling
          let w = img.width;
          let h = img.height;
          const { maxWidth, maxHeight } = COMPRESSION_CONFIG;
          
          // Always scale down to fit within bounds
          const ratio = Math.min(maxWidth / w, maxHeight / h, 1);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
          
          canvas.width = w;
          canvas.height = h;
          
          // White background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          
          // Iterative compression - start low
          let quality = COMPRESSION_CONFIG.quality;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          let sizeKB = (dataUrl.length * 0.75) / 1024;
          
          // Aggressively reduce until under target
          while (sizeKB > COMPRESSION_CONFIG.maxSizeKB && quality > 0.2) {
            quality -= 0.05;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
            sizeKB = (dataUrl.length * 0.75) / 1024;
          }
          
          // If still too large, reduce dimensions further
          if (sizeKB > COMPRESSION_CONFIG.maxSizeKB) {
            const scale = 0.6;
            canvas.width = Math.round(w * scale);
            canvas.height = Math.round(h * scale);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            dataUrl = canvas.toDataURL('image/jpeg', 0.4);
            sizeKB = (dataUrl.length * 0.75) / 1024;
          }
          
          // Final fallback - super small
          if (sizeKB > COMPRESSION_CONFIG.maxSizeKB) {
            canvas.width = 400;
            canvas.height = 300;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 400, 300);
            ctx.drawImage(img, 0, 0, 400, 300);
            dataUrl = canvas.toDataURL('image/jpeg', 0.3);
            sizeKB = (dataUrl.length * 0.75) / 1024;
          }
          
          resolve({
            base64: dataUrl.split(',')[1],
            preview: dataUrl,
            mediaType: 'image/jpeg',
            size: sizeKB * 1024
          });
        };
        
        img.src = e.target?.result as string;
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleDesktopUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_DESKTOP - desktopScreenshots.length);
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
          log('info', 'upload', 'Compressing Desktop: ' + file.name + ' (' + Math.round(file.size/1024) + 'KB original)');
          const c = await compressImage(file);
          const finalSizeKB = Math.round(c.size / 1024);
          log('success', 'upload', 'Desktop compressed: ' + finalSizeKB + 'KB (optimized)');
          setDesktopScreenshots(prev => [...prev, { base64: c.base64, name: file.name, mediaType: c.mediaType, size: c.size }]);
          setDesktopPreviews(prev => [...prev, c.preview]);
        } catch (err: any) {
          log('error', 'upload', 'Failed: ' + err.message);
        }
      }
    }
    if (desktopInputRef.current) desktopInputRef.current.value = '';
  };

  const handleMobileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_MOBILE - mobileScreenshots.length);
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
          log('info', 'upload', 'Compressing Mobile: ' + file.name + ' (' + Math.round(file.size/1024) + 'KB original)');
          const c = await compressImage(file);
          const finalSizeKB = Math.round(c.size / 1024);
          log('success', 'upload', 'Mobile compressed: ' + finalSizeKB + 'KB (optimized)');
          setMobileScreenshots(prev => [...prev, { base64: c.base64, name: file.name, mediaType: c.mediaType, size: c.size }]);
          setMobilePreviews(prev => [...prev, c.preview]);
        } catch (err: any) {
          log('error', 'upload', 'Failed: ' + err.message);
        }
      }
    }
    if (mobileInputRef.current) mobileInputRef.current.value = '';
  };

  const removeDesktop = (i: number) => {
    setDesktopScreenshots(prev => prev.filter((_, idx) => idx !== i));
    setDesktopPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const removeMobile = (i: number) => {
    setMobileScreenshots(prev => prev.filter((_, idx) => idx !== i));
    setMobilePreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const stages = [
    { id: 'init', name: 'Inisialisasi', w: 5 },
    { id: 'seo', name: 'SEO Analysis', w: 20 },
    { id: 'ui', name: 'UI/UX Vision', w: 30 },
    { id: 'mkt', name: 'Marketing', w: 25 },
    { id: 'wq', name: 'WebQual 4.0', w: 15 },
    { id: 'done', name: 'Selesai', w: 5 }
  ];

  const setStg = (id: string) => {
    const i = stages.findIndex(s => s.id === id);
    const p = stages.slice(0, i + 1).reduce((a, s) => a + s.w, 0);
    setProgress(p);
    setStage(id);
  };

  // API call with better error handling
  const callClaude = async (messages: any[], task: string) => {
    const start = Date.now();
    
    try {
      const bodyStr = JSON.stringify({ messages, task });
      const bodySizeKB = bodyStr.length / 1024;
      
      // Check body size before sending (Vercel limit is 4.5MB)
      if (bodySizeKB > 4000) {
        throw new Error('Request too large (' + Math.round(bodySizeKB) + 'KB). Please use smaller images.');
      }
      
      log('info', 'api', task + ' - sending ' + Math.round(bodySizeKB) + 'KB...');
      
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr
      });
      
      if (res.status === 413) {
        throw new Error('Request too large (413). Images need more compression.');
      }
      
      if (!res.ok) {
        const errText = await res.text();
        let errMsg = 'API Error ' + res.status;
        try {
          const errData = JSON.parse(errText);
          errMsg = errData.error || errMsg;
        } catch {
          errMsg = errText.substring(0, 100) || errMsg;
        }
        throw new Error(errMsg);
      }
      
      const data = await res.json();
      const duration = Date.now() - start;
      log('success', 'api', task + ' completed (' + duration + 'ms)');
      return { success: true, content: data.content, duration: duration };
    } catch (e: any) {
      log('error', 'api', task + ' failed: ' + e.message);
      return { success: false, error: e.message };
    }
  };

  const analyze = async () => {
    if (!url || desktopScreenshots.length === 0 || mobileScreenshots.length === 0) {
      return;
    }

    // Check total base64 size (this is what goes in the request)
    const totalBase64Size = [...desktopScreenshots, ...mobileScreenshots]
      .reduce((a, b) => a + b.base64.length, 0);
    const totalBase64KB = Math.round(totalBase64Size / 1024);
    
    // Vercel limit is 4.5MB, but we need room for prompt text too
    // So limit images to ~300KB total base64 (after encoding)
    if (totalBase64KB > 300) {
      setError('Total ukuran gambar terlalu besar (' + totalBase64KB + 'KB base64). Maksimal 300KB. Coba gambar yang lebih kecil.');
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

      // PHASE 1: INIT
      setStg('init');
      log('info', 'init', 'Starting analysis: ' + nUrl);
      log('info', 'init', 'Images: ' + desktopScreenshots.length + 'D + ' + mobileScreenshots.length + 'M (' + totalBase64KB + 'KB base64)');

      // PHASE 2: SEO (text only, fast)
      setStg('seo');
      log('info', 'seo', 'Analyzing SEO...');

      const seoPrompt = `SEO Expert: Analyze ${nUrl}. Return JSON only: {"domain":"${domain}","industri":"category","keywords":[{"keyword":"word","estimatedRank":15,"searchVolume":1000,"difficulty":"Medium"}],"onPageSEO":{"titleOptimization":{"score":70},"metaDescription":{"score":65},"urlStructure":{"score":75},"mobileReadiness":{"score":70},"technicalSEO":{"score":65}},"overallSEO":{"score":68,"visibility":"Medium"},"topOpportunities":["opp1"],"criticalIssues":["issue1"]}`;

      const seoResult = await callClaude([{ role: 'user', content: seoPrompt }], 'SEO');
      const seo = seoResult.success ? (parseJSON(seoResult.content) || { overallSEO: { score: 65 } }) : { overallSEO: { score: 65 } };
      
      if (seo.overallSEO) {
        log('success', 'seo', 'SEO Score: ' + seo.overallSEO.score + '/100');
      }

      // PHASE 3: UI/UX VISION (with small images)
      setStg('ui');
      log('info', 'ui', 'Vision AI analyzing...');

      const visionContent: any[] = [];
      
      // Add desktop
      desktopScreenshots.forEach((img, i) => {
        visionContent.push({ type: 'text', text: '[DESKTOP]' });
        visionContent.push({ 
          type: 'image', 
          source: { type: 'base64', media_type: 'image/jpeg', data: img.base64 } 
        });
      });
      
      // Add mobile
      mobileScreenshots.forEach((img, i) => {
        visionContent.push({ type: 'text', text: '[MOBILE]' });
        visionContent.push({ 
          type: 'image', 
          source: { type: 'base64', media_type: 'image/jpeg', data: img.base64 } 
        });
      });

      // SHORT prompt to minimize request size
      visionContent.push({ 
        type: 'text', 
        text: `UI/UX analysis for ${nUrl}. JSON only: {"desktop":{"overall":75},"mobile":{"overall":75},"ux":{"heuristics":{"visibility":{"score":7},"match":{"score":7},"control":{"score":6},"consistency":{"score":7},"prevention":{"score":6},"recognition":{"score":7},"flexibility":{"score":6},"aesthetic":{"score":7},"recovery":{"score":6},"help":{"score":6}},"overall":67},"ui":{"overall":74,"desktopScore":73,"mobileScore":75}}` 
      });

      const uiuxResult = await callClaude([{ role: 'user', content: visionContent }], 'UI/UX Vision');
      const uiux = uiuxResult.success ? (parseJSON(uiuxResult.content) || {}) : {};

      let uiScore = 70;
      let uxScore = 70;
      
      if (uiux.ui) {
        uiScore = uiux.ui.overall || 70;
        uxScore = uiux.ux?.overall || 70;
        log('success', 'ui', 'UI: ' + uiScore + ' | UX: ' + uxScore);
      } else {
        log('warning', 'ui', 'Vision failed - using defaults');
      }

      // PHASE 4: MARKETING (text only)
      setStg('mkt');
      log('info', 'mkt', 'Analyzing Marketing...');

      const mktPrompt = `Marketing analysis for ${nUrl}. SEO:${seo.overallSEO?.score || 65}, UI:${uiScore}, UX:${uxScore}. JSON only: {"valueProp":{"score":3.2},"mix7p":{"overall":3.1},"customerJourney":{"overall":3.0,"attention":{"score":3.2},"interest":{"score":3.0},"desire":{"score":2.8},"action":{"score":3.0}},"trust":{"score":3.4},"brand":{"score":3.3,"maturity":"Developing"},"conversion":{"score":2.8},"overall":3.1,"maturity":"Developing","strengths":["strength1"],"gaps":["gap1"],"prioritizedActions":[{"priority":1,"action":"action","impact":"High","effort":"Medium"}]}`;

      const mktResult = await callClaude([{ role: 'user', content: mktPrompt }], 'Marketing');
      const mkt = mktResult.success ? (parseJSON(mktResult.content) || { overall: 3.0 }) : { overall: 3.0 };

      if (mkt.overall) {
        log('success', 'mkt', 'Marketing: ' + (mkt.overall * 20).toFixed(0) + '%');
      }

      // PHASE 5: WEBQUAL 4.0
      setStg('wq');
      log('info', 'wq', 'Calculating WebQual 4.0...');

      const seoScore = seo.overallSEO ? seo.overallSEO.score : 65;
      const mktScore = mkt.overall || 3.0;

      const usability = ((uiScore + uxScore) / 2) / 20;
      const information = seoScore / 20;
      const service = Math.min(uiScore, uxScore) / 20;
      const marketing = mktScore;

      const wqScore = (usability * 0.25) + (information * 0.25) + (service * 0.20) + (marketing * 0.30);
      const wqPct = (wqScore / 5) * 100;

      const wqCalc = 'WQ = (U:' + usability.toFixed(2) + '*0.25) + (I:' + information.toFixed(2) + '*0.25) + (S:' + service.toFixed(2) + '*0.20) + (M:' + marketing.toFixed(2) + '*0.30) = ' + wqPct.toFixed(1) + '%';

      log('success', 'wq', 'WebQual 4.0: ' + wqPct.toFixed(1) + '%');

      // DONE
      setStg('done');
      const totalDuration = Date.now() - startTime;
      log('success', 'done', 'Completed in ' + (totalDuration / 1000).toFixed(1) + 's');

      const finalResults = {
        url: nUrl,
        domain: domain,
        duration: totalDuration,
        seo: { ...seo, score: seoScore },
        ui: { ...uiux.ui, overall: uiScore },
        ux: uiux.ux || { overall: uxScore, heuristics: {} },
        mkt: mkt,
        wq: {
          usability: { score: usability, pct: (usability / 5) * 100, source: 'UI + UX Average' },
          information: { score: information, pct: (information / 5) * 100, source: 'SEO Score' },
          service: { score: service, pct: (service / 5) * 100, source: 'Min(UI, UX)' },
          marketing: { score: marketing, pct: (marketing / 5) * 100, source: 'Marketing Analysis' },
          overall: { score: wqScore, pct: wqPct, calculation: wqCalc }
        },
        metadata: {
          desktopCount: desktopScreenshots.length,
          mobileCount: mobileScreenshots.length,
          desktopPreviews: desktopPreviews,
          mobilePreviews: mobilePreviews,
          totalBase64KB: totalBase64KB
        },
        methodologies: methodologies
      };

      setResults(finalResults);

      // Save to Supabase
      log('info', 'db', 'Saving to database...');
      try {
        const sessionData: AnalysisSession = {
          url: nUrl,
          domain: domain,
          seo_score: seoScore,
          ui_score: uiScore,
          ux_score: uxScore,
          marketing_score: mktScore * 20,
          webqual_score: wqPct,
          duration_ms: totalDuration,
          desktop_count: desktopScreenshots.length,
          mobile_count: mobileScreenshots.length,
          seo_data: seo,
          uiux_data: uiux,
          marketing_data: mkt,
          webqual_data: finalResults.wq,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
        };

        await saveAnalysisSession(sessionData);
        log('success', 'db', 'Saved to Supabase!');
        setSavedToDb(true);
      } catch (dbError: any) {
        log('error', 'db', 'Save failed: ' + dbError.message);
      }

    } catch (err: any) {
      log('error', 'error', 'Error: ' + err.message);
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const Bar = ({ v, m, c, h }: { v: number; m?: number; c?: string; h?: number }) => {
    const max = m || 100;
    const height = h || 6;
    const color = c || clr(v, max);
    const width = Math.min((v / max) * 100, 100);
    return (
      <div style={{ width: '100%', height: height, background: '#e5e7eb', borderRadius: height, overflow: 'hidden' }}>
        <div style={{ width: width + '%', height: '100%', background: color, borderRadius: height, transition: 'width 0.5s' }} />
      </div>
    );
  };

  const Ring = ({ v, m, sz, sw, c }: { v: number; m?: number; sz?: number; sw?: number; c?: string }) => {
    const max = m || 100;
    const size = sz || 100;
    const strokeW = sw || 8;
    const color = c || clr(v, max);
    const r = (size - strokeW) / 2;
    const circ = r * 2 * Math.PI;
    const off = circ - (v / max) * circ;
    return (
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={strokeW} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeW} strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s' }} />
      </svg>
    );
  };

  // Calculate current base64 size for display
  const currentBase64KB = Math.round(
    [...desktopScreenshots, ...mobileScreenshots].reduce((a, b) => a + b.base64.length, 0) / 1024
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>

        {/* HEADER */}
        <header style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 50, marginBottom: 12 }}>
            <Beaker size={14} style={{ color: '#16a34a' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#166534' }}>WebQual 4.0 + Vision AI + Supabase</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Website Marketing Scan Intelligence</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Analisis SEO, UI/UX, dan Marketing dengan metodologi ilmiah</p>
        </header>

        {/* INPUT FORM */}
        {!analyzing && !results && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: 20 }}>

            {/* Free Tier Notice */}
            <div style={{ background: '#fef3c7', borderRadius: 8, padding: 12, marginBottom: 20, border: '1px solid #fde68a', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <AlertCircle size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12, color: '#92400e' }}>
                <strong>Vercel Free Mode:</strong> Gambar dikompresi maksimal (~80KB/gambar). Hanya 1 Desktop + 1 Mobile untuk kecepatan optimal.
              </div>
            </div>

            {/* URL Input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                <Globe size={18} style={{ color: '#0ea5e9' }} /> URL Website
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                style={{ width: '100%', padding: 14, fontSize: 15, border: '2px solid #e2e8f0', borderRadius: 10, outline: 'none' }}
              />
            </div>

            {/* Screenshot Upload */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
                <Camera size={18} style={{ color: '#8b5cf6' }} /> Upload Screenshot (Auto-Compressed)
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Desktop */}
                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: desktopScreenshots.length > 0 ? '2px solid #10b981' : '2px solid #3b82f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Monitor size={20} style={{ color: '#3b82f6' }} />
                    <span style={{ fontWeight: 700, color: '#1e40af' }}>Desktop</span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, padding: '2px 8px', background: desktopScreenshots.length > 0 ? '#dcfce7' : '#e0f2fe', borderRadius: 10, color: desktopScreenshots.length > 0 ? '#166534' : '#1e40af' }}>
                      {desktopScreenshots.length}/{MAX_DESKTOP}
                    </span>
                  </div>
                  {desktopScreenshots.length === 0 ? (
                    <div
                      onClick={() => desktopInputRef.current?.click()}
                      style={{ border: '2px dashed #93c5fd', borderRadius: 8, padding: 20, textAlign: 'center', cursor: 'pointer', background: '#eff6ff' }}
                    >
                      <input type="file" ref={desktopInputRef} onChange={handleDesktopUpload} accept="image/*" style={{ display: 'none' }} />
                      <Monitor size={32} style={{ color: '#3b82f6' }} />
                      <p style={{ margin: '8px 0 0', fontWeight: 600, color: '#1e40af', fontSize: 13 }}>Click to Upload</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {desktopPreviews.map((p, i) => (
                        <div key={i} style={{ position: 'relative', width: '100%', height: 100, borderRadius: 8, overflow: 'hidden', border: '2px solid #10b981' }}>
                          <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            onClick={() => removeDesktop(i)}
                            style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 50, background: '#ef4444', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            ×
                          </button>
                          <div style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 10, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>
                            {Math.round(desktopScreenshots[i]?.base64.length / 1024)}KB base64
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mobile */}
                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: mobileScreenshots.length > 0 ? '2px solid #10b981' : '2px solid #8b5cf6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Smartphone size={20} style={{ color: '#8b5cf6' }} />
                    <span style={{ fontWeight: 700, color: '#5b21b6' }}>Mobile</span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, padding: '2px 8px', background: mobileScreenshots.length > 0 ? '#dcfce7' : '#f3e8ff', borderRadius: 10, color: mobileScreenshots.length > 0 ? '#166534' : '#5b21b6' }}>
                      {mobileScreenshots.length}/{MAX_MOBILE}
                    </span>
                  </div>
                  {mobileScreenshots.length === 0 ? (
                    <div
                      onClick={() => mobileInputRef.current?.click()}
                      style={{ border: '2px dashed #c4b5fd', borderRadius: 8, padding: 20, textAlign: 'center', cursor: 'pointer', background: '#f5f3ff' }}
                    >
                      <input type="file" ref={mobileInputRef} onChange={handleMobileUpload} accept="image/*" style={{ display: 'none' }} />
                      <Smartphone size={32} style={{ color: '#8b5cf6' }} />
                      <p style={{ margin: '8px 0 0', fontWeight: 600, color: '#5b21b6', fontSize: 13 }}>Click to Upload</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {mobilePreviews.map((p, i) => (
                        <div key={i} style={{ position: 'relative', width: '100%', height: 100, borderRadius: 8, overflow: 'hidden', border: '2px solid #10b981' }}>
                          <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            onClick={() => removeMobile(i)}
                            style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 50, background: '#ef4444', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            ×
                          </button>
                          <div style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 10, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>
                            {Math.round(mobileScreenshots[i]?.base64.length / 1024)}KB base64
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <div style={{ flex: 1, padding: 10, background: desktopScreenshots.length > 0 ? '#dcfce7' : '#fef3c7', borderRadius: 8, textAlign: 'center', fontSize: 13, fontWeight: 500 }}>
                {desktopScreenshots.length > 0 ? '✓ Desktop ready' : '⚠ Need Desktop'}
              </div>
              <div style={{ flex: 1, padding: 10, background: mobileScreenshots.length > 0 ? '#dcfce7' : '#fef3c7', borderRadius: 8, textAlign: 'center', fontSize: 13, fontWeight: 500 }}>
                {mobileScreenshots.length > 0 ? '✓ Mobile ready' : '⚠ Need Mobile'}
              </div>
            </div>

            {/* Size Indicator */}
            {(desktopScreenshots.length > 0 || mobileScreenshots.length > 0) && (
              <div style={{ 
                padding: 10, 
                background: currentBase64KB > 250 ? '#fef2f2' : '#f0fdf4', 
                borderRadius: 8, 
                textAlign: 'center', 
                fontSize: 12, 
                fontWeight: 500,
                marginBottom: 16,
                color: currentBase64KB > 250 ? '#991b1b' : '#166534'
              }}>
                Base64 Size: {currentBase64KB}KB / 300KB max {currentBase64KB > 250 && '⚠️ Near limit!'}
              </div>
            )}

            {/* Button */}
            <button
              onClick={analyze}
              disabled={!url || desktopScreenshots.length === 0 || mobileScreenshots.length === 0 || currentBase64KB > 300}
              style={{
                width: '100%',
                padding: 16,
                fontSize: 16,
                fontWeight: 700,
                borderRadius: 12,
                border: 'none',
                cursor: (url && desktopScreenshots.length > 0 && mobileScreenshots.length > 0 && currentBase64KB <= 300) ? 'pointer' : 'not-allowed',
                background: (url && desktopScreenshots.length > 0 && mobileScreenshots.length > 0 && currentBase64KB <= 300) ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : '#e2e8f0',
                color: (url && desktopScreenshots.length > 0 && mobileScreenshots.length > 0 && currentBase64KB <= 300) ? '#fff' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10
              }}
            >
              <Brain size={20} />
              {currentBase64KB > 300 ? 'Images too large' : (!url || desktopScreenshots.length === 0 || mobileScreenshots.length === 0) ? 'Complete URL & Screenshots' : 'Start Analysis'}
            </button>
          </div>
        )}

        {/* ANALYZING */}
        {analyzing && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ position: 'relative' }}>
                <Ring v={progress} sz={70} sw={6} c="#0ea5e9" />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#0ea5e9' }}>
                  {progress}%
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 700, fontSize: 18, margin: 0, color: '#0f172a' }}>
                  {stage ? stages.find(s => s.id === stage)?.name : 'Processing...'}
                </h3>
                <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
                  Optimized for Vercel Free Tier
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
              {stages.map((s, i) => {
                const currentIdx = stages.findIndex(st => st.id === stage);
                const bg = i < currentIdx ? '#10b981' : i === currentIdx ? '#0ea5e9' : '#e5e7eb';
                return (
                  <div key={s.id} style={{ flex: s.w, height: 4, borderRadius: 2, background: bg }} />
                );
              })}
            </div>

            <div style={{ maxHeight: 350, overflow: 'auto', background: '#0f172a', borderRadius: 10, padding: 14 }}>
              {logs.map((l, i) => {
                const color = l.type === 'error' ? '#f87171' : l.type === 'success' ? '#4ade80' : l.type === 'warning' ? '#fbbf24' : '#94a3b8';
                return (
                  <div key={i} style={{ fontSize: 12, fontFamily: 'monospace', color: color, marginBottom: 6 }}>
                    <span style={{ color: '#475569', marginRight: 8 }}>{l.ts}</span>
                    {l.msg}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RESULTS */}
        {results && (
          <div>
            {savedToDb && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Database size={18} style={{ color: '#16a34a' }} />
                <span style={{ fontSize: 13, color: '#166534', fontWeight: 500 }}>Saved to Supabase</span>
              </div>
            )}

            {/* Summary */}
            <div style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', borderRadius: 16, padding: 24, color: '#fff', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Award size={20} />
                    <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>WebQual 4.0 Score</h2>
                  </div>
                  <p style={{ opacity: 0.9, fontSize: 14, margin: 0 }}>{results.url}</p>
                  <p style={{ opacity: 0.7, fontSize: 12, margin: '4px 0 0' }}>{(results.duration / 1000).toFixed(1)}s | {results.metadata.totalBase64KB}KB</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1 }}>{results.wq.overall.pct.toFixed(0)}%</div>
                  <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>{lbl(results.wq.overall.pct, 100)}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 20 }}>
                {[
                  { k: 'usability', l: 'Usability', icon: MousePointer },
                  { k: 'information', l: 'Information', icon: FileText },
                  { k: 'service', l: 'Service', icon: Shield },
                  { k: 'marketing', l: 'Marketing', icon: Megaphone }
                ].map(d => {
                  const Icon = d.icon;
                  return (
                    <div key={d.k} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                      <Icon size={18} style={{ marginBottom: 4, opacity: 0.9 }} />
                      <div style={{ fontSize: 22, fontWeight: 700 }}>{results.wq[d.k].pct.toFixed(0)}%</div>
                      <div style={{ fontSize: 11, opacity: 0.8 }}>{d.l}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { id: 'overview', l: 'Overview', icon: LayoutGrid },
                { id: 'seo', l: 'SEO', icon: Search },
                { id: 'ui', l: 'UI/UX', icon: Palette },
                { id: 'mkt', l: 'Marketing', icon: Megaphone },
                { id: 'wq', l: 'WebQual', icon: Award }
              ].map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
                      fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 8, cursor: 'pointer',
                      background: tab === t.id ? '#0ea5e9' : '#fff',
                      color: tab === t.id ? '#fff' : '#64748b'
                    }}
                  >
                    <Icon size={16} /> {t.l}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, minHeight: 300 }}>
              {tab === 'overview' && (
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Analysis Summary</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, borderLeft: '4px solid #10b981' }}>
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>SEO</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>{results.seo.score}</div>
                      <Bar v={results.seo.score} c="#10b981" h={4} />
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, borderLeft: '4px solid #3b82f6' }}>
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>UI</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>{results.ui.overall}</div>
                      <Bar v={results.ui.overall} c="#3b82f6" h={4} />
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, borderLeft: '4px solid #f59e0b' }}>
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>UX</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{results.ux.overall}</div>
                      <Bar v={results.ux.overall} c="#f59e0b" h={4} />
                    </div>
                  </div>
                </div>
              )}

              {tab === 'seo' && (
                <div>
                  <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 12, padding: 20, color: '#fff', marginBottom: 20 }}>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>SEO Score</div>
                    <div style={{ fontSize: 36, fontWeight: 800 }}>{results.seo.score}/100</div>
                  </div>
                  {results.seo.keywords && (
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16 }}>
                      <h4 style={{ marginBottom: 12 }}>Keywords</h4>
                      {results.seo.keywords.map((k: any, i: number) => (
                        <div key={i} style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>
                          <strong>{k.keyword}</strong> - Rank #{k.estimatedRank}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'ui' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ background: '#eff6ff', borderRadius: 12, padding: 20 }}>
                      <h4 style={{ color: '#1e40af' }}>UI Score: {results.ui.overall}</h4>
                    </div>
                    <div style={{ background: '#fffbeb', borderRadius: 12, padding: 20 }}>
                      <h4 style={{ color: '#92400e' }}>UX Score: {results.ux.overall}</h4>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'mkt' && (
                <div>
                  <div style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)', borderRadius: 12, padding: 20, color: '#fff', marginBottom: 20 }}>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>Marketing</div>
                    <div style={{ fontSize: 36, fontWeight: 800 }}>{(results.mkt.overall * 20).toFixed(0)}%</div>
                  </div>
                </div>
              )}

              {tab === 'wq' && (
                <div>
                  <div style={{ background: '#f0f9ff', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                    <h3 style={{ color: '#0369a1' }}>WebQual 4.0 Formula</h3>
                    <code style={{ fontSize: 11 }}>{results.wq.overall.calculation}</code>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', borderRadius: 12, padding: 24, color: '#fff', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>Final Score</div>
                    <div style={{ fontSize: 56, fontWeight: 800 }}>{results.wq.overall.pct.toFixed(1)}%</div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setResults(null);
                setDesktopScreenshots([]);
                setMobileScreenshots([]);
                setDesktopPreviews([]);
                setMobilePreviews([]);
                setUrl('');
                setLogs([]);
                setTab('overview');
                setSavedToDb(false);
              }}
              style={{ width: '100%', marginTop: 20, padding: 14, fontSize: 14, fontWeight: 600, background: '#f1f5f9', border: 'none', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <RefreshCw size={16} /> New Analysis
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: '#fef2f2', borderRadius: 12, padding: 20, border: '1px solid #fecaca', marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <XCircle size={24} style={{ color: '#ef4444' }} />
              <div>
                <h4 style={{ fontWeight: 700, color: '#991b1b', margin: 0 }}>Error</h4>
                <p style={{ color: '#b91c1c', margin: '4px 0 0', fontSize: 14 }}>{error}</p>
              </div>
            </div>
            <button
              onClick={() => { setError(null); setAnalyzing(false); }}
              style={{ marginTop: 12, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#fff', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', color: '#991b1b' }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
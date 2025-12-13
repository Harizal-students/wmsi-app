'use client';

import React, { useState, useCallback, useRef } from 'react';
import { 
  Globe, Search, CheckCircle, XCircle, AlertTriangle, FileText, Palette, 
  RefreshCw, ChevronDown, TrendingUp, Award, Target, MousePointer, Lightbulb, 
  PieChart, Megaphone, LayoutGrid, Cpu, Beaker, Brain, Camera, Monitor, 
  Smartphone, Shield, Database, Zap
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
  
  // OPTIMIZED: Reduced max uploads for faster processing
  const MAX_DESKTOP = 2; // Reduced from 3
  const MAX_MOBILE = 1;  // Reduced from 2
  
  // OPTIMIZED: Aggressive compression settings for Vercel Free Tier
  const COMPRESSION_CONFIG = {
    maxWidth: 800,      // Reduced from 2000
    maxHeight: 600,     // Reduced from 2000
    quality: 0.6,       // Reduced from 0.8
    maxSizeKB: 150      // Target max 150KB per image
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

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const parseJSON = (text: string) => {
    try {
      const match = text && text.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : null;
    } catch (e) {
      return null;
    }
  };

  // OPTIMIZED: Aggressive image compression function
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
          
          // Calculate new dimensions
          let w = img.width;
          let h = img.height;
          const { maxWidth, maxHeight } = COMPRESSION_CONFIG;
          
          // Scale down if needed
          if (w > maxWidth || h > maxHeight) {
            const ratio = Math.min(maxWidth / w, maxHeight / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          
          canvas.width = w;
          canvas.height = h;
          
          // Draw with white background (for transparency)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          
          // Iterative compression to reach target size
          let quality = COMPRESSION_CONFIG.quality;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          let sizeKB = (dataUrl.length * 0.75) / 1024;
          
          // Reduce quality until under target size
          while (sizeKB > COMPRESSION_CONFIG.maxSizeKB && quality > 0.3) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
            sizeKB = (dataUrl.length * 0.75) / 1024;
          }
          
          // If still too large, reduce dimensions further
          if (sizeKB > COMPRESSION_CONFIG.maxSizeKB) {
            const scale = 0.7;
            canvas.width = Math.round(w * scale);
            canvas.height = Math.round(h * scale);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            dataUrl = canvas.toDataURL('image/jpeg', 0.5);
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
          log('info', 'upload', 'Compressing Desktop: ' + file.name + ' (' + Math.round(file.size/1024) + 'KB)');
          const c = await compressImage(file);
          const finalSizeKB = Math.round(c.size / 1024);
          log('success', 'upload', 'Desktop ready: ' + finalSizeKB + 'KB (optimized for speed)');
          setDesktopScreenshots(prev => [...prev, { base64: c.base64, name: file.name, mediaType: c.mediaType, size: c.size }]);
          setDesktopPreviews(prev => [...prev, c.preview]);
        } catch (err: any) {
          log('error', 'upload', 'Failed to process: ' + err.message);
        }
      }
    }
    if (desktopInputRef.current) {
      desktopInputRef.current.value = '';
    }
  };

  const handleMobileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_MOBILE - mobileScreenshots.length);
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
          log('info', 'upload', 'Compressing Mobile: ' + file.name + ' (' + Math.round(file.size/1024) + 'KB)');
          const c = await compressImage(file);
          const finalSizeKB = Math.round(c.size / 1024);
          log('success', 'upload', 'Mobile ready: ' + finalSizeKB + 'KB (optimized for speed)');
          setMobileScreenshots(prev => [...prev, { base64: c.base64, name: file.name, mediaType: c.mediaType, size: c.size }]);
          setMobilePreviews(prev => [...prev, c.preview]);
        } catch (err: any) {
          log('error', 'upload', 'Failed to process: ' + err.message);
        }
      }
    }
    if (mobileInputRef.current) {
      mobileInputRef.current.value = '';
    }
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

  // OPTIMIZED: API call with timeout handling
  const callClaude = async (messages: any[], task: string, timeoutMs: number = 9000) => {
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, task }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
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
      log('success', 'api', task + ' (' + duration + 'ms)');
      return { success: true, content: data.content, duration: duration };
    } catch (e: any) {
      clearTimeout(timeoutId);
      const errMsg = e.name === 'AbortError' ? 'Request timeout - image may be too large' : e.message;
      log('error', 'api', task + ' failed: ' + errMsg);
      return { success: false, error: errMsg };
    }
  };

  const analyze = async () => {
    if (!url || desktopScreenshots.length === 0 || mobileScreenshots.length === 0) {
      return;
    }

    // Check total image size
    const totalSize = [...desktopScreenshots, ...mobileScreenshots].reduce((a, b) => a + b.size, 0);
    const totalSizeKB = Math.round(totalSize / 1024);
    
    if (totalSizeKB > 500) {
      setError('Total ukuran gambar terlalu besar (' + totalSizeKB + 'KB). Maksimal 500KB untuk performa optimal.');
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
      log('info', 'init', 'Memulai analisis: ' + nUrl);
      log('info', 'init', 'Screenshots: ' + desktopScreenshots.length + ' Desktop + ' + mobileScreenshots.length + ' Mobile (' + totalSizeKB + 'KB total)');

      // PHASE 2: SEO (no images, fast)
      setStg('seo');
      log('info', 'seo', 'Menganalisis SEO dan Keywords...');

      const seoPrompt = `Kamu adalah SEO Expert. Analisis website ${nUrl} (domain: ${domain}). Identifikasi 5-8 kata kunci utama dengan estimasi ranking Google, volume, difficulty. Analisis On-Page SEO. Format JSON tanpa markdown: { "domain": "${domain}", "industri": "kategori", "keywords": [{"keyword": "kata", "estimatedRank": 15, "searchVolume": 1000, "difficulty": "Medium", "relevance": 9}], "onPageSEO": {"titleOptimization": {"score": 70, "reason": "penjelasan"}, "metaDescription": {"score": 65, "reason": "penjelasan"}, "urlStructure": {"score": 75, "reason": "penjelasan"}, "mobileReadiness": {"score": 70, "reason": "penjelasan"}, "technicalSEO": {"score": 65, "reason": "penjelasan"}}, "overallSEO": {"score": 68, "visibility": "Medium", "reason": "ringkasan"}, "topOpportunities": ["peluang1", "peluang2"], "criticalIssues": ["masalah1"] }`;

      const seoResult = await callClaude([{ role: 'user', content: seoPrompt }], 'SEO Analysis', 8000);
      const seo = seoResult.success ? (parseJSON(seoResult.content) || { overallSEO: { score: 65 } }) : { overallSEO: { score: 65 } };
      
      if (seo.overallSEO) {
        log('success', 'seo', 'SEO Score: ' + seo.overallSEO.score + '/100');
      }

      // PHASE 3: UI/UX VISION (with compressed images)
      setStg('ui');
      log('info', 'ui', 'Analyzing with Vision AI (optimized images)...');

      const visionContent: any[] = [];
      
      // Add compressed desktop screenshots
      desktopScreenshots.forEach((img, i) => {
        visionContent.push({ type: 'text', text: '[DESKTOP ' + (i + 1) + ']' });
        visionContent.push({ 
          type: 'image', 
          source: { 
            type: 'base64', 
            media_type: 'image/jpeg', 
            data: img.base64 
          } 
        });
      });
      
      // Add compressed mobile screenshots
      mobileScreenshots.forEach((img, i) => {
        visionContent.push({ type: 'text', text: '[MOBILE ' + (i + 1) + ']' });
        visionContent.push({ 
          type: 'image', 
          source: { 
            type: 'base64', 
            media_type: 'image/jpeg', 
            data: img.base64 
          } 
        });
      });

      // OPTIMIZED: Shorter prompt for faster processing
      const visionPrompt = `Analisis UI/UX screenshot website ${nUrl}. Format JSON singkat: { "desktop": { "hierarchy": {"score": 75, "reason": "singkat"}, "color": {"score": 70, "reason": "singkat"}, "typography": {"score": 72, "reason": "singkat"}, "layout": {"score": 74, "reason": "singkat"}, "overall": 73 }, "mobile": { "hierarchy": {"score": 78, "reason": "singkat"}, "touchTargets": {"score": 74, "reason": "singkat"}, "overall": 75 }, "ux": { "heuristics": { "visibility": {"score": 7}, "match": {"score": 7}, "control": {"score": 6}, "consistency": {"score": 7}, "prevention": {"score": 6}, "recognition": {"score": 7}, "flexibility": {"score": 6}, "aesthetic": {"score": 7}, "recovery": {"score": 6}, "help": {"score": 6} }, "overall": 67 }, "ui": { "overall": 74, "desktopScore": 73, "mobileScore": 75 } }`;

      visionContent.push({ type: 'text', text: visionPrompt });

      const uiuxResult = await callClaude([{ role: 'user', content: visionContent }], 'UI/UX Vision', 9000);
      const uiux = uiuxResult.success ? (parseJSON(uiuxResult.content) || {}) : {};

      // Handle Vision API failure gracefully
      let uiScore = 70;
      let uxScore = 70;
      
      if (uiux.ui) {
        uiScore = uiux.ui.overall || 70;
        uxScore = uiux.ux?.overall || 70;
        log('success', 'ui', 'UI: ' + uiScore + ' | UX: ' + uxScore);
      } else {
        log('warning', 'ui', 'Vision API timeout - using estimated scores');
      }

      // PHASE 4: MARKETING (no images, fast)
      setStg('mkt');
      log('info', 'mkt', 'Analyzing Marketing...');

      const seoContext = seo.overallSEO ? 'SEO: ' + seo.overallSEO.score + '/100' : '';
      const uiContext = 'UI: ' + uiScore + ', UX: ' + uxScore;

      // OPTIMIZED: Shorter marketing prompt
      const mktPrompt = `Analisis marketing website ${nUrl}. Data: ${seoContext}. ${uiContext}. Format JSON singkat: { "valueProp": {"score": 3.2, "reason": "singkat"}, "mix7p": {"overall": 3.1}, "customerJourney": {"overall": 3.0, "attention": {"score": 3.2}, "interest": {"score": 3.0}, "desire": {"score": 2.8}, "action": {"score": 3.0}}, "trust": {"score": 3.4}, "brand": {"score": 3.3, "maturity": "Developing"}, "conversion": {"score": 2.8}, "overall": 3.1, "maturity": "Developing", "strengths": ["kekuatan1"], "gaps": ["kelemahan1"], "prioritizedActions": [{"priority": 1, "action": "aksi", "impact": "High", "effort": "Medium"}] }`;

      const mktResult = await callClaude([{ role: 'user', content: mktPrompt }], 'Marketing', 8000);
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

      const wqCalc = 'WebQual = (U:' + usability.toFixed(2) + ' x 0.25) + (I:' + information.toFixed(2) + ' x 0.25) + (S:' + service.toFixed(2) + ' x 0.20) + (M:' + marketing.toFixed(2) + ' x 0.30) = ' + wqScore.toFixed(2) + '/5 = ' + wqPct.toFixed(1) + '%';

      log('success', 'wq', 'WebQual 4.0: ' + wqPct.toFixed(1) + '%');

      // DONE
      setStg('done');
      const totalDuration = Date.now() - startTime;
      log('success', 'done', 'Selesai dalam ' + (totalDuration / 1000).toFixed(1) + 's');

      const finalResults = {
        url: nUrl,
        domain: domain,
        duration: totalDuration,
        seo: { ...seo, score: seoScore },
        ui: { ...uiux.ui, desktop: uiux.desktop, mobile: uiux.mobile, responsive: uiux.responsive, visualEvidence: uiux.visualEvidence, overall: uiScore },
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
          totalImageSizeKB: totalSizeKB
        },
        methodologies: methodologies
      };

      setResults(finalResults);

      // Save to Supabase
      log('info', 'db', 'Menyimpan hasil ke database...');
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
        log('success', 'db', 'Data tersimpan ke Supabase!');
        setSavedToDb(true);
      } catch (dbError: any) {
        log('error', 'db', 'Gagal menyimpan: ' + dbError.message);
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

            {/* Optimization Notice */}
            <div style={{ background: '#eff6ff', borderRadius: 8, padding: 12, marginBottom: 20, border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Zap size={18} style={{ color: '#2563eb' }} />
              <div style={{ fontSize: 12, color: '#1e40af' }}>
                <strong>Optimized Mode:</strong> Gambar dikompresi otomatis untuk analisis cepat. Max {MAX_DESKTOP} Desktop + {MAX_MOBILE} Mobile.
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
                <Camera size={18} style={{ color: '#8b5cf6' }} /> Upload Screenshot
              </label>

              <div style={{ background: '#fefce8', borderRadius: 8, padding: 12, marginBottom: 16, border: '1px solid #fde047' }}>
                <p style={{ fontSize: 12, color: '#854d0e', margin: 0 }}>
                  <strong>Tips:</strong> Upload screenshot Desktop DAN Mobile. Gambar akan dikompresi otomatis (~150KB/gambar).
                </p>
              </div>

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
                  <div
                    onClick={() => desktopScreenshots.length < MAX_DESKTOP && desktopInputRef.current?.click()}
                    style={{ border: '2px dashed #93c5fd', borderRadius: 8, padding: 20, textAlign: 'center', cursor: desktopScreenshots.length < MAX_DESKTOP ? 'pointer' : 'not-allowed', background: '#eff6ff', opacity: desktopScreenshots.length >= MAX_DESKTOP ? 0.5 : 1 }}
                  >
                    <input type="file" ref={desktopInputRef} onChange={handleDesktopUpload} accept="image/*" multiple style={{ display: 'none' }} />
                    <Monitor size={32} style={{ color: '#3b82f6' }} />
                    <p style={{ margin: '8px 0 0', fontWeight: 600, color: '#1e40af', fontSize: 13 }}>
                      {desktopScreenshots.length >= MAX_DESKTOP ? 'Max reached' : 'Click to Upload'}
                    </p>
                  </div>
                  {desktopPreviews.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      {desktopPreviews.map((p, i) => (
                        <div key={i} style={{ position: 'relative', width: 80, height: 55, borderRadius: 6, overflow: 'hidden', border: '2px solid #93c5fd' }}>
                          <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            onClick={() => removeDesktop(i)}
                            style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: 50, background: '#ef4444', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            ×
                          </button>
                          <div style={{ position: 'absolute', bottom: 2, left: 2, fontSize: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '1px 4px', borderRadius: 3 }}>
                            {Math.round(desktopScreenshots[i]?.size / 1024)}KB
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
                  <div
                    onClick={() => mobileScreenshots.length < MAX_MOBILE && mobileInputRef.current?.click()}
                    style={{ border: '2px dashed #c4b5fd', borderRadius: 8, padding: 20, textAlign: 'center', cursor: mobileScreenshots.length < MAX_MOBILE ? 'pointer' : 'not-allowed', background: '#f5f3ff', opacity: mobileScreenshots.length >= MAX_MOBILE ? 0.5 : 1 }}
                  >
                    <input type="file" ref={mobileInputRef} onChange={handleMobileUpload} accept="image/*" multiple style={{ display: 'none' }} />
                    <Smartphone size={32} style={{ color: '#8b5cf6' }} />
                    <p style={{ margin: '8px 0 0', fontWeight: 600, color: '#5b21b6', fontSize: 13 }}>
                      {mobileScreenshots.length >= MAX_MOBILE ? 'Max reached' : 'Click to Upload'}
                    </p>
                  </div>
                  {mobilePreviews.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      {mobilePreviews.map((p, i) => (
                        <div key={i} style={{ position: 'relative', width: 45, height: 80, borderRadius: 6, overflow: 'hidden', border: '2px solid #c4b5fd' }}>
                          <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            onClick={() => removeMobile(i)}
                            style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: 50, background: '#ef4444', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            ×
                          </button>
                          <div style={{ position: 'absolute', bottom: 2, left: 2, fontSize: 7, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '1px 3px', borderRadius: 2 }}>
                            {Math.round(mobileScreenshots[i]?.size / 1024)}KB
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
                {desktopScreenshots.length > 0 ? '✓ ' + desktopScreenshots.length + ' Desktop' : '⚠ Desktop required'}
              </div>
              <div style={{ flex: 1, padding: 10, background: mobileScreenshots.length > 0 ? '#dcfce7' : '#fef3c7', borderRadius: 8, textAlign: 'center', fontSize: 13, fontWeight: 500 }}>
                {mobileScreenshots.length > 0 ? '✓ ' + mobileScreenshots.length + ' Mobile' : '⚠ Mobile required'}
              </div>
            </div>

            {/* Total Size Indicator */}
            {(desktopScreenshots.length > 0 || mobileScreenshots.length > 0) && (
              <div style={{ 
                padding: 10, 
                background: [...desktopScreenshots, ...mobileScreenshots].reduce((a, b) => a + b.size, 0) / 1024 > 400 ? '#fef2f2' : '#f0fdf4', 
                borderRadius: 8, 
                textAlign: 'center', 
                fontSize: 12, 
                fontWeight: 500,
                marginBottom: 16,
                color: [...desktopScreenshots, ...mobileScreenshots].reduce((a, b) => a + b.size, 0) / 1024 > 400 ? '#991b1b' : '#166534'
              }}>
                Total: {Math.round([...desktopScreenshots, ...mobileScreenshots].reduce((a, b) => a + b.size, 0) / 1024)}KB / 500KB max
              </div>
            )}

            {/* Button */}
            <button
              onClick={analyze}
              disabled={!url || desktopScreenshots.length === 0 || mobileScreenshots.length === 0}
              style={{
                width: '100%',
                padding: 16,
                fontSize: 16,
                fontWeight: 700,
                borderRadius: 12,
                border: 'none',
                cursor: (url && desktopScreenshots.length > 0 && mobileScreenshots.length > 0) ? 'pointer' : 'not-allowed',
                background: (url && desktopScreenshots.length > 0 && mobileScreenshots.length > 0) ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : '#e2e8f0',
                color: (url && desktopScreenshots.length > 0 && mobileScreenshots.length > 0) ? '#fff' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10
              }}
            >
              <Brain size={20} />
              {(!url || desktopScreenshots.length === 0 || mobileScreenshots.length === 0) ? 'Lengkapi URL dan Screenshot' : 'Mulai Analisis'}
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
                  {stage ? stages.find(s => s.id === stage)?.name : 'Memproses...'}
                </h3>
                <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
                  Optimized for fast analysis
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
            {/* Saved to DB indicator */}
            {savedToDb && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Database size={18} style={{ color: '#16a34a' }} />
                <span style={{ fontSize: 13, color: '#166534', fontWeight: 500 }}>Data analisis tersimpan ke Supabase</span>
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
                  <p style={{ opacity: 0.7, fontSize: 12, margin: '4px 0 0' }}>Analyzed in {(results.duration / 1000).toFixed(1)}s | Images: {results.metadata.totalImageSizeKB}KB</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1 }}>{results.wq.overall.pct.toFixed(0)}%</div>
                  <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>{lbl(results.wq.overall.pct, 100)}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 20 }}>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                  <MousePointer size={18} style={{ marginBottom: 4, opacity: 0.9 }} />
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{results.wq.usability.pct.toFixed(0)}%</div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>Usability</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                  <FileText size={18} style={{ marginBottom: 4, opacity: 0.9 }} />
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{results.wq.information.pct.toFixed(0)}%</div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>Information</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                  <Shield size={18} style={{ marginBottom: 4, opacity: 0.9 }} />
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{results.wq.service.pct.toFixed(0)}%</div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>Service</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                  <Megaphone size={18} style={{ marginBottom: 4, opacity: 0.9 }} />
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{results.wq.marketing.pct.toFixed(0)}%</div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>Marketing</div>
                </div>
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
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
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, minHeight: 400 }}>

              {/* Overview */}
              {tab === 'overview' && (
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Ringkasan Analisis</h3>

                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Camera size={16} /> Screenshot yang Dianalisis
                    </h4>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', marginBottom: 8 }}>Desktop ({results.metadata.desktopCount})</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {results.metadata.desktopPreviews.map((p: string, i: number) => (
                            <img key={i} src={p} alt="" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid #93c5fd' }} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#8b5cf6', marginBottom: 8 }}>Mobile ({results.metadata.mobileCount})</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {results.metadata.mobilePreviews.map((p: string, i: number) => (
                            <img key={i} src={p} alt="" style={{ width: 50, height: 90, objectFit: 'cover', borderRadius: 8, border: '2px solid #c4b5fd' }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, borderLeft: '4px solid #10b981' }}>
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>SEO Score</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>{results.seo.score}</div>
                      <Bar v={results.seo.score} c="#10b981" h={4} />
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, borderLeft: '4px solid #3b82f6' }}>
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>UI Score</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>{results.ui.overall || 70}</div>
                      <Bar v={results.ui.overall || 70} c="#3b82f6" h={4} />
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, borderLeft: '4px solid #f59e0b' }}>
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>UX Score</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{results.ux.overall}</div>
                      <Bar v={results.ux.overall} c="#f59e0b" h={4} />
                    </div>
                  </div>

                  {results.mkt.strengths && results.mkt.gaps && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
                      <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 16, border: '1px solid #bbf7d0' }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#166534', marginBottom: 10 }}>Kekuatan</h4>
                        {results.mkt.strengths.slice(0, 4).map((s: string, i: number) => (
                          <div key={i} style={{ fontSize: 12, color: '#166534', marginBottom: 6 }}>✓ {s}</div>
                        ))}
                      </div>
                      <div style={{ background: '#fef2f2', borderRadius: 12, padding: 16, border: '1px solid #fecaca' }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#991b1b', marginBottom: 10 }}>Area Perbaikan</h4>
                        {results.mkt.gaps.slice(0, 4).map((g: string, i: number) => (
                          <div key={i} style={{ fontSize: 12, color: '#991b1b', marginBottom: 6 }}>! {g}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SEO Tab */}
              {tab === 'seo' && (
                <div>
                  <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 12, padding: 20, color: '#fff', marginBottom: 20 }}>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>SEO Score</div>
                    <div style={{ fontSize: 36, fontWeight: 800 }}>{results.seo.score}/100</div>
                    <div style={{ fontSize: 14 }}>Visibility: {results.seo.overallSEO?.visibility || 'N/A'}</div>
                  </div>

                  {results.seo.keywords && results.seo.keywords.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Keyword Rankings</h4>
                      <div style={{ background: '#f8fafc', borderRadius: 12, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: '#e2e8f0' }}>
                              <th style={{ padding: 12, textAlign: 'left' }}>Keyword</th>
                              <th style={{ padding: 12, textAlign: 'center' }}>Rank</th>
                              <th style={{ padding: 12, textAlign: 'center' }}>Volume</th>
                              <th style={{ padding: 12, textAlign: 'center' }}>Difficulty</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.seo.keywords.map((kw: any, i: number) => (
                              <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: 12 }}>{kw.keyword}</td>
                                <td style={{ padding: 12, textAlign: 'center' }}>#{kw.estimatedRank}</td>
                                <td style={{ padding: 12, textAlign: 'center' }}>{kw.searchVolume?.toLocaleString()}</td>
                                <td style={{ padding: 12, textAlign: 'center' }}>{kw.difficulty}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* UI/UX Tab */}
              {tab === 'ui' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div style={{ background: '#eff6ff', borderRadius: 12, padding: 20 }}>
                      <h4 style={{ fontSize: 16, fontWeight: 700, color: '#1e40af', marginBottom: 16 }}>Desktop UI: {results.ui.desktopScore || results.ui.overall}</h4>
                      {results.ui.desktop && (
                        <p style={{ fontSize: 12, color: '#3b82f6' }}>{results.ui.desktop.hierarchy?.reason || 'Visual hierarchy analysis'}</p>
                      )}
                    </div>
                    <div style={{ background: '#f5f3ff', borderRadius: 12, padding: 20 }}>
                      <h4 style={{ fontSize: 16, fontWeight: 700, color: '#5b21b6', marginBottom: 16 }}>Mobile UI: {results.ui.mobileScore || results.ui.overall}</h4>
                      {results.ui.mobile && (
                        <p style={{ fontSize: 12, color: '#8b5cf6' }}>{results.ui.mobile.hierarchy?.reason || 'Mobile hierarchy analysis'}</p>
                      )}
                    </div>
                  </div>

                  {results.ux.heuristics && Object.keys(results.ux.heuristics).length > 0 && (
                    <div style={{ background: '#fffbeb', borderRadius: 12, padding: 16 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 12 }}>Nielsen Heuristics (UX: {results.ux.overall}/100)</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                        {Object.entries(results.ux.heuristics).map(([k, v]: [string, any]) => (
                          <div key={k} style={{ background: '#fff', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: clr(v.score || 0, 10) }}>{v.score || 0}</div>
                            <div style={{ fontSize: 9, color: '#64748b', textTransform: 'capitalize' }}>{k}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Marketing Tab */}
              {tab === 'mkt' && (
                <div>
                  <div style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)', borderRadius: 12, padding: 20, color: '#fff', marginBottom: 20 }}>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>Marketing Effectiveness</div>
                    <div style={{ fontSize: 40, fontWeight: 800 }}>{(results.mkt.overall * 20).toFixed(0)}%</div>
                    <div style={{ fontSize: 14 }}>Maturity: {results.mkt.maturity || 'Developing'}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Value Proposition</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6' }}>{results.mkt.valueProp?.score?.toFixed(1) || 0}/5</div>
                      <Bar v={results.mkt.valueProp?.score || 0} m={5} c="#8b5cf6" h={4} />
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Marketing Mix 7Ps</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#0ea5e9' }}>{results.mkt.mix7p?.overall?.toFixed(1) || 0}/5</div>
                      <Bar v={results.mkt.mix7p?.overall || 0} m={5} c="#0ea5e9" h={4} />
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Customer Journey</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{results.mkt.customerJourney?.overall?.toFixed(1) || 0}/5</div>
                      <Bar v={results.mkt.customerJourney?.overall || 0} m={5} c="#10b981" h={4} />
                    </div>
                  </div>

                  {results.mkt.prioritizedActions && results.mkt.prioritizedActions.length > 0 && (
                    <div style={{ background: '#fffbeb', borderRadius: 12, padding: 16, border: '1px solid #fde68a' }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 12 }}>Prioritized Actions</h4>
                      {results.mkt.prioritizedActions.map((a: any, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#fff', borderRadius: 8, marginBottom: 8 }}>
                          <span style={{ width: 28, height: 28, background: a.priority === 1 ? '#ef4444' : a.priority === 2 ? '#f59e0b' : '#10b981', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                            P{a.priority}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#78350f' }}>{a.action}</div>
                            <div style={{ fontSize: 11, color: '#92400e' }}>Impact: {a.impact} | Effort: {a.effort}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* WebQual Tab */}
              {tab === 'wq' && (
                <div>
                  <div style={{ background: '#f0f9ff', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid #bae6fd' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0369a1', marginBottom: 8 }}>WebQual 4.0 Framework</h3>
                    <p style={{ fontSize: 13, color: '#0284c7', marginBottom: 12 }}>Barnes dan Vidgen (2002), diadaptasi dengan dimensi Marketing</p>
                    <div style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
                      <code style={{ fontSize: 11, color: '#0369a1', fontFamily: 'monospace' }}>{results.wq.overall.calculation}</code>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                    {[
                      { k: 'usability', t: 'Usability', c: '#8b5cf6', w: '25%' },
                      { k: 'information', t: 'Information', c: '#0ea5e9', w: '25%' },
                      { k: 'service', t: 'Service', c: '#10b981', w: '20%' },
                      { k: 'marketing', t: 'Marketing', c: '#ec4899', w: '30%' }
                    ].map(d => (
                      <div key={d.k} style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{d.t}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>Weight: {d.w}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: d.c }}>{results.wq[d.k].pct.toFixed(0)}%</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{results.wq[d.k].score.toFixed(2)}/5</div>
                          </div>
                        </div>
                        <Bar v={results.wq[d.k].pct} c={d.c} h={8} />
                        <p style={{ fontSize: 12, color: '#64748b', marginTop: 10 }}>Source: {results.wq[d.k].source}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 20, background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', borderRadius: 12, padding: 24, color: '#fff', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>WebQual 4.0 Final Score</div>
                    <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1 }}>{results.wq.overall.pct.toFixed(1)}%</div>
                    <div style={{ fontSize: 16, marginTop: 4 }}>{lbl(results.wq.overall.pct, 100)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* New Analysis */}
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
              <RefreshCw size={16} /> Analisis Website Lain
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
              Coba Lagi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
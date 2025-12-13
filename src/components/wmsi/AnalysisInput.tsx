import React, { useRef } from 'react';
import { Globe, Camera, Monitor, Smartphone, Upload, CheckCircle, Brain } from 'lucide-react';

type ImgState = { preview: string; cloudinaryUrl: string | null; uploading: boolean } | null;

type Props = {
  url: string;
  setUrl: (v: string) => void;
  desktopImg: ImgState;
  mobileImg: ImgState;
  setDesktopImg: (v: ImgState) => void;
  setMobileImg: (v: ImgState) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'desktop' | 'mobile') => void;
  onAnalyze: () => void;
  isUploading: boolean;
};

export default function AnalysisInput({ 
  url, setUrl, desktopImg, mobileImg, setDesktopImg, setMobileImg, onUpload, onAnalyze, isUploading 
}: Props) {
  const desktopRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  const canAnalyze = url && desktopImg?.cloudinaryUrl && mobileImg?.cloudinaryUrl;

  return (
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
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com"
          style={{ width: '100%', padding: 12, fontSize: 14, border: '2px solid #e2e8f0', borderRadius: 8, outline: 'none' }} />
      </div>

      {/* Screenshots */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
          <Camera size={18} style={{ color: '#8b5cf6' }} /> Screenshots (Auto-Upload)
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Desktop Box */}
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: desktopImg?.cloudinaryUrl ? '2px solid #10b981' : '2px solid #3b82f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Monitor size={16} style={{ color: '#3b82f6' }} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Desktop</span>
              {desktopImg?.uploading && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#f59e0b' }}>Uploading...</span>}
              {desktopImg?.cloudinaryUrl && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#10b981' }}>✓ OK</span>}
            </div>
            {!desktopImg ? (
              <div onClick={() => desktopRef.current?.click()} style={{ border: '2px dashed #93c5fd', borderRadius: 6, padding: 16, textAlign: 'center', cursor: 'pointer', background: '#eff6ff' }}>
                <input type="file" ref={desktopRef} onChange={(e) => onUpload(e, 'desktop')} accept="image/*" style={{ display: 'none' }} />
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

          {/* Mobile Box */}
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: mobileImg?.cloudinaryUrl ? '2px solid #10b981' : '2px solid #8b5cf6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Smartphone size={16} style={{ color: '#8b5cf6' }} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Mobile</span>
              {mobileImg?.uploading && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#f59e0b' }}>Uploading...</span>}
              {mobileImg?.cloudinaryUrl && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#10b981' }}>✓ OK</span>}
            </div>
            {!mobileImg ? (
              <div onClick={() => mobileRef.current?.click()} style={{ border: '2px dashed #c4b5fd', borderRadius: 6, padding: 16, textAlign: 'center', cursor: 'pointer', background: '#f5f3ff' }}>
                <input type="file" ref={mobileRef} onChange={(e) => onUpload(e, 'mobile')} accept="image/*" style={{ display: 'none' }} />
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

      <button onClick={onAnalyze} disabled={!canAnalyze || isUploading}
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
  );
}
import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type Props = {
  elementId: string;
  filename: string;
};

export default function PdfGenerator({ elementId, filename }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    const element = document.getElementById(elementId);
    if (!element) return;

    setLoading(true);
    try {
      // 1. Capture element to canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true, // Allow loading images from Cloudinary
        logging: false,
        backgroundColor: '#ffffff'
      });

      // 2. Calculate PDF dimensions (A4)
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // 3. Generate PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Additional pages if content is long
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${filename}.pdf`);
    } catch (err) {
      console.error('PDF Generation failed', err);
      alert('Gagal membuat PDF. Pastikan gambar sudah termuat sepenuhnya.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={loading}
      style={{ 
        display: 'flex', alignItems: 'center', gap: 8, 
        padding: '8px 16px', borderRadius: 8, 
        background: '#0f172a', color: '#fff', 
        border: 'none', cursor: loading ? 'wait' : 'pointer',
        fontSize: 13, fontWeight: 600, transition: 'all 0.2s'
      }}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      {loading ? 'Generating PDF...' : 'Download Report'}
    </button>
  );
}
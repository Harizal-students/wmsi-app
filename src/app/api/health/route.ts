import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';

// Config Cloudinary
// PERBAIKAN: Menyesuaikan nama variabel dengan setting di Vercel (.env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Sebelumnya ada NEXT_PUBLIC_, sekarang dihapus
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = {
    supabase: false,
    cloudinary: false,
    claude: false,
    error: null as string | null
  };

  try {
    // 1. Check Supabase
    try {
        const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        // Query ringan (ambil 1 baris apapun, atau sekadar head request)
        await supabase.from('analysis_sessions').select('id').limit(1);
        status.supabase = true;
    } catch (e) {
        console.error('Supabase check failed', e);
    }

    // 2. Check Cloudinary
    try {
      // Kita lakukan ping ke API Cloudinary
      const clRes = await cloudinary.api.ping();
      if (clRes.status === 'ok') {
          status.cloudinary = true;
      }
    } catch (e: any) {
      console.error('Cloudinary Check Failed:', e.message);
      // Debug log (opsional, hanya muncul di server logs Vercel)
      console.log('Cloud Name used:', process.env.CLOUDINARY_CLOUD_NAME); 
    }

    // 3. Check Claude (Anthropic)
    // Cek ketersediaan key
    if (process.env.CLAUDE_API_KEY) {
        status.claude = true;
    }

    const allOk = status.supabase && status.cloudinary && status.claude;

    return NextResponse.json({ 
      status: allOk ? 'ok' : 'partial_outage',
      checks: status 
    });

  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error', 
      checks: status,
      message: error.message 
    }, { status: 500 });
  }
}
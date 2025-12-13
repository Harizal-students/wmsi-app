import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Konfigurasi Runtime Server
export const runtime = 'nodejs'; // Node.js runtime untuk performa I/O stabil
export const maxDuration = 60;   // Timeout diperpanjang untuk "Deep Thinking"
export const dynamic = 'force-dynamic';

// 1. Inisialisasi Clients
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// === FITUR 1: AI LEARNING (RAG SYSTEM) ===
// Fungsi ini mengambil "Memori Kolektif" dari analisis sukses sebelumnya
async function getKnowledgeBase(taskType: string) {
  try {
    // Strategi: Ambil 3 analisis dengan skor WebQual tertinggi sebagai "Gold Standard"
    // Kita filter yang datanya lengkap (tidak null)
    const { data: bestExamples, error } = await supabase
      .from('analysis_sessions')
      .select('domain, seo_score, webqual_score, seo_data, marketing_data, uiux_data')
      .not('webqual_score', 'is', null) // Pastikan skor ada
      .gte('webqual_score', 75)         // Hanya ambil contoh yang BAGUS (>75)
      .order('webqual_score', { ascending: false })
      .limit(3);

    if (error || !bestExamples || bestExamples.length === 0) {
      console.log('Knowledge Base: No high-quality history found yet. Running Zero-shot.');
      return ''; 
    }

    console.log(`[RAG] Retrieved ${bestExamples.length} high-quality past analyses for context.`);

    // Format data historis menjadi teks yang bisa dibaca AI
    const contextString = bestExamples.map((ex, i) => {
      // Ambil insight spesifik berdasarkan task
      let specificInsight = '';
      if (taskType.includes('SEO')) {
        specificInsight = `SEO Strategy: ${(ex.seo_data as any)?.overallSEO?.visibility || 'N/A'}`;
      } else if (taskType.includes('Marketing')) {
        specificInsight = `Brand Archetype: ${(ex.marketing_data as any)?.brand_authority?.brand_archetype || 'N/A'}`;
      } else {
        specificInsight = `UI Strength: ${(ex.uiux_data as any)?.ui?.visual_hierarchy?.analysis?.substring(0, 50) || 'N/A'}...`;
      }

      return `[Example ${i+1}] Domain: ${ex.domain} | WebQual Score: ${ex.webqual_score} | ${specificInsight}`;
    }).join('\n');

    return `\n\n=== KNOWLEDGE BASE (HISTORICAL DATA) ===\nGunakan data analisis sukses sebelumnya ini sebagai standar benchmark kualitas:\n${contextString}\n========================================\n`;

  } catch (error) {
    console.error('RAG System Warning:', error);
    return ''; // Fail-safe: Jika DB error, tetap jalan tanpa RAG
  }
}

// === FITUR 2: ANTI-HALLUCINATION PROTOCOL ===
const SAFETY_INSTRUCTIONS = `
*** ANTI-HALLUCINATION RULES (STRICT) ***
1. DO NOT invent organic traffic numbers, bounce rates, or specific backlinks unless explicitly provided in the prompt.
2. If you cannot see a specific UI element in the screenshot (e.g., specific dropdown menu items), DO NOT guess. State "Not visible in screenshot".
3. For SEO analysis, purely analyze the visible semantic structure and content strategy. Do not make up technical server logs.
4. Base your Marketing analysis strictly on the visible "Value Proposition" and "Copywriting".
5. If you are unsure, output neutral scores (e.g., 50/100) or generic placeholders rather than fake specific data.
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, task } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }

    // A. Aktifkan RAG: Ambil konteks pembelajaran
    const learningContext = await getKnowledgeBase(task || 'General');
    
    // B. Konstruksi Prompt Cerdas
    // Kita menyuntikkan (Inject) konteks RAG + Aturan Keamanan ke pesan terakhir user
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage && lastMessage.role === 'user') {
      const injectionContent = `${learningContext}\n\n${SAFETY_INSTRUCTIONS}\n\nLakukan analisis sekarang untuk target berikut:`;
      
      // Handle Text vs Vision (Array) content
      if (typeof lastMessage.content === 'string') {
        lastMessage.content = injectionContent + "\n" + lastMessage.content;
      } else if (Array.isArray(lastMessage.content)) {
        // Untuk vision, sisipkan teks instruksi di awal array
        lastMessage.content.unshift({ 
          type: 'text', 
          text: injectionContent 
        });
      }
    }

    console.log(`[AI Engine] Processing: ${task} | Model: Claude 3.5 Sonnet`);

    // C. Eksekusi AI
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620', // Gunakan model terbaru untuk reasoning terbaik
      max_tokens: 3000, // Token besar untuk output JSON panjang
      messages: messages,
      temperature: 0.3, // Rendah = Lebih faktual, Mengurangi halusinasi
      system: "Anda adalah Konsultan Audit Digital Senior yang objektif, faktual, dan akademis. Output Anda selalu dalam format JSON valid tanpa teks pengantar."
    });

    // D. Parsing Response
    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    // E. Validasi JSON Sederhana (Self-Correction)
    // Jika output ada teks tambahan di luar JSON, kita coba bersihkan
    let cleanJson = textContent;
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }

    return NextResponse.json({ 
      content: cleanJson,
      usage: response.usage,
      learning_active: !!learningContext // Flag untuk debugging frontend jika perlu
    });

  } catch (error: any) {
    console.error('[AI Analysis Failed]:', error.message);
    return NextResponse.json(
      { error: error.message || 'AI processing failed' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// === AI LEARNING (RAG) ===
async function getKnowledgeBase(taskType: string) {
  try {
    const { data: bestExamples } = await supabase
      .from('analysis_sessions')
      .select('domain, webqual_score')
      .not('webqual_score', 'is', null)
      .gte('webqual_score', 75)
      .limit(2);

    if (!bestExamples || bestExamples.length === 0) return '';
    
    // Context yang lebih ringkas agar hemat token
    const contextString = bestExamples.map((ex, i) => `Ref${i+1}: ${ex.domain} (Score:${ex.webqual_score})`).join(', ');
    return `Benchmarks: ${contextString}.`;
  } catch (error) { return ''; }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, task } = body;

    if (!messages || !Array.isArray(messages)) return NextResponse.json({ error: 'Messages required' }, { status: 400 });

    console.log(`[AI] Processing Task: ${task} (Simulation Mode)`);
    const learningContext = await getKnowledgeBase(task || 'General');
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
      
      // === PROMPT BARU: EXPERT SIMULATION MODE ===
      // Kita memaksa AI untuk "Mensimulasikan" data agar tidak kosong.
      const deepPrompt = `
        ${learningContext}
        
        *** INSTRUKSI UTAMA: SIMULASI AUDIT PROFESIONAL ***
        Anda adalah Konsultan Digital Senior. Pengguna membutuhkan laporan yang LENGKAP dan PENUH.
        
        ATURAN PENGISIAN DATA (WAJIB):
        1. JANGAN PERNAH MENGEMBALIKAN ARRAY KOSONG [].
        2. UNTUK SEO: Simulasikan 5 keyword yang PALING RELEVAN untuk website jenis ini. Estimasi volume & ranking berdasarkan kualitas konten yang terlihat.
        3. UNTUK MARKETING: WAJIB membandingkan dengan kompetitor nyata (Contoh: Tokopedia, Shopee, atau website pemerintah sejenis). JANGAN kosongkan bagian kompetitor.
        4. UNTUK UI/UX: Wajib mengutip 1-2 teori (Nielsen/Norman).
        5. FORMAT: JSON valid saja.

        Isi struktur JSON ini sepenuhnya (jangan ada field yang null/kosong):
        {
          "domain": "extract from url",
          "seo": {
            "overallSEO": {"score": 0-100, "visibility": "High/Med/Low"},
            "technical_audit": {"score": 0-100, "core_web_vitals_assessment": "Simulated (e.g. LCP 2.5s)", "mobile_friendliness": "Analysis based on image", "ssl_security": "Check url scheme"},
            "keyword_analysis": {
              "generated_keywords": [
                {"keyword": "isi keyword relevan 1", "search_volume": "High/Med", "google_rank_est": 1-100, "intent": "Informational/Transactional"},
                {"keyword": "isi keyword relevan 2", "search_volume": "High/Med", "google_rank_est": 1-100, "intent": "Informational/Transactional"},
                {"keyword": "isi keyword relevan 3", "search_volume": "High/Med", "google_rank_est": 1-100, "intent": "Informational/Transactional"},
                {"keyword": "isi keyword relevan 4", "search_volume": "High/Med", "google_rank_est": 1-100, "intent": "Informational/Transactional"},
                {"keyword": "isi keyword relevan 5", "search_volume": "High/Med", "google_rank_est": 1-100, "intent": "Informational/Transactional"}
              ],
              "ranking_analysis": "Analisis simulasi potensi ranking."
            }
          },
          "ui_ux": {
            "ui": {
              "overall": 0-100,
              "design_style": "e.g. Modern Minimalist / Corporate / Cluttered",
              "structure_audit": {"hero_section": "Present/Missing", "navigation": "Clear/Confusing"}
            },
            "ux": {
              "overall": 0-100,
              "academic_analysis": [
                {"theory": "Jakob's Law", "source": "NNGroup", "observation": "Users expect your site to work like other sites..."},
                {"theory": "Aesthetic-Usability Effect", "source": "Nielsen", "observation": "Attractive design perceived as more usable..."}
              ]
            }
          },
          "marketing": {
            "overall": 1.0-5.0,
            "competitor_analysis": {
              "competitor_name": "NAME_OF_REAL_COMPETITOR",
              "comparison_7p": {
                "product": {"us": "Analysis", "competitor": "Comparison", "verdict": "Better/Worse/Equal"},
                "price": {"us": "Analysis", "competitor": "Comparison", "verdict": "Better/Worse/Equal"},
                "promotion": {"us": "Analysis", "competitor": "Comparison", "verdict": "Better/Worse/Equal"},
                "place": {"us": "Analysis", "competitor": "Comparison", "verdict": "Better/Worse/Equal"}
              }
            }
          },
          "webqual": {
            "usability": {"score": 0-5, "pct": 0-100, "deep_reasoning": "Reasoning..."},
            "information": {"score": 0-5, "pct": 0-100, "deep_reasoning": "Reasoning..."},
            "service": {"score": 0-5, "pct": 0-100, "deep_reasoning": "Reasoning..."},
            "overall": {"score": 0-5, "pct": 0-100, "calc": "formula", "interpretation": "Excellent/Good/Fair"}
          }
        }
      `;
      
      if (typeof lastMessage.content === 'string') {
        lastMessage.content = deepPrompt + "\n" + lastMessage.content;
      } else if (Array.isArray(lastMessage.content)) {
        // Cari text block, kalau ga ada bikin baru di awal
        const textIdx = lastMessage.content.findIndex((c: any) => c.type === 'text');
        if (textIdx >= 0) {
          lastMessage.content[textIdx].text = deepPrompt + "\n" + lastMessage.content[textIdx].text;
        } else {
          lastMessage.content.unshift({ type: 'text', text: deepPrompt });
        }
      }
    }

    // Call AI with slightly higher temperature for creativity in simulation
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', // Sesuai CSV Anda
      max_tokens: 4000,
      messages: messages,
      temperature: 0.4, // Naikkan dikit biar dia "berani" mengisi data simulasi
    });

    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    // JSON Cleaning
    let cleanJson = textContent;
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleanJson = jsonMatch[0];

    return NextResponse.json({ content: cleanJson, usage: response.usage });

  } catch (error: any) {
    console.error('[AI Error]:', error);
    return NextResponse.json({ error: error.message || 'AI Error' }, { status: 500 });
  }
}
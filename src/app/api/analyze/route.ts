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

async function getKnowledgeBase(taskType: string) {
  try {
    const { data: bestExamples } = await supabase
      .from('analysis_sessions')
      .select('domain, webqual_score')
      .not('webqual_score', 'is', null)
      .gte('webqual_score', 75)
      .limit(2);

    if (!bestExamples || bestExamples.length === 0) return '';
    const contextString = bestExamples.map((ex, i) => `Ref${i+1}: ${ex.domain}`).join(', ');
    return `Benchmarks: ${contextString}.`;
  } catch (error) { return ''; }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, task } = body;

    if (!messages || !Array.isArray(messages)) return NextResponse.json({ error: 'Messages required' }, { status: 400 });

    console.log(`[AI] Processing Task: ${task} (FORCE SIMULATION)`);
    const learningContext = await getKnowledgeBase(task || 'General');
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
      
      // === PROMPT BARU: SIMULATION MODE ===
      // Perbedaan utama: Kita MEMERINTAHKAN AI untuk mengisi data simulasi jika data asli tidak ada.
      const deepPrompt = `
        ${learningContext}
        
        *** MODE: PROFESIONAL AUDIT SIMULATOR ***
        Tugas: Berikan laporan audit website yang LENGKAP. 
        KENDALA: Anda tidak memiliki akses real-time ke Google Analytics/SEMRush.
        SOLUSI: Anda WAJIB melakukan ESTIMASI CERDAS (Educated Guesses) berdasarkan praktik terbaik industri untuk mengisi semua data.
        
        ATURAN PENGISIAN DATA (CRITICAL):
        1. JANGAN BIARKAN ARRAY KOSONG. Jika data tidak ada, buatlah estimasi logis.
        2. KEYWORDS: Buat 5 keyword yang sangat relevan. Estimasi volume pencarian (High/Medium) dan ranking (1-50) seolah-olah Anda adalah tool SEO.
        3. KOMPETITOR: Bandingkan dengan brand nyata yang relevan (misal: Tokopedia, Gojek, atau website pemerintah terkait).
        4. SKOR: Berikan angka 0-100. Jangan pernah output string di kolom skor.

        Output HANYA JSON valid dengan struktur ini (isi semua field):
        {
          "domain": "extract domain",
          "seo": {
            "overallSEO": {"score": 75, "visibility": "Medium"},
            "technical_audit": {"score": 70, "core_web_vitals_assessment": "Simulated: LCP 2.4s", "mobile_friendliness": "Responsive View", "ssl_security": "Secure"},
            "keyword_analysis": {
              "generated_keywords": [
                {"keyword": "isi_keyword_1", "search_volume": "High", "google_rank_est": 12, "intent": "Transactional"},
                {"keyword": "isi_keyword_2", "search_volume": "Medium", "google_rank_est": 8, "intent": "Informational"},
                {"keyword": "isi_keyword_3", "search_volume": "High", "google_rank_est": 24, "intent": "Transactional"},
                {"keyword": "isi_keyword_4", "search_volume": "Low", "google_rank_est": 5, "intent": "Navigational"},
                {"keyword": "isi_keyword_5", "search_volume": "Medium", "google_rank_est": 15, "intent": "Informational"}
              ],
              "ranking_analysis": "Analisis potensi ranking..."
            }
          },
          "ui_ux": {
            "ui": {
              "overall": 75,
              "design_style": "Modern / Corporate / Minimalist",
              "structure_audit": {"hero_section": "Present", "navigation": "Standard"}
            },
            "ux": {
              "overall": 70,
              "academic_analysis": [
                {"theory": "Jakob's Law", "source": "Nielsen", "observation": "Layout follows standard conventions..."},
                {"theory": "Fitts's Law", "source": "Paul Fitts", "observation": "CTA buttons are large and easy to click..."}
              ]
            }
          },
          "marketing": {
            "overall": 3.5,
            "competitor_analysis": {
              "competitor_name": "SEBUTKAN_NAMA_KOMPETITOR_NYATA",
              "comparison_7p": {
                "product": {"us": "Analisis...", "competitor": "Bandingkan...", "verdict": "Better/Equal"},
                "price": {"us": "Analisis...", "competitor": "Bandingkan...", "verdict": "Better/Equal"},
                "promotion": {"us": "Analisis...", "competitor": "Bandingkan...", "verdict": "Better/Equal"},
                "place": {"us": "Analisis...", "competitor": "Bandingkan...", "verdict": "Better/Equal"}
              }
            }
          },
          "webqual": {
            "usability": {"score": 3.5, "pct": 70, "deep_reasoning": "Alasan..."},
            "information": {"score": 3.8, "pct": 76, "deep_reasoning": "Alasan..."},
            "service": {"score": 3.2, "pct": 64, "deep_reasoning": "Alasan..."},
            "overall": {"score": 3.5, "pct": 70, "calc": "formula", "interpretation": "Good"}
          }
        }
      `;
      
      if (typeof lastMessage.content === 'string') {
        lastMessage.content = deepPrompt + "\n" + lastMessage.content;
      } else if (Array.isArray(lastMessage.content)) {
        const textIdx = lastMessage.content.findIndex((c: any) => c.type === 'text');
        if (textIdx >= 0) {
          lastMessage.content[textIdx].text = deepPrompt + "\n" + lastMessage.content[textIdx].text;
        } else {
          lastMessage.content.unshift({ type: 'text', text: deepPrompt });
        }
      }
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', 
      max_tokens: 4000,
      messages: messages,
      temperature: 0.5, // Temperature naik agar lebih kreatif mengisi data simulasi
    });

    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    let cleanJson = textContent;
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleanJson = jsonMatch[0];

    return NextResponse.json({ content: cleanJson, usage: response.usage });

  } catch (error: any) {
    console.error('[AI Error]:', error);
    return NextResponse.json({ error: error.message || 'AI Error' }, { status: 500 });
  }
}
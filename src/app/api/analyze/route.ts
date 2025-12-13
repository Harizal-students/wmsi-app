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
      .select('domain, seo_score, webqual_score, seo_data, marketing_data')
      .not('webqual_score', 'is', null)
      .gte('webqual_score', 70)
      .order('webqual_score', { ascending: false })
      .limit(2);

    if (!bestExamples || bestExamples.length === 0) return '';

    const contextString = bestExamples.map((ex, i) => 
      `[Benchmark ${i+1}] Domain: ${ex.domain} | WQ: ${ex.webqual_score}`
    ).join('\n');

    return `\n\n[INTERNAL BENCHMARKS]\n${contextString}\n`;
  } catch (error) { return ''; }
}

// === RULES BARU (KOMPREHENSIF) ===
const SAFETY_RULES = `
*** STRICT OUTPUT RULES ***
1. FORMAT: Valid JSON only.
2. SCORING: Must be NUMBER (0-100). Never "Not visible".
3. SEO KEYWORDS: Generate 5 HIGH-VALUE keywords based on site persona. Estimate Google Rank based on on-page SEO health.
4. MARKETING: Compare strictly with a REAL WORLD COMPETITOR (e.g. if analyzing a shoe store, compare with Nike/Tokopedia).
5. UI/UX: Must cite ACADEMIC SOURCES (e.g., Nielsen, Norman, Garrett) for every observation.
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, task } = body;

    if (!messages || !Array.isArray(messages)) return NextResponse.json({ error: 'Messages required' }, { status: 400 });

    console.log(`[AI] Processing Task: ${task}`);
    const learningContext = await getKnowledgeBase(task || 'General');
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
      // PROMPT ENGINEERING TINGKAT LANJUT
      const deepPrompt = `
        ${learningContext}
        ${SAFETY_RULES}

        Lakukan analisis mendalam dengan struktur JSON berikut:
        {
          "domain": "example.com",
          "seo": {
            "overallSEO": {"score": 0-100, "visibility": "High/Med/Low"},
            "technical_audit": {"score": 0-100, "core_web_vitals_assessment": "string", "mobile_friendliness": "string", "ssl_security": "string"},
            "keyword_analysis": {
              "generated_keywords": [
                {"keyword": "keyword 1", "search_volume": "High/Med", "google_rank_est": 1-100, "difficulty": "Hard/Easy", "intent": "Transactional/Info"}
              ],
              "ranking_analysis": "Analisis korelasi antara keyword umum vs spesifik terhadap kualitas website sebagai alat pemasaran."
            }
          },
          "ui_ux": {
            "ui": {
              "overall": 0-100,
              "design_style": "Jelaskan gaya desain (misal: Minimalist, Brutalist, Material Design)",
              "structure_audit": {"hero_section": "Exist/Missing", "navigation": "Standard/Non-standard", "cta_placement": "Clear/Hidden"}
            },
            "ux": {
              "overall": 0-100,
              "academic_analysis": [
                {"theory": "Nama Teori (misal: Fitts Law / Jakob's Law)", "source": "Nama Peneliti/Buku", "observation": "Penerapan di website ini"}
              ]
            }
          },
          "marketing": {
            "overall": 1.0-5.0,
            "competitor_analysis": {
              "competitor_name": "Sebutkan 1 kompetitor terkenal",
              "comparison_7p": {
                "product": {"us": "...", "competitor": "...", "verdict": "Better/Worse"},
                "price": {"us": "...", "competitor": "...", "verdict": "Better/Worse"},
                "place": {"us": "...", "competitor": "...", "verdict": "Better/Worse"},
                "promotion": {"us": "...", "competitor": "...", "verdict": "Better/Worse"},
                "people": {"us": "...", "competitor": "...", "verdict": "Better/Worse"},
                "process": {"us": "...", "competitor": "...", "verdict": "Better/Worse"},
                "physical": {"us": "...", "competitor": "...", "verdict": "Better/Worse"}
              }
            }
          },
          "webqual": {
            "usability": {"score": 0-5, "pct": 0-100, "deep_reasoning": "Penjelasan mendalam kenapa nilai ini didapat berdasarkan data UI/UX"},
            "information": {"score": 0-5, "pct": 0-100, "deep_reasoning": "Penjelasan mendalam berdasarkan data SEO/Konten"},
            "service": {"score": 0-5, "pct": 0-100, "deep_reasoning": "Penjelasan mendalam berdasarkan data Marketing/Trust"},
            "overall": {"score": 0-5, "pct": 0-100, "calc": "string", "interpretation": "string"}
          }
        }
      `;
      
      if (typeof lastMessage.content === 'string') {
        lastMessage.content = deepPrompt + "\n" + lastMessage.content;
      } else if (Array.isArray(lastMessage.content)) {
        lastMessage.content.unshift({ type: 'text', text: deepPrompt });
      }
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', 
      max_tokens: 4000, // Token diperbesar untuk analisis panjang
      messages: messages,
      temperature: 0.2,
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
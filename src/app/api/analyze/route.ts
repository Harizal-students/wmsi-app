import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 60; // Timeout 60 detik
export const dynamic = 'force-dynamic';

// Init Clients
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// === FITUR 1: AI LEARNING (RAG SYSTEM) ===
async function getKnowledgeBase(taskType: string) {
  try {
    // Ambil 3 analisis terbaik sebagai referensi
    const { data: bestExamples, error } = await supabase
      .from('analysis_sessions')
      .select('domain, seo_score, webqual_score, seo_data, marketing_data, uiux_data')
      .not('webqual_score', 'is', null)
      .gte('webqual_score', 75)
      .order('webqual_score', { ascending: false })
      .limit(3);

    if (error || !bestExamples || bestExamples.length === 0) {
      console.log('[RAG] No history found. Running standard analysis.');
      return ''; 
    }

    const contextString = bestExamples.map((ex, i) => {
      let insight = '';
      if (taskType.includes('SEO')) insight = `SEO: ${(ex.seo_data as any)?.overallSEO?.visibility || 'N/A'}`;
      else if (taskType.includes('Marketing')) insight = `Brand: ${(ex.marketing_data as any)?.brand_authority?.brand_archetype || 'N/A'}`;
      else insight = `UI: ${(ex.uiux_data as any)?.ui?.visual_hierarchy?.analysis?.substring(0, 30) || 'N/A'}...`;

      return `[Ex ${i+1}] ${ex.domain} (WQ: ${ex.webqual_score}) - ${insight}`;
    }).join('\n');

    return `\n\n[HISTORICAL CONTEXT]\n${contextString}\n`;

  } catch (error) {
    console.error('[RAG Error]:', error);
    return ''; 
  }
}

// === FITUR 2: ANTI-HALLUCINATION ===
const SAFETY_RULES = `
RULES:
1. Strict JSON output only. No text before/after.
2. If UI elements are not visible in the screenshot, say "Not visible".
3. Do not invent traffic numbers.
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, task } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    console.log(`[AI] Starting Task: ${task}`);

    // 1. Inject Knowledge (RAG)
    const learningContext = await getKnowledgeBase(task || 'General');
    
    // 2. Modifikasi pesan terakhir user
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
      const instruction = `${learningContext}\n${SAFETY_RULES}\nAnalyze now:`;
      
      if (typeof lastMessage.content === 'string') {
        lastMessage.content = instruction + "\n" + lastMessage.content;
      } else if (Array.isArray(lastMessage.content)) {
        // Untuk Vision (Gambar), taruh instruksi di text block pertama
        const textBlockIndex = lastMessage.content.findIndex((c: any) => c.type === 'text');
        if (textBlockIndex >= 0) {
          lastMessage.content[textBlockIndex].text = instruction + "\n" + lastMessage.content[textBlockIndex].text;
        } else {
          lastMessage.content.unshift({ type: 'text', text: instruction });
        }
      }
    }

    // 3. Call Claude AI (DENGAN MODEL YANG BENAR SESUAI CSV)
    console.log('[AI] Calling Anthropic API...');
    
    try {
      const response = await anthropic.messages.create({
        // PERBAIKAN: Menggunakan nama model yang sesuai dengan CSV Anda
        model: 'claude-sonnet-4-20250514', 
        max_tokens: 2500,
        messages: messages,
        temperature: 0.3, 
      });

      const textContent = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      // 4. Clean JSON Output
      let cleanJson = textContent;
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanJson = jsonMatch[0];
      }

      console.log(`[AI] Success. Tokens used: ${response.usage.output_tokens}`);

      return NextResponse.json({ 
        content: cleanJson,
        usage: response.usage
      });

    } catch (apiError: any) {
      console.error('[Anthropic API Error]:', apiError);
      
      // Deteksi Error Spesifik
      if (apiError.status === 404) {
        return NextResponse.json({ error: 'Model AI tidak ditemukan. Cek API Key.' }, { status: 404 });
      }
      if (apiError.status === 401) {
        return NextResponse.json({ error: 'API Key tidak valid.' }, { status: 401 });
      }
      if (apiError.status === 429) {
        return NextResponse.json({ error: 'Rate limit tercapai. Tunggu sebentar.' }, { status: 429 });
      }
      
      throw apiError; // Lempar ke catch bawah untuk 500 generic
    }

  } catch (error: any) {
    console.error('[Server Error]:', error.message);
    return NextResponse.json(
      { error: error.message || 'Internal Analysis Error' },
      { status: 500 }
    );
  }
}
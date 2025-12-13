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
      .select('domain, seo_score, webqual_score, seo_data, marketing_data, uiux_data')
      .not('webqual_score', 'is', null)
      .gte('webqual_score', 70) // Turunkan sedikit threshold agar lebih mudah dapat contoh
      .order('webqual_score', { ascending: false })
      .limit(2); // Ambil 2 saja biar hemat token

    if (!bestExamples || bestExamples.length === 0) return '';

    const contextString = bestExamples.map((ex, i) => {
      let insight = '';
      if (taskType.includes('SEO')) insight = `SEO Vis: ${(ex.seo_data as any)?.overallSEO?.visibility}`;
      else if (taskType.includes('Marketing')) insight = `Archetype: ${(ex.marketing_data as any)?.brand_authority?.brand_archetype}`;
      else insight = `UI Strength: Good Hierarchy`;

      return `[Ref ${i+1}] ${ex.domain} (WQ: ${ex.webqual_score}) - ${insight}`;
    }).join('\n');

    return `\n\n[BENCHMARK DATA]\n${contextString}\n`;
  } catch (error) {
    return ''; 
  }
}

// === PERBAIKAN: SAFETY RULES YANG LEBIH CERDAS ===
const SAFETY_RULES = `
*** STRICT OUTPUT RULES ***
1. OUTPUT FORMAT: ONLY valid JSON. No introductory text.
2. SCORING RULES (CRITICAL): 
   - All fields named "score", "overall", "rank", or "volume" MUST be NUMBERS (0-100 or 0-10). 
   - NEVER output strings like "Not visible" or "N/A" for scores.
   - If you cannot see an element to score it, estimate a neutral score (e.g., 50 or 5) based on general heuristics.
3. TEXT RULES:
   - For descriptive fields (analysis, reasoning), you MAY use "Not visible in screenshot" if the element is missing.
4. FACTS: Do not invent specific traffic numbers. Use estimates like "Low", "Medium", "High".
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, task } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    console.log(`[AI] Processing Task: ${task}`);

    const learningContext = await getKnowledgeBase(task || 'General');
    
    // Inject Rules
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
      const instruction = `${learningContext}\n${SAFETY_RULES}\n\nAnalyze the provided content/image now:`;
      
      if (typeof lastMessage.content === 'string') {
        lastMessage.content = instruction + "\n" + lastMessage.content;
      } else if (Array.isArray(lastMessage.content)) {
        // Pastikan instruksi masuk ke block text
        const textBlock = lastMessage.content.find((c: any) => c.type === 'text');
        if (textBlock) {
          textBlock.text = instruction + "\n" + textBlock.text;
        } else {
          lastMessage.content.unshift({ type: 'text', text: instruction });
        }
      }
    }

    // Call AI (Model sesuai CSV Anda)
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', 
      max_tokens: 3000,
      messages: messages,
      temperature: 0.2, // Lebih rendah lagi agar lebih patuh aturan format
    });

    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    // JSON Cleaning
    let cleanJson = textContent;
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleanJson = jsonMatch[0];

    return NextResponse.json({ 
      content: cleanJson,
      usage: response.usage
    });

  } catch (error: any) {
    console.error('[AI Error]:', error);
    // Handle error status spesifik
    const status = error.status || 500;
    const msg = error.error?.message || error.message || 'AI Processing Error';
    return NextResponse.json({ error: msg }, { status });
  }
}
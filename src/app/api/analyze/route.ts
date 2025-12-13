import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, task } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      );
    }

    console.log(`[API] Task: ${task || 'unknown'}`);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: messages,
    });

    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    console.log(`[API] Response length: ${textContent.length} chars`);

    return NextResponse.json({ 
      content: textContent,
      usage: response.usage
    });

  } catch (error: any) {
    console.error('[API] Error:', error.message);
    
    return NextResponse.json(
      { error: error.message || 'API request failed' },
      { status: error.status || 500 }
    );
  }
}
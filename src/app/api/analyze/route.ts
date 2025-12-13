import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Configure route segment for larger payloads
export const runtime = 'nodejs';
export const maxDuration = 60; // Requires Vercel Pro for >10s

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Get content length to check size
    const contentLength = request.headers.get('content-length');
    const sizeKB = contentLength ? Math.round(parseInt(contentLength) / 1024) : 0;
    
    console.log(`[API] Request size: ${sizeKB}KB`);
    
    // Vercel Free limit is ~4.5MB, reject if too large
    if (sizeKB > 4000) {
      return NextResponse.json(
        { error: `Request too large (${sizeKB}KB). Max 4MB allowed.` },
        { status: 413 }
      );
    }

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

    // Extract text content
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
    
    // Handle specific errors
    if (error.message?.includes('Could not process image')) {
      return NextResponse.json(
        { error: 'Image processing failed. Please use smaller images.' },
        { status: 400 }
      );
    }
    
    if (error.status === 413 || error.message?.includes('too large')) {
      return NextResponse.json(
        { error: 'Request payload too large. Please compress images further.' },
        { status: 413 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'API request failed' },
      { status: error.status || 500 }
    );
  }
}
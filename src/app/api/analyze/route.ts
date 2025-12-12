import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, task } = body;

    const apiKey = process.env.CLAUDE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Claude API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API Error:', response.status, errorText);
      return NextResponse.json(
        { error: `Claude API Error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      content: data.content?.[0]?.text || '',
      usage: data.usage,
    });

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

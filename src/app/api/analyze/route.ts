import { NextRequest, NextResponse } from 'next/server';

// Tambah config untuk timeout lebih lama
export const maxDuration = 60; // 60 detik (Vercel Pro) atau 10 detik (Free)

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

    // Ambil response sebagai text dulu
    const responseText = await response.text();

    if (!response.ok) {
      console.error('Claude API Error:', response.status, responseText);
      return NextResponse.json(
        { error: `Claude API Error: ${response.status} - ${responseText.substring(0, 200)}` },
        { status: response.status }
      );
    }

    // Parse JSON dengan error handling
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error:', responseText.substring(0, 500));
      return NextResponse.json(
        { error: `Invalid JSON response: ${responseText.substring(0, 100)}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      content: data.content?.[0]?.text || '',
      usage: data.usage,
    });

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
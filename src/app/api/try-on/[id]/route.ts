import { NextRequest, NextResponse } from 'next/server';

const FASHN_API_KEY = process.env.FASHN_API_KEY;
const FASHN_BASE = 'https://api.fashn.ai/v1';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!FASHN_API_KEY) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  try {
    const res = await fetch(`${FASHN_BASE}/status/${params.id}`, {
      headers: { Authorization: `Bearer ${FASHN_API_KEY}` },
      cache: 'no-store',
    });

    const data = await res.json() as {
      id: string;
      status: 'starting' | 'in_queue' | 'processing' | 'completed' | 'failed';
      output?: string[];
      error?: string | null;
    };

    if (data.status === 'completed' && data.output?.[0]) {
      return NextResponse.json({ status: 'completed', outputUrl: data.output[0] });
    }
    if (data.status === 'failed') {
      console.error('[try-on/status] failed:', JSON.stringify(data));
      return NextResponse.json({ status: 'failed', error: data.error ?? 'Generation failed' });
    }
    return NextResponse.json({ status: data.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

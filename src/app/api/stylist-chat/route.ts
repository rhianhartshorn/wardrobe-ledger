import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { getSetting, setSetting } from '@/lib/db';
import { getPersonaContext, getStyleBriefContext } from '@/lib/stylist';

export type StyleDirective = {
  instruction: string;
  addedAt: string;
};

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json() as { message: string };
    if (!message?.trim()) return NextResponse.json({ error: 'No message' }, { status: 400 });

    const [personaCtx, styleBriefCtx, existingRaw] = await Promise.all([
      getPersonaContext(),
      getStyleBriefContext(),
      getSetting('style_directives'),
    ]);

    const existing: StyleDirective[] = existingRaw ? JSON.parse(existingRaw) : [];

    const existingDirectivesText = existing.length
      ? `Existing directives already registered:\n${existing.map((d) => `- ${d.instruction}`).join('\n')}`
      : '';

    const prompt = `You are a personal stylist in a direct conversation with your client.

${personaCtx}
${styleBriefCtx ? styleBriefCtx + '\n' : ''}
${existingDirectivesText}

The client has just said: "${message}"

Your job:
1. Extract 1-3 concrete styling directives from what they've said — specific enough to actually change how you dress them. Examples: "avoid overly safe colour combinations", "client wants more editorial risk in silhouette choices", "prioritise comfort over occasion-dressing", "client is ready to lean into their colour season more boldly".
2. Write a short acknowledgment (2-3 sentences max) in your stylist voice — warm but direct. Reference specifically what you've taken on board. Don't be sycophantic. Sound like a real professional.

Respond with ONLY valid JSON, no markdown:
{
  "directives": ["directive 1", "directive 2"],
  "acknowledgment": "your 2-3 sentence response to the client"
}`;

    const raw = await callClaude({ prompt, maxTokens: 400 });
    const parsed = parseJSON(raw) as { directives: string[]; acknowledgment: string };

    const newDirectives: StyleDirective[] = parsed.directives.map((instruction) => ({
      instruction,
      addedAt: new Date().toISOString(),
    }));

    // Keep last 10 directives to avoid runaway context growth
    const updated = [...existing, ...newDirectives].slice(-10);
    try {
      await setSetting('style_directives', JSON.stringify(updated));
    } catch { /* storage failure — still return the AI response */ }

    return NextResponse.json({
      acknowledgment: parsed.acknowledgment,
      directives: newDirectives,
      allDirectives: updated,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Chat failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const raw = await getSetting('style_directives');
    const directives: StyleDirective[] = raw ? JSON.parse(raw) : [];
    return NextResponse.json({ directives });
  } catch {
    return NextResponse.json({ directives: [] });
  }
}

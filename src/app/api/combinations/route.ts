import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { profileToContext, type BodyProfile } from '@/lib/body-profile';

type WardrobeItem = {
  id: string;
  category: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  pattern: string;
  formality: string;
  season: string;
};

export async function POST(req: NextRequest) {
  try {
    const { items, bodyProfile } = await req.json() as { items: WardrobeItem[]; bodyProfile?: BodyProfile };

    if (!items || items.length < 3) {
      return NextResponse.json({ error: 'Add at least 3 items to see outfit combinations.' }, { status: 400 });
    }

    const itemListText = items
      .map((it) => `${it.id} :: ${it.category}, "${it.name}", color ${it.primaryColor}${it.secondaryColor ? '/' + it.secondaryColor : ''}, ${it.pattern || 'solid'}, ${it.formality}, ${it.season}`)
      .join('\n');

    const profileCtx = bodyProfile ? profileToContext(bodyProfile) : '';
    const profileLine = profileCtx ? `\n${profileCtx} Every combination you choose and rank must genuinely flatter this body shape and colouring — don't just check logical compatibility, judge whether it's actually a good look for THIS person.\n` : '';

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const maxCombos = 20;

    const prompt = `You are a working fashion editor and personal stylist with sharp, current taste. Today is ${today}.${profileLine}

A client has given you their full real wardrobe. Your job is NOT to list every logically-compatible pairing — it's to use genuine fashion judgement to identify the combinations that actually look good, feel current for 2026, and flatter this specific person.

Wardrobe (id :: details):
${itemListText}

Create up to ${maxCombos} of the BEST outfit combinations from this wardrobe — using ONLY the exact ids above. Each combination needs at least 2 items. Order best to good. Be selective: only include combinations you'd genuinely recommend.

Respond with ONLY valid JSON, no markdown, no trailing commas:
{"combinations":[{"itemIds":["id1","id2"],"title":"max 5 words","category":"max 3 words","rationale":"max 12 words","formality":"Casual|Smart Casual|Business|Formal|Athletic","season":"All-season|Summer|Winter|Spring/Fall"}]}`;

    const raw = await callClaude({ prompt, maxTokens: 6000 });
    const parsed = parseJSON(raw) as { combinations?: unknown[] };
    return NextResponse.json({ combinations: parsed.combinations ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not curate combinations right now.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

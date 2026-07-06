import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { getSetting, setSetting } from '@/lib/db';
import { getPersonaContext, getStyleBriefContext, getBrandVoiceContext, getLifestyleContext, FIT_SPECIALIST_VOICE, FASHION_EDITOR_VOICE, ACCESSORIES_DIRECTOR_VOICE, COLOUR_ANALYST_VOICE, STYLIST_2026_LENS } from '@/lib/stylist';

export type StyleDirective = {
  instruction: string;
  addedAt: string;
};

type WardrobeItem = {
  id: string; name: string; category: string;
  primaryColor: string; secondaryColor: string;
  pattern: string; formality: string; season: string;
  material?: string; fit?: string; length?: string;
  accessoryType?: string; wearCount?: number;
};

export async function POST(req: NextRequest) {
  try {
    const { message, items, wardrobeGrid, wardrobeGridMapping } = await req.json() as {
      message: string;
      items?: WardrobeItem[];
      wardrobeGrid?: string;
      wardrobeGridMapping?: string;
    };
    if (!message?.trim()) return NextResponse.json({ error: 'No message' }, { status: 400 });

    const [personaCtx, styleBriefCtx, lifestyleCtx, existingRaw, brandVoice] = await Promise.all([
      getPersonaContext(),
      getStyleBriefContext(),
      getLifestyleContext(),
      getSetting('style_directives'),
      getBrandVoiceContext(),
    ]);

    const existing: StyleDirective[] = existingRaw ? JSON.parse(existingRaw) : [];

    const existingDirectivesText = existing.length
      ? `Styling directives already in place for this client:\n${existing.map((d) => `- ${d.instruction}`).join('\n')}\n`
      : '';

    const itemListText = items?.length
      ? items.map((it) =>
          `${it.id} :: ${it.category}${it.accessoryType ? ' (' + it.accessoryType + ')' : ''}, "${it.name}", ${it.primaryColor}${it.secondaryColor ? '/' + it.secondaryColor : ''}${it.material ? ', ' + it.material : ''}${it.fit ? ', ' + it.fit : ''}${it.length ? ', ' + it.length : ''}, ${it.formality}, ${it.season}${(it.wearCount ?? 0) > 0 ? ', worn ' + it.wearCount + 'x' : ''}`
        ).join('\n')
      : '';

    const wardrobeBlock = itemListText
      ? `\nCLIENT'S WARDROBE (${items!.length} pieces — reference these by name when giving specific advice):\n${itemListText}\n`
      : '';

    const gridBlock = wardrobeGrid
      ? `\nVISUAL WARDROBE GRID: A numbered image grid of all wardrobe items is attached. Grid key: ${wardrobeGridMapping}. Look at the actual colours, textures, and silhouettes before responding — your advice should be grounded in what these clothes actually look like.\n`
      : '';

    const prompt = `You are a personal stylist in a direct one-on-one conversation with your client. You have their full wardrobe in front of you — physically. You can see every piece.

${personaCtx}
${FASHION_EDITOR_VOICE}
${FIT_SPECIALIST_VOICE}
${COLOUR_ANALYST_VOICE}
${ACCESSORIES_DIRECTOR_VOICE}
${brandVoice}
${STYLIST_2026_LENS}
${styleBriefCtx ? styleBriefCtx + '\n' : ''}${lifestyleCtx}${wardrobeBlock}${gridBlock}${existingDirectivesText}
The client has just said: "${message}"

RESPONSE RULES:
- You have their wardrobe. When the client asks what to wear, name specific items from the list above — "your [item name]" — not generic descriptions.
- When recommending combinations, name every piece. Reference item IDs if you reference more than 2 pieces: e.g. "your white cotton poplin shirt (id:...) with your dark wash straight jeans".
- If the question is about a specific occasion, check whether they have appropriate items and say so directly. If they don't, tell them what's missing and be specific about what to buy.
- Give concrete directions: tuck or don't tuck, belt or no belt, which layer on top, which shoes.
- Extract 1-3 styling directives from what they've said — specific enough to actually change future recommendations.
- Write a short acknowledgment (2-3 sentences max) — warm, direct, like a real professional, not a chatbot. Reference what you can now see in the wardrobe if relevant.

Respond with ONLY valid JSON, no markdown:
{
  "directives": ["directive 1", "directive 2"],
  "acknowledgment": "your 2-3 sentence response — specific, direct, referencing actual wardrobe pieces where relevant"
}`;

    const wardrobeImages = wardrobeGrid ? [{ base64: wardrobeGrid }] : undefined;
    const raw = await callClaude({ prompt, images: wardrobeImages, maxTokens: 600, route: 'stylist-chat' });
    const parsed = parseJSON(raw) as { directives: string[]; acknowledgment: string };

    const newDirectives: StyleDirective[] = (parsed.directives ?? []).map((instruction) => ({
      instruction,
      addedAt: new Date().toISOString(),
    }));

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

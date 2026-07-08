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
    const { message, items, wardrobeGrid, wardrobeGridMapping, conversationHistory } = await req.json() as {
      message: string;
      items?: WardrobeItem[];
      wardrobeGrid?: string;
      wardrobeGridMapping?: string;
      conversationHistory?: Array<{ role: 'user' | 'stylist'; text: string }>;
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

    const conversationBlock = conversationHistory?.length
      ? `\nPREVIOUS CONVERSATION CONTEXT (most recent last):\n${conversationHistory.map((m) => `${m.role === 'user' ? 'CLIENT' : 'STYLIST'}: ${m.text}`).join('\n')}\n`
      : '';

    const prompt = `You are a personal stylist in a direct one-on-one conversation with your client. You have their full wardrobe in front of you — physically. You can see every piece.

${personaCtx}
${FASHION_EDITOR_VOICE}
${FIT_SPECIALIST_VOICE}
${COLOUR_ANALYST_VOICE}
${ACCESSORIES_DIRECTOR_VOICE}
${brandVoice}
${STYLIST_2026_LENS}
${styleBriefCtx ? styleBriefCtx + '\n' : ''}${lifestyleCtx}${wardrobeBlock}${gridBlock}${existingDirectivesText}${conversationBlock}
The client has just said: "${message}"

INTENT: First decide if the client wants outfit suggestions (they're asking what to wear for a specific occasion, today, an event, or asking you to dress them) OR if they're asking a reflective/strategic question (about their style, patterns, what to buy, what's missing, why they feel a certain way).

RESPONSE RULES:
- Write a response of 1-2 sentences maximum. Direct, warm, specific. Like a stylist who respects the client's time.
- If recommending something to try, frame it as an experiment: "Try this week: ..." Never over-explain.
- Extract 1-3 styling directives from what they've said — specific enough to change future recommendations.

If intent is OUTFIT: generate exactly 3 outfit suggestions using ONLY items from the wardrobe list above (reference by exact id). Each outfit should be a complete look.

Respond with ONLY valid JSON, no markdown:
{
  "intent": "outfit|conversation",
  "directives": ["directive 1"],
  "acknowledgment": "your 1-2 sentence response",
  "outfits": [{"title":"max 5 words","itemIds":["id1","id2","id3"],"styleReference":"specific 2026 aesthetic max 6 words","rationale":"max 20 words — coaching nudge, start with Try or Wear"}]
}

If intent is "conversation", omit the outfits field entirely.`;

    const wardrobeImages = wardrobeGrid ? [{ base64: wardrobeGrid }] : undefined;
    const raw = await callClaude({ prompt, images: wardrobeImages, maxTokens: 2000, route: 'stylist-chat' });
    const parsed = parseJSON(raw) as { intent?: string; directives: string[]; acknowledgment: string; outfits?: unknown[] };

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
      outfits: parsed.outfits ?? undefined,
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

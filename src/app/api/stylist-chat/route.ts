import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { getSetting, setSetting } from '@/lib/db';
import {
  getPersonaContext, getStyleBriefContext, getBrandVoiceContext,
  getLifestyleContext, getStyleDirectives,
  FIT_SPECIALIST_PERSONA, COLOUR_ANALYST_PERSONA, FASHION_EDITOR_PERSONA,
  OCCASION_SPECIALIST_PERSONA, WARDROBE_INTELLIGENCE_PERSONA, ACCESSORIES_DIRECTOR_PERSONA,
  STYLIST_2026_LENS, BRAND_VOICE_RULES,
} from '@/lib/stylist';

export type StyleDirective = {
  instruction: string;
  addedAt: string;
};

const LAYERING_KEYWORDS = [
  'cardigan','blazer','jacket','coat','gilet','vest','waistcoat','kimono',
  'overshirt','shacket','hoodie','zip-up','sweater','jumper','pullover',
  'sweatshirt','fleece','anorak','parka','trench',
];

function isCompleteOutfit(itemIds: string[], items: WardrobeItem[]): boolean {
  const pieces = itemIds.map((id) => items.find((i) => i.id === id)).filter(Boolean) as WardrobeItem[];
  if (pieces.length === 0) return false;
  if (pieces.some((p) => p.category === 'Dress/One-piece')) return true;
  const hasBottom = pieces.some((p) => p.category === 'Bottom');
  if (!hasBottom) return false;
  const isLayering = (p: WardrobeItem) => p.category === 'Outerwear' || LAYERING_KEYWORDS.some((kw) => p.name.toLowerCase().includes(kw));
  const hasBaseLayer = pieces.some((p) => p.category === 'Top' && !isLayering(p));
  return hasBaseLayer;
}

type WardrobeItem = {
  id: string; name: string; category: string;
  primaryColor: string; secondaryColor: string;
  pattern: string; formality: string; season: string;
  material?: string; fit?: string; length?: string;
  accessoryType?: string; wearCount?: number;
};

type SpecialistBrief = {
  role: string;
  type: 'candidates' | 'advisory';
  candidates?: Array<{ itemIds: string[]; note: string }>;
  advisory?: string;
  flag?: string;
};

type ChatOutfit = {
  title: string;
  itemIds: string[];
  styleReference?: string;
  rationale?: string;
  accessories?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// SPECIALIST CALL — runs one member of the style team
// ─────────────────────────────────────────────────────────────────────────────

async function runSpecialist(
  role: string,
  persona: string,
  remit: string,
  message: string,
  itemListText: string,
  contextBlock: string,
): Promise<SpecialistBrief> {
  const prompt = `${persona}

You are one specialist on a private styling team. The head stylist will synthesize all specialist inputs into the final recommendation to the client — the client never sees your brief directly.

${contextBlock}

CLIENT'S WARDROBE:
${itemListText || '(No wardrobe items yet)'}

CLIENT'S REQUEST: "${message}"

YOUR SPECIFIC REMIT FOR THIS BRIEF:
${remit}

If the client is asking for outfit recommendations (what to wear, outfit for an occasion, dress me for X): propose 1-2 specific combinations from the wardrobe above that pass your specialist criteria (reference items by exact id). Be specific about why each combination passes your test.

If the client is asking a strategic or conversational question (what's missing, style analysis, shopping advice, general styling question): provide your specialist analysis of what you observe — what the wardrobe data reveals from your expert lens.

In either case: name one specific flag — a structural concern, a colour problem, an aesthetic failure, a contextual mismatch, or a behavioural pattern — that the head stylist must be aware of.

Respond with ONLY valid JSON, no markdown:
{
  "type": "candidates|advisory",
  "candidates": [{"itemIds": ["id1","id2","id3"], "note": "max 20 words — the specific reason this passes your specialist test"}],
  "advisory": "max 40 words — your specialist analysis (omit if type is candidates)",
  "flag": "max 25 words — one specific concern from your specialist domain"
}`;

  try {
    const raw = await callClaude({ prompt, maxTokens: 350, route: `specialist-${role.toLowerCase().replace(/\s+/g, '-')}` });
    const parsed = parseJSON(raw) as Omit<SpecialistBrief, 'role'>;
    return { role, ...parsed };
  } catch {
    return { role, type: 'advisory', advisory: 'Brief unavailable.', flag: undefined };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HEAD STYLIST SYNTHESIS
// ─────────────────────────────────────────────────────────────────────────────

async function runHeadStylist(
  message: string,
  personaCtx: string,
  brandVoice: string,
  styleBriefCtx: string,
  lifestyleCtx: string,
  weatherBlock: string,
  wardrobeBlock: string,
  gridBlock: string,
  existingDirectivesText: string,
  conversationBlock: string,
  specialistBriefs: SpecialistBrief[],
  wardrobeImages?: Array<{ base64: string }>,
): Promise<{ intent: string; directives: string[]; acknowledgment: string; outfits?: ChatOutfit[] }> {

  const briefsBlock = specialistBriefs.map((b) => {
    const parts = [`── ${b.role.toUpperCase()} ──`];
    if (b.type === 'candidates' && b.candidates?.length) {
      b.candidates.forEach((c, i) => {
        parts.push(`Candidate ${i + 1}: items [${c.itemIds.join(', ')}] — ${c.note}`);
      });
    }
    if (b.advisory) parts.push(`Analysis: ${b.advisory}`);
    if (b.flag) parts.push(`Flag: ${b.flag}`);
    return parts.join('\n');
  }).join('\n\n');

  const prompt = `${personaCtx}

${STYLIST_2026_LENS}
${brandVoice}
${styleBriefCtx ? styleBriefCtx + '\n' : ''}${lifestyleCtx}${weatherBlock}${wardrobeBlock}${gridBlock}${existingDirectivesText}${conversationBlock}

━━━ SPECIALIST TEAM BRIEFS ━━━
Your team has reviewed the client's request. Their briefs are below. You synthesize these into the final recommendation.

${briefsBlock}

━━━ YOUR TASK ━━━
The client has said: "${message}"

1. INTENT: Determine if the client wants outfit suggestions or a strategic/conversational response.

2. DIRECTIVES: Extract only permanent styling preferences or constraints the client has revealed — things that should change every future recommendation. A directive must describe a stable truth about how this person dresses, not a one-time request.

EXTRACT: "avoids heels", "prefers loose fits over the hip", "needs workwear options", "dislikes showing arms", "colour palette should stay neutral", "wants to look less formal day-to-day"
DO NOT EXTRACT: "wants outfits featuring the beige blazer", "asked for 3 looks today", "requested something for Tuesday", "asked what goes with a specific item", "wanted a casual option this time"

If the message contains no permanent preference — only a one-time request or contextual ask — return an empty directives array. Never log transient requests as directives.

3. RESPONSE: Write 1-2 sentences direct to the client. Specific, warm, declarative. No hedging, no hollow words, no exclamation marks.

4. If intent is OUTFIT: Select the best 3 outfits from the specialist candidates above, or compose outfits yourself if the specialist candidates are insufficient. Use ONLY items from the wardrobe. Each outfit must be COMPLETE — a wearable look a person could walk out the door in.

COMPLETENESS RULE (mandatory): Every outfit requires (a) a base layer top — shirt, blouse, t-shirt, tank, bodysuit, camisole, or fine knit — OR a dress/jumpsuit that covers both top and bottom; AND (b) a bottom — trousers, jeans, skirt — OR the dress/jumpsuit. If a layering piece is included (cardigan, blazer, jacket, coat, hoodie, jumper, overshirt), the base layer top MUST also be included in itemIds. A cardigan + trousers with no top is not a complete outfit. A blazer + skirt with no blouse is not complete.

Each rationale: max 20 words, begins with Try or Wear, explains the specific logic.

Respond with ONLY valid JSON, no markdown:
{
  "intent": "outfit|conversation",
  "directives": ["directive 1"],
  "acknowledgment": "your 1-2 sentence response to the client",
  "outfits": [{"title":"max 5 words","itemIds":["id1","id2","id3"],"styleReference":"specific 2026 aesthetic max 6 words","rationale":"max 20 words — coaching nudge, start with Try or Wear"}]
}

If intent is "conversation", omit the outfits field.`;

  const raw = await callClaude({ prompt, images: wardrobeImages, maxTokens: 1200, route: 'head-stylist' });
  return parseJSON(raw) as { intent: string; directives: string[]; acknowledgment: string; outfits?: ChatOutfit[] };
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCESSORIES DIRECTOR — finishes the selected outfits
// ─────────────────────────────────────────────────────────────────────────────

async function runAccessoriesDirector(
  outfits: ChatOutfit[],
  items: WardrobeItem[],
  styleBriefCtx: string,
  lifestyleCtx: string,
): Promise<ChatOutfit[]> {

  const outfitDescriptions = outfits.map((o, i) => {
    const pieces = o.itemIds
      .map((id) => items.find((it) => it.id === id))
      .filter(Boolean)
      .map((it) => `${it!.name} (${it!.category}, ${it!.primaryColor}${it!.material ? ', ' + it!.material : ''})`)
      .join('; ');
    return `OUTFIT ${i + 1}: "${o.title}"\nPieces: ${pieces}\nStyle reference: ${o.styleReference ?? 'n/a'}`;
  }).join('\n\n');

  const prompt = `${ACCESSORIES_DIRECTOR_PERSONA}

${BRAND_VOICE_RULES}
${styleBriefCtx ? styleBriefCtx + '\n' : ''}${lifestyleCtx}

The head stylist has selected the following three outfits for the client. Your job is to provide the finishing accessory direction for each — the precise, opinionated detail that resolves the look.

${outfitDescriptions}

For each outfit, specify: what accessory or accessories to add (or confirm the look is complete without them), with the exact weight, finish, colour relationship, and why. Be specific — not "add a bag" but which shape, size, finish, and how it relates to the rest of the look. Max 25 words per outfit.

Respond with ONLY valid JSON, no markdown:
{
  "outfits": [
    {"accessories": "specific direction for outfit 1"},
    {"accessories": "specific direction for outfit 2"},
    {"accessories": "specific direction for outfit 3"}
  ]
}`;

  try {
    const raw = await callClaude({ prompt, maxTokens: 400, route: 'accessories-director' });
    const parsed = parseJSON(raw) as { outfits: Array<{ accessories: string }> };
    return outfits.map((o, i) => ({
      ...o,
      accessories: parsed.outfits[i]?.accessories ?? undefined,
    }));
  } catch {
    return outfits;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN POST HANDLER
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { message, items, weather, wardrobeGrid, wardrobeGridMapping, conversationHistory } = await req.json() as {
      message: string;
      items?: WardrobeItem[];
      weather?: { locationName: string; tempF: number; condition: string; summary: string };
      wardrobeGrid?: string;
      wardrobeGridMapping?: string;
      conversationHistory?: Array<{ role: 'user' | 'stylist'; text: string }>;
    };

    if (!message?.trim()) return NextResponse.json({ error: 'No message' }, { status: 400 });

    // Load all context in parallel
    const [personaCtx, styleBriefCtx, lifestyleCtx, existingRaw, brandVoice, styleDirectives] = await Promise.all([
      getPersonaContext(),
      getStyleBriefContext(),
      getLifestyleContext(),
      getSetting('style_directives'),
      getBrandVoiceContext(),
      getStyleDirectives(),
    ]);

    const existing: StyleDirective[] = existingRaw ? JSON.parse(existingRaw) : [];

    const existingDirectivesText = existing.length
      ? `CLIENT DIRECTIVES (from previous sessions — apply to every recommendation):\n${existing.map((d) => `- ${d.instruction}`).join('\n')}\n`
      : '';

    const itemListText = items?.length
      ? items.map((it) =>
          `${it.id} :: ${it.category}${it.accessoryType ? ' (' + it.accessoryType + ')' : ''}, "${it.name}", ${it.primaryColor}${it.secondaryColor ? '/' + it.secondaryColor : ''}${it.material ? ', ' + it.material : ''}${it.fit ? ', ' + it.fit : ''}${it.length ? ', ' + it.length : ''}, ${it.formality}, ${it.season}${(it.wearCount ?? 0) > 0 ? ', worn ' + it.wearCount + 'x' : ''}`
        ).join('\n')
      : '';

    const wardrobeBlock = itemListText
      ? `\nCLIENT'S WARDROBE (${items!.length} pieces):\n${itemListText}\n`
      : '';

    const gridBlock = wardrobeGrid
      ? `\nVISUAL WARDROBE GRID attached. Grid key: ${wardrobeGridMapping}. Use the visual to ground your advice in what these clothes actually look like.\n`
      : '';

    const weatherBlock = weather
      ? `\nCURRENT CONDITIONS (${weather.locationName}): ${weather.tempF}°F, ${weather.condition}. ${weather.summary} Factor this into outfit suggestions — fabrics, layering, and weather-appropriateness matter.\n`
      : '';

    const conversationBlock = conversationHistory?.length
      ? `\nRECENT CONVERSATION HISTORY (for context on the client's preferences and tone — do NOT treat earlier questions as part of the current request; each message is a distinct ask):\n${conversationHistory.map((m) => `${m.role === 'user' ? 'CLIENT' : 'STYLIST'}: ${m.text}`).join('\n')}\n`
      : '';

    // Trim conversation history for specialists — only last 2 exchanges for tone/preference context
    const trimmedConversationBlock = conversationHistory?.length
      ? `\nRECENT HISTORY (tone/preference context only — focus on the current request):\n${conversationHistory.slice(-4).map((m) => `${m.role === 'user' ? 'CLIENT' : 'STYLIST'}: ${m.text}`).join('\n')}\n`
      : '';

    // Context block passed to all specialists (shared context, no specialist personas)
    const sharedContext = [
      styleBriefCtx ? `COLOUR PROFILE:\n${styleBriefCtx}` : '',
      lifestyleCtx,
      weatherBlock,
      styleDirectives,
      existingDirectivesText,
      trimmedConversationBlock,
    ].filter(Boolean).join('\n');

    // ── STEP 1: Run 5 specialists in parallel ────────────────────────────────

    const specialistCalls: Promise<SpecialistBrief>[] = [
      runSpecialist(
        'Fit & Proportion',
        FIT_SPECIALIST_PERSONA,
        'Evaluate every proposed or possible combination against your proportion rules — fulcrum principle, hem intelligence, tuck decision, structure tension. Propose combinations that pass all structural tests. Flag any proportion problem you see.',
        message, itemListText, sharedContext,
      ),
      runSpecialist(
        'Colour Analysis',
        COLOUR_ANALYST_PERSONA,
        'Apply the colour profile as a hard filter. Propose combinations where the dominant pieces fall within the flattering palette. Flag any combination where a dominant piece falls in the avoid list.',
        message, itemListText, sharedContext,
      ),
      runSpecialist(
        'Fashion Editor',
        FASHION_EDITOR_PERSONA,
        'Apply your two tests — aesthetic coherence and currency. Propose combinations that have genuine visual logic and read as intentional and current. Name the specific thing that makes each interesting. Flag anything that reads as incoherent or dated.',
        message, itemListText, sharedContext,
      ),
      runSpecialist(
        'Occasion & Context',
        OCCASION_SPECIALIST_PERSONA,
        'Assess the occasion or context the client is dressing for against your four axes: formality level, sector/industry culture, geography, and what they are trying to signal. Provide the contextual brief the head stylist needs. Flag any combination that would misread for this context.',
        message, itemListText, sharedContext,
      ),
      runSpecialist(
        'Wardrobe Intelligence',
        WARDROBE_INTELLIGENCE_PERSONA,
        'Read the wear patterns, category clusters, aspiration-reality gap, and brand projection. Provide the behavioural and identity context the head stylist needs to make a recommendation that serves the client\'s real situation, not just their stated request. Flag the most important pattern or gap you observe.',
        message, itemListText, sharedContext,
      ),
    ];

    const specialistBriefs = await Promise.all(specialistCalls);

    // ── STEP 2: Head stylist synthesizes ────────────────────────────────────

    const wardrobeImages = wardrobeGrid ? [{ base64: wardrobeGrid }] : undefined;
    const synthesis = await runHeadStylist(
      message, personaCtx, brandVoice,
      styleBriefCtx, lifestyleCtx, weatherBlock,
      wardrobeBlock, gridBlock,
      existingDirectivesText, conversationBlock,
      specialistBriefs, wardrobeImages,
    );

    // ── STEP 3: Accessories director finishes the outfits ────────────────────

    let finalOutfits = synthesis.outfits;
    if (finalOutfits?.length && items?.length) {
      // Filter incomplete outfits before sending to accessories director
      finalOutfits = finalOutfits.filter((o) => isCompleteOutfit(o.itemIds, items));
      if (finalOutfits.length) {
        finalOutfits = await runAccessoriesDirector(
          finalOutfits, items, styleBriefCtx, lifestyleCtx,
        );
      }
    }

    // ── Save directives ──────────────────────────────────────────────────────

    const newDirectives: StyleDirective[] = (synthesis.directives ?? []).map((instruction) => ({
      instruction,
      addedAt: new Date().toISOString(),
    }));

    const updated = [...existing, ...newDirectives].slice(-10);
    try {
      await setSetting('style_directives', JSON.stringify(updated));
    } catch { /* storage failure — still return the AI response */ }

    return NextResponse.json({
      acknowledgment: synthesis.acknowledgment,
      directives: newDirectives,
      allDirectives: updated,
      outfits: finalOutfits ?? undefined,
      consultedSpecialists: specialistBriefs.map((b) => b.role),
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

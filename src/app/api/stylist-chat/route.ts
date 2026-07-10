import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { getSetting, setSetting, getSavedLooks } from '@/lib/db';
import { profileToContext, type BodyProfile } from '@/lib/body-profile';
import {
  getPersonaContext, getStyleBriefContext, getBrandVoiceContext,
  getLifestyleContext, getStyleDirectives, getStyleThesisContext,
  FIT_SPECIALIST_PERSONA, COLOUR_ANALYST_PERSONA, FASHION_EDITOR_PERSONA,
  OCCASION_SPECIALIST_PERSONA, WARDROBE_INTELLIGENCE_PERSONA, ACCESSORIES_DIRECTOR_PERSONA,
  STYLIST_2026_LENS, BRAND_VOICE_RULES, SHARED_OPERATING_PRINCIPLES,
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
  verdict: 'clear' | 'concern' | 'trade-off' | 'opportunity' | 'blocking';
  confidence: 'high' | 'medium' | 'low';
  observation: string;
  mechanism: string;
  recommendation: string;
  trade_off: string;
  abstain: boolean;
  candidates?: Array<{ itemIds: string[]; note: string }>;
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
  images?: Array<{ base64: string }>,
): Promise<SpecialistBrief> {
  const prompt = `${persona}

${SHARED_OPERATING_PRINCIPLES}

You are one specialist on a private styling team. The head stylist synthesizes all specialist briefs into the final recommendation — the client never sees your brief directly.

${contextBlock}

CLIENT'S WARDROBE:
${itemListText || '(No wardrobe items yet)'}

CLIENT'S REQUEST: "${message}"

YOUR REMIT: ${remit}

Return a structured specialist brief. Be honest about confidence. Abstain if you cannot make a confident judgement from the available information — do not manufacture confidence.

Use verdicts precisely:
— clear: no issue in your domain
— concern: a problem worth noting but not fatal
— trade-off: two valid options with real costs on each side
— opportunity: a specific improvement available
— blocking: a material failure that must change before the outfit works

If the client is asking for outfit recommendations, include 1-2 candidate combinations (by exact item id) that pass your specific criteria.

Respond with ONLY valid JSON, no markdown:
{
  "verdict": "clear|concern|trade-off|opportunity|blocking",
  "confidence": "high|medium|low",
  "observation": "max 30 words — what you can actually see or know, no invented details",
  "mechanism": "one word or phrase — proportion|colour|context|coherence|identity|practicality|visual-weight",
  "recommendation": "max 20 words — one precise action, or 'no change needed'",
  "trade_off": "max 20 words — what would be lost by making this change",
  "abstain": false,
  "candidates": [{"itemIds": ["id1","id2","id3"], "note": "max 15 words — why this passes your specific test"}]
}`;

  try {
    const raw = await callClaude({ prompt, images, maxTokens: 400, route: `specialist-${role.toLowerCase().replace(/\s+/g, '-')}` });
    const parsed = parseJSON(raw) as Omit<SpecialistBrief, 'role'>;
    return { role, ...parsed };
  } catch {
    return { role, verdict: 'clear', confidence: 'low', observation: 'Brief unavailable.', mechanism: '', recommendation: '', trade_off: '', abstain: true };
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

  // Classify the tension pattern across briefs
  const verdicts = specialistBriefs.filter((b) => !b.abstain).map((b) => b.verdict);
  const hasBlocking = verdicts.includes('blocking');
  const concernCount = verdicts.filter((v) => v === 'concern').length;
  const tensionClass = hasBlocking
    ? 'FATAL — at least one specialist has flagged a blocking issue'
    : concernCount >= 3
    ? 'DOMINANT — multiple concerns; the recommendation must address these before aesthetics'
    : concernCount >= 1
    ? 'MINOR — one concern; acknowledge it but do not let it derail the look'
    : verdicts.includes('trade-off')
    ? 'PRODUCTIVE TENSION — conflicting valid options; make a clear call and explain the trade'
    : 'CLEAR — no material concerns; proceed with confidence';

  const briefsBlock = specialistBriefs.map((b) => {
    if (b.abstain) return `── ${b.role.toUpperCase()} ── [abstained — insufficient information]`;
    const parts = [
      `── ${b.role.toUpperCase()} ──`,
      `Verdict: ${b.verdict.toUpperCase()} (confidence: ${b.confidence})`,
      `Observation: ${b.observation}`,
      `Mechanism: ${b.mechanism}`,
      `Recommendation: ${b.recommendation}`,
      `Trade-off: ${b.trade_off}`,
    ];
    if (b.candidates?.length) {
      b.candidates.forEach((c, i) => {
        parts.push(`Candidate ${i + 1}: [${c.itemIds.join(', ')}] — ${c.note}`);
      });
    }
    return parts.join('\n');
  }).join('\n\n');

  const prompt = `${personaCtx}

${STYLIST_2026_LENS}
${brandVoice}
${styleBriefCtx ? styleBriefCtx + '\n' : ''}${lifestyleCtx}${weatherBlock}${wardrobeBlock}${gridBlock}${existingDirectivesText}${conversationBlock}

━━━ SPECIALIST TEAM BRIEFS ━━━
Tension classification: ${tensionClass}

${briefsBlock}

━━━ YOUR TASK ━━━
The client has said: "${message}"

1. INTENT: Determine if the client wants outfit suggestions or a strategic/conversational response.

2. DIRECTIVES: Extract only permanent styling preferences or constraints the client has revealed — things that should change every future recommendation. A directive must describe a stable truth about how this person dresses, not a one-time request.

EXTRACT: "avoids heels", "prefers loose fits over the hip", "needs workwear options", "dislikes showing arms", "colour palette should stay neutral", "wants to look less formal day-to-day"
DO NOT EXTRACT: "wants outfits featuring the beige blazer", "asked for 3 looks today", "requested something for Tuesday", "asked what goes with a specific item", "wanted a casual option this time"

If the message contains no permanent preference — only a one-time request or contextual ask — return an empty directives array. Never log transient requests as directives.

3. RESPONSE: Write 1-2 sentences direct to the client. Specific, warm, declarative. No hedging, no hollow words, no exclamation marks. If tension class is FATAL or DOMINANT, address the core issue head-on — do not paper over it with outfit suggestions.

4. If intent is OUTFIT: Synthesize the specialist candidates above into the best 3 outfits. Where specialists conflict, make a clear call — explain the trade-off in the rationale. Use ONLY items from the wardrobe. Each outfit must be COMPLETE — a wearable look a person could walk out the door in.

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
// STYLE THESIS UPDATER — runs in background after each conversation turn
// Maintains a living ~150-word client profile in Redis.
// ─────────────────────────────────────────────────────────────────────────────

async function updateStyleThesisInBackground(
  existingThesis: string,
  wardrobeBlock: string,
  conversationTurn: { message: string; response: string },
  existingDirectivesText: string,
  lifestyleCtx: string,
  styleBriefCtx: string,
): Promise<void> {
  try {
    const prompt = `${WARDROBE_INTELLIGENCE_PERSONA}

You maintain a living client style thesis — a concise, factual summary of who this client is as a dresser, updated after every conversation.

${styleBriefCtx ? 'COLOUR PROFILE:\n' + styleBriefCtx + '\n' : ''}${lifestyleCtx}${existingDirectivesText}${wardrobeBlock}

MOST RECENT EXCHANGE:
CLIENT: "${conversationTurn.message}"
STYLIST RESPONSE: "${conversationTurn.response}"

${existingThesis ? 'CURRENT THESIS:\n' + existingThesis + '\n\nUpdate the thesis to reflect what you now know. Preserve what is still true. Replace or add where the new exchange changes or adds to the picture.' : 'No thesis exists yet. Write the initial thesis based on what is available.'}

Write a 100-150 word style thesis. Cover: what this client actually wears and reaches for; their real aesthetic identity (not aspirational); their fit and colour preferences; occasions they dress for; the gap between what they own and what they need; and the one or two truths about this client that a stylist must never forget. Be specific. No generalities, no hollow observations.

Respond with ONLY the thesis text — no JSON, no heading, no preamble.`;

    const thesis = await callClaude({ prompt, maxTokens: 300, route: 'style-thesis-update' });
    if (thesis?.trim()) {
      await setSetting('style_thesis', thesis.trim());
    }
  } catch {
    // Background update — never propagate errors to the client
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN POST HANDLER
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { message, items, bodyProfile, weather, wardrobeGrid, wardrobeGridMapping, conversationHistory } = await req.json() as {
      message: string;
      items?: WardrobeItem[];
      bodyProfile?: BodyProfile;
      weather?: { locationName: string; tempF: number; condition: string; summary: string };
      wardrobeGrid?: string;
      wardrobeGridMapping?: string;
      conversationHistory?: Array<{ role: 'user' | 'stylist'; text: string }>;
    };

    if (!message?.trim()) return NextResponse.json({ error: 'No message' }, { status: 400 });

    // Load all context in parallel
    const [personaCtx, styleBriefCtx, lifestyleCtx, existingRaw, brandVoice, styleDirectives, thesisCtx, existingThesisRaw, savedLooks] = await Promise.all([
      getPersonaContext(),
      getStyleBriefContext(),
      getLifestyleContext(),
      getSetting('style_directives'),
      getBrandVoiceContext(),
      getStyleDirectives(),
      getStyleThesisContext(),
      getSetting('style_thesis'),
      getSavedLooks(),
    ]);

    const existing: StyleDirective[] = existingRaw ? JSON.parse(existingRaw) : [];

    // Body profile context for Fit specialist
    const bodyProfileCtx = bodyProfile
      ? `\nCLIENT BODY PROFILE:\n${profileToContext(bodyProfile)}\nAll proportion and fit recommendations must be assessed against this profile.\n`
      : '';

    // Saved look history for Wardrobe Intelligence
    const workedLooks = savedLooks.filter((l) => l.feedback === 'worked');
    const didntWorkLooks = savedLooks.filter((l) => l.feedback === 'didnt_work');
    const savedLooksCtx = savedLooks.length ? [
      workedLooks.length ? `Looks worn and rated as working: ${workedLooks.map((l) => l.title).join('; ')}` : '',
      didntWorkLooks.length ? `Looks worn and rated as not working: ${didntWorkLooks.map((l) => l.title).join('; ')}` : '',
      savedLooks.filter((l) => !l.feedback).length ? `Looks saved but not yet worn: ${savedLooks.filter((l) => !l.feedback).map((l) => l.title).join('; ')}` : '',
    ].filter(Boolean).join('\n') : '';
    const savedLooksBlock = savedLooksCtx
      ? `\nCLIENT LOOK HISTORY (what has actually been worn and how it landed):\n${savedLooksCtx}\nUse this as behavioural evidence — what the client reaches for, what works on them in practice, what doesn't.\n`
      : '';

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
      thesisCtx,
      styleBriefCtx ? `COLOUR PROFILE:\n${styleBriefCtx}` : '',
      bodyProfileCtx,
      lifestyleCtx,
      savedLooksBlock,
      weatherBlock,
      styleDirectives,
      existingDirectivesText,
      trimmedConversationBlock,
    ].filter(Boolean).join('\n');

    // ── STEP 1: Route to relevant specialists ────────────────────────────────
    // Classify the request to avoid running specialists who cannot contribute.

    const msgLower = message.toLowerCase();
    const isOutfitRequest = /\b(wear|outfit|look|dress|style me|what (should|do) i wear|what('s| is) (a good|the right)|suggest|recommend|put together|combine|combination)\b/.test(msgLower);
    const isColourQuestion = /\b(colour|color|palette|tone|clash|match|go with)\b/.test(msgLower);
    const isFitQuestion = /\b(fit|proportion|shape|tuck|hem|length|size|silhouette)\b/.test(msgLower);
    const isOccasionQuestion = /\b(occasion|work|office|interview|wedding|event|formal|casual|weekend|smart|dress code|meeting|date|party|travel)\b/.test(msgLower);
    const isWardrobeQuestion = /\b(missing|gap|need|buy|shopping|capsule|wardrobe|collection|have enough|what do i (have|own))\b/.test(msgLower);

    // Always include: Fit (structure), Colour (hard filter), Wardrobe Intelligence (identity context)
    // Conditionally include: Fashion Editor (all outfit requests + general aesthetic questions)
    //                        Occasion (when context/event is relevant)
    const runFashionEditor = isOutfitRequest || isColourQuestion || isFitQuestion || (!isWardrobeQuestion && !isOccasionQuestion);
    const runOccasion = isOccasionQuestion || isOutfitRequest;

    const wardrobeImages = wardrobeGrid ? [{ base64: wardrobeGrid }] : undefined;

    const specialistCalls: Promise<SpecialistBrief>[] = [
      runSpecialist(
        'Fit & Proportion',
        FIT_SPECIALIST_PERSONA,
        `Evaluate every proposed or possible combination against your proportion rules — fulcrum principle, hem intelligence, tuck decision, structure tension. The client body profile is in your context — apply it specifically. Propose combinations that pass all structural tests for this body. Flag any proportion problem you see.${wardrobeImages ? ' A visual wardrobe grid is attached — use it to assess actual silhouette and drape, not just the text descriptions.' : ''}`,
        message, itemListText, sharedContext, wardrobeImages,
      ),
      runSpecialist(
        'Colour Analysis',
        COLOUR_ANALYST_PERSONA,
        `Apply the colour profile as a hard filter. Propose combinations where the dominant pieces fall within the flattering palette. Flag any combination where a dominant piece falls in the avoid list.${wardrobeImages ? ' A visual wardrobe grid is attached — verify actual colours visually rather than relying solely on colour name text fields.' : ''}`,
        message, itemListText, sharedContext, wardrobeImages,
      ),
      runSpecialist(
        'Wardrobe Intelligence',
        WARDROBE_INTELLIGENCE_PERSONA,
        'Read the wear patterns, look history (what worked and what didn\'t), category clusters, aspiration-reality gap, and brand projection. The client\'s saved look history is in your context — treat it as behavioural evidence about what actually works on this person, not just what they aspire to. Provide the behavioural and identity context the head stylist needs. Flag the most important pattern or gap you observe.',
        message, itemListText, sharedContext,
      ),
      ...(runFashionEditor ? [runSpecialist(
        'Fashion Editor',
        FASHION_EDITOR_PERSONA,
        'Apply your two tests — aesthetic coherence and currency. Propose combinations that have genuine visual logic and read as intentional and current. Name the specific thing that makes each interesting. Flag anything that reads as incoherent or dated.',
        message, itemListText, sharedContext,
      )] : []),
      ...(runOccasion ? [runSpecialist(
        'Occasion & Context',
        OCCASION_SPECIALIST_PERSONA,
        'Assess the occasion or context the client is dressing for against your four axes: formality level, sector/industry culture, geography, and what they are trying to signal. Provide the contextual brief the head stylist needs. Flag any combination that would misread for this context.',
        message, itemListText, sharedContext,
      )] : []),
    ];

    const specialistBriefs = await Promise.all(specialistCalls);

    // ── STEP 2: Head stylist synthesizes ────────────────────────────────────

    const synthesis = await runHeadStylist(
      message, personaCtx, brandVoice,
      styleBriefCtx, thesisCtx + lifestyleCtx + bodyProfileCtx + savedLooksBlock, weatherBlock,
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

    // Fire thesis update in background — non-blocking
    updateStyleThesisInBackground(
      existingThesisRaw ?? '',
      wardrobeBlock,
      { message, response: synthesis.acknowledgment },
      existingDirectivesText,
      lifestyleCtx,
      styleBriefCtx,
    );

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

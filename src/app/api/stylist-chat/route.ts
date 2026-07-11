import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { getSetting, setSetting, getSavedLooks } from '@/lib/db';
import { profileToContext, type BodyProfile } from '@/lib/body-profile';
import {
  getPersonaContext, getStyleBriefContext, getBrandVoiceContext,
  getLifestyleContext, getStyleDirectives, getStyleThesisContext,
  FIT_SPECIALIST_PERSONA, COLOUR_ANALYST_PERSONA, FASHION_EDITOR_PERSONA,
  OCCASION_SPECIALIST_PERSONA, WARDROBE_INTELLIGENCE_PERSONA,
  STYLIST_2026_LENS, SHARED_OPERATING_PRINCIPLES, STYLING_CRAFT_LIBRARY,
} from '@/lib/stylist';
import { getWardrobeCharacterBriefContext } from '@/lib/wardrobe-brain';
import { isCompleteOutfit, runVisualGate, runAccessoriesDirector, type ChatOutfit, type WardrobeItemLite } from '@/lib/outfit-pipeline';

export type StyleDirective = {
  instruction: string;
  addedAt: string;
};

type WardrobeItem = WardrobeItemLite;

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

type PackingPiece = { itemId: string; role: string };
type GapItem = { description: string; why: string; priority: 'high' | 'medium' | 'low' };

export type Block =
  | { type: 'text'; label?: string; content: string }
  | { type: 'outfits'; label?: string; outfits: ChatOutfit[] }
  | { type: 'packingList'; label?: string; logic: string; outfitCount: number; pieces: PackingPiece[] }
  | { type: 'focus'; label?: string; focusItemId: string; analysis: string; styling: string; pairings: Array<{ itemIds: string[]; note: string }> }
  | { type: 'verdict'; label?: string; verdict: 'yes' | 'no' | 'with-modifications'; reasoning: string; modification?: string; alternativeItemIds?: string[] }
  | { type: 'principles'; label?: string; items: string[] }
  | { type: 'gaps'; label?: string; gaps: GapItem[]; unlockPiece?: string }
  | { type: 'itemList'; label: string; itemIds: string[] };

type StylistResponse = {
  directives: string[];
  acknowledgment: string;
  blocks: Block[];
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
// ROUND TABLE — one cross-talk pass when specialists disagree.
// Real teams get quality from friction, not from five monologues stapled
// together. When verdicts conflict, show each specialist what the others said
// and let them push back, concede, or sharpen — in a single combined call so
// the cost stays bounded to one extra round-trip, not N.
// ─────────────────────────────────────────────────────────────────────────────

function briefsHaveDisagreement(briefs: SpecialistBrief[]): boolean {
  const live = briefs.filter((b) => !b.abstain);
  if (live.length < 2) return false;
  const verdicts = new Set(live.map((b) => b.verdict));
  const hasBlocking = verdicts.has('blocking');
  const hasTradeOff = verdicts.has('trade-off');
  const mixedClearAndConcern = verdicts.has('clear') && verdicts.has('concern');
  return hasBlocking || hasTradeOff || mixedClearAndConcern;
}

async function runRoundTable(
  message: string,
  briefs: SpecialistBrief[],
): Promise<SpecialistBrief[]> {
  const briefsText = briefs.map((b) => {
    if (b.abstain) return `── ${b.role.toUpperCase()} ── [abstained]`;
    return [
      `── ${b.role.toUpperCase()} ──`,
      `Verdict: ${b.verdict.toUpperCase()} (confidence: ${b.confidence})`,
      `Observation: ${b.observation}`,
      `Recommendation: ${b.recommendation}`,
      b.candidates?.length ? `Candidates: ${b.candidates.map((c) => `[${c.itemIds.join(', ')}] — ${c.note}`).join(' | ')}` : '',
    ].filter(Boolean).join('\n');
  }).join('\n\n');

  const prompt = `You are moderating a round-table between styling specialists who gave conflicting or tense initial briefs on the same client request: "${message}"

${SHARED_OPERATING_PRINCIPLES}

INITIAL BRIEFS:
${briefsText}

Each specialist has now seen every other brief. For each specialist (in the same order, same roles), produce a revised brief: hold their position if it survives the pushback, or concede and sharpen it if a stronger specialist argument overrides theirs. A specialist should update their candidates if another specialist's candidate is objectively stronger against their own criteria. Do not manufacture false consensus — real disagreement should survive if it is genuinely a trade-off, not a lack of information.

Respond with ONLY valid JSON, no markdown — same shape and order as the input, one object per specialist:
{
  "briefs": [
    {"role": "exact role name", "verdict": "clear|concern|trade-off|opportunity|blocking", "confidence": "high|medium|low", "observation": "max 30 words", "mechanism": "one word or phrase", "recommendation": "max 20 words", "trade_off": "max 20 words", "abstain": false, "candidates": [{"itemIds": ["id1","id2"], "note": "max 15 words"}]}
  ]
}`;

  try {
    const raw = await callClaude({ prompt, maxTokens: 700, route: 'round-table' });
    const parsed = parseJSON(raw) as { briefs: SpecialistBrief[] };
    if (!parsed.briefs?.length) return briefs;
    return briefs.map((original) => {
      const revised = parsed.briefs.find((r) => r.role === original.role);
      return revised ? { ...original, ...revised } : original;
    });
  } catch {
    return briefs;
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
  wardrobeCharacterBriefCtx = '',
): Promise<StylistResponse> {

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
${styleBriefCtx ? styleBriefCtx + '\n' : ''}${lifestyleCtx}${weatherBlock}${wardrobeCharacterBriefCtx}${wardrobeBlock}${gridBlock}${existingDirectivesText}${conversationBlock}

${STYLING_CRAFT_LIBRARY}

━━━ SPECIALIST TEAM BRIEFS ━━━
Tension classification: ${tensionClass}

${briefsBlock}

━━━ YOUR TASK ━━━
The client has said: "${message}"

STEP 1 — DIRECTIVES: Extract only permanent styling preferences or constraints revealed. A directive is a stable truth about how this person dresses — not a one-time request.
EXTRACT: "avoids heels", "prefers loose fits", "needs workwear", "dislikes showing arms", "stays neutral palette"
DO NOT EXTRACT: "wants outfits with the beige blazer", "asked for 3 looks", "wants something for Tuesday"
Return an empty array if nothing permanent was revealed.

STEP 2 — SYNTHESIZE SPECIALIST INPUT: Before writing anything, resolve the team's verdicts:
— Any combination flagged BLOCKING by any specialist must be excluded. No exceptions.
— CONCERN verdicts must be acknowledged or addressed in your response — do not silently ignore them.
— Favour outfit candidates that multiple specialists have endorsed. If a specialist proposed specific item IDs that pass their tests, prefer those combinations.
— If the tension class is FATAL or DOMINANT, lead with the problem before offering alternatives.
— You have consulted the full team. Your response must reflect their collective input — do not arrive at a recommendation that contradicts a specialist who gave high-confidence input.
— VARIETY: If the client is asking for outfit ideas or options for an occasion (not a narrow single-item verdict), propose at least 2 genuinely different combinations built around different anchor pieces. Do not let the specialists' shared preference for high-wear-count pieces collapse your answer onto the same 1-2 items every time — a client asking "what should I wear" wants her wardrobe's range explored, not her go-to pairing recycled back at her.
— REPETITION CHECK: Look at the recent conversation history above. If you already proposed a specific combination earlier in this conversation, do not propose the identical combination again — the client has either already seen it or has told you it doesn't fit. Offer something genuinely different.
— QUALITY GATE: Variety and underused-piece candidates are not exempt from scrutiny. Before finalizing ANY combination — whether it came from a specialist's candidate list or your own synthesis — check it against Fit & Proportion's structure rules, Colour Analysis's palette test, and Fashion Editor's pattern-mixing and coherence test yourself. A pairing surfaced because it's underused, or because a single specialist proposed it, still has to actually work as a whole outfit. Two competing bold prints with no coordinating logic, a proportion clash, or a palette miss must be excluded even if no specialist explicitly called it BLOCKING — you are the final check, not a pass-through.

STEP 3 — WRITE YOUR RESPONSE: 1-2 sentences to the client. Direct, warm, declarative. No hedging, no hollow words, no exclamation marks.

STEP 4 — BUILD YOUR BLOCKS: Compose a response from any combination of block types, in whatever order best serves the request. You are not limited to one of each — a wedding weekend needs multiple outfit blocks, and a simple "what should I wear to X" question deserves 2-3 real options, not one. A narrow verdict question ("does this work") may need only a text or verdict block. Choose the structure that would be most useful to this client for this specific request.

AVAILABLE BLOCK TYPES:

"text" — a paragraph of analysis, reasoning, or advice. Use when the content is discursive.
  {"type":"text","label":"optional heading","content":"your text here"}

"outfits" — one or more complete outfit combinations. Use for specific looks to wear.
  {"type":"outfits","label":"optional e.g. 'Day 1' or 'For the dinner'","outfits":[{"title":"max 5 words","itemIds":["id1","id2","id3"],"styleReference":"2026 aesthetic max 6 words","rationale":"max 20 words, starts with Try or Wear","stylingNote":"max 15 words — the specific technique from the STYLING CRAFT vocabulary that makes this combination work, e.g. 'Half-tuck the shirt, cuff twice narrow, ankle-cuff the trouser hem'"}]}

"packingList" — a travel capsule: minimum pieces, maximum outfit combinations.
  {"type":"packingList","logic":"max 20 words — pieces count, outfit count, what it covers","outfitCount":14,"pieces":[{"itemId":"id1","role":"max 8 words — why this earns its place"}]}

"focus" — analysis of one specific piece and how to wear it.
  {"type":"focus","focusItemId":"exact item id","analysis":"max 25 words — what this piece is and how it works","styling":"max 20 words — proportion, tuck, occasion guidance","pairings":[{"itemIds":["id1","id2"],"note":"max 15 words — why this works"}]}

"verdict" — a direct yes/no/with-modifications on a specific question.
  {"type":"verdict","verdict":"yes|no|with-modifications","reasoning":"max 25 words","modification":"max 20 words — what would make it work","alternativeItemIds":["id1","id2","id3"]}

"principles" — a list of specific styling rules or guidelines for this client.
  {"type":"principles","label":"optional heading","items":["specific principle max 20 words","..."]}

"gaps" — wardrobe gap analysis with priority-ordered missing pieces.
  {"type":"gaps","gaps":[{"description":"specific gap max 10 words","why":"max 15 words","priority":"high|medium|low"}],"unlockPiece":"max 20 words — best single purchase"}

"itemList" — a labelled selection of specific items from the wardrobe.
  {"type":"itemList","label":"heading e.g. 'Best pieces for this'","itemIds":["id1","id2","id3"]}

OUTFIT COMPLETENESS RULE: Every outfit in an "outfits" or "packingList" block requires a base layer top (shirt, blouse, t-shirt, tank, bodysuit, camisole, or fine knit) OR a dress/jumpsuit. Plus a bottom OR the dress/jumpsuit. Layering pieces (cardigan, blazer, jacket, coat, hoodie, jumper, overshirt) always require a base layer top underneath.

Respond with ONLY valid JSON, no markdown:
{
  "directives": [],
  "acknowledgment": "1-2 sentences to the client",
  "blocks": [ ...your chosen blocks in order... ]
}`;

  // The head stylist is the taste-critical call — it runs on the strongest model.
  const raw = await callClaude({ prompt, images: wardrobeImages, maxTokens: 3500, model: 'claude-opus-4-8', route: 'head-stylist' });
  return parseJSON(raw) as StylistResponse;
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
    const [personaCtx, styleBriefCtx, lifestyleCtx, existingRaw, brandVoice, styleDirectives, thesisCtx, existingThesisRaw, savedLooks, wardrobeCharacterBriefCtx] = await Promise.all([
      getPersonaContext(),
      getStyleBriefContext(),
      getLifestyleContext(),
      getSetting('style_directives'),
      getBrandVoiceContext(),
      getStyleDirectives(),
      getStyleThesisContext(),
      getSetting('style_thesis'),
      getSavedLooks(),
      getWardrobeCharacterBriefContext(),
    ]);

    const existing: StyleDirective[] = existingRaw ? JSON.parse(existingRaw) : [];

    // Body profile context for Fit specialist
    const bodyProfileCtx = bodyProfile
      ? `\nCLIENT BODY PROFILE:\n${profileToContext(bodyProfile)}\nAll proportion and fit recommendations must be assessed against this profile.\n`
      : '';

    // Saved look history for Wardrobe Intelligence
    const workedLooks = savedLooks.filter((l) => l.feedback === 'worked');
    const didntWorkLooks = savedLooks.filter((l) => l.feedback === 'didnt_work');
    const lookPieces = (ids: string[]) => ids.map((id) => items?.find((i) => i.id === id)?.name).filter(Boolean).join(' + ');
    const savedLooksCtx = savedLooks.length ? [
      workedLooks.length ? `CONFIRMED WINS — combinations validated in real life on this client. These are your taste calibration: every new proposal should hold up next to them:\n${workedLooks.map((l) => `- "${l.title}"${lookPieces(l.itemIds) ? ': ' + lookPieces(l.itemIds) : ''}`).join('\n')}` : '',
      didntWorkLooks.length ? `CONFIRMED MISSES — worn and rated as not working. Understand why before proposing anything similar:\n${didntWorkLooks.map((l) => `- "${l.title}"${lookPieces(l.itemIds) ? ': ' + lookPieces(l.itemIds) : ''}`).join('\n')}` : '',
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
          `${it.id} :: ${it.category}${it.accessoryType ? ' (' + it.accessoryType + ')' : ''}, "${it.name}", ${it.primaryColor}${it.secondaryColor ? '/' + it.secondaryColor : ''}${it.material ? ', ' + it.material : ''}${it.fit ? ', ' + it.fit : ''}${it.length ? ', ' + it.length : ''}, ${it.formality}, ${it.season}${it.visualNotes ? ' [' + it.visualNotes + ']' : ''}${(it.wearCount ?? 0) > 0 ? ', worn ' + it.wearCount + 'x' : ''}${it.styleNote ? ' — ' + it.styleNote : ''}`
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
    const isCapsuleRequest = /\b(holiday|trip|travel|packing|pack|days away|weekend away|minimis|suitcase|luggage|capsule|how many outfits)\b/.test(msgLower);
    const isColourQuestion = /\b(colour|color|palette|tone|clash|match|go with)\b/.test(msgLower);
    const isFitQuestion = /\b(fit|proportion|shape|tuck|hem|length|size|silhouette)\b/.test(msgLower);
    const isOccasionQuestion = /\b(occasion|work|office|interview|wedding|event|formal|casual|weekend|smart|dress code|meeting|date|party|travel)\b/.test(msgLower);
    const isWardrobeQuestion = /\b(missing|gap|need|buy|shopping|wardrobe|collection|have enough|what do i (have|own))\b/.test(msgLower);

    // Always include: Fit (structure), Colour (hard filter), Wardrobe Intelligence (identity context)
    // Conditionally include: Fashion Editor (all outfit requests + general aesthetic questions)
    //                        Occasion (when context/event is relevant)
    const isFocusRequest = /\b(what goes with|go with|wear with|pair with|style with|how (do|should|can) i wear|how to wear|works? with)\b/.test(msgLower);
    const isVerdictRequest = /\b(can i wear|does this work|would this work|is this (ok|okay|appropriate|right)|too (formal|casual|much))\b/.test(msgLower);
    const isStrategyRequest = /\b(look more|dress more|build a wardrobe|dress for|style for|want to (look|dress|appear)|wardrobe for)\b/.test(msgLower);

    const runFashionEditor = isOutfitRequest || isCapsuleRequest || isFocusRequest || isColourQuestion || isFitQuestion || isStrategyRequest || (!isWardrobeQuestion && !isOccasionQuestion && !isVerdictRequest);
    const runOccasion = isOccasionQuestion || isOutfitRequest || isCapsuleRequest || isVerdictRequest;

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
        isCapsuleRequest
          ? 'Identify the most versatile pieces in this wardrobe — items that work across multiple outfit combinations, multiple formality levels, and multiple activity types. Rank the top 8–12 pieces by versatility-per-item for a travel capsule. Flag any category gaps (e.g. no lightweight layer, no smart-casual option) that would leave the client without an outfit for a likely occasion.'
          : 'Read the wear patterns, look history (what worked and what didn\'t), category clusters, aspiration-reality gap, and brand projection. The client\'s saved look history is in your context — treat it as behavioural evidence about what actually works on this person, not as a script to repeat. If this is a request for outfit ideas (not a narrow single-item verdict), your job is to surface underused pieces worth reactivating — do not propose the same top-worn anchor combination the client already reaches for constantly; that is not new information, it is a rut. High wear count validates that a piece works on this client; it does not mean the same 1-2 pieces should be the candidate every time. An underused piece is only worth surfacing if it genuinely coordinates with something else in the wardrobe on colour and proportion, not merely because it has low wear count — do not propose a pairing you would not also propose if wear count were irrelevant. Provide the behavioural and identity context the head stylist needs. Flag the most important pattern or gap you observe.',
        message, itemListText, sharedContext,
      ),
      ...(runFashionEditor ? [runSpecialist(
        'Fashion Editor',
        FASHION_EDITOR_PERSONA,
        `Apply your two tests — aesthetic coherence and currency. Propose combinations that have genuine visual logic and read as intentional and current. Name the specific thing that makes each interesting. Flag anything that reads as incoherent or dated. Pay specific attention to pattern mixing: two bold patterns (florals, animal print, houndstooth, plaid, geometric) together only work with a shared colour family or a clear dominant/accent scale hierarchy — flag any pattern-on-pattern combination that lacks that logic as a clash, not a considered choice.${wardrobeImages ? ' A visual wardrobe grid is attached — judge coherence with your eyes on the actual garments, not from the text descriptions alone.' : ''}`,
        message, itemListText, sharedContext, wardrobeImages,
      )] : []),
      ...(runOccasion ? [runSpecialist(
        'Occasion & Context',
        OCCASION_SPECIALIST_PERSONA,
        'Assess the occasion or context the client is dressing for against your four axes: formality level, sector/industry culture, geography, and what they are trying to signal. Provide the contextual brief the head stylist needs. Flag any combination that would misread for this context.',
        message, itemListText, sharedContext,
      )] : []),
    ];

    let specialistBriefs = await Promise.all(specialistCalls);

    // ── STEP 1.5: Round table — one cross-talk pass if the team disagrees ────
    // Only pay for the extra call when there's a real tension to resolve.

    if (briefsHaveDisagreement(specialistBriefs)) {
      specialistBriefs = await runRoundTable(message, specialistBriefs);
    }

    // ── STEP 2: Head stylist synthesizes ────────────────────────────────────

    const synthesis = await runHeadStylist(
      message, personaCtx, brandVoice,
      styleBriefCtx, thesisCtx + lifestyleCtx + bodyProfileCtx + savedLooksBlock, weatherBlock,
      wardrobeBlock, gridBlock,
      existingDirectivesText, conversationBlock,
      specialistBriefs, wardrobeImages,
      wardrobeCharacterBriefCtx,
    );

    // ── STEP 3: Post-process blocks ──────────────────────────────────────────
    // Run completeness check + accessories director on all outfit blocks

    let finalBlocks = synthesis.blocks ?? [];

    if (items?.length) {
      // Collect all outfit blocks that have outfits
      const outfitBlockIndices: number[] = [];
      const allOutfits: ChatOutfit[] = [];
      finalBlocks.forEach((b, i) => {
        if (b.type === 'outfits' && b.outfits?.length) {
          outfitBlockIndices.push(i);
          allOutfits.push(...b.outfits);
        }
      });

      if (allOutfits.length) {
        const completeOutfits = allOutfits.filter((o) => isCompleteOutfit(o.itemIds, items));

        // Visual gate and accessories direction run concurrently rather than
        // sequentially — accessories are generated for every complete outfit
        // in parallel with the gate check, and simply discarded for whichever
        // outfits fail. Costs a few wasted accessory calls on rejected looks,
        // saves a full sequential AI round-trip on every request.
        const [gateSurvivors, accessorised] = completeOutfits.length
          ? await Promise.all([
              runVisualGate(completeOutfits, items),
              runAccessoriesDirector(completeOutfits, items, styleBriefCtx, lifestyleCtx),
            ])
          : [new Set<ChatOutfit>(), [] as ChatOutfit[]];
        const approvedOutfits = completeOutfits.filter((o) => gateSurvivors.has(o));

        const enriched = approvedOutfits.map((o) => {
          const idx = completeOutfits.indexOf(o);
          return accessorised[idx] ?? o;
        });

        // Map enriched outfits back into their blocks
        let enrichedIdx = 0;
        finalBlocks = finalBlocks.map((b, i) => {
          if (b.type !== 'outfits' || !outfitBlockIndices.includes(i)) return b;
          const blockOutfits: ChatOutfit[] = [];
          (b.outfits ?? []).forEach((o) => {
            if (isCompleteOutfit(o.itemIds, items) && gateSurvivors.has(o)) {
              if (enriched[enrichedIdx]) blockOutfits.push(enriched[enrichedIdx++]);
            }
          });
          return blockOutfits.length ? { ...b, outfits: blockOutfits } : null;
        }).filter((b): b is Block => b !== null);

        // Every proposed outfit failed the visual review — be honest rather than silent
        if (completeOutfits.length > 0 && approvedOutfits.length === 0) {
          finalBlocks.push({
            type: 'text',
            label: 'Final review',
            content: 'The team assembled options but pulled them at the final visual review — seen together, the combinations did not resolve. Ask again and the team will build from different anchor pieces.',
          });
        }
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
      blocks: finalBlocks,
      directives: newDirectives,
      allDirectives: updated,
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

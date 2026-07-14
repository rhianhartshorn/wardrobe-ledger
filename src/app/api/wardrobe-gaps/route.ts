import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { profileToContext, type BodyProfile } from '@/lib/body-profile';
import {
  getPersonaContext, getStyleDirectives, STYLIST_2026_LENS, getStyleBriefContext, getBrandVoiceContext, getLifestyleContext,
  FIT_SPECIALIST_PERSONA, FASHION_EDITOR_PERSONA, WARDROBE_INTELLIGENCE_PERSONA,
} from '@/lib/stylist';
import { runSpecialist, briefsHaveDisagreement, runRoundTable, classifyTension, formatBriefsBlock, buildWardrobeCachePrefix } from '@/lib/specialist-team';
import type { GapAnalysisResult } from '@/lib/gap-types';

type WardrobeItem = {
  id: string;
  category: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  pattern: string;
  formality: string;
  season: string;
  material?: string;
  fit?: string;
  length?: string;
  accessoryType?: string;
  wearCount?: number;
};

export type { WardrobeGap, GapAnalysisResult } from '@/lib/gap-types';

export async function POST(req: NextRequest) {
  try {
    const { items, bodyProfile, wearBehaviourSummary, wardrobeGrid, wardrobeGridMapping } = await req.json() as {
      items: WardrobeItem[];
      bodyProfile?: BodyProfile;
      wearBehaviourSummary?: string;
      wardrobeGrid?: string;
      wardrobeGridMapping?: string;
    };

    if (!items || items.length < 3) {
      return NextResponse.json({ error: 'Add at least 3 items to analyse wardrobe gaps.' }, { status: 400 });
    }

    const [styleBriefCtx, personaCtx, styleDirectives, brandVoice, lifestyleCtx] = await Promise.all([
      getStyleBriefContext(),
      getPersonaContext(),
      getStyleDirectives(),
      getBrandVoiceContext(),
      getLifestyleContext(),
    ]);

    const profileCtx = bodyProfile ? profileToContext(bodyProfile) : '';
    const profileBlock = profileCtx ? `\nCLIENT PROFILE: ${profileCtx}\n` : '';
    const behaviourBlock = wearBehaviourSummary ? `\nWEAR BEHAVIOUR: ${wearBehaviourSummary}\n` : '';

    const catSummary = items.reduce<Record<string, number>>((acc, it) => {
      acc[it.category] = (acc[it.category] ?? 0) + 1;
      return acc;
    }, {});
    const formalitySummary = items.reduce<Record<string, number>>((acc, it) => {
      acc[it.formality] = (acc[it.formality] ?? 0) + 1;
      return acc;
    }, {});
    const catLine = Object.entries(catSummary).map(([c, n]) => `${n} × ${c}`).join(', ');
    const formalityLine = Object.entries(formalitySummary).map(([f, n]) => `${n} × ${f}`).join(', ');
    const breakdownBlock = `\nCategory breakdown: ${catLine}\nFormality breakdown: ${formalityLine}\n`;

    const itemListText = items
      .map((it) => `${it.category}, "${it.name}", ${it.primaryColor}${it.secondaryColor ? '/' + it.secondaryColor : ''}, ${it.pattern || 'solid'}${it.material ? ', ' + it.material : ''}${it.fit ? ', ' + it.fit : ''}${it.length ? ', ' + it.length : ''}, ${it.formality}${(it.wearCount ?? 0) > 0 ? ', worn ' + it.wearCount + 'x' : ', unworn'}`)
      .join('\n');

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const gridBlock = wardrobeGrid
      ? `\nVISUAL WARDROBE GRID: A numbered image grid of all items is attached. Grid key: ${wardrobeGridMapping}. Use the visual grid to verify actual colours, fabric textures, and silhouettes when identifying gaps.\n`
      : '';

    const wardrobeImages = wardrobeGrid ? [{ base64: wardrobeGrid }] : undefined;

    const sharedContext = [
      styleBriefCtx ? `COLOUR PROFILE:\n${styleBriefCtx}` : '',
      lifestyleCtx,
      profileBlock,
      behaviourBlock,
      styleDirectives,
      breakdownBlock,
    ].filter(Boolean).join('\n');

    // ── STEP 1: The specialist team audits this wardrobe for real gaps ───────

    const task = 'Conduct a wardrobe audit identifying specific, actionable gaps — precise missing pieces that would unlock real daily wearability, plus categories the client should stop buying more of.';

    const specialistBriefs = await Promise.all([
      runSpecialist(
        'Fit & Proportion',
        FIT_SPECIALIST_PERSONA,
        'Identify structural gaps — missing silhouettes, rises, or layer weights that would resolve proportion problems this wardrobe currently cannot solve. Reference actual category counts and wear data.',
        task, itemListText, sharedContext,
      ),
      runSpecialist(
        'Fashion Editor',
        FASHION_EDITOR_PERSONA,
        'Identify aesthetic and coherence gaps — where this wardrobe lacks the connective pieces needed to make its existing items combine into current, intentional looks. Flag categories that are already over-represented with no real payoff.',
        task, itemListText, sharedContext, wardrobeImages,
      ),
      runSpecialist(
        'Wardrobe Intelligence',
        WARDROBE_INTELLIGENCE_PERSONA,
        'Identify behavioural and occasion gaps from wear patterns and category distribution — where the client is structurally unable to dress appropriately for a common occasion, or has clustered around a comfort zone at the expense of range. Name the biggest structural challenge this wardrobe has.',
        task, itemListText, sharedContext,
      ),
    ]);

    const finalBriefs = briefsHaveDisagreement(specialistBriefs)
      ? await runRoundTable(task, specialistBriefs)
      : specialistBriefs;

    // ── STEP 2: Head stylist synthesizes the audit ────────────────────────────

    const prompt = `${personaCtx} ${brandVoice} Today is ${today}.
${styleBriefCtx ? styleBriefCtx + '\n' : ''}${lifestyleCtx}${gridBlock}${styleDirectives}${profileBlock}${behaviourBlock}
${STYLIST_2026_LENS}

━━━ SPECIALIST TEAM BRIEFS ━━━
Tension classification: ${classifyTension(finalBriefs)}

${formatBriefsBlock(finalBriefs)}

━━━ YOUR TASK ━━━
${breakdownBlock}

Synthesize your team's briefs above into one wardrobe audit. Your job is to identify specific, actionable gaps — not vague advice like "add more variety", but precise missing pieces that would unlock real daily wearability.

For each gap, you need: (1) what is missing and why it matters given this specific wardrobe, (2) data from the wardrobe that confirms the gap — reference actual item names, wear counts, and category distributions, (3) a specific shopping suggestion naming cut, colour, fabric, and why it integrates with what they already own.

Priority HIGH = a gap that prevents the client from dressing appropriately for common occasions, or a structural imbalance they encounter daily. Priority MEDIUM = a gap that limits outfit combinations or versatility. Priority LOW = a refinement that would elevate an already-functional wardrobe.

Identify 3–6 gaps. Be ruthlessly specific. If the wardrobe is genuinely complete for its owner's apparent lifestyle, say so in the summary and surface only low-priority refinements.

Also identify 1–3 categories the client should NOT buy more of right now — things they already have enough of, or where buying more won't solve their actual problem. Be direct. "You already own 4 black knitwear pieces — more won't unlock new outfits." This is one of the most useful things a stylist can say.

Respond with ONLY valid JSON, no markdown:
{"summary":"one sentence honest assessment of the wardrobe's biggest structural challenge","gaps":[{"priority":"high|medium|low","gap":"what's missing — max 8 words","why":"specific data-backed reason referencing actual items or patterns","suggestion":"specific piece to buy: cut, colour, fabric, and why it integrates — max 25 words"}],"dontBuy":[{"category":"max 5 words — what NOT to buy","reason":"max 20 words — direct reason referencing actual wardrobe counts or patterns"}]}`;

    // Taste-critical synthesis — same standard as the head stylist elsewhere.
    // Shares the same cache prefix the specialist calls above just wrote.
    const raw = await callClaude({
      prompt,
      cacheableSections: [buildWardrobeCachePrefix(itemListText)],
      images: wardrobeImages,
      maxTokens: 2200,
      model: 'claude-opus-4-8',
      route: 'wardrobe-gaps',
    });
    const parsed = parseJSON(raw) as GapAnalysisResult;

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gap analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

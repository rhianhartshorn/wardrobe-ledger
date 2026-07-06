import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { profileToContext, type BodyProfile } from '@/lib/body-profile';
import { getPersonaContext, getStyleDirectives, STYLIST_2026_LENS, FIT_SPECIALIST_VOICE, FASHION_EDITOR_VOICE, getStyleBriefContext, getBrandVoiceContext, getLifestyleContext } from '@/lib/stylist';
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

    const itemListText = items
      .map((it) => `${it.category}, "${it.name}", ${it.primaryColor}${it.secondaryColor ? '/' + it.secondaryColor : ''}, ${it.pattern || 'solid'}${it.material ? ', ' + it.material : ''}${it.fit ? ', ' + it.fit : ''}${it.length ? ', ' + it.length : ''}, ${it.formality}${(it.wearCount ?? 0) > 0 ? ', worn ' + it.wearCount + 'x' : ', unworn'}`)
      .join('\n');

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const gridBlock = wardrobeGrid
      ? `\nVISUAL WARDROBE GRID: A numbered image grid of all items is attached. Grid key: ${wardrobeGridMapping}. Use the visual grid to verify actual colours, fabric textures, and silhouettes when identifying gaps.\n`
      : '';

    const prompt = `${personaCtx} ${FASHION_EDITOR_VOICE} ${FIT_SPECIALIST_VOICE} ${brandVoice} Today is ${today}.
${styleBriefCtx ? styleBriefCtx + '\n' : ''}${lifestyleCtx}${gridBlock}${styleDirectives}${profileCtx ? `\nCLIENT PROFILE: ${profileCtx}\n` : ''}${wearBehaviourSummary ? `\nWEAR BEHAVIOUR: ${wearBehaviourSummary}\n` : ''}
${STYLIST_2026_LENS}

FULL WARDROBE:
${itemListText}

Category breakdown: ${catLine}
Formality breakdown: ${formalityLine}

You are a senior personal stylist conducting a wardrobe audit. Your job is to identify specific, actionable gaps — not vague advice like "add more variety", but precise missing pieces that would unlock real daily wearability.

For each gap, you need: (1) what is missing and why it matters given this specific wardrobe, (2) data from the wardrobe that confirms the gap — reference actual item names, wear counts, and category distributions, (3) a specific shopping suggestion naming cut, colour, fabric, and why it integrates with what they already own.

Priority HIGH = a gap that prevents the client from dressing appropriately for common occasions, or a structural imbalance they encounter daily. Priority MEDIUM = a gap that limits outfit combinations or versatility. Priority LOW = a refinement that would elevate an already-functional wardrobe.

Identify 3–6 gaps. Be ruthlessly specific. If the wardrobe is genuinely complete for its owner's apparent lifestyle, say so in the summary and surface only low-priority refinements.

Respond with ONLY valid JSON, no markdown:
{"summary":"one sentence honest assessment of the wardrobe's biggest structural challenge","gaps":[{"priority":"high|medium|low","gap":"what's missing — max 8 words","why":"specific data-backed reason referencing actual items or patterns","suggestion":"specific piece to buy: cut, colour, fabric, and why it integrates — max 25 words"}]}`;

    const wardrobeImages = wardrobeGrid ? [{ base64: wardrobeGrid }] : undefined;
    const raw = await callClaude({ prompt, images: wardrobeImages, maxTokens: 1500, route: 'wardrobe-gaps' });
    const parsed = parseJSON(raw) as GapAnalysisResult;

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gap analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

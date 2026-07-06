import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { getPersonaContext, getStyleDirectives, IMAGE_STRATEGIST_VOICE, STYLIST_2026_LENS, getStyleBriefContext, getBrandVoiceContext } from '@/lib/stylist';
import type { BodyProfile } from '@/lib/body-profile';

type WardrobeItem = {
  id: string; category: string; name: string;
  primaryColor: string; pattern: string; formality: string;
  season: string; material?: string; accessoryType?: string;
  wearCount?: number;
};

export type ImageStrategyResult = {
  brandStatement: string;
  narrativeArc: string;
  consistencyRead: string;
  tensionPoints: string[];
  strategicGaps: string[];
  strengthSignals: string[];
  nextChapter: string;
};

export async function POST(req: NextRequest) {
  try {
    const { items, bodyProfile, topWorn, savedLookTitles } = await req.json() as {
      items: WardrobeItem[];
      bodyProfile?: BodyProfile;
      topWorn?: string[];
      savedLookTitles?: string[];
    };

    if (!items || items.length < 5) {
      return NextResponse.json({ error: 'Add at least 5 items for a meaningful image analysis.' }, { status: 400 });
    }

    const [personaCtx, styleDirectives, styleBriefCtx, brandVoice] = await Promise.all([
      getPersonaContext(),
      getStyleDirectives(),
      getStyleBriefContext(),
      getBrandVoiceContext(),
    ]);

    const itemListText = items
      .map((i) => `${i.category}${i.accessoryType ? ' (' + i.accessoryType + ')' : ''}, "${i.name}", ${i.primaryColor}, ${i.pattern || 'solid'}${i.material ? ', ' + i.material : ''}, ${i.formality}${(i.wearCount ?? 0) > 0 ? ', worn ' + i.wearCount + 'x' : ''}`)
      .join('\n');

    const tasteSignals = [
      ...(topWorn?.length ? [`Most-worn (real behaviour): ${topWorn.join('; ')}`] : []),
      ...(savedLookTitles?.length ? [`Looks they've saved: ${savedLookTitles.join('; ')}`] : []),
    ].join('\n');

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = `${personaCtx} ${IMAGE_STRATEGIST_VOICE} ${brandVoice} Today is ${today}. ${STYLIST_2026_LENS}
${styleBriefCtx ? styleBriefCtx + '\n' : ''}${styleDirectives}
Read this wardrobe not as a shopping list but as a communication system. What image is this person currently projecting? What are they trying to say, and what are their clothes actually saying? Where is the gap?

BEHAVIOURAL SIGNALS (weight these heavily — they reveal real identity vs aspiration):
${tasteSignals || 'No wear data yet.'}

Wardrobe:
${itemListText}

Deliver a clear-eyed image strategy assessment. Be honest and specific — this person wants to know the truth. Avoid hollow positivity.

Respond with ONLY valid JSON, no markdown:
{
  "brandStatement": "1 sentence — what their wardrobe currently says about them, as if a stranger read it cold. Max 20 words.",
  "narrativeArc": "1 sentence — where their style appears to be heading based on what they actually wear and save. Max 20 words.",
  "consistencyRead": "1-2 sentences — how coherent the overall image is. Are they telling a clear story or several conflicting ones? Max 25 words.",
  "tensionPoints": ["specific tension or contradiction working against their image, max 15 words", "second tension point if real — omit if not"],
  "strategicGaps": ["a narrative gap — not just a missing item type but a missing signal or register, max 15 words", "second gap if real"],
  "strengthSignals": ["something their wardrobe already says powerfully and clearly, max 12 words", "second strength if real"],
  "nextChapter": "1 sentence — the single most impactful shift they could make, not a shopping list but a directional instruction. Max 20 words."
}`;

    const raw = await callClaude({ prompt, maxTokens: 1000, route: 'image-strategy' });
    const parsed = parseJSON(raw) as ImageStrategyResult;
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image strategy analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

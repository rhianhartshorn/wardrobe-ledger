import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { profileToContext, type BodyProfile } from '@/lib/body-profile';
import { STYLIST_PERSONA, STYLIST_2026_LENS } from '@/lib/stylist';

type WardrobeItem = {
  id: string; category: string; name: string;
  primaryColor: string; secondaryColor: string;
  pattern: string; formality: string; season: string;
};

export async function POST(req: NextRequest) {
  try {
    const { items, bodyProfile } = await req.json() as { items: WardrobeItem[]; bodyProfile?: BodyProfile };
    if (!items || items.length < 3) {
      return NextResponse.json({ error: 'Add at least 3 items to get a style reading.' }, { status: 400 });
    }

    const itemListText = items
      .map((it) => `${it.id} :: ${it.category}, "${it.name}", ${it.primaryColor}${it.secondaryColor ? '/' + it.secondaryColor : ''}, ${it.pattern || 'solid'}, ${it.formality}, ${it.season}`)
      .join('\n');

    const profileCtx = bodyProfile ? profileToContext(bodyProfile) : '';
    const profileLine = profileCtx ? `\nClient profile to factor into your analysis: ${profileCtx}` : '';

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = `${STYLIST_PERSONA} Today is ${today}. ${STYLIST_2026_LENS} Analyse this real wardrobe to identify the person's genuine style identity with the precision and honesty of an editor who has seen thousands of wardrobes.${profileLine}

Wardrobe:
${itemListText}

${profileCtx ? `Consider their body type and colouring when describing strengths, gaps, and style groups — note when pieces work particularly well or poorly for their frame.` : ''}

Respond with ONLY valid JSON, no markdown:
{
  "archetype": "2–4 word style archetype (e.g. 'Parisian Minimalist', 'Sharp Modern Classic')",
  "archetypeDescription": "1 sentence max 20 words${profileCtx ? ' — include how their colouring amplifies this' : ''}",
  "styleKeywords": ["word1","word2","word3","word4","word5"],
  "colorStory": "max 12 words on palette and mood",
  "wardrobeStrengths": ["max 8 words","max 8 words","max 8 words"],
  "wardrobeGaps": ["max 8 words","max 8 words","max 8 words"],
  "styleGroups": [{"groupName":"e.g. 'The Weekend Edit'","mood":"4–5 words","itemIds":["id1","id2"]}]
}

styleGroups: group ALL items into 2–4 meaningful aesthetic clusters by look/mood — not by category. Every item in exactly one group. Keep responses concise.`;

    const raw = await callClaude({ prompt, maxTokens: 2000 });
    const parsed = parseJSON(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Style analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

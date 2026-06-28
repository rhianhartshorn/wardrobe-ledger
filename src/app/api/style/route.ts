import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { profileToContext } from '@/app/api/body-profile/route';
import type { BodyProfile } from '@/app/api/body-profile/route';

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

    const prompt = `You are a perceptive fashion editor. Today is ${today}. Analyze this real wardrobe to identify the person's genuine style identity.${profileLine}

Wardrobe:
${itemListText}

${profileCtx ? `Consider their body type and colouring when describing strengths, gaps, and style groups — note when pieces work particularly well or poorly for their frame.` : ''}

Respond with ONLY valid JSON, no markdown:
{
  "archetype": "2–4 word style archetype (e.g. 'Parisian Minimalist', 'Sharp Modern Classic')",
  "archetypeDescription": "2 sentences: what this archetype means and what it says about their taste${profileCtx ? ' — include one line on how their body type and colouring amplify this archetype' : ''}",
  "styleKeywords": ["word1","word2","word3","word4","word5"],
  "colorStory": "1 sentence on the dominant palette and mood it projects${bodyProfile?.undertone ? ` — note how it aligns or clashes with their ${bodyProfile.undertone} undertone` : ''}",
  "wardrobeStrengths": ["strength max 12 words","strength 2","strength 3"],
  "wardrobeGaps": ["gap max 12 words${profileCtx ? ' — gaps should reflect what is missing for their specific body type or colouring' : ''}","gap 2","gap 3"],
  "styleGroups": [{"groupName":"e.g. 'The Weekend Edit'","mood":"5–8 words describing the vibe","itemIds":["id1","id2"]}]
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

import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';

type WardrobeItem = {
  id: string;
  category: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  pattern: string;
  formality: string;
  season: string;
};

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json() as { items: WardrobeItem[] };

    if (!items || items.length < 3) {
      return NextResponse.json({ error: 'Add at least 3 items to get a style reading.' }, { status: 400 });
    }

    const itemListText = items
      .map(
        (it) =>
          `${it.id} :: ${it.category}, "${it.name}", ${it.primaryColor}${it.secondaryColor ? '/' + it.secondaryColor : ''}, ${it.pattern || 'solid'}, ${it.formality}, ${it.season}`
      )
      .join('\n');

    const prompt = `You are a perceptive fashion editor analyzing a person's real wardrobe to identify their genuine style identity — not aspirational, but what their actual clothes reveal.

Wardrobe:
${itemListText}

Analyze this wardrobe and respond with ONLY valid JSON, no markdown fences:
{
  "archetype": "2–4 word style archetype name (e.g. 'Parisian Minimalist', 'Relaxed Romantic', 'Sharp Modern Classic')",
  "archetypeDescription": "2 sentences: what this archetype means and what it says about the person's taste",
  "styleKeywords": ["word1","word2","word3","word4","word5"],
  "colorStory": "1 sentence on the dominant color palette and what mood it projects",
  "wardrobeStrengths": ["max 12 words each", "strength 2", "strength 3"],
  "wardrobeGaps": ["gap 1 max 12 words", "gap 2", "gap 3"],
  "styleGroups": [
    {
      "groupName": "e.g. 'The Weekend Edit'",
      "mood": "5–8 words describing the vibe of this group",
      "itemIds": ["id1", "id2", "id3"]
    }
  ]
}

styleGroups: group ALL items into 2–4 meaningful aesthetic clusters (not by category — by the look/mood they create together). Every item must appear in exactly one group. Use the exact item ids from the wardrobe list above.`;

    const raw = await callClaude({ prompt, maxTokens: 1500 });
    const parsed = parseJSON(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Style analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

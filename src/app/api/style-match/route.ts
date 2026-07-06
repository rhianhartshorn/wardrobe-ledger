import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { getPersonaContext, getStyleDirectives, STYLIST_2026_LENS } from '@/lib/stylist';

type WardrobeItem = {
  id: string; name: string; category: string;
  primaryColor: string; secondaryColor: string;
  pattern: string; formality: string; season: string;
};

export async function POST(req: NextRequest) {
  try {
    const { items, goal } = await req.json() as { items: WardrobeItem[]; goal?: string };
    if (!items?.length) return NextResponse.json({ error: 'No items' }, { status: 400 });

    const itemListText = items
      .map((i) => `${i.id} :: ${i.category}, "${i.name}", ${i.primaryColor}${i.secondaryColor ? '/' + i.secondaryColor : ''}, ${i.pattern || 'solid'}, ${i.formality}`)
      .join('\n');

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const goalSection = goal
      ? `\nThe person's style aspiration is: "${goal}"\nAnalyse how close their current wardrobe already is to this goal, which specific pieces (by id) already work toward it, what is missing, and 3 concrete tips to bridge the gap using what they own.`
      : '';

    const [personaCtx, styleDirectives] = await Promise.all([getPersonaContext(), getStyleDirectives()]);
    const prompt = `${personaCtx} Today is ${today}. ${STYLIST_2026_LENS}${styleDirectives}

Wardrobe:
${itemListText}
${goalSection}

Based on this wardrobe, identify the 3 real people (celebrities, models, style icons, designers — real named individuals) whose personal style this wardrobe most closely resembles. Be specific and accurate — think about the actual clothes, colours, and formality level, not just vibes.

Respond with ONLY valid JSON, no markdown:
{
  "closestMatches": [
    {
      "name": "Real person's full name",
      "why": "max 20 words explaining the specific overlap in style/palette/pieces",
      "matchStrength": "high | medium | low"
    }
  ]${goal ? `,
  "goalAnalysis": {
    "goal": "${goal.replace(/"/g, "'")}",
    "howClose": "one sentence: how aligned the current wardrobe already is",
    "workingPieces": ["id1", "id2"],
    "missingPieces": ["specific item description max 10 words", "item 2", "item 3"],
    "bridgeTips": ["concrete tip using existing wardrobe max 20 words", "tip 2", "tip 3"]
  }` : ''}
}`;

    const raw = await callClaude({ prompt, maxTokens: 1200 });
    const parsed = parseJSON(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

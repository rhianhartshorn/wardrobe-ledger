import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { profileToContext, type BodyProfile } from '@/lib/body-profile';
import { getPersonaContext, getStyleDirectives, STYLIST_2026_LENS, COLOUR_ANALYST_VOICE, IMAGE_STRATEGIST_VOICE, getStyleBriefContext, BRAND_VOICE_RULES } from '@/lib/stylist';

type WardrobeItem = {
  id: string; category: string; name: string;
  primaryColor: string; secondaryColor: string;
  pattern: string; formality: string; season: string;
  material?: string; accessoryType?: string; wearCount?: number;
};

export type { StyleGroup, StyleTwin, StyleReadResult } from '@/lib/style-types';

export async function POST(req: NextRequest) {
  try {
    const { items, bodyProfile, topWorn, savedLookTitles } = await req.json() as {
      items: WardrobeItem[];
      bodyProfile?: BodyProfile;
      topWorn?: string[];
      savedLookTitles?: string[];
    };

    if (!items || items.length < 3) {
      return NextResponse.json({ error: 'Add at least 3 items to get a style reading.' }, { status: 400 });
    }

    const [styleBriefCtx, personaCtx, styleDirectives] = await Promise.all([
      getStyleBriefContext(),
      getPersonaContext(),
      getStyleDirectives(),
    ]);

    const itemListText = items
      .map((it) => `${it.id} :: ${it.category}${it.accessoryType ? ' (' + it.accessoryType + ')' : ''}, "${it.name}", ${it.primaryColor}${it.secondaryColor ? '/' + it.secondaryColor : ''}, ${it.pattern || 'solid'}${it.material ? ', ' + it.material : ''}, ${it.formality}, ${it.season}${(it.wearCount ?? 0) > 0 ? ', worn ' + it.wearCount + 'x' : ''}`)
      .join('\n');

    const tasteSignals = [
      ...(topWorn?.length ? [`Most-worn (real behaviour): ${topWorn.join('; ')}`] : []),
      ...(savedLookTitles?.length ? [`Saved looks: ${savedLookTitles.join('; ')}`] : []),
    ].join('\n');

    const profileCtx = bodyProfile ? profileToContext(bodyProfile) : '';
    const profileBlock = profileCtx
      ? `\nCLIENT PROFILE: ${profileCtx}\nFactor body shape and colouring into archetype, strengths, gaps, and style groups.\n`
      : '';

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = `${personaCtx} ${COLOUR_ANALYST_VOICE} ${IMAGE_STRATEGIST_VOICE} ${BRAND_VOICE_RULES} Today is ${today}. ${STYLIST_2026_LENS}
${styleBriefCtx ? styleBriefCtx + '\n' : ''}${styleDirectives}${tasteSignals ? 'BEHAVIOURAL SIGNALS — weight these heavily, they reveal real style vs aspiration:\n' + tasteSignals + '\n' : ''}${profileBlock}
You are delivering a complete style reading of this wardrobe. Three lenses in one:
1. Who they ARE (archetype, aesthetic identity, style clusters)
2. What they're PROJECTING (brand statement, narrative coherence, what a stranger reads)
3. Who they dress LIKE (2–3 real style references — not aspirational goals, actual matches)

Be honest and specific throughout. Hollow positivity is useless. A sharp observation is worth more than three vague compliments.

Wardrobe:
${itemListText}

Respond with ONLY valid JSON, no markdown:
{
  "archetype": "2–4 word style archetype",
  "archetypeDescription": "1 sentence max 20 words — what makes this archetype specific to them",
  "styleKeywords": ["word1","word2","word3","word4","word5"],
  "styleTwins": [
    {"name": "real person or style icon their wardrobe most resembles", "why": "1 sentence max 15 words — specific reason", "matchStrength": "high|medium|low"},
    {"name": "second match", "why": "specific reason", "matchStrength": "high|medium|low"},
    {"name": "third match if real — omit if not", "why": "specific reason", "matchStrength": "low"}
  ],
  "brandStatement": "1 sentence max 20 words — what their wardrobe says to a stranger reading it cold",
  "narrativeArc": "1 sentence max 20 words — where their style is heading based on what they actually wear",
  "nextChapter": "1 sentence max 20 words — the single most impactful shift they could make",
  "colorStory": "max 12 words on palette and mood",
  "wardrobeStrengths": ["max 8 words", "max 8 words", "max 8 words"],
  "wardrobeGaps": ["max 8 words", "max 8 words", "max 8 words"],
  "styleGroups": [{"groupName": "e.g. The Weekend Edit", "mood": "4–5 words", "itemIds": ["id1","id2"]}]
}

styleGroups: group ALL items into 2–4 meaningful aesthetic clusters by look/mood, not by category. Every item in exactly one group.`;

    const raw = await callClaude({ prompt, maxTokens: 2500 });
    const parsed = parseJSON(raw) as StyleReadResult;
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Style reading failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

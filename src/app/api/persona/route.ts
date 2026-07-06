import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { getSetting, setSetting } from '@/lib/db';
import { STYLIST_PERSONA, STYLIST_2026_LENS, getStyleBriefContext } from '@/lib/stylist';
import type { StyleBrief } from '@/app/api/style-brief/route';
import type { BodyProfile } from '@/lib/body-profile';

export type StyleDiscoveryAnswers = {
  moodPicks: string[];       // e.g. ['Quiet Luxury', 'Parisian Cool']
  dinnerFeeling: string;     // e.g. 'Effortlessly put-together'
  dressedValue: string;      // e.g. 'Looking expensive and considered'
  lifestyleMix: string[];    // e.g. ['City social & dining', 'Cultural & arts']
  dressingFor: string;       // e.g. 'Myself first'
  styleIntent?: string;      // optional free-text from advanced users
};

export type PersonaRecord = {
  persona: string;
  generatedAt: string;
  basedOnItemCount: number;
};

export async function POST(req: NextRequest) {
  try {
    const { answers, bodyProfile, itemCount, topWorn, savedLookTitles } = await req.json() as {
      answers: StyleDiscoveryAnswers;
      bodyProfile?: BodyProfile;
      itemCount: number;
      topWorn?: string[];
      savedLookTitles?: string[];
    };

    const styleBriefRaw = await getSetting('style_brief');
    const brief = styleBriefRaw ? JSON.parse(styleBriefRaw) as StyleBrief : null;
    const colourContext = brief
      ? `Colour season: ${brief.colourSeason}. Undertone: ${brief.undertone}. Flattering palette: ${brief.flatteringColours.slice(0, 5).join(', ')}.`
      : '';

    const bodyContext = bodyProfile?.bodyShape
      ? `Body shape: ${bodyProfile.bodyShape}. Height: ${bodyProfile.height || 'not specified'}.`
      : '';

    const tasteContext = [
      topWorn?.length ? `Most-worn items: ${topWorn.join('; ')}` : '',
      savedLookTitles?.length ? `Saved looks: ${savedLookTitles.join('; ')}` : '',
    ].filter(Boolean).join('\n');

    const prompt = `${STYLIST_PERSONA} ${STYLIST_2026_LENS}

You are building a personalised stylist persona for a specific client. This persona will be injected into every AI recommendation this client receives, replacing generic advice with something tuned to exactly who they are and what they want.

CLIENT PROFILE:
Aesthetic preferences: ${answers.moodPicks.join(', ')}
How they want to feel when dressed up: ${answers.dinnerFeeling}
What matters most when getting dressed: ${answers.dressedValue}
Lifestyle mix (how they actually spend their time): ${answers.lifestyleMix.join(', ')}
Who they dress for: ${answers.dressingFor}
${answers.styleIntent ? `In their own words: "${answers.styleIntent}"` : ''}
${colourContext}
${bodyContext}
${tasteContext ? 'Behavioural signals:\n' + tasteContext : ''}

Write a personalised stylist persona — 4-5 sentences — that a senior stylist would use as their internal brief before advising this specific client. It should:
- Encode their aesthetic direction and what they're reaching for
- Reflect their colour season and how that interacts with their taste
- Capture their actual lifestyle — the real contexts they dress for — and how this should shape every recommendation (e.g. someone who splits their week between outdoor activity and city social needs versatility and ease; someone who mostly dresses for cultural and professional contexts needs range of register)
- Note who they dress for and what that means for the kind of advice that will land
- Be written in second person as if briefing a colleague: "This client is..." or "They respond to..."
- Sound like a real human stylist briefing, not marketing copy

Respond with ONLY valid JSON, no markdown:
{"persona": "the full 3-4 sentence persona text"}`;

    const raw = await callClaude({ prompt, maxTokens: 500, route: 'persona' });
    const parsed = parseJSON(raw) as { persona: string };

    const record: PersonaRecord = {
      persona: parsed.persona,
      generatedAt: new Date().toISOString(),
      basedOnItemCount: itemCount,
    };

    try {
      await setSetting('stylist_persona', JSON.stringify(record));
    } catch { /* storage failure — still return the generated persona */ }

    return NextResponse.json({ success: true, persona: parsed.persona });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Persona generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const raw = await getSetting('stylist_persona');
    if (!raw) return NextResponse.json({ persona: null });
    const record = JSON.parse(raw) as PersonaRecord;
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ persona: null });
  }
}

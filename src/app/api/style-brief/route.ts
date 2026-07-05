import { NextResponse } from 'next/server';
import { getImage, getSetting, setSetting } from '@/lib/db';
import { callClaude, parseJSON } from '@/lib/claude';
import { STYLIST_PERSONA } from '@/lib/stylist';
import { profileToContext, type BodyProfile } from '@/lib/body-profile';

export type StyleBrief = {
  colourSeason: string;        // e.g. "Soft Autumn"
  undertone: string;           // warm | cool | neutral
  contrastLevel: string;       // low | medium | high
  skinTone: string;            // prose description
  hairTone: string;            // prose description
  eyeColour: string;
  flatteringColours: string[]; // specific colour names
  avoidColours: string[];
  colourPrinciple: string;     // one sentence on why
  seasonalPalette: string;     // e.g. "Autumn — muted, warm, earth tones"
  generatedAt: string;
};

export async function POST() {
  try {
    const profileFilename = await getSetting('profile_photo');
    if (!profileFilename) {
      return NextResponse.json({ error: 'No profile photo — add one first.' }, { status: 400 });
    }
    const profileImg = await getImage(profileFilename);
    if (!profileImg) {
      return NextResponse.json({ error: 'Profile photo not found.' }, { status: 400 });
    }

    const bodyProfileRaw = await getSetting('body_profile');
    let bodyProfile: BodyProfile | undefined;
    try { if (bodyProfileRaw) bodyProfile = JSON.parse(bodyProfileRaw) as BodyProfile; } catch { /* ignore */ }
    const bodyCtx = bodyProfile ? profileToContext(bodyProfile) : '';

    const prompt = `${STYLIST_PERSONA}

You are performing a professional colour analysis of this person — the same assessment a trained colour analyst would give in a paid consultation.

Study the photo carefully: skin tone depth and undertone, hair colour and warmth, eye colour, the overall contrast level between skin and hair.

${bodyCtx ? `Additional context about this client: ${bodyCtx}` : ''}

Determine their colour season with precision. Apply the 12-season system if helpful (e.g. Soft Autumn, True Spring, Cool Winter, Light Summer etc).

Respond with ONLY valid JSON, no markdown:
{
  "colourSeason": "e.g. Soft Autumn",
  "undertone": "warm | cool | neutral",
  "contrastLevel": "low | medium | high",
  "skinTone": "max 8 words describing their skin tone precisely",
  "hairTone": "max 8 words describing hair colour and warmth",
  "eyeColour": "max 4 words",
  "flatteringColours": ["8–10 specific colour names that will genuinely light up this person"],
  "avoidColours": ["4–6 colour names that will wash out or clash with their colouring"],
  "colourPrinciple": "one precise sentence explaining the key rule for this person's colouring",
  "seasonalPalette": "max 8 words — the character of their ideal palette"
}`;

    const raw = await callClaude({
      prompt,
      imageBase64: profileImg.data,
      mediaType: profileImg.mimeType,
      maxTokens: 600,
      model: 'claude-sonnet-4-6',
    });

    const brief = parseJSON(raw) as StyleBrief;
    brief.generatedAt = new Date().toISOString().slice(0, 10);

    await setSetting('style_brief', JSON.stringify(brief));

    return NextResponse.json({ brief });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Style brief generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const raw = await getSetting('style_brief');
  if (!raw) return NextResponse.json({ brief: null });
  try {
    return NextResponse.json({ brief: JSON.parse(raw) as StyleBrief });
  } catch {
    return NextResponse.json({ brief: null });
  }
}

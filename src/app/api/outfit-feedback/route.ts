import { NextRequest, NextResponse } from 'next/server';
import { getImage, getSetting } from '@/lib/db';
import { callClaude } from '@/lib/claude';
import { STYLIST_PERSONA, STYLIST_2026_LENS, COLOUR_ANALYST_VOICE, FIT_SPECIALIST_VOICE, getStyleBriefContext } from '@/lib/stylist';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { items?: { id: string; name: string; category: string; primaryColor: string; formality?: string }[]; bodyProfile?: Record<string, string> };
    const items = body.items ?? [];

    if (!items.length) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    const profileFilename = await getSetting('profile_photo');
    if (!profileFilename) {
      return NextResponse.json({ error: 'no_profile_photo' }, { status: 400 });
    }
    const profileImg = await getImage(profileFilename);
    if (!profileImg) {
      return NextResponse.json({ error: 'no_profile_photo' }, { status: 400 });
    }

    const outfitDesc = items.map((i) => `${i.name} (${i.category}, ${i.primaryColor})`).join(', ');
    const bp = body.bodyProfile;
    const bodyDesc = bp?.height ? `Body: ${bp.height}, ${bp.bodyShape ?? ''}, ${bp.undertone ?? ''} undertone.` : '';

    const styleBriefCtx = await getStyleBriefContext();

    const prompt = `${STYLIST_PERSONA} ${COLOUR_ANALYST_VOICE} ${FIT_SPECIALIST_VOICE} ${STYLIST_2026_LENS}
${styleBriefCtx ? styleBriefCtx + '\n' : ''}
Your client is considering this outfit: ${outfitDesc}
${bodyDesc}

Look at their photo and give sharp, specific feedback in 3–4 sentences covering:
- Exactly how the colour palette interacts with their skin tone and hair (reference the colour profile above — name the specific colours and whether they flatter or drain)
- Whether the silhouette and proportions work for their frame
- One concrete styling adjustment that would elevate it

Write as a trusted stylist who respects their time. No hollow phrases, no hedging.`;

    const feedback = await callClaude({
      prompt,
      imageBase64: profileImg.data,
      mediaType: profileImg.mimeType,
      maxTokens: 300,
      model: 'claude-sonnet-4-6',
    });

    // Strip markdown headers/bold so text renders cleanly in the UI
    const clean = feedback.replace(/^#+\s.*\n?/gm, '').replace(/\*\*(.*?)\*\*/g, '$1').trim();
    return NextResponse.json({ feedback: clean });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

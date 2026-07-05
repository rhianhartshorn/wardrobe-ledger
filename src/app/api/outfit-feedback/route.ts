import { NextRequest, NextResponse } from 'next/server';
import { getImage, getSetting } from '@/lib/db';
import { callClaude } from '@/lib/claude';

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

    const prompt = `You are a personal stylist giving honest, specific feedback about an outfit for this person.

The outfit is: ${outfitDesc}
${bodyDesc}

Looking at their photo, give 3–4 sentences of personalised feedback on:
- How the colour palette works with their complexion and colouring
- Whether the silhouette/proportions suit their build
- One specific styling tweak that would elevate the look

Be direct and specific. No generic advice.`;

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

import { NextRequest, NextResponse } from 'next/server';
import { getImage, getSetting } from '@/lib/db';
import { callClaude } from '@/lib/claude';
import type { BodyProfile } from '@/lib/body-profile';

type SlimItem = {
  id: string;
  name: string;
  category: string;
  primaryColor: string;
  formality: string;
  imageFilename?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const { items, bodyProfile } = await req.json() as {
      items: SlimItem[];
      bodyProfile?: BodyProfile;
    };

    if (!items?.length) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    // Get profile photo
    const profileFilename = await getSetting('profile_photo');
    if (!profileFilename) {
      return NextResponse.json({ error: 'no_profile_photo' }, { status: 400 });
    }
    const profileImg = await getImage(profileFilename);
    if (!profileImg) {
      return NextResponse.json({ error: 'no_profile_photo' }, { status: 400 });
    }

    const outfitDesc = items.map((i) => `${i.name} (${i.category}, ${i.primaryColor})`).join(', ');

    const bodyDesc = bodyProfile?.height
      ? `Body profile: ${bodyProfile.height}, ${bodyProfile.bodyShape ?? 'unknown shape'}, ${bodyProfile.undertone ?? 'unknown undertone'} undertone.`
      : '';

    const prompt = `You are a personal stylist giving honest, specific feedback about an outfit for this person.

The outfit is: ${outfitDesc}
${bodyDesc}

Looking at their photo, give 3–4 sentences of personalised feedback on:
- How the colour palette works with their complexion and colouring
- Whether the silhouette/proportions suit their build
- One specific styling tweak that would elevate the look

Be direct and specific — reference their actual colouring and the actual pieces. No generic advice.`;

    const feedback = await callClaude({
      prompt,
      imageBase64: profileImg.data,
      mediaType: profileImg.mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
      maxTokens: 300,
      model: 'claude-sonnet-4-6',
    });

    return NextResponse.json({ feedback });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

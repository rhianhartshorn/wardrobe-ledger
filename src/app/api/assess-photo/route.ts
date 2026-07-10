import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    const { base64Data, mediaType } = await req.json() as { base64Data: string; mediaType: string };
    if (!base64Data) return NextResponse.json({ quality: 'warn', issues: [], tip: '' });

    const prompt = `You are assessing the quality of a garment photo for a personal styling AI. The AI needs to see the garment clearly to evaluate colour accuracy, texture, fit, and silhouette — all of which directly affect the quality of styling recommendations.

Assess this photo against these five criteria:

1. VISIBILITY: Is the garment fully in frame and not cropped at any edge?
2. BACKGROUND: Does the background contrast clearly from the garment, so the garment's edges and silhouette are readable?
3. LIGHTING: Is the lighting adequate to read the true colour — not overexposed (washed out), not underexposed (too dark), not strongly tinted by artificial light?
4. SINGLE ITEM: Is this a photo of a single garment — not a full outfit, multiple items piled together, or a garment being worn on a person?
5. SHARPNESS: Is the image sharp enough to distinguish fabric texture and garment details?

Be strict. The styling AI is making real judgements about colour and proportion from this photo.

Return ONLY valid JSON, no markdown:
{
  "quality": "good|warn|poor",
  "issues": ["specific issue — be concrete, e.g. 'garment is cropped at the hem' not 'visibility issue'"],
  "tip": "one specific instruction for retaking that fixes the main problem, or empty string if quality is good"
}

quality meanings:
— "good": passes all five criteria. AI can work reliably with this photo.
— "warn": minor issue on 1 criterion that may slightly reduce accuracy but doesn't prevent assessment.
— "poor": fails 2+ criteria, or has one major failure (very dark, background same colour as garment, multiple items, severe crop) that makes reliable AI assessment unlikely.`;

    const raw = await callClaude({
      prompt,
      images: [{ base64: base64Data, mediaType: mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' }],
      maxTokens: 200,
      route: 'assess-photo',
    });

    const result = parseJSON(raw) as { quality: string; issues: string[]; tip: string };
    return NextResponse.json(result);
  } catch {
    // Never block an upload due to assessment failure
    return NextResponse.json({ quality: 'warn', issues: [], tip: '' });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { STYLIST_PERSONA, STYLIST_2026_LENS } from '@/lib/stylist';

export async function POST(req: NextRequest) {
  try {
    const { type, title, context } = await req.json() as {
      type: 'outfit' | 'aesthetic' | 'purchase' | 'style-group' | 'style-match';
      title: string;
      context: string; // freeform context string
    };

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const persona = `${STYLIST_PERSONA} Today is ${today}. ${STYLIST_2026_LENS}`;
    const prompts: Record<string, string> = {
      outfit: `${persona} Write a rich editorial breakdown of this outfit concept: "${title}". Context: ${context}. Cover: what makes this aesthetic work in 2026, exactly how to put it together, what details matter (fabric, fit, accessories), what mood/occasion it suits, and 3 concrete styling tips. Be specific and inspiring — write like a great magazine feature, not a generic style guide.`,
      aesthetic: `${persona} Write a rich editorial breakdown of the style aesthetic: "${title}". Context: ${context}. Cover: what defines this aesthetic in 2026 (vs how it looked in past decades), key pieces and silhouettes, colour palette, the mood and occasions it suits, and 3 ways to incorporate it into a real wardrobe. Be specific and opinionated.`,
      purchase: `${persona} Write a detailed buying guide for this wardrobe investment: "${title}". Context: ${context}. Cover: exactly what to look for (cut, fabric, colour, weight), what to avoid, how to style it multiple ways, what combinations it unlocks, and the price point that represents genuine value. Be practical and direct — a stylist giving real advice, not a shopping feature.`,
      'style-group': `${persona} Write an editorial piece about this wardrobe aesthetic cluster: "${title}". Context: ${context}. Cover: what unifies these pieces and what that says about the wearer's taste, what occasions and moods this group serves, how to get the most out of these pieces together, what one or two additions would complete this edit, and how it sits within 2026 taste.`,
      'style-match': `${persona} Write a deep dive on style icon: "${title}". Context: ${context}. Cover: what defines their personal style signature (be specific — not just vibes), key pieces that anchor their look, their philosophy around dressing, how to channel their aesthetic in 2026 without costume-copying, and 3 specific actionable ways to adapt their sensibility to everyday wear.`,
    };

    const prompt = `${prompts[type] ?? prompts.aesthetic}

Respond with ONLY valid JSON, no markdown:
{
  "headline": "editorial headline max 8 words",
  "overview": "2 sentences capturing the essence",
  "sections": [
    { "heading": "section title max 4 words", "body": "2-3 sentences of substance" }
  ],
  "tips": ["concrete actionable tip max 20 words", "tip 2", "tip 3"]
}

Include 3–4 sections. Make it feel like reading a good magazine.`;

    const raw = await callClaude({ prompt, maxTokens: 1500 });
    const parsed = parseJSON(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load detail';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

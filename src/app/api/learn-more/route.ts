import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    const { type, title, context } = await req.json() as {
      type: 'outfit' | 'aesthetic' | 'purchase' | 'style-group' | 'style-match';
      title: string;
      context: string; // freeform context string
    };

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const prompts: Record<string, string> = {
      outfit: `You are a fashion editor. Today is ${today}. Write a rich editorial breakdown of this outfit concept: "${title}". Context: ${context}. Cover: what makes this aesthetic work in 2026, exactly how to put it together, what details matter (fabric, fit, accessories), what mood/occasion it suits, and 3 concrete styling tips. Be specific and inspiring.`,
      aesthetic: `You are a fashion editor. Today is ${today}. Write a rich editorial breakdown of the style aesthetic: "${title}". Context: ${context}. Cover: what defines this aesthetic in 2026 (vs how it looked in past decades), key pieces and silhouettes, colour palette, the mood and occasions it suits, and 3 ways to incorporate it into a real wardrobe. Be specific.`,
      purchase: `You are a personal stylist. Today is ${today}. Write a detailed guide for this wardrobe investment: "${title}". Context: ${context}. Cover: exactly what to look for (cut, fabric, colour), price range to target, how to style it multiple ways, what it unlocks in a wardrobe, and what to avoid when buying. Be practical and specific.`,
      'style-group': `You are a fashion editor. Today is ${today}. Write an editorial piece about this wardrobe aesthetic cluster: "${title}". Context: ${context}. Cover: what unifies these pieces, what occasions and moods this group serves, how to get the most out of these pieces together, what's missing from this cluster, and how it fits 2026 trends.`,
      'style-match': `You are a fashion editor. Today is ${today}. Write a deep dive on style icon: "${title}". Context: ${context}. Cover: what defines their personal style signature, key pieces in their wardrobe, how they approach dressing (their philosophy), how to channel their aesthetic in 2026 without costume-copying, and 3 specific ways to adapt their look for everyday wear.`,
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

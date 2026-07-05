import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { STYLIST_PERSONA, STYLIST_2026_LENS, FASHION_EDITOR_VOICE, FIT_SPECIALIST_VOICE, COLOUR_ANALYST_VOICE, getStyleBriefContext } from '@/lib/stylist';

export async function POST(req: NextRequest) {
  try {
    const { type, title, context } = await req.json() as {
      type: 'outfit' | 'aesthetic' | 'purchase' | 'style-group' | 'style-match';
      title: string;
      context: string;
    };

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const styleBriefCtx = await getStyleBriefContext();
    const clientCtx = styleBriefCtx ? `\n${styleBriefCtx}\nApply this client's colour profile and colouring when giving any advice — all recommendations should be tailored to their specific palette.\n` : '';

    const base = `${STYLIST_PERSONA} Today is ${today}. ${STYLIST_2026_LENS}${clientCtx}`;

    const prompts: Record<string, string> = {
      outfit: `${base}${FIT_SPECIALIST_VOICE} Write a rich editorial breakdown of this outfit concept: "${title}". Context: ${context}. Cover: what makes this aesthetic work in 2026, exactly how to put it together (with specific attention to fit and proportion), what details matter (fabric, fit, accessories), what mood/occasion it suits, and 3 concrete styling tips. Be specific and inspiring — write like a great magazine feature, not a generic style guide.`,
      aesthetic: `${base}${FASHION_EDITOR_VOICE} Write a rich editorial breakdown of the fashion currency of this piece and how to wear it in 2026: "${title}". Context: ${context}. Cover: what era this piece belongs to and what has changed since then, exactly how the current moment is recontextualising it, the specific silhouettes and combinations that make it feel 2026 rather than dated, and 3 concrete ways to style it right now. Be opinionated — an editor who has seen every trend cycle knows precisely where each piece sits.`,
      purchase: `${base}${COLOUR_ANALYST_VOICE} Write a detailed buying guide for this wardrobe investment: "${title}". Context: ${context}. Cover: exactly what to look for (cut, fabric, colour — specifically which shades will work with this client's colouring), what to avoid, how to style it multiple ways, what combinations it unlocks, and the price point that represents genuine value. Be practical and direct.`,
      'style-group': `${base}${FASHION_EDITOR_VOICE} Write an editorial piece about this wardrobe aesthetic cluster: "${title}". Context: ${context}. Cover: what unifies these pieces and what that says about the wearer's taste, what occasions and moods this group serves, how to get the most out of these pieces together, what one or two additions would complete this edit, and how it sits within 2026 taste.`,
      'style-match': `${base}${FASHION_EDITOR_VOICE} Write a deep dive on style icon: "${title}". Context: ${context}. Cover: what defines their personal style signature (be specific — not just vibes), key pieces that anchor their look, their philosophy around dressing, how to channel their aesthetic in 2026 without costume-copying, and 3 specific actionable ways to adapt their sensibility to everyday wear.`,
    };

    const prompt = `${prompts[type] ?? prompts.aesthetic}

Respond with ONLY valid JSON, no markdown:
{
  "headline": "max 6 words",
  "overview": "1 sentence max 20 words",
  "sections": [
    { "heading": "max 3 words", "body": "1 sentence max 18 words" }
  ],
  "tips": ["max 12 words", "max 12 words"]
}

Include 3 sections only.`;

    const raw = await callClaude({ prompt, maxTokens: 1500 });
    const parsed = parseJSON(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load detail';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

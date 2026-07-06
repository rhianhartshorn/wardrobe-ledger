import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { profileToContext, type BodyProfile } from '@/lib/body-profile';
import { getPersonaContext, getStyleDirectives, STYLIST_2026_LENS, STYLIST_REJECTION_CRITERIA, FASHION_EDITOR_VOICE, FIT_SPECIALIST_VOICE, COLOUR_ANALYST_VOICE, ACCESSORIES_DIRECTOR_VOICE, getStyleBriefContext, getBrandVoiceContext } from '@/lib/stylist';
import { auditInBackground } from '@/lib/editorial';

type WardrobeItem = {
  id: string;
  category: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  pattern: string;
  formality: string;
  season: string;
  material?: string;
};

type Combination = {
  itemIds: string[];
  title?: string;
  category?: string;
  rationale?: string;
  formality?: string;
  season?: string;
  accessorizing?: string;
};

// Hard validation — only enforces completeness. Creative layering (skirt over dress,
// jumper over slip, etc.) is left to stylist team judgment.
function isPhysicallyWearable(combo: Combination, items: WardrobeItem[]): boolean {
  const pieces = combo.itemIds
    .map((id) => items.find((i) => i.id === id))
    .filter((p): p is WardrobeItem => Boolean(p));

  if (pieces.length === 0) return false;

  const cats = pieces.map((p) => p.category);

  // Must have something covering the top half
  const hasTopCoverage = cats.some((c) => c === 'Top' || c === 'Dress/One-piece' || c === 'Outerwear');
  // Must have something covering the bottom half
  const hasBottomCoverage = cats.some((c) => c === 'Bottom' || c === 'Dress/One-piece');

  return hasTopCoverage && hasBottomCoverage;
}

export async function POST(req: NextRequest) {
  try {
    const { items, bodyProfile, topWorn, savedLookTitles, wearBehaviourSummary } = await req.json() as { items: WardrobeItem[]; bodyProfile?: BodyProfile; topWorn?: string[]; savedLookTitles?: string[]; wearBehaviourSummary?: string };

    if (!items || items.length < 3) {
      return NextResponse.json({ error: 'Add at least 3 items to see outfit combinations.' }, { status: 400 });
    }

    const [styleBriefCtx, personaCtx, styleDirectives, brandVoice] = await Promise.all([getStyleBriefContext(), getPersonaContext(), getStyleDirectives(), getBrandVoiceContext()]);
    const tasteSignals = [
      ...(topWorn?.length ? [`Items this client reaches for most: ${topWorn.join('; ')}`] : []),
      ...(savedLookTitles?.length ? [`Looks they've saved: ${savedLookTitles.join('; ')}`] : []),
      ...(wearBehaviourSummary ? [`Wear behaviour patterns: ${wearBehaviourSummary}`] : []),
    ].join('\n');

    const itemListText = items
      .map((it) => `${it.id} :: ${it.category}, "${it.name}", color ${it.primaryColor}${it.secondaryColor ? '/' + it.secondaryColor : ''}, ${it.pattern || 'solid'}${it.material ? ', ' + it.material : ''}, ${it.formality}, ${it.season}`)
      .join('\n');

    const profileCtx = bodyProfile ? profileToContext(bodyProfile) : '';
    const profileBlock = profileCtx ? `\nCLIENT PROFILE: ${profileCtx}\nEvery combination must be assessed against this profile — silhouette proportion, colours that work with their undertone and hair tone. A combination that doesn't flatter this specific person does not make the list.\n` : '';

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const maxCombos = 10;

    // Summarise what garment categories are actually available so the model works with reality
    const catSummary = items.reduce<Record<string, number>>((acc, it) => {
      acc[it.category] = (acc[it.category] ?? 0) + 1;
      return acc;
    }, {});
    const catLine = Object.entries(catSummary).map(([c, n]) => `${n} × ${c}`).join(', ');

    const prompt = `${personaCtx} ${FASHION_EDITOR_VOICE} ${FIT_SPECIALIST_VOICE} ${COLOUR_ANALYST_VOICE} ${ACCESSORIES_DIRECTOR_VOICE} ${brandVoice} Today is ${today}.
${styleBriefCtx ? styleBriefCtx + '\n' : ''}${styleDirectives}${tasteSignals ? 'CLIENT TASTE SIGNALS:\n' + tasteSignals + '\n' : ''}${profileBlock}
${STYLIST_2026_LENS}

Wardrobe (id :: category, name, color, pattern, formality, season):
${itemListText}

Wardrobe breakdown: ${catLine}

Select up to ${maxCombos} complete outfit combinations from this wardrobe, ranked best first. Each combination is reviewed by the full styling team — Fashion Editor, Fit Specialist, Colour Analyst, Accessories Director. If any expert would reject it, it does not appear.

${STYLIST_REJECTION_CRITERIA}

OUTFIT RULES:
1. Every outfit must achieve full coverage — something on top (Top, Dress/One-piece, or Outerwear) AND something on the bottom (Bottom or Dress/One-piece). A top with no bottom is not an outfit.
2. Creative layering is encouraged where it genuinely works — a skirt over a slip dress, a longline knit over a shirt-dress, a fine-knit under a blazer. These are editorial moves, not mistakes. Use your judgment: does this specific combination of pieces make sense together, or is it just two items that can't realistically be worn at the same time?
3. If the wardrobe has no bottoms and no dresses/jumpsuits, return an empty combinations array.

A shorter list of genuinely great outfits beats padding with mediocre or incomplete ones.

Respond with ONLY valid JSON, no markdown, no trailing commas:
{"combinations":[{"itemIds":["id1","id2"],"title":"max 5 words","category":"max 3 words","rationale":"one sharp sentence — name the specific reason this works: a proportion, a contrast, a colour story","formality":"Casual|Smart Casual|Business|Formal|Athletic","season":"All-season|Summer|Winter|Spring/Fall","accessorizing":"specific accessory direction max 10 words"}]}`;

    const raw = await callClaude({ prompt, maxTokens: 2000 });
    const parsed = parseJSON(raw) as { combinations?: Combination[] };
    const rawCombinations = parsed.combinations ?? [];

    // Server-side validation — filters what the model misses
    const combinations = rawCombinations.filter((c) => isPhysicallyWearable(c, items));

    const rationaleText = combinations.map((c) => c.rationale).filter(Boolean).join('\n');
    if (rationaleText) auditInBackground('combinations', 'combination rationale', rationaleText);

    return NextResponse.json({ combinations });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not curate combinations right now.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

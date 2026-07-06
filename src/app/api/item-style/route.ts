import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { profileToContext, type BodyProfile } from '@/lib/body-profile';
import { getPersonaContext, getStyleDirectives, STYLIST_2026_LENS, FASHION_EDITOR_VOICE, ACCESSORIES_DIRECTOR_VOICE, getStyleBriefContext, getBrandVoiceContext } from '@/lib/stylist';

type WardrobeItem = {
  id: string; name: string; category: string;
  primaryColor: string; secondaryColor: string;
  pattern: string; formality: string; season: string; material?: string;
};

export async function POST(req: NextRequest) {
  try {
    const { item, wardrobe, bodyProfile } = await req.json() as { item: WardrobeItem; wardrobe: WardrobeItem[]; bodyProfile?: BodyProfile };
    if (!item) return NextResponse.json({ error: 'No item provided' }, { status: 400 });

    const others = wardrobe.filter((i) => i.id !== item.id);
    const wardrobeText = others
      .map((i) => `${i.id} :: ${i.category}, "${i.name}", ${i.primaryColor}${i.secondaryColor ? '/' + i.secondaryColor : ''}${i.material ? ', ' + i.material : ''}, ${i.formality}`)
      .join('\n');

    const [styleBriefCtx, personaCtx, styleDirectives, brandVoice] = await Promise.all([getStyleBriefContext(), getPersonaContext(), getStyleDirectives(), getBrandVoiceContext()]);
    const profileCtx = bodyProfile ? profileToContext(bodyProfile) : '';
    const profileLine = profileCtx ? `\nClient profile: ${profileCtx}\nEvery look MUST work for their body type — apply appropriate silhouette and proportion rules.\n` : '';

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const bodyRules = bodyProfile?.bodyShape ? `
Body-specific styling rules to apply:
${bodyProfile.bodyShape === 'pear' ? '- Add volume/interest above the waist. Keep the bottom half streamlined.' : ''}
${bodyProfile.bodyShape === 'apple' ? '- Use V-necks and vertical lines to elongate the torso. Empire waist or straight-through silhouettes work best.' : ''}
${bodyProfile.bodyShape === 'hourglass' ? '- Define the waist in every look. Wrap styles and belted pieces are ideal.' : ''}
${bodyProfile.bodyShape === 'rectangle' ? '- Create shape with peplums, ruffles, belts, or tucked-in hems. Avoid shapeless silhouettes.' : ''}
${bodyProfile.bodyShape === 'athletic' ? '- Soften shoulders with fluid fabrics. Add hip curve with wide-leg or A-line bottoms.' : ''}
${bodyProfile.height === 'petite' ? '- Petite: avoid overwhelming proportions. Crop lengths, high waists, and monochrome dressing all elongate.' : ''}
${bodyProfile.height === 'tall' ? '- Tall: can carry maxi, wide-leg, and oversized proportions well.' : ''}
${bodyProfile.undertone === 'warm' ? '- Colour: warm undertone — steer towards earth tones, camel, olive, rust, warm whites. Avoid icy or blue-based tones.' : bodyProfile.undertone === 'cool' ? '- Colour: cool undertone — navy, grey, burgundy, jewel tones, true white all flatter. Avoid orange-based hues.' : ''}
${bodyProfile.features?.includes('Minimise my bust') ? '- Avoid deep V-necks or clingy tops. Structured necklines preferred.' : ''}
${bodyProfile.features?.includes('Create waist definition') ? '- Always find a way to define the waist in each look.' : ''}
` : '';

    const prompt = `${personaCtx} ${FASHION_EDITOR_VOICE} ${ACCESSORIES_DIRECTOR_VOICE} ${brandVoice} Today is ${today}. ${STYLIST_2026_LENS}
${styleBriefCtx ? styleBriefCtx + '\n' : ''}${styleDirectives}${profileLine}${bodyRules}

The hero piece is: ${item.category}, "${item.name}", color ${item.primaryColor}${item.secondaryColor ? '/' + item.secondaryColor : ''}${item.material ? ', ' + item.material : ''}, ${item.pattern || 'solid'}, ${item.formality}, ${item.season}.

Other items in their wardrobe:
${wardrobeText || '(none yet)'}

Create 4 ways to style the hero piece:
- 3 looks using ONLY items from the wardrobe list above (reference by exact id). Each look must specifically work for the client's body type and colouring.
- 1 look that suggests 1–2 items NOT in the wardrobe to elevate the hero piece further — these suggested pieces must suit their body shape and colouring. Set wardrobeItemIds to [].

For every look, give a specific 2026-relevant aesthetic name and explain briefly why this combination works for their proportions.

Respond ONLY with valid JSON, no markdown:
{"looks":[{"title":"max 5 words","aesthetic":"specific current 2026 aesthetic","wardrobeItemIds":["id1","id2"],"suggestedPurchases":["item description max 10 words"],"howToWear":"max 12 words"}]}`;

    const raw = await callClaude({ prompt, maxTokens: 3000 });
    const parsed = parseJSON(raw) as { looks?: unknown[] };
    return NextResponse.json({ looks: parsed.looks ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Style generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

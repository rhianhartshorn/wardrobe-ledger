import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { getImage } from '@/lib/db';
import { profileToContext, type BodyProfile } from '@/lib/body-profile';
import { getPersonaContext, getStyleDirectives, STYLIST_2026_LENS, FIT_SPECIALIST_VOICE, ACCESSORIES_DIRECTOR_VOICE, getStyleBriefContext, getBrandVoiceContext } from '@/lib/stylist';
import { auditInBackground } from '@/lib/editorial';

type WeatherSnapshot = {
  locationName: string;
  tempF: number;
  condition: string;
  summary: string;
};

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
  fit?: string;
  length?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      items: WardrobeItem[];
      weather?: WeatherSnapshot | null;
      occasion: string;
      note?: string;
      profileImageFilename?: string;
      bodyProfile?: BodyProfile;
      topWorn?: string[];
      savedLookTitles?: string[];
      wearBehaviourSummary?: string;
      wardrobeGrid?: string;
      wardrobeGridMapping?: string;
    };
    const { items, weather, occasion, note, profileImageFilename, bodyProfile, topWorn, savedLookTitles, wearBehaviourSummary, wardrobeGrid, wardrobeGridMapping } = body;

    if (!items?.length) return NextResponse.json({ error: 'No wardrobe items provided' }, { status: 400 });

    const safeName = profileImageFilename ? profileImageFilename.replace(/[^a-zA-Z0-9._-]/g, '') : null;
    const [styleBriefCtx, personaCtx, styleDirectives, brandVoice, profileImageData] = await Promise.all([
      getStyleBriefContext(),
      getPersonaContext(),
      getStyleDirectives(),
      getBrandVoiceContext(),
      safeName ? getImage(safeName) : Promise.resolve(null),
    ]);

    let profileImageBase64: string | undefined;
    let profileMediaType = 'image/jpeg';
    if (profileImageData) { profileImageBase64 = profileImageData.data; profileMediaType = profileImageData.mimeType; }

    const itemListText = items
      .map((i) => `${i.id} :: ${i.category}, "${i.name}", color ${i.primaryColor}${i.secondaryColor ? '/' + i.secondaryColor : ''}, ${i.pattern || 'solid'}${i.material ? ', ' + i.material : ''}${i.fit ? ', ' + i.fit : ''}${i.length ? ', ' + i.length : ''}, ${i.formality}, ${i.season}`)
      .join('\n');

    const photoLine = profileImageBase64
      ? `The first attached image is a photo of the client. ${styleBriefCtx ? 'A professional colour analysis has already been performed (see COLOUR PROFILE below) — use those facts directly. Cross-reference the photo to apply the silhouette and proportion assessment.' : 'Analyse their colouring from the photo before selecting outfits — identify undertone, contrast level, and hair tone, then use this as a hard colour filter.'} In each outfit rationale, name the specific colour reason it works for their colouring. Never comment on weight or size. `
      : (styleBriefCtx ? 'A professional colour analysis is available — use it as a hard filter when selecting outfits. ' : '');

    const gridLine = wardrobeGrid
      ? `${profileImageBase64 ? 'The second' : 'The'} attached image is a numbered visual grid of the wardrobe items. Grid key: ${wardrobeGridMapping}. Use it to verify actual colour accuracy, fabric texture and weight, and how each piece's silhouette reads — trust the visual over the text tags for these qualities.`
      : '';

    const profileCtx = bodyProfile ? profileToContext(bodyProfile) : '';

    const tasteSignals = [
      ...(topWorn?.length ? [`Items this client reaches for most: ${topWorn.join('; ')}`] : []),
      ...(savedLookTitles?.length ? [`Looks they've saved and loved: ${savedLookTitles.join('; ')}`] : []),
      ...(wearBehaviourSummary ? [`Wear behaviour patterns: ${wearBehaviourSummary}`] : []),
    ].join('\n');

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const bodyGuidance = bodyProfile?.bodyShape ? `
IMPORTANT — apply these body-fit principles to every outfit:
${profileCtx}
Silhouette rules for their shape:
${bodyProfile.bodyShape === 'hourglass' ? '- Celebrate the waist — wrap dresses, belted pieces, fitted cuts work beautifully. Avoid shapeless sacks or very boxy oversized fits.' : ''}
${bodyProfile.bodyShape === 'pear' ? '- Balance with volume on top (statement sleeves, interesting necklines, bold colours above the waist). Dark, streamlined bottoms elongate the lower half. A-line skirts and wide-leg trousers are ideal. Avoid clingy skirts or tapered trousers that emphasise hips.' : ''}
${bodyProfile.bodyShape === 'apple' ? '- Elongate the torso with V-necks, open necklines, and vertical lines. Empire waist or fit-and-flare silhouettes create shape. Avoid high-waisted bottoms that cut across the widest point. Monochrome dressing slims.' : ''}
${bodyProfile.bodyShape === 'rectangle' ? '- Create curves with peplums, wrap styles, ruffles, or belted pieces. Cropped tops with high-waisted bottoms define a waist. Fitted and draped fabrics work better than very stiff structures.' : ''}
${bodyProfile.bodyShape === 'athletic' ? '- Soften the shoulder line with off-shoulder, scoop necks, and fluid fabrics. High-waisted wide-leg trousers add hip curve. Avoid strong shoulder pads or very structured blazers.' : ''}
${bodyProfile.height === 'petite' ? '- Petite frame: avoid overwhelming proportions. Midi lengths should hit at the knee or just below. Monochrome or tonal dressing adds height. Cropped jackets work better than long coats. Avoid ankle straps.' : ''}
${bodyProfile.height === 'tall' ? '- Tall frame: can carry bold proportions, maxi lengths, wide-leg trousers, and oversized pieces beautifully. Midi skirts can hit mid-calf.' : ''}
${bodyProfile.features?.includes('Minimise my bust') ? '- Avoid deep V-necks or very fitted tops. Structured, supportive necklines (boat neck, high scoop, square neck) are more flattering.' : ''}
${bodyProfile.features?.includes('Create waist definition') ? '- Always suggest a way to define the waist — a belt, a tucked-in hem, or a fitted layer.' : ''}
${bodyProfile.features?.includes('Elongate my silhouette') ? '- Prioritise vertical lines, monochrome dressing, and long layering pieces.' : ''}
Colour guidance: ${profileCtx.includes('warm') ? 'warm undertone — earth tones, camel, olive, rust, warm white, terracotta, gold jewellery all work beautifully. Avoid icy pastels or stark white.' : profileCtx.includes('cool') ? 'cool undertone — navy, burgundy, grey, jewel tones, true white and silver all flatter. Avoid orange-based tones and yellows.' : 'neutral undertone — can wear both warm and cool tones well.'}
${bodyProfile.fitPreference === 'relaxed' ? 'This client prefers relaxed, easy-fitting pieces — avoid suggesting anything too tight or structured.' : bodyProfile.fitPreference === 'tailored' ? 'This client prefers tailored, structured pieces — lean towards fitted, polished silhouettes.' : ''}
` : '';

    const prompt = `${personaCtx} ${FIT_SPECIALIST_VOICE} ${ACCESSORIES_DIRECTOR_VOICE} ${brandVoice} Today is ${today}. ${STYLIST_2026_LENS} ${photoLine}${gridLine ? ' ' + gridLine : ''}
${styleBriefCtx ? styleBriefCtx + '\n' : ''}${styleDirectives}${tasteSignals ? 'CLIENT TASTE SIGNALS — use these to understand their real style preferences, not just their wardrobe on paper:\n' + tasteSignals + '\n' : ''}${bodyGuidance}
Occasion: ${occasion}${note ? ' — additional context: ' + note : ''}
${weather ? `Current weather: ${weather.locationName}, ${weather.tempF}°F, ${weather.condition}. ${weather.summary}` : 'No weather data — the user is planning ahead or exploring. Select outfits that work across a range of conditions for this occasion, and note any weather-sensitive layering in the weatherNote field.'}

Wardrobe (id :: details):
${itemListText}

Using ONLY items from this wardrobe list (reference by exact id), assemble exactly 3 distinct polished outfit combinations. Discard any combination where the palette clashes with the client's colouring — only surface outfits that genuinely flatter them. For each, name the current 2026 style aesthetic. Apply the body and colour analysis above to every outfit choice.

Respond with ONLY valid JSON, no markdown:
{"outfits":[{"title":"max 5 words","itemIds":["id1","id2"],"styleReference":"specific 2026 aesthetic max 6 words","rationale":"max 35 words — lead with the specific colour reason this works for their complexion/hair, then name the silhouette benefit for their frame","accessorizing":["specific accessory direction max 10 words — name the type, finish, and why (e.g. 'a slim tan leather belt — anchors the waist, adds warmth')","second accessory tip max 10 words"],"weatherNote":"max 15 words"}]}`;

    const extraImages = wardrobeGrid ? [{ base64: wardrobeGrid }] : undefined;
    const raw = await callClaude({ prompt, imageBase64: profileImageBase64, mediaType: profileMediaType, images: extraImages, maxTokens: 3000 });
    const parsed = parseJSON(raw) as { outfits?: Array<{ rationale?: string; accessorizing?: string[] }> };
    const outfits = parsed.outfits ?? [];

    // Audit rationales in background — no effect on response
    const rationaleText = outfits.map((o) => o.rationale).filter(Boolean).join('\n');
    if (rationaleText) auditInBackground('outfit', 'outfit rationale', rationaleText);

    return NextResponse.json({ outfits });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Outfit generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

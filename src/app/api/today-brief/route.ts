import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { getSetting, setSetting, getSavedLooks, getJournalEntries } from '@/lib/db';
import { profileToContext, type BodyProfile } from '@/lib/body-profile';
import {
  getPersonaContext, getStyleBriefContext, getBrandVoiceContext,
  getLifestyleContext, getStyleDirectives, getStyleThesisContext,
  STYLIST_2026_LENS, STYLING_CRAFT_LIBRARY,
} from '@/lib/stylist';
import { getWardrobeCharacterBriefContext, getStyleIdentityContext } from '@/lib/wardrobe-brain';
import { isCompleteOutfit, runVisualGate, runAccessoriesDirector, buildSpotlightBlock, buildStatementRoster, recordRecommendationsInBackground, type ChatOutfit, type WardrobeItemLite } from '@/lib/outfit-pipeline';
import { buildWardrobeCachePrefix } from '@/lib/specialist-team';

type TodayResponse = {
  greeting: string;
  primary?: ChatOutfit;
  alternative?: ChatOutfit;
};

type CachedBrief = { date: string; response: TodayResponse };

export async function POST(req: NextRequest) {
  try {
    const { items, bodyProfile, weather, force } = await req.json() as {
      items?: WardrobeItemLite[];
      bodyProfile?: BodyProfile;
      weather?: { locationName: string; tempF: number; condition: string; summary: string };
      force?: boolean;
    };

    if (!items?.length || items.length < 3) {
      return NextResponse.json({ error: 'Add at least 3 items to get a daily brief.' }, { status: 400 });
    }

    const todayDate = new Date().toISOString().slice(0, 10);

    // The wardrobe and weather rarely change meaningfully between two opens
    // on the same day — reuse the day's brief instead of regenerating a full
    // Opus outfit pass every single time the app is opened.
    if (!force) {
      try {
        const cachedRaw = await getSetting('today_brief_cache');
        const cached = cachedRaw ? (JSON.parse(cachedRaw) as CachedBrief) : null;
        if (cached?.date === todayDate) {
          return NextResponse.json(cached.response);
        }
      } catch { /* fall through to regenerate */ }
    }

    const [personaCtx, styleBriefCtx, lifestyleCtx, brandVoice, styleDirectives, thesisCtx, wardrobeCharacterBriefCtx, savedLooks, journal, styleIdentityCtx] = await Promise.all([
      getPersonaContext(),
      getStyleBriefContext(),
      getLifestyleContext(),
      getBrandVoiceContext(),
      getStyleDirectives(),
      getStyleThesisContext(),
      getWardrobeCharacterBriefContext(),
      getSavedLooks(),
      getJournalEntries(),
      getStyleIdentityContext(),
    ]);

    const bodyProfileCtx = bodyProfile
      ? `\nCLIENT BODY PROFILE:\n${profileToContext(bodyProfile)}\n`
      : '';

    const weatherBlock = weather
      ? `\nTODAY'S CONDITIONS (${weather.locationName}): ${weather.tempF}°F, ${weather.condition}. ${weather.summary} Factor this directly — fabrics, layering, and weather-appropriateness are hard requirements today, not suggestions.\n`
      : '';

    // Recently worn — last 3 days of journal entries — avoid repeating as the anchor
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const recentIds = new Set(
      journal.filter((e) => Date.now() - e.loggedAt < THREE_DAYS_MS).flatMap((e) => e.itemIds)
    );
    const recentNames = items.filter((i) => recentIds.has(i.id)).map((i) => i.name);
    const recentBlock = recentNames.length
      ? `\nWORN IN THE LAST 3 DAYS (avoid making these the anchor piece today — the client has already reached for them recently): ${recentNames.join(', ')}\n`
      : '';

    const workedLooks = savedLooks.filter((l) => l.feedback === 'worked');
    const lookPieces = (ids: string[]) => ids.map((id) => items.find((i) => i.id === id)?.name).filter(Boolean).join(' + ');
    const savedLooksBlock = workedLooks.length
      ? `\nCONFIRMED WINS — combinations validated in real life on this client, your taste calibration:\n${workedLooks.map((l) => `- "${l.title}"${lookPieces(l.itemIds) ? ': ' + lookPieces(l.itemIds) : ''}`).join('\n')}\n`
      : '';

    const itemListText = items.map((it) =>
      `${it.id} :: ${it.category}${it.accessoryType ? ' (' + it.accessoryType + ')' : ''}, "${it.name}", ${it.primaryColor}${it.secondaryColor ? '/' + it.secondaryColor : ''}${it.material ? ', ' + it.material : ''}${it.fit ? ', ' + it.fit : ''}${it.length ? ', ' + it.length : ''}, ${it.formality}, ${it.season}${it.visualNotes ? ' [' + it.visualNotes + ']' : ''}${(it.wearCount ?? 0) > 0 ? ', worn ' + it.wearCount + 'x' : ''}${it.styleNote ? ' — ' + it.styleNote : ''}`
    ).join('\n');

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const spotlightBlock = buildSpotlightBlock(items);
    const statementRoster = buildStatementRoster(items);

    const prompt = `${personaCtx}

${STYLIST_2026_LENS}
${brandVoice}
Today is ${today}.
${styleBriefCtx ? styleBriefCtx + '\n' : ''}${lifestyleCtx}${weatherBlock}${wardrobeCharacterBriefCtx}${styleIdentityCtx}${thesisCtx}${savedLooksBlock}${recentBlock}${bodyProfileCtx}${styleDirectives}${spotlightBlock}${statementRoster}

━━━ YOUR TASK ━━━
This is the client's morning brief — the one thing your styling atelier proactively prepares before she even asks. Show up the way a real stylist would: dressed, resolved, ready.

Propose exactly ONE primary look for today and ONE genuinely different alternative (different anchor piece, not a minor variation). Both must:
— be weather-appropriate for today's conditions if given
— avoid the pieces worn in the last 3 days as the anchor
— pass proportion, colour, and pattern-mixing rules exactly like any other recommendation — an underused piece only earns a place if it actually coordinates
— include a specific styling technique from the craft vocabulary above, not just which pieces go together

If a SPOTLIGHT block appears above, genuinely consider those pieces before defaulting to familiar anchors — a long wardrobe list makes it easy to unconsciously skip past the same items every day.

Write one short, warm greeting sentence for today — direct, no hedging, no hollow words.

OUTFIT COMPLETENESS RULE: Every outfit requires a base layer top (shirt, blouse, t-shirt, tank, bodysuit, camisole, or fine knit) OR a dress/jumpsuit, plus a bottom OR the dress/jumpsuit. Layering pieces (cardigan, blazer, jacket, coat, hoodie, jumper, overshirt) always require a base layer top underneath.

Respond with ONLY valid JSON, no markdown:
{
  "greeting": "1 sentence for today",
  "primary": {"title":"max 5 words","itemIds":["id1","id2","id3"],"styleReference":"max 6 words","rationale":"max 20 words, starts with Try or Wear","stylingNote":"max 15 words — specific technique"},
  "alternative": {"title":"max 5 words","itemIds":["id1","id2","id3"],"styleReference":"max 6 words","rationale":"max 20 words, starts with Try or Wear","stylingNote":"max 15 words — specific technique"}
}`;

    const raw = await callClaude({
      prompt,
      cacheableSections: [buildWardrobeCachePrefix(itemListText), STYLING_CRAFT_LIBRARY],
      maxTokens: 1200,
      model: 'claude-opus-4-8',
      route: 'today-brief',
    });
    const parsed = parseJSON(raw) as TodayResponse;

    // Post-process: completeness + visual gate + accessories, same bar as any other recommendation.
    // Gate and accessories run concurrently rather than sequentially — a few wasted
    // accessory calls on rejected looks is cheaper than a second full AI round-trip.
    const candidates = [parsed.primary, parsed.alternative].filter((o): o is ChatOutfit => !!o?.itemIds?.length);
    const complete = candidates.filter((o) => isCompleteOutfit(o.itemIds, items));
    const [gateSurvivors, accessorised] = complete.length
      ? await Promise.all([
          runVisualGate(complete, items),
          runAccessoriesDirector(complete, items, styleBriefCtx, lifestyleCtx, styleIdentityCtx),
        ])
      : [new Set<ChatOutfit>(), [] as ChatOutfit[]];
    const approved = complete.filter((o) => gateSurvivors.has(o));
    const enriched = approved.map((o) => accessorised[complete.indexOf(o)] ?? o);

    const result: TodayResponse = {
      greeting: parsed.greeting || "Here's today.",
      primary: enriched.find((o) => o.title === parsed.primary?.title) ?? enriched[0],
      alternative: enriched.find((o) => o.title === parsed.alternative?.title && o !== enriched[0]),
    };

    // Only real generations count as a recommendation, not repeat reads of
    // the cached brief later the same day.
    const recommendedIds = [result.primary, result.alternative].filter(Boolean).flatMap((o) => o!.itemIds);
    if (recommendedIds.length) recordRecommendationsInBackground(recommendedIds);

    try {
      await setSetting('today_brief_cache', JSON.stringify({ date: todayDate, response: result } satisfies CachedBrief));
    } catch { /* cache write failure — still return the fresh result */ }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not build today\'s brief';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { profileToContext, type BodyProfile } from '@/lib/body-profile';
import {
  getPersonaContext, getStyleDirectives, STYLIST_2026_LENS, getStyleBriefContext, getBrandVoiceContext, getLifestyleContext,
  COLOUR_ANALYST_PERSONA, FASHION_EDITOR_PERSONA, WARDROBE_INTELLIGENCE_PERSONA,
} from '@/lib/stylist';
import { getWardrobeCharacterBriefContext, saveStyleIdentity, getTeamPerspective } from '@/lib/wardrobe-brain';
import { searchInspirationImages } from '@/lib/image-search';
import { runSpecialist, briefsHaveDisagreement, runRoundTable, classifyTension, formatBriefsBlock, buildWardrobeCachePrefix } from '@/lib/specialist-team';
import { auditInBackground } from '@/lib/editorial';
import type { StyleReadResult } from '@/lib/style-types';

type WardrobeItem = {
  id: string; category: string; name: string;
  primaryColor: string; secondaryColor: string;
  pattern: string; formality: string; season: string;
  material?: string; fit?: string; length?: string; accessoryType?: string; wearCount?: number; visualNotes?: string;
};

export type { StyleGroup, StyleTwin, StyleReadResult } from '@/lib/style-types';

export async function POST(req: NextRequest) {
  try {
    const { items, bodyProfile, topWorn, savedLookTitles, wearBehaviourSummary, wardrobeGrid, wardrobeGridMapping } = await req.json() as {
      items: WardrobeItem[];
      bodyProfile?: BodyProfile;
      topWorn?: string[];
      savedLookTitles?: string[];
      wearBehaviourSummary?: string;
      wardrobeGrid?: string;
      wardrobeGridMapping?: string;
    };

    if (!items || items.length < 3) {
      return NextResponse.json({ error: 'Add at least 3 items to get a style reading.' }, { status: 400 });
    }

    const [styleBriefCtx, personaCtx, styleDirectives, brandVoice, lifestyleCtx, wardrobeCharacterBriefCtx] = await Promise.all([
      getStyleBriefContext(),
      getPersonaContext(),
      getStyleDirectives(),
      getBrandVoiceContext(),
      getLifestyleContext(),
      getWardrobeCharacterBriefContext(),
    ]);

    const itemListText = items
      .map((it) => `${it.id} :: ${it.category}${it.accessoryType ? ' (' + it.accessoryType + ')' : ''}, "${it.name}", ${it.primaryColor}${it.secondaryColor ? '/' + it.secondaryColor : ''}, ${it.pattern || 'solid'}${it.material ? ', ' + it.material : ''}${it.fit ? ', ' + it.fit : ''}${it.length ? ', ' + it.length : ''}, ${it.formality}, ${it.season}${it.visualNotes ? ' [' + it.visualNotes + ']' : ''}${(it.wearCount ?? 0) > 0 ? ', worn ' + it.wearCount + 'x' : ''}`)
      .join('\n');

    const tasteSignals = [
      ...(topWorn?.length ? [`Most-worn (real behaviour): ${topWorn.join('; ')}`] : []),
      ...(savedLookTitles?.length ? [`Saved looks: ${savedLookTitles.join('; ')}`] : []),
      ...(wearBehaviourSummary ? [`Wear behaviour patterns: ${wearBehaviourSummary}`] : []),
    ].join('\n');

    const profileCtx = bodyProfile ? profileToContext(bodyProfile) : '';
    const profileBlock = profileCtx
      ? `\nCLIENT PROFILE: ${profileCtx}\nFactor body shape and colouring into archetype, strengths, gaps, and style groups.\n`
      : '';

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const gridBlock = wardrobeGrid
      ? `\nVISUAL WARDROBE GRID: A numbered image grid of all wardrobe items is attached. Grid key: ${wardrobeGridMapping}. Use the visual grid to ground your archetype reading in what the clothes actually look like — actual colours, fabric textures, and silhouettes, not just text tags.\n`
      : '';

    const wardrobeImages = wardrobeGrid ? [{ base64: wardrobeGrid }] : undefined;

    const sharedContext = [
      styleBriefCtx ? `COLOUR PROFILE:\n${styleBriefCtx}` : '',
      lifestyleCtx,
      wardrobeCharacterBriefCtx,
      profileBlock,
      styleDirectives,
      tasteSignals ? `BEHAVIOURAL SIGNALS — weight these heavily, they reveal real style vs aspiration:\n${tasteSignals}` : '',
    ].filter(Boolean).join('\n');

    // ── STEP 1: The specialist team actually reads this wardrobe ─────────────
    // Three lenses map directly onto the three sections of a style reading:
    // Colour Analysis → colour story; Fashion Editor → archetype & style twins
    // (aesthetic identity, currency, real-world references); Wardrobe
    // Intelligence → strengths, gaps, narrative arc, brand projection.

    const task = 'Deliver a complete style reading of this wardrobe — archetype, aesthetic identity, style twins, brand projection, colour story, strengths, gaps, and narrative direction.';

    const specialistBriefs = await Promise.all([
      runSpecialist(
        'Colour Analysis',
        COLOUR_ANALYST_PERSONA,
        'Read this wardrobe\'s overall colour identity — how well the palette actually worn matches the client\'s colour profile, any recurring clashes or misses, and the true colour story (mood and palette) this wardrobe tells. This directly informs the colour story section of the reading.',
        task, itemListText, sharedContext,
      ),
      runSpecialist(
        'Fashion Editor',
        FASHION_EDITOR_PERSONA,
        'Identify this wardrobe\'s real aesthetic archetype and the 2-3 real people, style icons, or designers it most genuinely resembles — not aspirational references, actual matches grounded in the specific pieces owned. Assess whether the wardrobe reads current or dated. This directly informs the archetype and style twins sections.',
        task, itemListText, sharedContext, wardrobeImages,
      ),
      runSpecialist(
        'Wardrobe Intelligence',
        WARDROBE_INTELLIGENCE_PERSONA,
        'Read wear patterns, category clustering, the aspiration-reality gap, and brand projection — what this wardrobe currently signals to a stranger versus what the client likely intends. Identify the strongest 3 strengths and 3 gaps, and where this wardrobe is heading. This directly informs brand statement, narrative arc, next chapter, strengths, and gaps.',
        task, itemListText, sharedContext,
      ),
    ]);

    const finalBriefs = briefsHaveDisagreement(specialistBriefs)
      ? await runRoundTable(task, specialistBriefs)
      : specialistBriefs;

    // ── STEP 2: Head stylist synthesizes the team's briefs into the reading ──

    const prompt = `${personaCtx} ${brandVoice} Today is ${today}. ${STYLIST_2026_LENS}
${styleBriefCtx ? styleBriefCtx + '\n' : ''}${lifestyleCtx}${wardrobeCharacterBriefCtx}${gridBlock}${styleDirectives}${tasteSignals ? 'BEHAVIOURAL SIGNALS — weight these heavily, they reveal real style vs aspiration:\n' + tasteSignals + '\n' : ''}${profileBlock}

━━━ SPECIALIST TEAM BRIEFS ━━━
Tension classification: ${classifyTension(finalBriefs)}

${formatBriefsBlock(finalBriefs)}

━━━ YOUR TASK ━━━
You are delivering a complete style reading of this wardrobe, synthesizing your team's briefs above into one coherent voice. Three lenses in one:
1. Who they ARE (archetype, aesthetic identity, style clusters) — from Fashion Editor
2. What they're PROJECTING (brand statement, narrative coherence, what a stranger reads) — from Wardrobe Intelligence
3. Who they dress LIKE (2-3 real style references — not aspirational goals, actual matches) — from Fashion Editor
Colour Analysis's brief informs the colour story and any palette flags woven through the reading.

Your response must reflect the team's collective input — do not contradict a specialist who gave high-confidence input without explaining why.

Be honest and specific throughout. Hollow positivity is useless. A sharp observation is worth more than three vague compliments.

Respond with ONLY valid JSON, no markdown:
{
  "archetype": "2–4 word style archetype",
  "archetypeDescription": "1 sentence max 20 words — what makes this archetype specific to them",
  "styleKeywords": ["word1","word2","word3","word4","word5"],
  "styleTwins": [
    {"name": "real person or style icon their wardrobe most resembles", "why": "1 sentence max 15 words — specific reason", "matchStrength": "high|medium|low"},
    {"name": "second match", "why": "specific reason", "matchStrength": "high|medium|low"},
    {"name": "third match if real — omit if not", "why": "specific reason", "matchStrength": "low"}
  ],
  "brandStatement": "1 sentence max 20 words — what their wardrobe says to a stranger reading it cold",
  "narrativeArc": "1 sentence max 20 words — where their style is heading based on what they actually wear",
  "nextChapter": "1 sentence max 20 words — the single most impactful shift they could make",
  "colorStory": "max 12 words on palette and mood",
  "wardrobeStrengths": ["max 8 words", "max 8 words", "max 8 words"],
  "wardrobeGaps": ["max 8 words", "max 8 words", "max 8 words"],
  "styleGroups": [{"groupName": "e.g. The Weekend Edit", "mood": "4–5 words", "itemIds": ["id1","id2"]}]
}

styleGroups: group ALL items into 2–4 meaningful aesthetic clusters by look/mood, not by category. Every item in exactly one group.`;

    // Taste-critical synthesis — same standard as the head stylist elsewhere.
    // Shares the same cache prefix (principles + wardrobe) the specialist
    // calls above just wrote, billed at a fraction of normal input cost.
    const raw = await callClaude({
      prompt,
      cacheableSections: [buildWardrobeCachePrefix(itemListText)],
      images: wardrobeImages,
      maxTokens: 5000,
      model: 'claude-opus-4-8',
      route: 'style-read',
    });
    const parsed = parseJSON(raw) as StyleReadResult;

    // Persist the client's own declared style identity so day-to-day
    // recommendations can adapt to it instead of defaulting to the team's
    // own house aesthetic. Fire-and-forget — never blocks the response.
    if (parsed.archetype) {
      saveStyleIdentity({
        archetype: parsed.archetype,
        styleKeywords: parsed.styleKeywords ?? [],
        brandStatement: parsed.brandStatement ?? '',
        colorStory: parsed.colorStory ?? '',
        narrativeArc: parsed.narrativeArc ?? '',
      });
    }

    // Real inspiration photos for each style twin — never blocks the reading if unavailable
    if (parsed.styleTwins?.length) {
      const withImages = await Promise.all(
        parsed.styleTwins.map(async (twin) => ({
          ...twin,
          images: await searchInspirationImages(`${twin.name} style outfit`, 3, 'style-read'),
        }))
      );
      parsed.styleTwins = withImages;
    }

    const auditText = [
      parsed.archetypeDescription,
      parsed.brandStatement,
      parsed.narrativeArc,
      parsed.nextChapter,
    ].filter(Boolean).join('\n');
    if (auditText) auditInBackground('style-read', 'style analysis section', auditText);

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Style reading failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// The team's note on how their default technical POV adapts to this
// client's declared archetype — generated once in the background after a
// Read My Style run, fetched separately since it may not be ready the
// instant the POST above returns.
export async function GET() {
  try {
    const teamPerspective = await getTeamPerspective();
    return NextResponse.json({ teamPerspective });
  } catch {
    return NextResponse.json({ teamPerspective: '' });
  }
}

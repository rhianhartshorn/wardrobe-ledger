import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { profileToContext, type BodyProfile } from '@/lib/body-profile';
import {
  getPersonaContext, getStyleDirectives, STYLIST_2026_LENS, getStyleBriefContext, getBrandVoiceContext,
  FIT_SPECIALIST_PERSONA, COLOUR_ANALYST_PERSONA, FASHION_EDITOR_PERSONA,
} from '@/lib/stylist';
import { searchInspirationImages } from '@/lib/image-search';
import { runSpecialist, briefsHaveDisagreement, runRoundTable, classifyTension, formatBriefsBlock } from '@/lib/specialist-team';
import type { InspirationImage } from '@/lib/style-types';

type WardrobeItem = {
  id: string; name: string; category: string;
  primaryColor: string; secondaryColor: string;
  pattern: string; formality: string; season: string; material?: string; fit?: string; length?: string;
};

export async function POST(req: NextRequest) {
  try {
    const { items, goal, bodyProfile, wearBehaviourSummary } = await req.json() as {
      items: WardrobeItem[];
      goal?: string;
      bodyProfile?: BodyProfile;
      wearBehaviourSummary?: string;
    };
    if (!items?.length) return NextResponse.json({ error: 'No items' }, { status: 400 });

    const itemListText = items
      .map((i) => `${i.id} :: ${i.category}, "${i.name}", ${i.primaryColor}${i.secondaryColor ? '/' + i.secondaryColor : ''}, ${i.pattern || 'solid'}${i.material ? ', ' + i.material : ''}${i.fit ? ', ' + i.fit : ''}${i.length ? ', ' + i.length : ''}, ${i.formality}`)
      .join('\n');

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const [styleBriefCtx, personaCtx, styleDirectives, brandVoice] = await Promise.all([
      getStyleBriefContext(),
      getPersonaContext(),
      getStyleDirectives(),
      getBrandVoiceContext(),
    ]);

    const profileCtx = bodyProfile ? profileToContext(bodyProfile) : '';
    const profileBlock = profileCtx
      ? `\nCLIENT PROFILE: ${profileCtx}\nFactor their body shape, colouring, and height into every assessment — what works aesthetically in the abstract may not work for this specific person.\n`
      : '';

    const behaviourBlock = wearBehaviourSummary
      ? `\nWEAR BEHAVIOUR: ${wearBehaviourSummary}\n`
      : '';

    const goalSection = goal
      ? `\nThe client's style aspiration is: "${goal}"\nAnalyse how close their current wardrobe already is to this reference, accounting for their body and colouring. Which specific pieces (by id) already work toward it, what is missing, and 3 concrete tips to bridge the gap using what they own.`
      : '';

    const sharedContext = [
      styleBriefCtx ? `COLOUR PROFILE:\n${styleBriefCtx}` : '',
      profileBlock,
      behaviourBlock,
      styleDirectives,
    ].filter(Boolean).join('\n');

    // ── STEP 1: The specialist team assesses the match / gap ─────────────────

    const task = goal
      ? `Identify the 3 real people whose style this wardrobe most resembles, AND assess how close this wardrobe is to the client's stated goal: "${goal}".`
      : 'Identify the 3 real people (celebrities, models, style icons, designers) whose personal style this wardrobe most closely resembles.';

    const specialistBriefs = await Promise.all([
      runSpecialist(
        'Fit & Proportion',
        FIT_SPECIALIST_PERSONA,
        `Assess whether this wardrobe's proportions and silhouettes genuinely suit the client's body profile. A style match or goal reference that doesn't work for this specific frame is not a real match.${goalSection}`,
        task, itemListText, sharedContext,
      ),
      runSpecialist(
        'Colour Analysis',
        COLOUR_ANALYST_PERSONA,
        `Assess whether this wardrobe's palette genuinely suits the client's colour profile. A style match or goal reference built on colours that don't flatter this client's undertone is not a real match.${goalSection}`,
        task, itemListText, sharedContext,
      ),
      runSpecialist(
        'Fashion Editor',
        FASHION_EDITOR_PERSONA,
        `Identify the real people, style icons, or designers this wardrobe's actual pieces most closely resemble — grounded in specific garments owned, not aspiration. ${goal ? `Assess concretely how close this wardrobe already is to "${goal}" and what's missing.` : ''}`,
        task, itemListText, sharedContext,
      ),
    ]);

    const finalBriefs = briefsHaveDisagreement(specialistBriefs)
      ? await runRoundTable(task, specialistBriefs)
      : specialistBriefs;

    // ── STEP 2: Head stylist synthesizes the team's briefs ───────────────────

    const prompt = `${personaCtx} ${brandVoice} Today is ${today}. ${STYLIST_2026_LENS}
${styleBriefCtx ? styleBriefCtx + '\n' : ''}${styleDirectives}${profileBlock}${behaviourBlock}

━━━ SPECIALIST TEAM BRIEFS ━━━
Tension classification: ${classifyTension(finalBriefs)}

${formatBriefsBlock(finalBriefs)}

━━━ YOUR TASK ━━━
Wardrobe:
${itemListText}
${goalSection}

Synthesize your team's briefs above. Be specific and accurate — consider the actual clothes, colours, formality level, and how they work with this client's body and colouring. A style match that doesn't flatter this person's specific frame and undertone is not a genuine match, even if a specialist proposed it — resolve any disagreement yourself before finalizing.

Respond with ONLY valid JSON, no markdown:
{
  "closestMatches": [
    {
      "name": "Real person's full name",
      "why": "max 20 words — specific overlap in style, palette, pieces, and why it works for this person's frame/colouring",
      "matchStrength": "high | medium | low"
    }
  ]${goal ? `,
  "goalAnalysis": {
    "goal": "${goal.replace(/"/g, "'")}",
    "howClose": "one sentence: how aligned the current wardrobe already is, given their body and colouring",
    "workingPieces": ["id1", "id2"],
    "missingPieces": ["specific item description max 10 words", "item 2", "item 3"],
    "bridgeTips": ["concrete tip using existing wardrobe max 20 words", "tip 2", "tip 3"]
  }` : ''}
}`;

    // Taste-critical synthesis — same standard as the head stylist elsewhere.
    const raw = await callClaude({ prompt, maxTokens: 1200, model: 'claude-opus-4-8', route: 'style-match' });
    const parsed = parseJSON(raw) as {
      closestMatches?: Array<{ name: string; why: string; matchStrength: string }>;
      goalAnalysis?: { goal: string; images?: InspirationImage[] } & Record<string, unknown>;
    };

    // Real inspiration photos for the goal aesthetic — never blocks the analysis if unavailable
    if (parsed.goalAnalysis?.goal) {
      parsed.goalAnalysis.images = await searchInspirationImages(`${parsed.goalAnalysis.goal} outfit style`, 3);
    }

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

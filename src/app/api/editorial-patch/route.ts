import { NextResponse } from 'next/server';
import { callClaude, parseJSON } from '@/lib/claude';
import { getSetting, setSetting } from '@/lib/db';
import type { EditorialLogEntry } from '@/lib/editorial';
import type { EditorialPatch } from '@/lib/editorial-types';

export type { EditorialPatch } from '@/lib/editorial-types';

const PATCH_ANALYST_PROMPT = `You are a copy quality analyst reviewing failures from an editorial audit system. A brand voice spec is being enforced via AI prompts, but some outputs are still violating the rules. Your job: analyse the violation patterns and generate new, specific prompt rules that will fix what keeps slipping through.

The existing brand voice rules already cover the basics: banned words (elevate/effortless/luxury/chic/curated/versatile etc), no hedging, second person only, no exclamation marks, short sentences.

You are generating ADDITIONAL rules — targeted corrections for what the existing rules are failing to prevent. These will be injected directly into AI prompts. Make them precise and actionable, not general. If the AI keeps using "effortlessly", don't say "avoid banned words" (already in the spec) — say "The word 'effortlessly' and its variants keep appearing despite being banned. Never use them in any form."

Generate 3–6 rules maximum. Only create rules for patterns that appear more than once. Do not duplicate rules already in the base spec.`;

export async function GET() {
  try {
    const raw = await getSetting('editorial_log');
    const log: EditorialLogEntry[] = raw ? JSON.parse(raw) : [];

    // Only process unreviewed entries (since last patch run)
    const lastPatchRaw = await getSetting('editorial_patch_timestamp');
    const lastPatchAt = lastPatchRaw ? parseInt(lastPatchRaw, 10) : 0;
    const newEntries = log.filter((e) => e.loggedAt > lastPatchAt && !e.passed);

    if (newEntries.length < 3) {
      return NextResponse.json({ message: 'Not enough new violations to patch', count: newEntries.length });
    }

    // Collect violation quotes and issues
    const violationSummary = newEntries.flatMap((e) =>
      e.violations.map((v) => `[${e.route} — ${e.context}] "${v.quote}" — ${v.issue}`)
    ).join('\n');

    const prompt = `${PATCH_ANALYST_PROMPT}

Recent violations from AI outputs (${newEntries.length} failed audits, ${newEntries.reduce((s, e) => s + e.violations.length, 0)} violations):

${violationSummary}

Identify patterns — what keeps failing, what the model keeps doing wrong despite the existing rules.

Respond with ONLY valid JSON, no markdown:
{
  "patches": [
    {
      "rule": "the exact rule text to inject into AI prompts — write as a direct instruction, max 25 words",
      "triggeredBy": "max 8 words — what pattern triggered this"
    }
  ]
}`;

    const raw2 = await callClaude({ prompt, maxTokens: 800, model: 'claude-haiku-4-5-20251001' });
    const parsed = parseJSON(raw2) as { patches: Array<{ rule: string; triggeredBy: string }> };

    if (!parsed.patches?.length) {
      return NextResponse.json({ message: 'No new patches generated' });
    }

    // Merge with existing patches, keep last 20
    const existingRaw = await getSetting('editorial_patches');
    const existing: EditorialPatch[] = existingRaw ? JSON.parse(existingRaw) : [];

    const newPatches: EditorialPatch[] = parsed.patches.map((p) => ({
      rule: p.rule,
      triggeredBy: p.triggeredBy,
      addedAt: Date.now(),
    }));

    const merged = [...newPatches, ...existing].slice(0, 20);
    await setSetting('editorial_patches', JSON.stringify(merged));
    await setSetting('editorial_patch_timestamp', String(Date.now()));

    return NextResponse.json({
      message: `Generated ${newPatches.length} new patch rule${newPatches.length !== 1 ? 's' : ''}`,
      patches: newPatches,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Patch generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

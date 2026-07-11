import { NextResponse } from 'next/server';
import { getAllItems, updateItem } from '@/lib/db';
import { callClaude, parseJSON } from '@/lib/claude';

// ---------------------------------------------------------------------------
// Background enrichment — items added before the richer tagging schema lack
// visual_notes (pattern scale, sheen, weight/drape, neckline/rise). Each call
// processes a small batch from their stored photos; the client fires this on
// load until nothing remains. Never user-facing, never blocks anything.
// ---------------------------------------------------------------------------

export async function POST() {
  try {
    const items = await getAllItems();
    const pending = items.filter((i) => !i.visual_notes && i.image_data_url?.startsWith('data:'));
    const batch = pending.slice(0, 4);

    await Promise.all(batch.map(async (item) => {
      try {
        const match = /^data:([^;]+);base64,(.*)$/.exec(item.image_data_url);
        if (!match) return;
        const prompt = `Look at this garment photo ("${item.name}", ${item.category}). Respond with ONLY valid JSON, no markdown: {"visualNotes":"max 15 words, comma-separated styling-relevant attributes: pattern scale (large-scale print / small-scale print / no pattern), sheen (matte / subtle sheen / shiny), fabric weight and drape (lightweight-fluid / mid-weight / structured / heavy), plus neckline for tops and dresses or rise for bottoms when visible"}`;
        const raw = await callClaude({ prompt, imageBase64: match[2], mediaType: match[1], maxTokens: 120, model: 'claude-haiku-4-5-20251001', route: 'enrich-tags' });
        const parsed = parseJSON(raw) as { visualNotes?: string };
        if (parsed.visualNotes?.trim()) {
          await updateItem(item.id, { visual_notes: parsed.visualNotes.trim() });
        }
      } catch { /* skip this item, try again next round */ }
    }));

    return NextResponse.json({ processed: batch.length, remaining: Math.max(0, pending.length - batch.length) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Enrichment failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

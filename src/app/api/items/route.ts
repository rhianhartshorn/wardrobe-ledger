import { NextRequest, NextResponse } from 'next/server';
import { getAllItems, insertItem, clearAllItems, setSetting, type ItemRow } from '@/lib/db';
import { generateItemDossierInBackground, updateWardrobeCharacterBriefInBackground } from '@/lib/wardrobe-brain';

function toClient(row: ItemRow) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    pattern: row.pattern,
    formality: row.formality,
    season: row.season,
    material: row.material || undefined,
    fit: row.fit || undefined,
    length: row.length || undefined,
    accessoryType: row.accessory_type || undefined,
    imageFilename: row.image_filename || null,
    imageUrl: row.image_data_url || null,
    addedAt: row.added_at,
    price: row.price,
    wearCount: row.wear_count ?? 0,
    styleNote: row.style_note || undefined,
    visualNotes: row.visual_notes || undefined,
  };
}

export async function GET() {
  try {
    const items = await getAllItems();
    return NextResponse.json(items.map(toClient));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  await Promise.all([
    clearAllItems(),
    setSetting('style_directives', '[]'),
  ]);
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const {
      id, name, category,
      primaryColor = '', secondaryColor = '',
      pattern = '', formality = '', season = '', material = '', fit = '', length = '', accessoryType = '',
      imageDataUrl = '',
      price, visualNotes = '',
    } = body as Record<string, string | number | undefined>;

    if (!id || !name || !category) {
      return NextResponse.json({ error: 'id, name, and category are required' }, { status: 400 });
    }

    const row: ItemRow = {
      id: id as string, name: name as string, category: category as string,
      primary_color: primaryColor as string,
      secondary_color: secondaryColor as string,
      pattern: pattern as string,
      formality: formality as string,
      season: season as string,
      material: (material as string) || undefined,
      fit: (fit as string) || undefined,
      length: (length as string) || undefined,
      accessory_type: (accessoryType as string) || undefined,
      image_filename: '',
      image_data_url: imageDataUrl as string,
      added_at: Date.now(),
      price: price != null ? Number(price) : undefined,
      wear_count: 0,
      visual_notes: (visualNotes as string) || undefined,
    };

    await insertItem(row);

    // Fire-and-forget: give this piece a styling dossier, then refresh the wardrobe character brief
    generateItemDossierInBackground(row).then(() => {
      getAllItems().then((all) => updateWardrobeCharacterBriefInBackground(all)).catch(() => {});
    }).catch(() => {});

    return NextResponse.json(toClient(row), { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

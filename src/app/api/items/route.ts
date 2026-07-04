import { NextRequest, NextResponse } from 'next/server';
import { getAllItems, insertItem, clearAllItems, type ItemRow } from '@/lib/db';

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
    imageFilename: row.image_filename || null,
    imageUrl: row.image_data_url || null,
    addedAt: row.added_at,
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
  await clearAllItems();
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, string>;
    const {
      id, name, category,
      primaryColor = '', secondaryColor = '',
      pattern = '', formality = '', season = '',
      imageDataUrl = '',
    } = body;

    if (!id || !name || !category) {
      return NextResponse.json({ error: 'id, name, and category are required' }, { status: 400 });
    }

    const row: ItemRow = {
      id, name, category,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      pattern, formality, season,
      image_filename: '',
      image_data_url: imageDataUrl,
      added_at: Date.now(),
    };

    await insertItem(row);
    return NextResponse.json(toClient(row), { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

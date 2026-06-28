import { NextRequest, NextResponse } from 'next/server';
import { getAllItems, getItem, insertItem, type ItemRow } from '@/lib/db';

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
  return NextResponse.json(getAllItems().map(toClient));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, string>;
    console.log('[items POST] keys:', Object.keys(body).join(','), 'imageDataUrl length:', (body.imageDataUrl ?? '').length);
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

    insertItem(row);
    return NextResponse.json(toClient(getItem(id)!), { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getItem, deleteItem, deleteImage, incrementWear, updateItem, getAllItems } from '@/lib/db';
import { updateWardrobeCharacterBriefInBackground } from '@/lib/wardrobe-brain';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const item = await getItem(params.id).catch(() => undefined);
  await deleteItem(params.id);
  if (item?.image_filename) await deleteImage(item.image_filename).catch(() => {});
  getAllItems().then((all) => updateWardrobeCharacterBriefInBackground(all)).catch(() => {});
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json() as { action?: string; wear_count?: number };
    const item = await getItem(params.id);
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (body.action === 'log-wear') {
      const newCount = await incrementWear(params.id);
      return NextResponse.json({ wear_count: newCount });
    }

    if (body.action === 'update-fields') {
      const { name, category, primaryColor, secondaryColor, pattern, formality, season, material, fit, length, price } = body as {
        action: string; name?: string; category?: string; primaryColor?: string; secondaryColor?: string;
        pattern?: string; formality?: string; season?: string; material?: string; fit?: string; length?: string; price?: number | null;
      };
      await updateItem(params.id, {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(primaryColor !== undefined && { primary_color: primaryColor }),
        ...(secondaryColor !== undefined && { secondary_color: secondaryColor }),
        ...(pattern !== undefined && { pattern }),
        ...(formality !== undefined && { formality }),
        ...(season !== undefined && { season }),
        ...(material !== undefined && { material: material || undefined }),
        ...(fit !== undefined && { fit: fit || undefined }),
        ...(length !== undefined && { length: length || undefined }),
        ...(price !== undefined && { price: price ?? undefined }),
      });
      const updated = await getItem(params.id);
      if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      getAllItems().then((all) => updateWardrobeCharacterBriefInBackground(all)).catch(() => {});
      return NextResponse.json({
        id: updated.id, name: updated.name, category: updated.category,
        primaryColor: updated.primary_color, secondaryColor: updated.secondary_color,
        pattern: updated.pattern, formality: updated.formality, season: updated.season,
        material: updated.material, fit: updated.fit, length: updated.length,
        price: updated.price, wearCount: updated.wear_count ?? 0,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

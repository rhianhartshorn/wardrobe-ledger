import { NextRequest, NextResponse } from 'next/server';
import { getItem, deleteItem, deleteImage, incrementWear } from '@/lib/db';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const item = await getItem(params.id).catch(() => undefined);
  await deleteItem(params.id);
  if (item?.image_filename) await deleteImage(item.image_filename).catch(() => {});
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

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

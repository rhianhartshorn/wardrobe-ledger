import { NextRequest, NextResponse } from 'next/server';
import { getItem, deleteItem, deleteImage } from '@/lib/db';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const item = await getItem(params.id);
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await deleteItem(params.id);

  if (item.image_filename) {
    await deleteImage(item.image_filename);
  }

  return NextResponse.json({ ok: true });
}

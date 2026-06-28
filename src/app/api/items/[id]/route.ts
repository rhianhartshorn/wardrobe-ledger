import { NextRequest, NextResponse } from 'next/server';
import { getItem, deleteItem, deleteImage } from '@/lib/db';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const item = getItem(params.id);
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  deleteItem(params.id);

  if (item.image_filename) {
    deleteImage(item.image_filename);
  }

  return NextResponse.json({ ok: true });
}

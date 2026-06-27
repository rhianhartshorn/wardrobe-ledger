import { NextRequest, NextResponse } from 'next/server';
import { getItem, deleteItem, UPLOADS_DIR } from '@/lib/db';
import { unlink } from 'fs/promises';
import path from 'path';

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
    const safeName = item.image_filename.replace(/[^a-zA-Z0-9._-]/g, '');
    await unlink(path.join(UPLOADS_DIR, safeName)).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

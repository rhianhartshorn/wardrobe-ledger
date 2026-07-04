import { NextRequest, NextResponse } from 'next/server';
import { getItem, deleteItem, deleteImage } from '@/lib/db';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const item = await getItem(params.id).catch(() => undefined);
  await deleteItem(params.id);
  if (item?.image_filename) await deleteImage(item.image_filename).catch(() => {});
  return NextResponse.json({ ok: true });
}

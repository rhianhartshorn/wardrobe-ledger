import { NextResponse } from 'next/server';
import { clearAllItems, nukeLegacyBlob } from '@/lib/db';

export async function GET() {
  await clearAllItems();
  await nukeLegacyBlob();
  return new NextResponse(
    `<html><body style="font-family:sans-serif;padding:40px;text-align:center">
      <h2>✓ Wardrobe cleared</h2>
      <p>All ghost items and legacy data have been removed.</p>
      <a href="/" style="color:blue">Go back to the app</a>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}

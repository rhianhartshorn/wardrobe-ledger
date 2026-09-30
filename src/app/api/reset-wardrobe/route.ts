import { NextRequest, NextResponse } from 'next/server';
import { clearAllItems, nukeLegacyBlob, setSetting } from '@/lib/db';

// This wipes the ENTIRE wardrobe — every item, every photo, permanently.
// It was previously a plain GET with no confirmation, which is exactly the
// kind of request a browser prefetch, a link-preview crawler, or a bot can
// trigger without a human ever intending to. A GET here now only renders a
// confirmation form; the actual wipe requires a POST with an exact
// confirmation phrase in the body, so nothing can trigger it by accident.
export async function GET() {
  return new NextResponse(
    `<html><body style="font-family:sans-serif;padding:40px;text-align:center;max-width:480px;margin:0 auto">
      <h2>⚠ Permanently clear the wardrobe?</h2>
      <p>This deletes every item and every photo. It cannot be undone.</p>
      <form method="POST">
        <input type="hidden" name="confirm" value="DELETE_MY_WARDROBE" />
        <button type="submit" style="padding:10px 20px;background:#c0392b;color:white;border:none;cursor:pointer">
          Yes, permanently delete everything
        </button>
      </form>
      <p><a href="/" style="color:blue">Cancel — go back to the app</a></p>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}

export async function POST(req: NextRequest) {
  let confirm = '';
  try {
    const contentType = req.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      confirm = ((await req.json()) as { confirm?: string })?.confirm ?? '';
    } else {
      const form = await req.formData();
      confirm = (form.get('confirm') as string) ?? '';
    }
  } catch { /* fall through — missing/invalid body is treated as unconfirmed */ }

  if (confirm !== 'DELETE_MY_WARDROBE') {
    return NextResponse.json({ error: 'Confirmation missing or incorrect — nothing was deleted.' }, { status: 400 });
  }

  await Promise.all([
    clearAllItems(),
    nukeLegacyBlob(),
    setSetting('style_directives', '[]'),
  ]);
  return new NextResponse(
    `<html><body style="font-family:sans-serif;padding:40px;text-align:center">
      <h2>✓ Wardrobe cleared</h2>
      <p>All ghost items and legacy data have been removed.</p>
      <a href="/" style="color:blue">Go back to the app</a>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}

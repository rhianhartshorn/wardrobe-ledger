# The Wardrobe Ledger

Personal wardrobe inventory + AI stylist. Single-user, runs locally.

## Setup

### 1. Install dependencies

```bash
npm install
```

> **Windows note:** `better-sqlite3` ships prebuilt binaries for common Node versions and usually installs without compilation. If it fails, install the [Windows build tools](https://github.com/nodejs/node-gyp#on-windows): `npm install --global windows-build-tools` (run as Administrator), then retry.

### 2. Set your Anthropic API key

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and paste your key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The SQLite database (`wardrobe.db`) and uploaded images (`uploads/`) are created automatically on first run — both are gitignored.

---

## What each route does

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/items` | GET | List all wardrobe items |
| `/api/items` | POST | Save a new item (metadata only; image already saved by /api/tag) |
| `/api/items/[id]` | DELETE | Remove item + delete image file |
| `/api/tag` | POST | Compress+save image, call Claude vision for auto-tags |
| `/api/weather` | GET | Open-Meteo weather (no API key) + Nominatim reverse-geocode |
| `/api/outfit` | POST | Claude (with web_search) generates 3 outfit combos from your wardrobe |
| `/api/mirror` | POST | Claude scores every item 0–10 for in-wardrobe versatility |
| `/api/profile` | GET/POST/DELETE | Manage the optional profile photo |
| `/api/uploads/[filename]` | GET | Serve images stored in `uploads/` |

All Anthropic API calls are server-side only — the key is never sent to the browser.

---

## Deploying to Vercel

> **Important:** This app stores images on the local filesystem and uses SQLite. Both are ephemeral on Vercel's serverless infrastructure. For a persistent Vercel deployment, you'd need to swap in:
> - **Images:** Cloudflare R2, AWS S3, or Vercel Blob
> - **Database:** Turso (libSQL), PlanetScale, or Neon
>
> For local or VPS use the current setup works as-is.

```bash
npm run build    # verify it builds cleanly first
vercel deploy
```

Add `ANTHROPIC_API_KEY` as an environment variable in the Vercel dashboard.

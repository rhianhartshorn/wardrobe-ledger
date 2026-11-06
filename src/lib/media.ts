import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import type { S3Client } from '@aws-sdk/client-s3';

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
const useR2 = !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET);
const LOCAL_DIR = path.join(process.cwd(), '.local-media');

let client: S3Client | null = null;
async function s3(): Promise<S3Client> {
  if (!client) {
    const { S3Client } = await import('@aws-sdk/client-s3');
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID!, secretAccessKey: R2_SECRET_ACCESS_KEY! },
    });
  }
  return client;
}

// A container's local disk is wiped on every redeploy, so photos written there
// in production would vanish — the same silent-loss failure as the original
// app. Refuse instead.
function assertDurable(): void {
  if (!useR2 && process.env.NODE_ENV === 'production' && !process.env.ALLOW_LOCAL_MEDIA) {
    throw new Error('Photo storage (R2) is not configured — refusing to store photos on non-durable disk in production.');
  }
}

const SAFE_KEY = /^[a-zA-Z0-9][a-zA-Z0-9/_.-]*$/;
function checkKey(key: string): void {
  if (!SAFE_KEY.test(key) || key.includes('..')) throw new Error(`Invalid media key: ${key}`);
}

export function mediaUrl(key: string | null | undefined): string | null {
  return key ? `/api/media/${key}` : null;
}

export async function putMedia(key: string, body: Buffer, contentType: string): Promise<void> {
  checkKey(key);
  assertDurable();
  if (useR2) {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    await (await s3()).send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: body, ContentType: contentType }));
    return;
  }
  const file = path.join(LOCAL_DIR, key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, body);
  await fs.writeFile(`${file}.type`, contentType);
}

export async function getMedia(key: string): Promise<{ body: Buffer; contentType: string } | null> {
  checkKey(key);
  if (useR2) {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    try {
      const res = await (await s3()).send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
      const bytes = await res.Body?.transformToByteArray();
      return bytes ? { body: Buffer.from(bytes), contentType: res.ContentType ?? 'application/octet-stream' } : null;
    } catch (err) {
      if ((err as { name?: string }).name === 'NoSuchKey') return null;
      throw err;
    }
  }
  const file = path.join(LOCAL_DIR, key);
  try {
    const [body, contentType] = await Promise.all([fs.readFile(file), fs.readFile(`${file}.type`, 'utf-8').catch(() => 'application/octet-stream')]);
    return { body, contentType };
  } catch {
    return null;
  }
}

export async function deleteMedia(key: string): Promise<void> {
  checkKey(key);
  if (useR2) {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await (await s3()).send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return;
  }
  const file = path.join(LOCAL_DIR, key);
  await Promise.all([fs.rm(file, { force: true }), fs.rm(`${file}.type`, { force: true })]);
}

export async function mediaHealth(): Promise<{ ok: boolean; backend: 'r2' | 'local'; error?: string }> {
  const backend = useR2 ? 'r2' : 'local';
  try {
    assertDurable();
    const key = 'health/probe.txt';
    await putMedia(key, Buffer.from(String(Date.now())), 'text/plain');
    const back = await getMedia(key);
    if (!back) throw new Error('probe written but not readable');
    return { ok: true, backend };
  } catch (err) {
    return { ok: false, backend, error: err instanceof Error ? err.message : String(err) };
  }
}

export function parseDataUrl(dataUrl: string): { mimeType: string; buffer: Buffer } | null {
  const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  if (!m) return null;
  return { mimeType: m[1], buffer: Buffer.from(m[2], 'base64') };
}

export function extFor(mimeType: string): string {
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('webp')) return 'webp';
  return 'jpg';
}

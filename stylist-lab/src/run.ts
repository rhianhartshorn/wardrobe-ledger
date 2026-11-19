import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WARDROBES } from './wardrobes';
import { REQUESTS, resolveRequest } from './requests';
import { runChecks, type CheckFailure } from './checks';
import { judge, type Judgement } from './judge';
import { ENGINES } from './engines';
import { writeReport } from './report';
import type { CallRecord, EngineContext, StylistOutput } from './types';

// Usage (from the stylist-lab folder):
//   npx tsx src/run.ts --engine baseline --wardrobes maya --requests r01,r03 --label smoke
//   npx tsx src/run.ts --engine baseline                     (everything)
//   add --no-judge to skip scoring (cheap dry run)

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

export type CaseResult = {
  wardrobe: string;
  request: string;
  requestText: string;
  output?: StylistOutput;
  engineCalls: CallRecord[];
  checks: CheckFailure[];
  judgement?: Judgement;
  judgeCall?: CallRecord;
  error?: string;
};

async function main() {
  const engineKey = arg('engine') ?? 'baseline';
  const engine = ENGINES[engineKey];
  if (!engine) throw new Error(`Unknown engine "${engineKey}". Options: ${Object.keys(ENGINES).join(', ')}`);
  const wardrobeKeys = (arg('wardrobes') ?? 'all') === 'all' ? Object.keys(WARDROBES) : arg('wardrobes')!.split(',');
  const requestKeys = (arg('requests') ?? 'all') === 'all' ? REQUESTS.map((r) => r.key) : arg('requests')!.split(',');
  const doJudge = !process.argv.includes('--no-judge');
  const label = arg('label') ?? 'run';

  console.log(`Engine: ${engine.name} — ${engine.description}`);
  console.log(`Wardrobes: ${wardrobeKeys.join(', ')} | Requests: ${requestKeys.join(', ')} | Judge: ${doJudge ? 'on' : 'off'}\n`);

  // Wardrobes in parallel; requests within a wardrobe in order, so the
  // cached wardrobe prompt is written once and then read cheaply.
  const results = (await Promise.all(wardrobeKeys.map(async (wKey) => {
    const wardrobe = WARDROBES[wKey];
    if (!wardrobe) throw new Error(`Unknown wardrobe "${wKey}"`);
    const out: CaseResult[] = [];
    for (const rKey of requestKeys) {
      const req = REQUESTS.find((r) => r.key === rKey);
      if (!req) throw new Error(`Unknown request "${rKey}"`);
      const ctx: EngineContext = { wardrobe, request: resolveRequest(req, wardrobe) };
      const result: CaseResult = { wardrobe: wKey, request: rKey, requestText: ctx.request.resolvedText, engineCalls: [], checks: [] };
      try {
        const r = await engine.run(ctx);
        result.output = r.output;
        result.engineCalls = r.calls;
        result.checks = runChecks(r.output, wardrobe);
        if (doJudge) {
          const j = await judge(ctx, r.output);
          result.judgement = j.judgement;
          result.judgeCall = j.call;
        }
      } catch (err) {
        result.error = err instanceof Error ? err.message : String(err);
        const call = (err as { call?: CallRecord }).call;
        if (call) result.engineCalls.push(call);
      }
      const cost = result.engineCalls.reduce((s, c) => s + c.costUsd, 0);
      console.log(`${wKey}/${rKey}: ${result.error ? `ERROR ${result.error}` : `overall ${result.judgement?.overall ?? '-'}/10, ${result.checks.filter((c) => c.severity === 'critical').length} critical check failures, $${cost.toFixed(3)}`}`);
      out.push(result);
    }
    return out;
  }))).flat();

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'results', `${stamp}-${engine.name}-${label}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'results.json'), JSON.stringify({ engine: engine.name, description: engine.description, label, results }, null, 2));
  const summary = writeReport(dir, engine.name, engine.description, results);
  console.log(`\n${summary}\nReport: ${path.join(dir, 'report.md')}`);
}

main().catch((err) => { console.error(err); process.exit(1); });

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WARDROBES } from './wardrobes';
import { REQUESTS, resolveRequest } from './requests';
import { runChecks, type CheckFailure } from './checks';
import { judge, JUDGE_VERSION, type Judgement } from './judge';
import { ENGINES } from './engines';
import { writeReport } from './report';
import type { CallRecord, EngineContext, StylistOutput } from './types';

// Usage (from the stylist-lab folder):
//   npx tsx src/run.ts --engine baseline --wardrobes maya --requests r01,r03 --label smoke
//   npx tsx src/run.ts --engine baseline                       (everything)
//   npx tsx src/run.ts --rejudge results/<folder>              (re-score saved outputs with the current judge)
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
  trace?: unknown; // engine-specific intermediate steps, for diagnosis
};

const RESULTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'results');

function ctxFor(wKey: string, rKey: string): EngineContext {
  const wardrobe = WARDROBES[wKey];
  const req = REQUESTS.find((r) => r.key === rKey);
  if (!wardrobe || !req) throw new Error(`Unknown case ${wKey}/${rKey}`);
  return { wardrobe, request: resolveRequest(req, wardrobe) };
}

async function score(result: CaseResult, ctx: EngineContext): Promise<void> {
  result.checks = runChecks(result.output!, ctx.wardrobe);
  const j = await judge(ctx, result.output!);
  result.judgement = j.judgement;
  result.judgeCall = j.call;
}

function logCase(r: CaseResult) {
  const cost = r.engineCalls.reduce((s, c) => s + c.costUsd, 0);
  console.log(`${r.wardrobe}/${r.request}: ${r.error ? `ERROR ${r.error}` : `overall ${r.judgement?.overall ?? '-'}/10, ${r.checks.filter((c) => c.severity === 'critical').length} critical check failures, $${cost.toFixed(3)}`}`);
}

async function runEngine(): Promise<{ name: string; description: string; label: string; results: CaseResult[] }> {
  const engineKey = arg('engine') ?? 'baseline';
  const engine = ENGINES[engineKey];
  if (!engine) throw new Error(`Unknown engine "${engineKey}". Options: ${Object.keys(ENGINES).join(', ')}`);
  const wardrobeKeys = (arg('wardrobes') ?? 'all') === 'all' ? Object.keys(WARDROBES) : arg('wardrobes')!.split(',');
  const requestKeys = (arg('requests') ?? 'all') === 'all' ? REQUESTS.map((r) => r.key) : arg('requests')!.split(',');
  const doJudge = !process.argv.includes('--no-judge');

  console.log(`Engine: ${engine.name} — ${engine.description}`);
  console.log(`Wardrobes: ${wardrobeKeys.join(', ')} | Requests: ${requestKeys.join(', ')} | Judge: ${doJudge ? JUDGE_VERSION : 'off'}\n`);

  // Wardrobes in parallel; requests within a wardrobe in order, so the
  // cached wardrobe prompt is written once and then read cheaply.
  const results = (await Promise.all(wardrobeKeys.map(async (wKey) => {
    const out: CaseResult[] = [];
    for (const rKey of requestKeys) {
      const ctx = ctxFor(wKey, rKey);
      const result: CaseResult = { wardrobe: wKey, request: rKey, requestText: ctx.request.resolvedText, engineCalls: [], checks: [] };
      try {
        const r = await engine.run(ctx);
        result.output = r.output;
        result.engineCalls = r.calls;
        result.trace = r.trace;
        if (doJudge) await score(result, ctx);
        else result.checks = runChecks(r.output, ctx.wardrobe);
      } catch (err) {
        result.error = err instanceof Error ? err.message : String(err);
        const call = (err as { call?: CallRecord }).call;
        if (call) result.engineCalls.push(call);
      }
      logCase(result);
      out.push(result);
    }
    return out;
  }))).flat();
  return { name: engine.name, description: engine.description, label: arg('label') ?? 'run', results };
}

async function rejudge(source: string): Promise<{ name: string; description: string; label: string; results: CaseResult[] }> {
  const saved = JSON.parse(fs.readFileSync(path.resolve(source, 'results.json'), 'utf-8')) as {
    engine: string; description: string; results: CaseResult[];
  };
  console.log(`Re-scoring ${saved.results.length} saved cases from ${saved.engine} with judge ${JUDGE_VERSION}\n`);
  const byWardrobe = new Map<string, CaseResult[]>();
  for (const r of saved.results) byWardrobe.set(r.wardrobe, [...(byWardrobe.get(r.wardrobe) ?? []), r]);
  const results = (await Promise.all(Array.from(byWardrobe.values()).map(async (cases) => {
    const out: CaseResult[] = [];
    for (const old of cases) {
      const result: CaseResult = { ...old, checks: [], judgement: undefined, judgeCall: undefined };
      if (result.output && !result.error) {
        try { await score(result, ctxFor(result.wardrobe, result.request)); }
        catch (err) { result.error = `judge: ${err instanceof Error ? err.message : String(err)}`; }
      }
      logCase(result);
      out.push(result);
    }
    return out;
  }))).flat();
  return { name: saved.engine, description: saved.description, label: 'rejudged', results };
}

async function main() {
  const source = arg('rejudge');
  const run = source ? await rejudge(source) : await runEngine();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dir = path.join(RESULTS_DIR, `${stamp}-${run.name}-${run.label}-judge${JUDGE_VERSION}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'results.json'), JSON.stringify({ engine: run.name, description: run.description, label: run.label, judgeVersion: JUDGE_VERSION, results: run.results }, null, 2));
  const summary = writeReport(dir, run.name, `${run.description} Judge ${JUDGE_VERSION}.`, run.results);
  console.log(`\n${summary}\nReport: ${path.join(dir, 'report.md')}`);
}

main().catch((err) => { console.error(err); process.exit(1); });

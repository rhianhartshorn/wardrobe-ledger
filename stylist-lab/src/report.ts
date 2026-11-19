import fs from 'fs';
import path from 'path';
import { WARDROBES } from './wardrobes';
import { JUDGE_FAILURES } from './judge';
import type { CaseResult } from './run';

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const f1 = (n: number) => (isNaN(n) ? '–' : n.toFixed(1));
const money = (n: number) => `$${n.toFixed(3)}`;

export function writeReport(dir: string, engineName: string, description: string, results: CaseResult[]): string {
  const ok = results.filter((r) => r.output);
  const judged = ok.filter((r) => r.judgement);
  const looks = judged.flatMap((r) => r.judgement!.looks);

  const engineCost = results.flatMap((r) => r.engineCalls).reduce((s, c) => s + c.costUsd, 0);
  const judgeCost = results.reduce((s, r) => s + (r.judgeCall?.costUsd ?? 0), 0);
  const latency = avg(ok.map((r) => r.engineCalls.reduce((s, c) => s + c.latencyMs, 0)));
  const calls = avg(ok.map((r) => r.engineCalls.length));

  const totalLooks = ok.reduce((s, r) => s + r.output!.looks.length, 0);
  const codeCritical = ok.flatMap((r) => r.checks.filter((c) => c.severity === 'critical'));
  const judgeCritical = looks.flatMap((l) => l.failures.filter((f) => JUDGE_FAILURES[f.code] === 'critical'));
  const looksWithCritical = ok.reduce((s, r) => {
    const fromChecks = new Set(r.checks.filter((c) => c.severity === 'critical' && c.look).map((c) => c.look));
    r.judgement?.looks.forEach((l) => { if (l.failures.some((f) => JUDGE_FAILURES[f.code] === 'critical')) fromChecks.add(l.look); });
    return s + fromChecks.size;
  }, 0);

  const failureCounts = new Map<string, number>();
  for (const c of ok.flatMap((r) => r.checks)) failureCounts.set(c.code, (failureCounts.get(c.code) ?? 0) + 1);
  for (const f of looks.flatMap((l) => l.failures)) failureCounts.set(f.code, (failureCounts.get(f.code) ?? 0) + 1);

  const dim = (k: 'answersBrief' | 'feelsLikeClient' | 'visuallyResolved' | 'hasIdea' | 'finished' | 'explanation') => f1(avg(looks.map((l) => l[k])));
  const overall = avg(judged.map((r) => r.judgement!.overall));
  const signOff = looks.length ? (looks.filter((l) => l.stylistWouldSignOff).length / looks.length) * 100 : NaN;

  const summary = [
    `Overall ${f1(overall)}/10 | sign-off ${f1(signOff)}% of looks | looks with a critical failure: ${looksWithCritical}/${totalLooks}`,
    `Engine cost ${money(engineCost)} total, ${money(engineCost / Math.max(ok.length, 1))}/request | avg ${f1(calls)} calls, ${f1(latency / 1000)}s | judge cost ${money(judgeCost)} | errors ${results.length - ok.length}`,
  ].join('\n');

  const lines: string[] = [];
  lines.push(`# ${engineName}`, '', description, '', '## Scorecard', '');
  lines.push('| Metric | Value |', '|---|---|');
  lines.push(`| Overall (1–10) | **${f1(overall)}** |`);
  lines.push(`| Stylist would sign off | ${f1(signOff)}% of looks |`);
  lines.push(`| Looks with a critical failure | ${looksWithCritical} of ${totalLooks} |`);
  lines.push(`| Critical failures (code checks / judge) | ${codeCritical.length} / ${judgeCritical.length} |`);
  lines.push(`| Answers the brief | ${dim('answersBrief')} |`);
  lines.push(`| Feels like the client | ${dim('feelsLikeClient')} |`);
  lines.push(`| Visually resolved | ${dim('visuallyResolved')} |`);
  lines.push(`| Has an idea | ${dim('hasIdea')} |`);
  lines.push(`| Finished | ${dim('finished')} |`);
  lines.push(`| Explanation | ${dim('explanation')} |`);
  lines.push(`| Uses the wardrobe's best | ${f1(avg(judged.map((r) => r.judgement!.usesWardrobesBest)))} |`);
  lines.push(`| Range across the three looks | ${f1(avg(judged.map((r) => r.judgement!.range)))} |`);
  lines.push(`| Cost per request (engine) | ${money(engineCost / Math.max(ok.length, 1))} |`);
  lines.push(`| Model calls per request | ${f1(calls)} |`);
  lines.push(`| Response time | ${f1(latency / 1000)}s |`);
  lines.push(`| Judge cost (whole run) | ${money(judgeCost)} |`);
  lines.push(`| Errors | ${results.length - ok.length} |`, '');

  lines.push('## By wardrobe', '', '| Wardrobe | Overall | Sign-off | Wardrobe\'s best |', '|---|---|---|---|');
  for (const wKey of Array.from(new Set(results.map((r) => r.wardrobe)))) {
    const rs = judged.filter((r) => r.wardrobe === wKey);
    const ls = rs.flatMap((r) => r.judgement!.looks);
    lines.push(`| ${WARDROBES[wKey].label} | ${f1(avg(rs.map((r) => r.judgement!.overall)))} | ${f1(ls.length ? (ls.filter((l) => l.stylistWouldSignOff).length / ls.length) * 100 : NaN)}% | ${f1(avg(rs.map((r) => r.judgement!.usesWardrobesBest)))} |`);
  }
  lines.push('');

  lines.push('## Most common failures', '', '| Failure | Count |', '|---|---|');
  for (const [code, n] of Array.from(failureCounts.entries()).sort((a, b) => b[1] - a[1])) lines.push(`| ${code} | ${n} |`);
  lines.push('');

  lines.push('## Every case', '');
  for (const r of results) {
    const w = WARDROBES[r.wardrobe];
    const name = (id: string) => w.items.find((i) => i.id === id)?.name ?? `${id} (not owned)`;
    lines.push(`### ${w.client.name} — ${r.request}: "${r.requestText}"`, '');
    if (r.error) { lines.push(`**Error:** ${r.error}`, ''); continue; }
    if (r.judgement) lines.push(`**Overall ${r.judgement.overall}/10.** ${r.judgement.summary}`, '');
    r.output!.looks.forEach((l, idx) => {
      const j = r.judgement?.looks.find((x) => x.look === idx + 1);
      lines.push(`**Look ${idx + 1}: ${l.title}** — ${l.idea}`);
      lines.push(`- Pieces: ${l.itemIds.map(name).join(' · ')}`);
      lines.push(`- How to wear: ${l.howToWear}`);
      if (j) {
        lines.push(`- Judge: brief ${j.answersBrief}, like-client ${j.feelsLikeClient}, resolved ${j.visuallyResolved}, idea ${j.hasIdea}, finished ${j.finished}, explanation ${j.explanation} · sign-off: ${j.stylistWouldSignOff ? 'yes' : 'no'}`);
        lines.push(`- ${j.comment}`);
        if (j.failures.length) lines.push(`- Failures: ${j.failures.map((f) => `${f.code} (${f.detail})`).join('; ')}`);
      }
      const checks = r.checks.filter((c) => c.look === idx + 1);
      if (checks.length) lines.push(`- Code checks: ${checks.map((c) => `${c.code} — ${c.detail}`).join('; ')}`);
      lines.push('');
    });
    if (r.output!.note) lines.push(`_Stylist's note: ${r.output!.note}_`, '');
    if (r.judgement && r.judgement.missedOpportunity.toLowerCase() !== 'none') lines.push(`**Missed opportunity:** ${r.judgement.missedOpportunity}`, '');
  }

  fs.writeFileSync(path.join(dir, 'report.md'), lines.join('\n'));
  return summary;
}

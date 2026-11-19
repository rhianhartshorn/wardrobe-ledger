# Stylist Lab

A standalone test bench for building a stylist that gives genuinely excellent outfit advice, kept separate from the app until it's proven.

## What's here

- `src/wardrobes/` — four invented clients with full wardrobes, profiles, Style DNA, directives and history:
  - **Maya:** expressive and print-led, in London.
  - **Daniel:** tailored menswear, cycling in Copenhagen.
  - **Sarah:** basics-heavy, in Sydney in late spring.
  - **Lena:** 15 pieces, a student in Berlin.
- `src/requests.ts` — 10 fixed requests: everyday, occasion, "surprise me", rain, date, weekend, high-stakes, wedding, a focus piece and travel. The season is worked out from each client's hemisphere.
- `src/engines/` — the stylists being tested. `baseline` is one well-written prompt in one call: the bar every more complex engine has to beat.
- `src/checks.ts` — free code checks for hard failures: an item the client doesn't own, no shoes, a layer with nothing under it, repeated looks, the same anchor twice.
- `src/judge.ts` — a scoring model (Claude Opus 5.5, high effort) applying the written rubric and failure list. It also names the best look the stylist missed.
- `results/` — one folder per run, each with `report.md` (the scorecard plus every look written out) and `results.json`.

## Running it (from this folder)

```
npx tsx src/run.ts --engine baseline --wardrobes maya,lena --requests r03,r08 --label smoke
npx tsx src/run.ts --engine baseline --label full        # all 4 wardrobes × 10 requests
npx tsx src/run.ts --engine baseline --no-judge          # outputs only, no scoring cost
```

It uses `ANTHROPIC_API_KEY` from the app's `.env.local`. Every run costs money, and the report shows engine and judge cost separately.

## Caveat

The judge hasn't yet been calibrated against real stylist expertise; that comes from the Style Knowledge base (`docs/REBUILD_PLAN.md` §5.3). Until then, use its scores to compare engines with each other, not as an absolute verdict.

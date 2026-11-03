# The Wardrobe Ledger — Rebuild Plan

**Status:** draft for approval. No code is written against this plan until it's approved.
**Date:** 2026-11-03

---

## 1. Why a rebuild and not more patches

- **Quality has stopped moving.** Five rounds of fixes on wardrobe repetition took the maximisation score from 3.0 to 4.0/10. The same engine scores 7–8.5 on test wardrobes. Each fix added a rule, a retry or another layer, and none of them changed the structure.
- **Cost is structural.** A single "what should I wear" message triggers 10–14 model calls (1–2 of them on Opus) and sends a photo of the whole wardrobe every time.
- **Storage lost everything.** The only copy of the wardrobe lived in a free-tier cache, with photos stored as text and no backups. The database was deleted, and every item went with it.
- **The timing is right.** There's no live data left to migrate, so we don't need to stay compatible with the old format.

Two layers get rebuilt: **storage** and the **styling engine**. The UI shell, the client-knowledge ideas and the style vocabulary are kept.

---

## 2. Product scope for v1

The core loop: **build the closet → find what to wear → give feedback → the stylist learns → Style DNA sharpens.**

| Keep in v1 | Notes |
|---|---|
| Closet: add (including bulk), edit, browse | One combined photo-analysis call per item. Low-confidence tags are highlighted for one-tap correction. |
| **"Dress for…" occasion browser** | The home screen. Pick a common occasion (workday, weekend brunch, cycling and a day out…) and see 6–9 looks for it in the **current season, worked out from where you are**. Starter occasions come from the lifestyle profile, and you can add your own. Looks are prepared in advance (§4), so browsing makes no AI calls. |
| **Today** | Today's pick from the right occasion pool, adjusted for the real weather. Tapped, not automatic. |
| **Stylist chat** | For anything specific or unusual |
| Edit a look | Quick buttons on any look ("bolder", "more relaxed", "warmer", "swap the shoes") make one cheap call that edits it, instead of regenerating from scratch |
| Looks + one-tap feedback | "Wore it", "Saved", "Not for me" (with a reason) on every outfit card |
| Style DNA (Read My Style) + **taste board** | Style DNA reads both what you own **and** looks you love: images you save or upload, the "never" list, what you want to feel like. Your closet records past purchases; the taste board records who you want to be. |
| Inputs: colour analysis, body profile, lifestyle profile | Kept as they are, fed into one shared client profile |
| Admin: cost, coverage, quality, knowledge freshness, recommendation traces | Made possible by the new data model |

| Parked (rebuilt on the new engine later, or dropped if nobody misses them) |
|---|
| Virtual try-on, outfit inspiration images, "similar looks online", fashion currency, style goals, gap audit, learn-more, image strategy, item style. The **combinations grid** is replaced by the occasion browser. |

| Later (after v1 is proven) |
|---|
| Look boards (garment photos composed into one image, backgrounds removed); "this or that" choices between two looks to learn taste; optional mirror selfies when logging a wear, to learn fit on the body; a week-ahead plan that varies across days (**not linked to a calendar**); trip packing; purchase vetting. |

| Deleted (unused by the UI or redundant) |
|---|
| `mirror`, `outfit-feedback`, legacy `style`, `upload`, `editorial-review`/`editorial-patch`/`editorial-patch-list`, `debug-env` (it publicly reveals which secrets are set) |

**Onboarding:** the app should be useful from **8–10 items**, not 80. Bulk add is a first-class feature.

---

## 3. Storage and data model

**Recommendation:** Postgres (Railway) for data, plus object storage for photos (Cloudflare R2, or a Railway volume if we want to avoid a new account). Photos are stored as files and referenced by URL. Each item has a ~300px thumbnail for lists, with full-size images loaded only on demand.

Postgres replaces the individual Redis counters because the analytics we need are queries over tables. Pair repetition, coverage and "surfaced but never chosen" all become `SELECT`s.

```
items             id, name, category, created_at, image_url, thumb_url,
                  attributes jsonb   -- each field {value, confidence}:
                                     --   colour, pattern, material, fit, length,
                                     --   formality, season, sheen, drape, weight,
                                     --   print_scale, neckline/rise, structure
                  salience jsonb     -- 0–3: visual_salience, pattern_intensity,
                                     --   colour_intensity, pairing_flexibility,
                                     --   styling_difficulty, identity_strength
item_roles        item_id, role, source, updated_at
                  -- evolving: workhorse / statement / identity-anchor /
                  --   underused-promising / occasion-specific
                  -- kept separate from stable visual facts
recommendations   id, created_at, request_text, request_tier, slot_role
                  (best | fresh | discovery), item_ids[], anchor_item_id,
                  model_used, outcome (shown | saved | worn | worked |
                  didnt_work | dismissed), outcome_at
wear_log          id, date, item_ids[], recommendation_id nullable
looks             id, title, item_ids[], feedback, created_at
client_profile    singleton jsonb: style_dna (operational lens), colour_brief,
                  body, lifestyle, wardrobe_character, directives, updated_at
usage_log         ts, route, model, input/output/cached tokens, cost
style_knowledge   id, layer (craft | currency), type, source_url, author,
                  published_at, ingested_at, weight, retired_at,
                  occasion, season, region, aesthetic, record jsonb,
                  embedding (for relevance retrieval), held_out bool
                  -- living: weekly refresh + lookups append to it;
                  -- currency weight decays with age (see §5.3)
item_pairs        item_a, item_b, compatibility (0–1), reason, scored_at
                  -- scored once when an item is added (~80 pairs, batched)
occasions         id, name, code (formality, practical rules), source
                  (lifestyle | user | default), sort_order
outfit_pool       id, occasion_id, season, item_ids[], idea, scores jsonb,
                  built_at, engine_version, stale bool
                  -- prepared overnight; marked stale when the wardrobe,
                  -- season, knowledge or feedback changes
taste_board       id, image_url, source_url, note, extracted jsonb, added_at
traces            recommendation_id, engine_version, inputs jsonb,
                  candidates jsonb, scores jsonb, chosen jsonb, reasons jsonb
                  -- the "flight recorder": replay any look on a new engine
```

**Safety:** a nightly JSON export, a "Download my wardrobe" button, a `/api/health` endpoint shown in admin, and every destructive endpoint gated behind POST plus confirmation.

---

## 4. The styling engine

**Do the hard work ahead of time.** Most of the expensive thinking doesn't need to happen while you wait:
- **The outfit graph.** When an item is added, its compatibility with every other piece is scored once, cheaply and in batch. That's about 80 pairs per new item, not a full rerun.
- **Occasion pools.** Overnight, the full pipeline below builds 6–9 strong looks for each of your occasions in the current season, using discounted batch processing. Only pools marked stale (because the wardrobe, season, knowledge or feedback changed) get rebuilt, and the number rebuilt per night is capped.
- **Live requests mostly pick from vetted candidates.** Browsing occasions makes no AI calls. Today's pick is a pool look adjusted for the weather. Chat requests start from the graph and the pools, so the live pipeline does less inventing and more tailoring.

**One pipeline for every outfit request** (overnight pools, chat, and later the parked features):

```
ROUTE ──► RETRIEVE ──► GENERATE ──► FILTER ──► CRITIQUE ──► SELECT & EXPLAIN
 code       code       1 call        code      1 call        1 call
                       (cheap)                (cheap; vision   (Sonnet; Opus
                                               only if risky)   on escalation)
```

**Route (code).** Assign the request a tier:
- **Tier 0:** no AI. Browse, filter, history, coverage, **occasion pools**.
- **Tier 1:** one cheap call. Simple pairing ("which shoes?"), explaining a look, **editing a look** ("bolder", "swap the shoes").
- **Tier 2:** the standard pipeline above. The target is 3 calls.
- **Tier 3:** deep work: wedding, capsule, Style DNA rebuild, wardrobe strategy.

UI intents (buttons) set the tier directly. Free text falls back to the existing keyword classification.

**Retrieve (code, no AI).** Hard filters first: formality, season, weather, comfort constraints and the occasion's practical rules (no long hems for cycling, for example). Then the score:
`relevance + style-DNA and taste-board fit + pair compatibility (outfit graph) + proven success − exposure penalty − pair-repetition penalty − recent-wear penalty + exploration bonus`.

**Season comes from place, not just the date.** The season is worked out from hemisphere and local climate, with today's real weather layered on top. A warm October day in London still gets autumn looks, adjusted for the heat.
This produces three pools (best, fresh and discovery), roughly 10–20 pieces in total. **Footwear and owned accessories are always included** as their own candidate sets. The weights live in one config file so they're easy to tune.

**Generate (one cheap call).** Produce 8–10 candidate outfits as item IDs only: several that are very characteristic of the client, several more adventurous ones, several built on less-exposed pieces, and one or two wildcards. This step is for exploration, not polished writing.

**Filter (code).** Every look must be complete, **including shoes**. Only owned items may appear. Drop duplicates, recently repeated pairs and anything that breaks the client's directives.

**Critique (one cheap call, text by default).** Score each candidate on fit to the request, whether it feels specifically like *this* client (against Style DNA), visual coherence and freshness. Real photos are sent **only** when there's a trigger: two or more patterns, a difficult colour relationship, low-confidence attributes, an explicit "does this work?", or a Tier 3 request.

**Select & explain (Sonnet).** Choose the best 3 looks, one per slot role. It may swap one item if that materially improves a look. It must not average looks into a safe compromise. It writes the explanation, names a specific styling technique and picks accessories **from the wardrobe by item ID**.
- **Escalate to Opus only** when candidate scores are too close to call, the critic flags real problems, the request is Tier 3, the client rejected the previous answer, or the client asks for depth.
- Every escalation is logged so we can check whether it helped.

**What the six personas become.** Three functions:
- **Styling Director:** taste, identity, generation, the final call.
- **Visual Critic:** silhouette, proportion, colour, pattern, texture.
- **Life Editor:** occasion, weather, work culture, practicality.

The "styling team" can stay as product presentation. Wardrobe Intelligence becomes stored client state rather than a fresh call every request. Fit and colour become scoring dimensions rather than separate calls.

**Prompt policy:**
- **One client-profile builder** used by every route. Today about 16 routes each assemble their own context.
- **One compact operating policy:** the evidence hierarchy, consequence-based reasoning and the voice rules.
- **No universal aesthetic lens.** Reference points come from the client's Style DNA.
- **Rules only for what code can't enforce.** Variety, coverage, completeness and repetition all move into code.
- **No absolute fashion rules** ("zero exceptions"). Prompts describe what a choice does visually instead.
- **Persona biographies cut** down to their methods.
- **Editorial self-patches** get a cap, deduplication, an expiry date and admin review.

**Ingestion.** One vision call per photo returns tags, photo quality, the visual attributes **with confidence** and the salience scores. That replaces today's separate `tag` and `assess-photo` calls. Low-confidence fields are shown to the client for a one-tap correction, so a bad early tag never becomes permanent styling "fact". The interpretive style note becomes an evolving role, separate from the stable visual facts.

**The flight recorder.** Every recommendation stores its full trace: inputs, candidates, scores, what was chosen, why, and the engine version. When a look is bad we can see which stage failed, and any past request can be replayed on a new engine version. That makes every quality claim checkable.

**Quality built into the engine, not only tested for afterwards:**
- **The select step follows a real stylist's process:** brief → client → *the idea of the look* → anchor piece → build around it → finish (shoes, layer, accessory, one styling move) → check proportion, colour and pattern → explain.
- **Every look names its idea in one line** (for example, "the navy floral trouser worn like a suit"). If it can't name one, it isn't ready to show.
- **The critic checks the named failure list in §5.2** item by item, instead of a general "is this good?".
- **Current, relevant inspiration from the living Style Knowledge base (§5.3):** the generator and critic see the freshest real stylist and editor examples for this occasion, season, place and aesthetic, weighted toward the client's own lens. They're told to reinterpret them, not copy them. This is how the stylist learns the professional bar, and stays current, without fine-tuning.
- **Feedback changes the engine:** "Not for me" reasons, edits ("bolder" is a signal too) and wear/save outcomes feed retrieval scores, the outfit graph and Style DNA.
- **Coverage is a diagnostic, not a target.** A good stylist doesn't try to use every piece; they find the best look for *her*, for *this*. Coverage and repetition metrics exist to catch the engine converging on the same pieces, never to force pieces into looks. The old judge's "five pieces sat unused" complaint held a single answer to an unrealistic bar.

---

## 5. Quality: what "stylist-grade" means and how we prove it

Outfit quality is the number one priority. Until now every quality number came from one AI model grading another, and that judge was never checked against real human expertise. We don't have hired stylists, so the ground truth comes from **curated, continuously refreshed public stylist and editor expertise** (the Style Knowledge base) plus **you, as the client**. The AI judge is only trusted where it agrees with that expertise.

**Why not fine-tune?** Fine-tuning isn't a practical option for the models this app uses, and the models already know a great deal of public styling advice. The gap is that the pipeline steers toward safe, committee outputs. The knowledge base fixes that in two ways: current, real examples set the bar inside each request, and real expert verdicts become the benchmark. It also keeps the stylist current, which no amount of fine-tuning on a fixed date would.

### 5.1 The standard — the stylist's rubric

Every look is scored 1–5 on each dimension:

1. **Answers the brief.** The right register for the occasion, the weather, and real life (can she walk, sit, commute in it?).
2. **Feels like her.** Specific to this client's Style DNA, body and colouring, not a generic well-dressed person.
3. **Uses the wardrobe's best.** It reaches for the strongest pieces for this brief, including ones she under-uses, rather than settling for safe.
4. **Visually resolved.** Proportion, colour relationships, pattern scale, texture and visual weight work as one look.
5. **Has an idea.** A point of view you could name in a line, not just "these go together".
6. **Finished.** Shoes, the right layer, accessories from her wardrobe, and one specific styling move (a tuck, cuff, roll or knot).
7. **The three looks are a real range.** Different anchors, different moods, each with a clear job.
8. **The explanation earns trust.** Concrete visual reasons, something learned, no filler.

Plus two yes/no verdicts:
- **The client:** "Would you wear this?"
- **A professional (the calibrated critic):** "Would a stylist sign this off for a paying client?"

### 5.2 Failure list

Every failure that you or the critic tags becomes a test (§5.4).

| Severity | Failures |
|---|---|
| **Critical** (must be zero) | An item the client doesn't own; an incomplete look (no shoes, or a layer with no base); wrong register for the occasion; breaks a client directive (e.g. "arms covered"); wrong for the weather; the same look repeated within one conversation |
| **Major** | A safe default while stronger options sat unused; the same anchor across looks; a statement piece smothered; a pattern or colour clash with no logic; flattened toward minimalism against her Style DNA; costume-y or trying too hard; generic accessory advice |
| **Minor** | No real styling technique; a vague explanation or banned words; looks too similar to each other |

### 5.3 Ground truth: a living Style Knowledge base

This is **not** a static library. Style changes over time, and it differs by occasion, climate, culture and person. The model's own sense of "current" is frozen at its training date, so this layer is what keeps the stylist up to date. It has to keep learning.

**Two layers that age differently:**

| Layer | What it holds | How it ages |
|---|---|---|
| **Craft** | What proportion, colour, pattern-mixing, texture and silhouette choices *do* visually, with worked examples | Slowly. Revisited, but rarely retired. |
| **Currency** | What reads as current *now*: this season's silhouettes, how a trend piece is actually being worn, what's tired, the codes for specific occasions and places | Fast. Every record is dated and loses weight as it ages; superseded records are retired. |

**Each record** is short, structured, in our own words, and linked to its source:

```
{ layer: craft | currency, source_url, author_or_publication,
  type: editorial | how-to | critique | occasion-code,
  published_at, ingested_at, expires_or_decays,
  hero_piece, other_pieces, occasion, climate_or_season, region_or_culture,
  aesthetic, body_or_context_notes,
  the_idea, styling_moves, reasoning,
  verdict + issues (critiques only) }
```

**How it stays alive:**

1. **A weekly refresh.** A scheduled job searches current stylist, editor and street-style coverage across a rotating set of aesthetics, occasions and seasons. It turns what it finds into new currency records, and retires or down-weights ones that newer coverage contradicts. This uses a cheap model and is capped per week.
2. **Lookups when the knowledge is thin.** When a request hits an occasion, place or aesthetic the knowledge base covers poorly (a Diwali wedding, Ascot, a rainy-city ski trip), the stylist runs a live search at request time. It uses the result for that request and saves it as a new record, so coverage grows exactly where clients need it. This is limited to Tier 3 requests or a detected coverage gap, and the result is cached.
3. **Staleness alarms.** Admin shows coverage and freshness by occasion, aesthetic and season, and flags any area whose newest currency record is too old.
4. **The client is the most dynamic layer.** Her feedback, her evolving roles for each piece, and her Style DNA (re-read as her wardrobe and wear history change) decide which records even apply to her. A minimalist and a maximalist asking about the same occasion get different references.

**Curation rules:**
- **Prefer named professionals,** and high-agreement community answers.
- **Cover many aesthetics, occasions, climates, cultures and body types,** and check that coverage on every refresh so no single taste dominates.
- **Paraphrase rather than copy.** Respect each site's terms, and never copy articles into the app.
- **Hold a dated portion out** for testing only.

**How it's used:**

1. **Inspiration, not templates.** The generator and critic see the 3–5 most relevant records, chosen by occasion, season, place, aesthetic and freshness and weighted toward this client's lens. They're told explicitly to *reinterpret* these for the client's own wardrobe, and they're free to depart from them when the client or the brief calls for it. The records set the bar; they never dictate the answer, and they always describe *other* people's wardrobes.
2. **Critique agreement (judge calibration).** For held-out expert critiques, our critic judges the same described outfit blind. It's trusted only where it matches the expert: **the same verdict in ≥ 80% of cases, and the same main issue named in ≥ 70%.** Any dimension where it disagrees gets fixed, or stops being relied on.
3. **Same-piece challenges.** For held-out editorial "N ways to wear X" pieces, a test wardrobe is built around that hero piece. The engine's looks are compared against the editor's on the rubric, judged by the calibrated critic, with a sample checked by you.

**You, as the client.** Blind review rounds on your real wardrobe, with photos, are the final word on "would I wear this?". The knowledge base measures craft and currency; you measure fit for you.

### 5.4 Pressure tests (automated, run on every engine change)

**The test wardrobes** (committed to the repo, text-only so runs are cheap):
- **Expressive:** about 75 items, modelled on the lost real wardrobe.
- **Basics-heavy:** about 60 items.
- **Small:** 15 items.
- **Tailored/menswear-leaning:** about 50 items.

The suites:
- **Reference set.** 4 wardrobes × 10 fixed requests: everyday, occasion, "surprise me", weather-constrained and follow-up.
- **Hard wardrobes.** Only basics, only prints, mixed formality with gaps (no formal shoes), one colour family, very trend-heavy.
- **Hard briefs:**
  - black tie with no gown
  - an outdoor wedding in the rain
  - a funeral
  - a creative-industry interview
  - "make my boring wardrobe exciting"
  - "cold but want to look sharp"
  - conflicting constraints (arms covered in a heatwave)
  - only one suitable piece exists: it must say so rather than force variety
  - the client mentions an item that isn't in the wardrobe
- **Conversation.** "Not that, bolder", "I hate florals", "something I haven't worn": does the next answer actually change?
- **Repetition stress.** 30 everyday requests in a row on the expressive wardrobe. We measure anchor diversity, the share of the wardrobe surfaced, and the most any single item or pair is reused.
- **Consistency.** The same brief 5 times. Quality should stay tight while the looks themselves differ.
- **Critique agreement and same-piece challenges** (§5.3), on held-out records.
- **Currency.** On briefs tied to the current season, are the looks consistent with the *freshest* currency records, or with ones that have since been retired? This test flags any look that leans on an outdated trend.
- **Occasion range.** Briefs from a rotating set of occasions, places and cultures. Thin coverage should trigger a lookup, and the stylist should say when it's working from limited knowledge rather than bluff.
- **Occasion pools.** For each test wardrobe and a standard set of occasions (workday, weekend brunch, cycling and a day out, dinner, travel day), the overnight pool must pass every gate. Practical rules must hold: a cycling look with a long hem or heels is a critical failure.
- **Season by place.** The same date tested in London, Sydney and Singapore must produce autumn, spring and hot/wet-season looks respectively, with today's real weather overriding when it's unseasonal.
- **Edits.** "Bolder", "more relaxed", "warmer" and "swap the shoes" must change the look in the asked direction, keep what wasn't asked to change, and stay complete.
- **Never-again suite.** Every failure that you or the critic tags is saved with its brief and its bad output. The engine must never reproduce that failure on that brief. This suite only grows.
- **Held-out briefs.** A set of briefs never used for tuning, so we can't overfit to the reference set.

### 5.5 Visual review

Text descriptions hide visual problems, so reviews use **outfit boards**: the actual garment photos laid out together.
- **Primary visual round:** your real wardrobe, once it's re-added, with your own photos.
- **Test-wardrobe boards:** item descriptions with colour swatches. Good enough for checking the brief, range and idea, but not trusted for fine visual judgement.

### 5.6 Gates: when the new engine is allowed to ship

**All of these must hold:**

| Gate | Threshold |
|---|---|
| Critical failures across the reference set and pressure suites | **Zero** |
| Critic calibration against expert critiques | **Same verdict ≥ 80%; same main issue ≥ 70%** (must pass before the gates below count) |
| Calibrated critic's "a stylist would sign this off" | **≥ 80% of looks** |
| Mean rubric score (calibrated critic) | **≥ 4.0 / 5** |
| Blind comparison vs the old engine (you + the critic) | **Wins or ties ≥ 70%** |
| Same-piece challenges vs the editor's looks | **On par or better ≥ 40%** at launch. Matching professionals is the long-term target. |
| Your "would wear" on your real wardrobe | **≥ 70% of looks** |
| Cost and calls per Tier 2 message | ≤ 40% of today's cost, ≤ ⅓ of the calls |

**After launch:**
- Every engine or prompt change runs the automated suites, and any regression on a critical failure blocks the change.
- Your review round repeats monthly, and before any major engine change.
- The knowledge base refreshes weekly and grows through lookups. A staleness alarm flags any area that's falling behind.

### 5.7 The quality loop inside the product

- **Every outfit card:** "Wore it", "Save", "Not for me". "Not for me" asks one tap for the reason: too safe, not me, wrong for the occasion, doesn't go together, wrong weather, I don't own that. Reasons feed retrieval and the never-again suite.
- **Admin quality dashboard:** rubric trend over time, failure-type counts, wear and save rates by slot (best, fresh, discovery), and wardrobe coverage.

---

## 6. Phases

| Phase | Work | Done when |
|---|---|---|
| **0 — Foundation** | Postgres + photo storage, thumbnails, health check, export, POST-only destructive actions, **trace logging (the flight recorder)** | 10 items added, the service restarted, and everything still there. Export round-trips, and every AI call is traced and costed. |
| **1 — Quality bar** | Rubric and failure list committed; Style Knowledge base seeded (craft and currency layers, dated, held-out split) with the weekly refresh job running; test wardrobes; automated pressure suites; old engine scored; critic calibration measured | Baseline numbers and calibration results committed to `docs/` |
| **2 — Ingestion + profile** | Single photo-analysis call with confidence, salience and one-tap correction; outfit-graph pair scoring; roles table; taste board; one shared client-profile builder; operational Style DNA | Test wardrobes and real uploads carry full attributes and pair scores, and Style DNA reads both the closet and the taste board |
| **3 — New engine** | Routing; retrieval with fresh, client-weighted knowledge and graph scores; lookups on coverage gaps; generate, filter, critique, select; look editing; behind a flag | Passes every gate in §5.6 |
| **4 — Occasions + feedback** | "Dress for…" occasion browser with overnight pools and place-aware seasons; Today from the pools; one-tap outcomes with reasons; quality, coverage and knowledge-freshness dashboards | Pool looks pass the same gates as live looks, browsing makes no AI calls, and feedback visibly changes retrieval |
| **5 — Cleanup + rebuild** | Delete dead routes, retire the old engine, rebuild Style DNA on the new pipeline, reconsider parked features one at a time | Old engine removed |
| **Later** | Look boards; "this or that" taste choices; mirror selfies when logging a wear; week-ahead plan (no calendar link); trips; purchase vetting | Each is gated on the same quality bar before shipping |
| **Ongoing** | Automated suites on every change; your monthly review; weekly knowledge refresh and staleness alarms; nightly pool rebuilds | No critical regressions ship |

Phase 0 needs your new database. Phases 1–3 can proceed while you re-add your wardrobe.

---

## 7. Risks

- **Rebuilding into a shinier version of the same sprawl.** Mitigated by the narrow v1 scope and the hard gates in §5.6.
- **Public advice varies in quality.** Mitigated by curating for named professionals and high-agreement expert answers, and by recording each record's source so weak ones can be pruned.
- **The knowledge base recreating a single taste, or drifting toward whatever is loudest online.** Mitigated by deliberate coverage across aesthetics, occasions, climates, cultures and body types, checked on every refresh, and by weighting records toward each client's own lens.
- **Chasing trends.** Currency records are inspiration for *how* to make a look current inside the client's own style, never a reason to push her toward a trend. The rubric's "feels like her" score keeps that honest.
- **Refresh and lookup cost creeping up.** Mitigated by a weekly cap on the refresh job, lookups only on Tier 3 or a detected gap, and every result cached.
- **Copyright and site terms.** Mitigated by keeping records as short paraphrased notes with links, never copying content into the app, and respecting each site's terms.
- **Taste is subjective.** Mitigated by scoring against a written rubric, checking the critic against expert verdicts, and keeping you as the final "would wear" judge.
- **Overfitting.** Mitigated by held-out records and briefs that are never used for tuning.
- **Text-only test wardrobes can't judge visual fit.** The primary visual round uses your real photos.
- **Judge drift.** The critic is frozen per evaluation version and re-calibrated against the held-out critiques every round.
- **Re-entering 78 items is a burden on you.** Bulk add plus the single combined analysis call makes it faster and cheaper.

---

## 8. Decisions needed

1. **Photo storage:** Cloudflare R2 (recommended: durable, cheap, needs an account) or a Railway volume (no new account, tied to one service)?
2. **Data:** Railway Postgres (recommended) or a fresh Upstash database as a stopgap?
3. **Parked features:** can they disappear from the UI during the rebuild, or should they stay visible on the old engine?
4. **Cost target:** is "≤ 40% of today's cost per chat message" the right bar, or do you have a hard per-message budget?
5. **Style Knowledge base:** OK to build and continuously refresh it from public stylist, editor and street-style content, as short paraphrased notes with source links, including live lookups when the stylist hits a gap?
6. **Your reviews:** will you do a blind review round yourself (about 30 minutes) for the baseline, and again before launch?

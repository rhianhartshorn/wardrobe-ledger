# The Wardrobe Ledger: Full Project Briefing

**For:** an outside AI asked to help rethink the whole approach.
**As of:** 26 November 2026.
**How to read this:** it's written to stand alone; you don't need access to the code. Where something is uncertain, unverified or our own interpretation, it says so. Section 11 lists the questions we most want help with.

---

## 1. What we are trying to achieve

**The goal:** a personal styling app that gives outfit advice as good as an excellent human stylist (or styling team) would, using only the clothes the person actually owns.

**What "good" means to the owner, in priority order:**
1. **Outfit quality.** Genuinely fashionable, specific to the person, using the best of their wardrobe, practical for real life. Not merely "rule-compliant" or "safe". This is the number one priority.
2. **Range.** It shouldn't keep recommending the same few pieces; it should get the most out of the whole wardrobe.
3. **Adapting to the person.** It should work with *their* style (maximalist, minimalist, tailored, streetwear…), not pull everyone toward one house taste.
4. **Staying current.** Fashion changes over time and differs by occasion and place, so the system must not rely on a frozen idea of what's "in".
5. **Cost and speed.** Affordable enough to use daily, and fast enough for a real app.

**Who it's for:** currently one real user (the owner), but designed as a product.

**The owner's background:** a non-engineer product owner with strong opinions on fashion quality. Their feedback has repeatedly pushed for:
- evidence over assertion
- real stylist-level taste, not rule-following
- not losing good ideas from earlier work

---

## 2. Timeline at a glance

The whole project is in one Git repository: 191 commits between 27 June and 19 November 2026. It was built entirely by an AI coding assistant (Claude Code) working with the owner, who is not an engineer and directed everything through conversation. Sections 3–7 tell the story in order.

| When (2026) | Phase | What happened |
|---|---|---|
| Before 27 Jun | **Prototype** | A single-file prototype built as a Claude.ai artifact (`wardrobe-ledger.jsx`): browser storage, with AI calls made from the page itself. |
| 27 Jun – 3 Jul | **1. Building the app** | Moved to a real Next.js app on Railway. Built the closet, photo upload, AI tagging and the first AI features. Storage was redesigned about six times. |
| 3 – 7 Jul | **2. Features and "expert" voice** | Many features added: Style DNA, outfits, combinations, try-on, profiles, a journal and cost tracking. Specialist personas, brand voice and a self-correcting copy editor were introduced. |
| 8 – 13 Jul | **3. The AI styling team** | A multi-agent "styling team" built: parallel specialists, a head stylist, a round table, a visual gate and an accessories director. Then cost reduction work. |
| 16 Jul | **4. Measured quality, rounds of patching** | The owner found the advice safe and repetitive. Many measured fixes were tried; the scores barely moved. |
| 16 Jul – 29 Sep | Pause | No commits. |
| 29 – 30 Sep | **5. Outside review, then data loss** | First redesign steps from an outside AI review. Then the production database was found deleted, taking the entire real wardrobe with it (78 items and photos, no backup). |
| 3 – 5 Nov | **6. Rebuild plan, new storage** | A staged rebuild plan written; storage rebuilt on Postgres and Cloudflare R2. |
| 18 – 19 Nov | **7. Standalone stylist lab** | App work paused. A separate test bench built (invented wardrobes, a fixed request set, automatic checks, an AI judge). A one-call baseline and several "smarter" engines tested; none beats the baseline yet. API credits ran out mid-experiment. |

---

## 3. How the app was built (27 June – 16 July)

This chapter covers how the original app came together, the decisions made along the way, and the engineering problems that kept recurring. Several of those problems shaped later decisions, and some still matter for a rethink.

### 3.1 From prototype to a real app (27 June)

- The idea began as a **Claude.ai artifact**: a single React file (`wardrobe-ledger.jsx`) that stored data in the artifact's browser storage and called Claude straight from the page.
- It was re-platformed into a standalone **Next.js 14 app** (TypeScript, Tailwind), with all Claude calls moved to the server. The first version used SQLite and saved images to disk. The weather came from Open-Meteo, which is free and needs no key.
- It was deployed to **Railway** on day one, auto-deploying on every push to GitHub.

### 3.2 The closet and the fight with storage (27 June – 3 July)

**Photo upload and tagging** was the first core loop. You photograph a piece; Claude vision tags its category, colours, pattern, material, formality and season. It took several fixes to work on iPhone:
- The camera-only `capture` attribute was removed, so the photo library shows.
- Multi-select needed a wrapping `<label>`, not a hidden input.
- One persistent file input was needed, so repeat uploads work.
- One bad photo is now isolated, so it can't fail the whole batch.

Bulk upload with a sequential tagging queue and duplicate detection was added early.

**Storage was redesigned about six times in a week,** because Railway's disk is wiped on every deploy:

| Step | Storage approach |
|---|---|
| 1 | SQLite and images on disk (lost on redeploy) |
| 2 | Images stored inside a JSON file |
| 3 | Images stored as data URLs inside each item record |
| 4 | **Upstash Redis** (a hosted, free-tier key-value store) |
| 5 | Redis "hashes" to fix lost writes, then several fixes to how commands were sent |
| 6 | Images moved to their own Redis keys |
| 7 | Finally, plain get/set only, after hash operations kept misbehaving |

A **double-encoding bug** (values stored as JSON inside JSON) corrupted the list of item IDs and caused "ghost items". A leftover data blob from another Railway project also produced ghost items. To clear such corruption, wipe endpoints were added:
- `DELETE /api/items`
- `GET /api/reset-wardrobe`, a "phone-friendly" wipe you could open in a browser

That GET endpoint was later found to be a serious vulnerability: anything that opened the URL would erase the wardrobe.

Every photo was still stored as base64 text inside Redis, and that Redis database was the only copy of everything. **This decision led directly to the data loss in September** (section 6).

### 3.3 Feature build-out (27 June – 7 July)

Features were added quickly, often several a day:

- **Style DNA tab** (27–28 Jun):
  - an archetype reading
  - "style twins" (real people the wardrobe resembles)
  - "style aspirations / style match" (how close you are to a target look)
  - per-item "fashion currency" (timeless, current, dated or coming back)
  - "learn more" deep dives
- **Body and colour profile** (28 Jun): a questionnaire, plus colour analysis from a photo, injected into every prompt.
- **Saved Looks and an Outfit Journal** (29 Jun), for logging what was worn.
- **Combinations tab** (29 Jun): first every possible outfit worked out in code, then replaced with AI-picked, ranked outfits.
- **Closet tools** (3 Jul): search and filters, cost per wear (price ÷ wears), and a seasonal review.
- **Navigation:** reorganised into five tabs (3 Jul), with a first-launch onboarding carousel (4 Jul).
- **Virtual try-on:** first through Fashn.ai (4 Jul), then Google Gemini image generation (5 Jul), plus Claude vision feedback on an outfit photo. These were later blocked by missing or unpaid API keys.
- **A "wardrobe value" score ("Mirror")** for each item, and a gap audit with a "don't buy" list (6–7 Jul).
- **An API cost tracker** with an admin dashboard (6 Jul).
- **Voice input** for chat (8 Jul).

### 3.4 Giving the AI an expert voice (3 – 7 July)

- **A "senior stylist" persona** was applied to every AI route (3 Jul).
- **Specialist personas** were introduced: Fashion Editor, Fit Specialist and Colour Analyst (5 Jul).
- **Richer client context:** a "style brief" (colour analysis), "taste signals" from what was actually worn and saved, a lifestyle profile from a style-discovery quiz, and a personalised stylist persona generated from it.
- **A brand-voice document** with banned words (for example "elevated", "effortless", "chic") was applied everywhere.
- **A "Copy Director" editorial agent** was added. It audits generated text in the background. An auto-patching system then wrote new prompt rules from repeated violations, and those rules were injected into every later call, with no limit on how many could pile up.
- **An early lesson about rules (6 Jul):** the combinations feature got hard "wearability rules" and a code validator. Within a day these were relaxed to "trust the stylist's judgement on layering; only enforce completeness", because strict rules were rejecting good outfits. The same tension recurred much later (section 9).
- **The wardrobe as an image:** a photo grid of the whole wardrobe began being sent to the AI with outfit requests (6 Jul), so it could "see" the clothes.

### 3.5 The multi-agent styling team (8 – 13 July)

**Restructure:** Today, Outfit and Chat were merged into a single Stylist tab with outfit cards shown inline in the chat (8 Jul).

**The multi-agent team (8–10 Jul):**
- Five specialists run in parallel, then a head stylist and an accessories director.
- Specialists return structured briefs with verdicts and confidence.
- There's a "problem classification", and a round table if the specialists disagree.
- Each request is routed only to the specialists it needs.
- A "living Style Thesis" profile is maintained in the background.
- A styling-technique library was added.
- Response "modes" were replaced with flexible blocks (outfits, text, verdict, packing list, gaps, and so on).

**Quality overhaul (10 Jul):**
- a "visual gate" that checks real garment photos together
- an Opus head stylist
- richer tagging
- taste exemplars
- a quality gate against clashing combinations
- a fix for the stylist repeating the same high-wear outfit

A **Today tab** with a proactive daily brief was added, and the slow steps were run in parallel to cut waiting time.

**Bugs in this stretch:**
- Over-eager "directive" extraction caused a formality bias. For example, a one-off "work outfit" request was being saved as a permanent rule.
- The usage log had its own double-encoding bug, so the cost dashboard silently recorded nothing for a while.

**Cost work (11–13 Jul):**
- stopped re-sending the wardrobe photo grid when not needed
- three cuts based on the dashboard's data
- prompt caching across the specialist pipeline
- covered two untracked cost sources and corrected a wrong price

**By mid-July** a typical chat message made about 10–14 AI calls, one or two of them on the most expensive model.

### 3.6 Engineering problems that kept recurring

- **Silent failures:** storage errors swallowed and shown as "empty", the usage log silently empty, uploads failing silently.
- **Encoding and serialization bugs** in the hand-rolled Redis layer (double-encoding, three separate times).
- **Truncated AI output:** JSON cut off mid-response, fixed repeatedly by raising token limits, splitting calls or a "smarter" brace-matching parser.
- **Race conditions:** wear counts, and later a shared settings blob where one write clobbered another.
- **Infrastructure kept free and fragile:** free-tier Redis as the only copy of the data, photos as base64 text, no backups and no authentication.
- **Speed:** many sequential AI calls; slow, heavy-reasoning models.
- **Prompt growth:** every quality issue was answered with more prompt text or another agent, and nothing was ever removed.

---

## 4. The original app as it stood in mid-July

**Stack:**
- Next.js 14 (App Router) with TypeScript, deployed on Railway (auto-deploys from the `master` branch on GitHub).
- AI: Anthropic Claude only. At the time this meant Opus 4.8 for "taste-critical" calls, Sonnet 4.6 for most others and Haiku 4.5 for cheap background jobs.
- Storage: Upstash Redis on the free tier, with photos as base64 text (see section 3.2).
- Other services: Google Gemini image generation for virtual try-on and generated inspiration images (an earlier Fashn.ai try-on was replaced), and Google Custom Search for real-world style photos. By the September review, the Google keys weren't set in production, so these features returned nothing.
- Weather: Open-Meteo, with OpenStreetMap for place names (free, no keys).

**Features (five tabs plus extras):**
- **Today:** a daily outfit brief based on the weather.
- **Stylist:** free-form chat.
- **Closet:** photo upload with AI auto-tagging of every item.
- **Looks:** saved outfits with "worked / didn't work" feedback.
- **Style:**
  - "Read My Style" (an archetype, "style twins", brand statement, colour story)
  - "Style Goals" (how close you are to a target style)
  - "What's Missing" (a gap audit with a "don't buy" list)
- **Extras:** a combinations grid, virtual try-on, a wardrobe "value" score, fashion-currency ratings, "learn more" deep dives, an editorial copy-audit system that wrote its own new prompt rules, and a cost dashboard.

**How a styling request worked (the "styling team"):**
1. Three to five specialist calls run in parallel, each a long persona prompt:
   - Fit & Proportion
   - Colour Analyst
   - Fashion Editor
   - Occasion & Context
   - Wardrobe Intelligence

   Each returned a structured brief: verdict, confidence, observation, recommendation, candidate outfits.
2. A "round table" call runs if the specialists disagree.
3. A head-stylist synthesis call (often Opus) produces the answer.
4. A "visual gate": a vision call per outfit, looking at the real garment photos.
5. An Accessories Director call.
6. Background jobs: a style-thesis update, the editorial audit, and recording which items were recommended.

**About 10–14 model calls per chat message**, one or two of them on the most expensive model.

**Shared prompt material injected into every call:**
- an "evidence hierarchy": what the client has worn and loved, then what they've said they want, then what can be seen about the garments, and so on, down to general conventions
- a list of "anti-AI-styling" bans (no reflexive French tuck, no "pop of colour", and so on)
- a brand-voice word ban list
- a styling-technique vocabulary
- a fixed "2026 aesthetic lens" naming The Row, Toteme, Lemaire, Bottega Veneta and Copenhagen minimalism

---

## 5. The quality problem and what we tried (16 July)

**The complaint:** the advice was safe and repetitive. It kept recommending the same few pieces, especially a plain black blazer thrown over everything. Prints, colour and dresses went unused, even though the real wardrobe was rich in them (about 52 of 78 items were prints, bold colours or dresses).

### How we measured it

- **An AI judge:** we built one to score "maximisation" (did the stylist use the wardrobe's strongest options?) and "fashionability".
- **Validating the judge:**
  - Planted outfits of known quality were ranked correctly.
  - Two different models agreed: no disagreement of 3 or more points across 6 test outfits.
  - Repeated scoring was stable.
- **The caveat:** it was never validated against human stylists.
- **Synthetic wardrobes:** we tested the same engine on invented wardrobes. It scored around 7–8.5 on fashionability on several of them, but only around 3–5 on the real wardrobe. This ruled out "the real wardrobe is just basic" as the explanation (the owner rightly challenged that excuse).

### What was tried, in order, on the real wardrobe

Maximisation score out of 10; the baseline was **3.0**.

| # | Attempt | Result |
|---|---|---|
| 1 | Prompt rules: "build around the highest-impact piece", "fashion-forward defaults", "don't smother the statement piece" | No real change |
| 2 | Stripped wear counts from the prompt (testing whether "most-worn" anchoring was the cause) | Worse (2.3). Ruled out. |
| 3 | Code-built "statement roster" listing every print, colour and dress | No change (3.0) |
| 4 | Detect zero statement pieces used, then a stripped-down "revise this JSON" retry | **Worse (2.7).** The revision bypassed the quality reasoning and sometimes produced nothing that passed the visual gate. |
| 5 | Retry via the full prompt instead | Back to 3.0. Added latency; one request timed out (HTTP 502). |
| 6 | Reworded the retry: "weigh the full set of unused statement pieces for this occasion" (the earlier rule was gamed: it used the same one "safe" statement dress every time) | 3.3 |
| 7 | Three outfits per answer instead of two | **4.0**, the best real gain |

**Conclusions at the time:**
- Each fix added another rule. The head-stylist prompt accumulated more than 11 overlapping "don't be repetitive / don't be safe" rules, plus the fixed minimalist lens contradicting several of them.
- Our hypothesis: the system's **own aesthetic anchoring and rule pile-up** caused the blandness, more than any missing rule. This was later partly supported by lab evidence (section 9).

**Other bugs found and fixed in this period:**
- Settings stored in one shared Redis blob with an unguarded read-modify-write race.
- A double-decode bug.
- A storage layer that turned database errors into "empty wardrobe".
- An unauthenticated GET endpoint that wiped the whole wardrobe.
- An automatic AI call on every app open.

---

## 6. The data-loss incident (late September)

**What happened:**
- Around 29–30 September, just after the first redesign steps were deployed, the live app began returning Railway's "Application not found".
- Once Railway was restored, the app loaded but showed an **empty wardrobe**, and photo uploads failed.
- Investigation showed every database write was failing, and that the free-tier Upstash database had been **deleted by the provider**: its hostname no longer existed. Free databases are archived or removed when idle, though we can't confirm the exact trigger.

**Why it was total:**
- It was the **only copy**: every photo was stored as base64 text inside it, and there was no backup or export.
- Because the code swallowed errors, the app showed an empty wardrobe rather than an outage. That masked the cause for a while. At first, an unprotected "wipe" endpoint (section 3.2) was suspected; that was a real vulnerability and was fixed, but it wasn't the cause.

**What followed:**
- Database and storage failures now surface as errors.
- The wipe endpoints require an explicit confirmation.
- Storage was rebuilt (section 7).

**Lesson:** the storage was not fit to hold the only copy of someone's wardrobe.

---

## 7. The outside review and the rebuild plan (29 September – 5 November)

### The outside review

An outside AI reviewed a description of the system and recommended:
- replacing "committee then synthesis" with **retrieve → generate → filter/rank → select → explain**
- deterministic candidate retrieval in code before any model call
- repetition avoidance through scoring rather than prompt pleading
- three looks with different roles (best / fresh / discovery)
- richer item attributes, with confidence scores
- a client "aesthetic lens" built from their Style DNA instead of a universal minimalist lens
- Sonnet as the default model, with Opus as an escalation
- cost tiers
- controls on the self-patching editorial system
- coverage analytics

### What we built from it

**In the app:**
- Retrieval with exposure penalties and three role-based pools.
- An operational Style DNA object: colour and pattern appetite, minimalism tolerance, the client's own style references and anti-references.
- The universal lens replaced by a neutral one.

These were deployed but never measured, because the data loss happened right after.

**The rebuild plan (`docs/REBUILD_PLAN.md`):**
- **Narrow v1 scope:**
  - closet
  - a "Dress for…" occasion browser
  - chat
  - one-tap feedback
  - Style DNA with a "taste board" (looks you love, not just what you own)
- **New storage:**
  - Postgres for data
  - Cloudflare R2 for photos, with thumbnails, daily backups and export
- **A single styling pipeline:**
  - deterministic retrieval
  - cheap candidate generation
  - code filters
  - a cheap critic
  - selection by Sonnet, escalating to Opus only when needed
- **A precomputed "outfit graph":** item-pair compatibility scored when an item is added, plus occasion pools built overnight.
- **A "living Style Knowledge" base:**
  - a craft layer (slow-changing)
  - a currency layer (dated, decaying, refreshed weekly)
  - live lookups when knowledge is thin, all paraphrased from public stylist, editor and street-style content
  - used as inspiration and as a benchmark, not as templates
  - **the owner explicitly rejected a static style library:** style changes over time and by occasion
- **A written quality rubric:** 8 dimensions plus "would a stylist sign this off?", a named failure list, pressure tests (hard wardrobes, hard briefs, repetition stress, a "never again" suite) and ship gates.
- **No hired stylists are available.** Human ground truth comes from the owner's own "would you wear this?" reviews, plus expert verdicts drawn from the knowledge base.

**Parked features:** every removed feature is preserved, with its good ideas recorded, in `docs/PARKED_FEATURES.md` and at the git tag `pre-rebuild`.

**Phase 0 storage rebuild:**
- Done in code and verified locally.
- Production refuses to run without durable storage.
- **Not yet connected in production:** the owner hasn't created the Railway Postgres database or the R2 bucket, so the live app currently shows "unavailable". The owner's real wardrobe hasn't been re-entered.

---

## 8. The stylist lab (18 – 19 November)

**Why it exists:** the owner decided to pause app changes and get a stylist that produces genuinely good results first, testing on **synthetic wardrobes we invent**. Integration comes later. The lab lives in `stylist-lab/` in the same repo.

### Test wardrobes

Four invented clients, each with a full profile:
- body
- colouring (including which colours drain them near the face)
- lifestyle and work dress code
- Style DNA (summary, keywords, references, anti-references, aspiration)
- permanent directives
- history (looks that worked and looks that didn't)

Each item has category, name, colours, pattern, material, silhouette, formality (1–5), warmth (1–5), wear count and notes. Traps are included deliberately.

| Client | Wardrobe | Traps included |
|---|---|---|
| **Maya**, 34, London | ~75 items, expressive print-led maximalist (modelled on the lost real wardrobe) | An over-used black blazer; a never-worn check blazer; icy pastels that drain her; 9cm heels when she avoids heels over 7cm; arms covered at work |
| **Daniel**, 41, Copenhagen | ~45 items, tailored Scandinavian menswear | Cycles year-round in wind and rain; a long overcoat that's awkward on the bike; leather-soled shoes; under-used rust and brown pieces |
| **Sarah**, 29, Sydney (late spring in November) | ~55 items, basics-heavy and mostly black | Black drains her; a never-worn cobalt satin skirt; prefers flats |
| **Lena**, 22, Berlin | 15 pieces, streetwear and vintage student | Walks and cycles everywhere; tests range from very little, and honesty when a brief exceeds the wardrobe |

### Requests

**Ten fixed requests**, used for every client:
1. work tomorrow
2. dinner at a nice restaurant
3. "surprise me"
4. rain all day with lots of walking
5. a first date at a cocktail bar
6. weekend brunch and shops
7. presenting to senior leadership
8. an outdoor wedding where it might rain
9. "how do I wear my [hero piece]"
10. a long travel day

The season is worked out from hemisphere and date. Each city has default weather and a rain variant.

### Scoring

**Free code checks for hard failures:**
- items the client doesn't own
- no shoes
- no top and bottom (or dress)
- a layer with no base underneath
- two pairs of shoes
- repeated looks
- the same anchor piece twice
- looks that are too similar

**An AI judge** (Claude Opus 5.5, high effort) acting as "creative director of a top styling studio":
- **Per look**, it scores 1–5 on: answers the brief; feels like the client; visually resolved; has an idea; finished; explanation quality. It also gives a yes/no "would a top stylist sign this off?", tags named failures and comments.
- **Per answer**, it scores: uses the wardrobe's best; range; overall (1–10); the specific missed opportunity, with item IDs; a summary.
- **Named failures:**
  - Critical: wrong register, breaks a directive, wrong for the weather, impractical.
  - Major: safe default, smothered statement piece, clash without logic, not her style, bad colour at the face, proportion problem, costume, repeats a known miss.
  - Minor: could be more practical, no real technique, weak explanation, unfinished.
- **Judge v2** (current) defines "critical" strictly: the client would genuinely be cold or wet, couldn't do the activity, would be clearly mis-dressed, or a directive is broken. It's versioned so results from different judge versions are never compared.
- **The judge hasn't been calibrated against human expertise.** It is used to compare engines, not as an absolute verdict.

**In our reading, the judge's comments are specific and fashion-literate.** For example, it flagged:
- suede boots for a wet outdoor wedding
- cropped trousers with flats cutting a short-legged client's line
- a black trench smothering a colourful look and putting black at the face
- velvet in the rain
- a print clash with no shared colour

### Tooling

- Every model call logs tokens, cost and latency.
- Prompt caching is used on the stable wardrobe and profile block.
- A `--rejudge` mode re-scores saved outputs without new stylist calls.
- Each run writes `report.md` (a scorecard plus every look written out) and `results.json`.

---

## 9. Lab results so far

Models used: Claude Sonnet 5.5 ($2/$10 per million tokens, input/output), Opus 5.5 ($4/$20) for the judge, Haiku 5.5 ($0.10/$0.50) for one cheap variant.

### The baseline

The bar to beat is **one well-written prompt in one call** (Sonnet 5.5, high effort).

The prompt: an exceptional stylist; three complete looks using only owned items by ID; different anchors; respect weather, occasion, activity and directives; a sharper version of the client's own style; use history; reach for strong pieces, including under-worn ones, without forcing them; be honest about what the wardrobe lacks; give the idea, the styling moves and why for each look.

**Full run: 4 clients × 10 requests (40 answers, 120 looks), re-scored with judge v2:**

| Metric | Score |
|---|---|
| Overall | **6.5 / 10** |
| Stylist would sign off | **62.5%** of looks |
| Looks with a genuine critical failure | 17 / 120 |
| Answers the brief | 3.5 / 5 |
| Feels like the client | 4.0 / 5 |
| Visually resolved | 3.5 / 5 |
| Has an idea | 3.4 / 5 |
| Finished | 3.6 / 5 |
| Explanation | 3.1 / 5 |
| Uses the wardrobe's best | 3.6 / 5 |
| Range | 3.5 / 5 |
| Cost per request | **$0.034** |
| Response time | **~28 seconds** |

**By client (overall, sign-off):** Maya 6.7 (73%) · Daniel 6.4 (50%) · Sarah 6.8 (80%) · Lena 6.0 (47%).

**Most common failures:**

| Failure | Count |
|---|---|
| Could be more practical | 94 |
| Weak explanation | 70 |
| Safe default | 41 |
| Unfinished | 32 |
| Proportion problem | 30 |
| Clash without logic | 10 |
| Wrong register | 10 |
| Not her style | 9 |
| Wrong for the weather | 8 |

(Under judge v1, which over-used "critical", the same outputs scored 6.3 with 68/120 looks marked critical.)

**A notable finding:** this simple baseline does *not* under-reach the way the old app did. It readily used never-worn pieces (the check blazer, the velvet slip, the pink tweed jacket, the cobalt skirt). Its weaknesses are execution:
- practicality, weather and activity treated as an afterthought
- proportion on the specific body
- explanations that are vague or claim things the outfit doesn't deliver
- some safe defaults

This suggests the old app's committee-plus-rules machinery was itself a main cause of its blandness.

**Example of a strong look** (Lena, "surprise me"), scored idea 5 and like-client 5: her black satin slip dress worn over cargo trousers and a faded band tee, with chunky lace-up boots, a chain necklace and a cropped puffer. "Club-kid layering that is pure Berlin and very her."

**Example of a weak answer** (Maya, outdoor wedding in possible rain), 5/10:
- It led with suede boots.
- Velvet would get wet.
- A black trench smothered emerald and pink.
- A floral-and-check print clash had no shared colour.

The judge's missed opportunity: "her proven baroque wrap dress with black tights and flat knee-high boots, the pink tweed cropped jacket for structure and romance, pearls, the red mini bag, the camel coat over it, plus an umbrella."

### Experiment: a "conditions layer" plus critique and revise (v1)

**The conditions layer,** worked out in code before any model call:
- temperature band
- light versus heavy rain
- cycling, lots of walking, or an outdoor event
- target formality range from the request wording
- heel limits parsed from directives

It then:
- removes items that break a directive (for example heels over the limit)
- tags each item with what it means today ("rain-ready", "risky on the bike", "very light for today", "too casual for this")
- hard-checks the finished looks: outerwear when it's cold, enough warmth, rain-ready outerwear in heavy rain, shoes for wet ground, bike-safe pieces, not under-dressed

**Variants tested**, all with an improved stylist prompt (an explicit stylist process, three looks with different jobs, explanations must be true):
- **v1 (critic):** generate → code checks → a critique by Sonnet at medium effort, giving a keep/fix/replace verdict per look with codes and fixes → revise.
- **v1-lite:** conditions plus the improved prompt, one call.
- **v1-checked:** generate, then revise only if the code checks fail.

**First v1 (critic) smoke test, 4 cases:**
- Two ties, two losses (Daniel's wedding 6 → 4).
- About 4.6× the cost ($0.158 per request) and about 100 seconds.
- **The failure mode:** the critic over-applied practicality. It swapped Daniel's wool overcoat for a casual waxed jacket on all three wedding looks because of "possible showers". The revision then made all three looks share the same coat, shoes, belt and watch, so the range collapsed.
- **Fixes made:** the critic got the judge's severity rules and was told to protect register, ideas and range; KEEP looks are returned unchanged; there are no negative rain tags in light showers.

**Head-to-head on the 12 hardest cases** (rain, leadership presentation and wedding, for all 4 clients), against the baseline on the same cases. API credits ran out mid-run, so the critic variant has only 8 cases and v1-checked has 10:

| Version (matched cases) | Overall vs baseline | Wins / losses / ties | Sign-off | Looks with a critical failure | Range | Wardrobe's best | Cost per request |
|---|---|---|---|---|---|---|---|
| v1-lite (12) | 5.75 vs 6.08 | 2 / 5 / 5 | 39% vs 50% | **2 vs 10** | 3.1 vs 3.4 | 3.1 vs 3.3 | ~$0.04 (same) |
| v1-checked (10) | 5.80 vs 6.20 | 1 / 4 / 5 | 40% vs 50% | 5 vs 6 | 2.9 vs 3.4 | 3.1 vs 3.4 | ~$0.06 |
| v1 + critic (8) | 6.00 vs 6.13 | 3 / 3 / 2 | 50% vs 50% | 6 vs 5 | **2.5** vs 3.4 | 3.1 vs 3.3 | ~$0.11 |

**Our interpretation** (small samples; a one-point change in a single case is within judge noise, but every variant moved in the same direction):
- **Making real-life conditions explicit works for practicality.** Critical failures dropped from 10 to 2 at no extra cost.
- **But handing constraints to the generator as rules up front makes it more cautious:** less range, less reach, lower overall.
- **Critique-and-revise loops add cost and latency, and also homogenise the looks.**
- **This is the same pattern as the original app:** more rules and more review led to safer, blander styling.

### Next experiment planned, not yet run (no credits)

"Generate freely, enforce afterwards":
1. Use the baseline prompt unchanged, so it keeps its taste and range.
2. Run the code condition checks.
3. Apply a minimal targeted fix only to looks that break a hard rule (for example swap the shoes or coat, keeping the idea).

Estimated cost: about $1.50 on the 12 hard cases, then about $5 for the full 40.

---

## 10. Challenges and lessons so far

1. **Rules make the model safer, not better.** Every layer of rules, retries and critique tended to reduce range and taste, even when it fixed the specific failure it targeted. The simplest prompt has outperformed every elaborate system so far.
2. **Practicality is the main, fixable weakness of the simple approach.** It's largely knowable from data (temperature against warmth, rain against fabric, cycling against hems), so code can check it. The open question is how to enforce it without dulling taste.
3. **Measuring taste is hard.**
   - The AI judge is detailed and plausible, but uncalibrated against humans.
   - It initially over-used "critical"; we fixed that and versioned it.
   - Judge noise is roughly ±1 point per case, so small samples mislead.
   - No hired human stylists are available. The owner is the only human judge.
4. **Synthetic versus real wardrobes:** invented wardrobes are fully described in text. Real wardrobes come from photo tagging, which is noisier, and visual qualities matter (print scale, colour, fit). The lab tests text-only reasoning; the visual side is untested here.
5. **Cost and latency:**
   - The baseline costs $0.034 per request, which is acceptable, but takes 28 seconds, which is too slow for a live app (Sonnet 5.5 at high effort).
   - Multi-call pipelines took 60–100 seconds.
   - Judging is the main cost of evaluation: about $3.70 per 40-case run.
   - API credits have run out three times during heavy testing.
6. **Process lessons:**
   - Test against a fixed benchmark before claiming a fix works. Several "fixes" made things worse.
   - Don't excuse poor results by blaming the input (the "the wardrobe is too basic" claim was wrong).
   - Infrastructure must not fail silently.
7. **Scope creep:** the original app grew many features before the core styling was good. The owner wants the old features' good ideas kept (`docs/PARKED_FEATURES.md`), but integrated only after the core is excellent.

---

## 11. What we'd like help rethinking

1. **The overall approach to "stylist-level" quality.** Is "one strong model call plus code-enforced practicality" the right core, or is there a fundamentally better architecture? Options include few-shot exemplars, retrieval of expert looks, generating many candidates then selecting, fine-tuning-like approaches, or a different decomposition of the task.
2. **How to enforce hard real-life constraints without dulling taste.** Constraints up front made outputs bland, and critique loops homogenised them. What works better? Our next idea is to generate freely, then make minimal fixes afterwards.
3. **How to get genuine fashion judgement and currency.** That means real taste, an awareness of what's current, and adapting to very different personal styles, from public expert content, without a static rulebook.
4. **Evaluation.** How to make the judge trustworthy without human stylists: calibration against public expert critiques, pairwise comparisons, multiple judges, owner reviews? How big should samples be to separate signal from noise? How do we judge visual qualities?
5. **Cost and latency targets** for an everyday app, with acceptable quality: precomputation, cheaper models, caching, batch processing.
6. **Product shape.** Whether the narrow v1 makes sense: closet, a "Dress for…" occasion browser, chat, one-tap feedback, Style DNA plus a taste board. Also, what the minimum is that would make a real person trust and keep using it.
7. **Anything we're missing,** or any assumption we should drop.

---

## 12. Reference

**Repository:** `rhianhartshorn/wardrobe-ledger` on GitHub, branch `master`.

**Documents:**
- `docs/REBUILD_PLAN.md`: the staged rebuild plan, quality rubric, gates and phases.
- `docs/PARKED_FEATURES.md`: every removed feature and engine idea, with its good parts and how it should return.
- `stylist-lab/README.md`: how to run the lab.

**Lab results:** in `stylist-lab/results/`, one folder per run, each with `report.md` and `results.json`.

**Code:**
- The original app, intact: git tag `pre-rebuild`.
- Stylist lab: `stylist-lab/src/`. Engines are in `engines/`; the rest are `judge.ts`, `checks.ts`, `conditions.ts`, `wardrobes/` and `requests.ts`.

**State of things:**
- The live app is showing "unavailable" until Postgres and R2 are connected.
- The real wardrobe needs re-entering.
- The lab needs API credits topped up to continue.

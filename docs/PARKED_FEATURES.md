# Parked Features & Ideas Register

**Purpose:** nothing from the original app is lost in the rebuild. Every feature and engine idea taken out is recorded here: what it did, what was genuinely good, what to fix, and how it comes back on the new engine.

**Recovering the original code:** everything below exists exactly as it was at the git tag **`pre-rebuild`** (commit `44d9bf7`, pushed to GitHub).

```
git show pre-rebuild:src/app/api/<route>/route.ts      # read one file
git checkout pre-rebuild -- src/app/api/<route>         # restore a folder
```

**The rule for bringing anything back:** it returns on the new engine (shared client profile, retrieval, living style knowledge, the flight recorder), and it must pass the same quality gates as everything else (`REBUILD_PLAN.md` §5.6). Nothing comes back as a standalone prompt.

**Status key:**

| Status | Meaning |
|---|---|
| **Folded in** | Its idea is already part of the v1 plan |
| **Parked** | Returns after v1 |
| **Retired** | The feature goes, but its idea is kept below |

---

## 1. Features

### 1.1 Style Goals ("How do I achieve this?")
- **Status:** Parked. A strong candidate to return first after v1.
- **Code at tag:** `src/app/api/style-match/route.ts`, Style tab section 2 in `src/components/StyleTab.tsx`
- **What it did:** you name a target (Quiet Luxury, Parisian Cool, a specific person) or pick from a curated list. The team said which 3 real people your wardrobe already resembles, how close you are to the goal, and the specific steps to close the gap.
- **What was good:**
  - It refused false matches: a match that didn't suit your body or colouring wasn't counted, even if the style overlapped. Fit and Colour each checked this.
  - It grounded the answer in garments you actually own, not aspiration.
  - It produced concrete steps rather than mood-board talk.
- **What to fix:** it ran through the full specialist committee, which made it expensive. Its sense of a target ("Quiet Luxury") was frozen at the model's training date.
- **How it returns:** a goal becomes a temporary layer on top of Style DNA. Retrieval and the occasion pools lean toward the goal for as long as it's active, and the living knowledge base supplies *current* references for that goal. "Steps to close the gap" ties into purchase vetting later.

### 1.2 What's Missing (gap audit)
- **Status:** Parked.
- **Code at tag:** `src/app/api/wardrobe-gaps/route.ts`, Style tab section 3
- **What it did:** 3–6 priority-ranked gaps (high, medium, low), each with data from your wardrobe proving it and a specific piece to buy: cut, colour, fabric, and how it fits with what you own.
- **What was good:**
  - **The "don't buy" list**, e.g. "You already own 4 black knitwear pieces; more won't unlock new outfits." This is one of the most useful things a stylist can say.
  - A precise priority definition. High means you can't dress for a common occasion; medium means it limits combinations; low is a refinement.
  - Permission to say the wardrobe is complete.
- **What to fix:** gaps were *judged* by the AI. In the new system they can be **measured**: occasions with thin pools, pairs that never resolve, and pieces with zero good partners in the outfit graph.
- **How it returns:** computed from the outfit graph and occasion pools first, with the AI only explaining and recommending. Rank each suggestion by how many new good outfits it would unlock (computable from the graph). This merges with **purchase vetting** later.

### 1.3 Wardrobe value scoring ("Mirror")
- **Status:** Retired as a separate route; the idea lives on.
- **Code at tag:** `src/app/api/mirror/route.ts`
- **What it did:** scored every item 0–10 on its value to *this* wardrobe. It named the most valuable pieces, the ones worth reconsidering, and 3 purchases that would make the wardrobe work harder.
- **What was good:** the rubric deliberately did **not** reward wear frequency alone:

  | Criterion | Points |
  |---|---|
  | How many outfits it unlocks | 0–4 |
  | Occasion necessity: a wedding-guest dress scores high even if rarely worn, and specialised pieces aren't penalised | 0–3 |
  | Gaps it fills (season, formality, colour) | 0–2 |
  | Longevity | 0–1 |

- **How it returns:** as a per-item "value" figure in the Closet, computed mostly from the outfit graph (outfits unlocked), occasion coverage and roles. It feeds the gap audit and purchase vetting.

### 1.4 Fashion currency
- **Status:** Parked. The idea is folded into the living knowledge base.
- **Code at tag:** `src/app/api/fashion-currency/route.ts`, shown in `ClosetTab.tsx`
- **What it did:** rated every piece's currency (when it peaked: timeless, current, dated or coming back) with a required "how to wear it now" tip, even for timeless pieces.
- **What was good:**
  - **The four-way status is a genuinely useful vocabulary.**
  - **The "howNow" tip was mandatory**, so a piece was never just labelled "dated" with no way forward.
- **What to fix:** its view of what's current was frozen at the model's training date, which is exactly the problem the living knowledge base (currency layer) now solves.
- **How it returns:** a per-item currency badge and "how to wear it now" tip, generated from the *currency* layer of the knowledge base and refreshed as that layer refreshes.

### 1.5 Ways to wear this piece (item style)
- **Status:** Parked. A strong candidate to return early.
- **Code at tag:** `src/app/api/item-style/route.ts`, triggered from `ClosetTab.tsx`
- **What it did:** for one hero piece, 4 ways to wear it. Three used only your wardrobe; one suggested 1–2 pieces you *don't* own to take it further. Each had a current aesthetic name and a reason it works for your proportions.
- **What was good:**
  - **The 3-plus-1 structure**, wardrobe-only looks plus one aspirational look, is excellent product design.
  - Advice was tied to your body and colouring.
- **How it returns:** a "focus piece" request on the new pipeline. Retrieval is pinned to the hero piece, and the outfit graph supplies its best partners. The aspirational fourth look links into purchase vetting.

### 1.6 Combinations grid
- **Status:** Retired, replaced by the **"Dress for…" occasion browser** (v1).
- **Code at tag:** `src/app/api/combinations/route.ts`, `src/components/CombinationsTab.tsx`
- **What it did:** a ranked list of complete outfits drawn from the whole wardrobe, each with title, category, rationale, formality, season and accessory direction.
- **What was good:**
  - **The completeness spec:** the clearest written statement of the "a layer needs a base underneath" rule, with allowed and disallowed examples.
  - **The accessory rule:** owned accessories must appear by item ID.
  - "A shorter list of great outfits beats padding with mediocre ones."
- **Where the ideas went:** the completeness spec becomes the code-level filter (which now adds shoes). The accessory rule is in the new select step. "Fewer, better" is how pools are sized.

### 1.7 Occasion outfit generator (legacy "outfit")
- **Status:** Retired, folded into the occasion browser and Today.
- **Code at tag:** `src/app/api/outfit/route.ts`, `src/components/OutfitTab.tsx`
- **What it did:** you pick an occasion, add an optional note, and get 3 outfits that use the weather. When there was no weather it planned ahead with a weather note, and it could use your profile photo for colouring.
- **What was good:**
  - **This was an early version of the "Dress for…" browser.**
  - **Planning ahead without weather:** looks that work across conditions, plus a weather note. Keep that for future-dated occasions.
  - The coaching tone: rationales start with "Try…" or "Wear…".
- **Where the ideas went:** the occasion browser (v1). Keep the "planning ahead" behaviour for when an occasion isn't today.

### 1.8 Virtual try-on
- **Status:** Parked. It needs `GOOGLE_API_KEY`, which isn't set in production.
- **Code at tag:** `src/app/api/outfit-try-on/route.ts`, used from `LooksTab.tsx` / `StylistTab.tsx`
- **What it did:** combined your profile photo with up to 4 garment photos to make a photorealistic image of you wearing the look. It kept your face, hair and proportions, styled like an editorial shoot.
- **What was good:** it's the most emotionally compelling feature, because you actually see yourself in it.
- **What to fix:** cost and quality need checking, and it's sensitive: it uses your photo, so keep it private, opt-in, and never stored beyond what's needed.
- **How it returns:** after v1, as an opt-in "See it on me" action on a chosen look. Generated on demand, never in bulk. It's paired with look boards, which are cheaper and come first.

### 1.9 Outfit inspiration image
- **Status:** Parked. Needs `GOOGLE_API_KEY`.
- **Code at tag:** `src/app/api/outfit-inspiration/route.ts`
- **What it did:** a photorealistic image of an anonymous, generic model wearing your actual garments, as a style reference without your photo.
- **What was good:** it shows the look worn, not just laid flat, with no privacy cost.
- **How it returns:** the privacy-free alternative to try-on, optional on a chosen look. Look boards come first.

### 1.10 Similar looks online
- **Status:** Parked. Needs `GOOGLE_CSE_API_KEY` / `GOOGLE_CSE_ID`, which never worked in production.
- **Code at tag:** `src/app/api/outfit-references/route.ts`, `src/lib/image-search.ts`
- **What it did:** on demand, real-world photos close to a recommended look, linked to their source and never re-hosted.
- **What was good:**
  - **On demand only**, so it costs nothing per response.
  - **Linking rather than re-hosting** is the right approach for rights.
- **How it returns:** largely absorbed by the living knowledge base, whose records already carry source links. A look can show "the reference behind this idea" from the records used to build it, at no extra cost. Image search stays optional.

### 1.11 Style twins with photos (inside Read My Style)
- **Status:** Folded into Style DNA (v1). The photos need `GOOGLE_CSE_*`.
- **Code at tag:** `src/app/api/style-read/route.ts` (the `styleTwins` field)
- **What it did:** 2–3 real style icons your wardrobe actually resembles, with a match strength and a reason, plus photos.
- **What was good:** "Actual matches grounded in pieces owned, not aspiration."
- **How it returns:** Style DNA keeps style twins, now from both the closet **and** the taste board. Matches against the closet show who you dress like; matches against the taste board show who you want to dress like. The gap between the two is the most useful thing Style DNA can show.

### 1.12 Image strategy (personal brand read)
- **Status:** Folded into Style DNA. Parked as a standalone section.
- **Code at tag:** `src/app/api/image-strategy/route.ts`, `src/components/ImageStrategySection.tsx`
- **What it did:** read your wardrobe as a *communication system*. It covered what a stranger reads cold, where your style is heading, how coherent your image is, tensions working against it, gaps in what it signals (not just missing items), strengths, and the "next chapter".
- **What was good:**
  - **Tension points and gaps in signal are unusual and genuinely insightful.**
  - "The next chapter is a direction, not a shopping list."
- **How it returns:** these fields become part of the Style DNA reading. They're compared against the taste board ("what you say vs. what you want to say").

### 1.13 Learn more (editorial deep dives)
- **Status:** Parked.
- **Code at tag:** `src/app/api/learn-more/route.ts`, `src/components/LearnMorePage.tsx`
- **What it did:** magazine-style breakdowns, specialised by type: an outfit concept, the currency of a piece, a buying guide, a style cluster, or a style icon. Each had a headline, an overview, 3 sections and tips.
- **What was good:**
  - It teaches, which is what makes a stylist feel worth paying.
  - Each content type had its own angle. The buying guide, for example, covered which shades suit *your* colouring and what a fair price is.
- **How it returns:** a "Why this works" deep dive on any look or piece, written from the trace (the flight recorder already knows why each choice was made) and from the knowledge records it drew on. That's cheaper and more truthful than writing a fresh essay.

### 1.14 Photo feedback on an outfit (outfit-feedback)
- **Status:** Retired. It was never wired into the UI; the idea is kept.
- **Code at tag:** `src/app/api/outfit-feedback/route.ts`
- **What it did:** looked at your photo and gave 3–4 sentences on how the palette interacts with your skin and hair, whether the silhouette suits your frame, and one adjustment.
- **How it returns:** as the **mirror selfie** idea (Later): when you log a wear with a photo, the critic learns how pieces actually look and fit on you.

### 1.15 Style discovery quiz + persona builder
- **Status:** Folded in. This becomes the **taste intake** in v1.
- **Code at tag:** `src/app/api/persona/route.ts`, `src/components/StyleDiscoveryCarousel.tsx`
- **What it did:** a short quiz turned into a 4–5 sentence internal brief "as if briefing a colleague". Questions covered mood picks, how you want to feel dressed up, what matters most when getting dressed, your lifestyle mix and who you dress for.
- **What was good:**
  - **These are exactly the right intake questions.** "Who you dress for" and "how you want to feel" are what a real first session asks.
  - The persona was written in a stylist's briefing voice.
- **How it returns:** the quiz becomes the first part of the taste intake, alongside the taste board. Its answers feed operational Style DNA directly instead of a free-text persona.

### 1.16 Editorial audit ("Copy Director") + self-patching rules
- **Status:** Parked behind controls (cap, deduplication, expiry, admin review), as in `REBUILD_PLAN.md`.
- **Code at tag:** `src/lib/editorial.ts`, `src/app/api/editorial-review`, `editorial-patch`, `editorial-patch-list`
- **What it did:** a cheap model audited generated copy against the brand voice. A "Patch Analyst" read recurring violations and wrote specific new rules, such as "the word 'effortlessly' keeps appearing despite the ban, so never use it in any form", which were injected into future prompts.
- **What was good:** a real self-correcting feedback loop, with specific rather than generic rules.
- **What to fix:** it had no ceiling. Rules piled up forever and made every prompt longer and more expensive.
- **How it returns:** as part of the quality loop, using sampled audits, with patches reviewed in admin and periodically merged into one compact voice policy.

---

## 2. Ideas inside the old engine worth keeping

These weren't separate features. They were thinking embedded in prompts and code. The plan already keeps several; this list makes sure none fall through.

### Evidence and judgement
- **The evidence hierarchy**, highest to lowest:
  1. what she's repeatedly worn and loved
  2. what she's said she wants
  3. what can be seen about the garments
  4. the occasion
  5. proportion and colour principles
  6. current fashion
  7. general conventions
- **"Wear history is validation, not a default answer."**
- **Four distinct verdicts:**
  - does not work
  - works but isn't the strongest version
  - works but not for this client
  - breaks a rule in a way that improves the outfit
- **"Admit uncertainty; abstain when evidence is insufficient."** Specialists were explicitly allowed to abstain.
- **"Identify the mechanism behind every judgement":** proportion, visual weight, line, colour, context, coherence, identity or practicality.

### The anti-AI-styling list
Avoid these tells:
- a French tuck by default
- a belt just because the waist isn't defined
- "a pop of colour"
- jewellery by default
- treating "flattering" as meaning "thinner"
- calling something timeless because it's boring
- giving several options instead of a judgement
- adding accessories to an already-finished look
- turning every outfit into its safest version

**Keep this list in the operating policy.**

### Voice
- The banned-word list (elevated, effortless, chic, curated, versatile, investment piece, and so on) and the rule "say *why* it flatters".
- Second person, declarative, no hedging, no exclamation marks.

### Styling craft vocabulary
- Named tucks, sleeve treatments, hem and layering order, knots, neckline management, waist definition without a belt, and footwear proportion moves (ankle cuff, no-break hem).
- The rule that **every look names at least one specific move.**

### Specialist methods (personas go; their methods stay, reworded as consequences rather than absolutes)
- **Fit:**
  - Hem intelligence: what each hem length does to the leg.
  - Cropped pieces depend on the rise of what's underneath.
  - Structure tension: one structured piece plus one soft piece.
  - Volume balance, **reframed:** "volume on both halves broadens the silhouette. That can be intentional, but it costs length and definition."
- **Colour:**
  - Undertone → depth → chroma, in that order.
  - Primary pieces (the largest area) must flatter, while accents can bend the rules.
  - Black isn't neutral on everyone; ivory and stark white are different; navy and camel behave differently on warm and cool undertones.
  - A professional colour brief is treated as established fact.
- **Occasion:**
  - The four axes: formality, industry culture, geography, what you want to signal.
  - **"Most dress code errors are one register off."**
  - **"Smart casual means smart with one relaxed piece, not casual with one smart piece."**
  - Interview dress sits half a register above everyday dress for the role.
  - Some occasions override personal style entirely: funerals and religious ceremonies.
- **Wardrobe Intelligence:**
  - A piece that's never worn is one of three things: **a fit problem, an occasion gap, or an identity gap.**
  - Category clustering: many similar pieces means either a comfort anchor or a gap in the category next to it.
  - **The aspiration-reality gap:** editorial pieces never worn alongside well-worn basics is a styling problem, not a wardrobe problem.
  - Repeat purchases in the same hue signal a commitment you haven't built around yet.
- **Accessories:**
  - Read visual weight first.
  - **The rule of three:** shoes, bag and jewellery, where one is the statement and two recede.
  - Some looks are genuinely complete without accessories.
  - Be specific about metal temperature, scale, belt width and finish, bag shape and carry, and how the toe and heel change the outfit's proportions.
- **Fashion Editor:**
  - The coherence test: a shared register, not matching.
  - The currency test: proportion and fabric tension, not trends.
  - "Matchy-matchy is as wrong as incoherence."
  - "The edit should reduce, not add."

### Mechanisms
- **The visual gate's principle: "Boring passes. Broken fails."** It judges the assembled look from real photos, not tags.
- **Directive extraction discipline:**
  - Only permanent truths ("avoids heels"). Never occasion-scoped wishes, one-off format preferences, or uncertain inferences.
  - "A missed directive costs nothing; a wrong one misdirects every future conversation."
  - **"What she says in this message beats a stored directive."**
- **Confirmed wins and misses:** saved looks marked as worked or didn't work become taste calibration.
- **Count discipline:** the message's "here are two looks" must match what was actually built. Reconcile it if a gate later removes a look.
- **Repetition check within a conversation,** and **distinct anchors across looks.** Both now move into code.
- **Recent-wear avoidance:** don't anchor on anything worn in the last 3 days.
- **Wardrobe character brief:** a living summary of workhorses, underused pieces with what would unlock them, native strengths and blind spots. This becomes part of the shared client profile.
- **Item dossier:** a one-time note on each piece's role. It becomes the evolving **roles** table.
- **Style thesis:** a living ~150-word profile, absorbed into the shared client profile.
- **Exposure tracking** (recommended ≠ preferred) and **the spotlight** on under-exposed pieces. Both become retrieval scoring.
- **Round table:** one cross-talk pass only when specialists genuinely disagree. The principle survives as **escalation only on real disagreement or close scores.**
- **The team adapting to the client:** "our rigour stays, the aesthetic destination flexes." This becomes operational Style DNA.

---

## 3. Return order after v1 (proposed)

1. **Ways to wear this piece** (§1.5). It's cheap on the new engine and high-value.
2. **Style Goals** (§1.1), as a temporary layer on top of Style DNA.
3. **Gap audit + wardrobe value + purchase vetting** (§1.2, §1.3), computed from the outfit graph.
4. **Fashion currency badges** (§1.4), from the knowledge base.
5. **"Why this works" deep dives** (§1.13), from traces.
6. **Look boards, then try-on and inspiration images** (§1.8, §1.9).

Each returns only when it passes the quality gates. This register gets updated as each feature comes back.

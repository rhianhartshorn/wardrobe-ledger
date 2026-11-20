# v1.1-sonnet-critic

Conditions in code → generate (Sonnet 5.5, high) → code checks → critique (claude-sonnet-5-5, medium) → revise when needed. Judge v2.

## Scorecard

| Metric | Value |
|---|---|
| Overall (1–10) | **6.0** |
| Stylist would sign off | 50.0% of looks |
| Looks with a critical failure | 6 of 24 |
| Critical failures (code checks / judge) | 1 / 7 |
| Answers the brief | 3.4 |
| Feels like the client | 3.9 |
| Visually resolved | 3.3 |
| Has an idea | 3.1 |
| Finished | 3.5 |
| Explanation | 3.4 |
| Uses the wardrobe's best | 3.1 |
| Range across the three looks | 2.5 |
| Cost per request (engine) | $0.107 |
| Model calls per request | 3.0 |
| Response time | 62.8s |
| Judge cost (whole run) | $0.710 |
| Errors | 4 |

## By wardrobe

| Wardrobe | Overall | Sign-off | Wardrobe's best |
|---|---|---|---|
| Maya — expressive print-led maximalist (London) | 6.5 | 66.7% | 3.5 |
| Daniel — tailored Scandinavian menswear (Copenhagen) | 6.5 | 66.7% | 3.5 |
| Sarah — basics-heavy casual (Sydney) | 6.0 | 33.3% | 3.0 |
| Lena — small streetwear/vintage wardrobe (Berlin) | 5.0 | 33.3% | 2.5 |

## Most common failures

| Failure | Count |
|---|---|
| COULD_BE_MORE_PRACTICAL | 19 |
| WEAK_EXPLANATION | 13 |
| SAFE_DEFAULT | 11 |
| PROPORTION_PROBLEM | 6 |
| CLASH_WITHOUT_LOGIC | 6 |
| TOO_SIMILAR | 5 |
| UNFINISHED | 5 |
| IMPRACTICAL | 5 |
| BAD_COLOUR_AT_FACE | 2 |
| WRONG_REGISTER | 2 |
| NOT_HER_STYLE | 2 |
| REPEATED_LOOK | 1 |
| COSTUME | 1 |
| REPEATS_KNOWN_MISS | 1 |

## Every case

### Maya — r04: "It's raining all day and I'll be walking a lot. What should I wear?"

**Overall 6/10.** The stylist correctly identifies m51 as the only rain-ready coat and steers away from dragging wide-legs. Look 3 does good work unlocking m45. But the set treats the trench as decoration, telling her to wear it open in steady breezy rain three times. It never uses the silk scarf m84 to fix black at her face. In Look 2 it chooses a crepe skirt and ankle boots 'for range' while admitting a better option. Warmth is borderline throughout for an all-day walk at 8°C. Competent, with one genuine idea, but needs practical tightening before it goes to Maya.

**Look 1: Baroque in the Rain** — Her gallery-opening dress, made weatherproof with a trench, tights and flat knee-high boots.
- Pieces: Baroque print wrap midi dress · Black opaque tights · Black flat knee-high boots · Black belted trench coat · Chunky gold hoop earrings · Black leather tote
- How to wear: Wear the wrap dress with black opaque tights and the flat knee-high boots. The boots cover the calf, so the midi hem never touches wet ground. Belt the trench loosely at the natural waist, or leave it open so the wrap and its print show. Add the gold hoops and carry the black tote, which holds a laptop and an umbrella.
- Judge: brief 4, like-client 4, resolved 3, idea 3, finished 4, explanation 3 · sign-off: yes
- Practically the soundest look here: a wrap midi with flat knee-highs and opaque tights is exactly right for a long, wet walking day, and the baroque keeps her personality. It needs the trench closed, m84 at the neck to break the black at her face, and m41 underneath for warmth.
- Failures: COULD_BE_MORE_PRACTICAL (m30 is silky jersey (warmth 2) under an unlined cotton trench m51 (warmth 3) at 8°C, breezy, walking all day. That is borderline. The burgundy cardigan m41 under the trench, or the silk scarf m84 at the neck, would make it comfortable. 'Leave it open so the print shows' is the wrong instruction in steady rain.); BAD_COLOUR_AT_FACE (With m51 belted, the black trench collar sits right at her face. Black is also repeated in the tights, boots and tote m71, so the head-to-toe frame is black. Tucking the rust/navy/cream scarf m84 into the collar would fix the face and tie into the baroque.); WEAK_EXPLANATION ('The boots cover the calf, so the midi hem never touches wet ground' is muddled. A midi never touches the ground anyway. The real benefit is that the knee-highs close the gap between hem and boot, so the tights stay dry. That is the point worth teaching.); SAFE_DEFAULT (This is a near-repeat of her proven gallery look. It is sensible for a wet day, but it adds no new idea.)

**Look 2: Cobalt and Mustard Colour Block** — Joyful colour-on-colour with a red accent, held together by a sharp belted waist.
- Pieces: Cobalt merino jumper · Mustard pleated midi skirt · Wide black leather belt · Black opaque tights · Black leather Chelsea boots · Black belted trench coat · Red leather mini shoulder bag · Chunky gold hoop earrings
- How to wear: Tuck the cobalt merino fully into the mustard pleated skirt and mark the waist with the wide black belt, worn over the jumper at the skirt's waistband. Add black opaque tights and the black Chelsea boots. Wear the trench open over the top and don't belt it as well, so the belt stays the one waist statement and the cobalt and mustard show down the front. If the wind bites, belt the trench instead and slip the black belt into your bag for indoors. The skirt hem will peek out below the knee-length trench, so keep an eye on it in the rain. Carry the red mini bag close against your body under the trench. Wear the gold hoops.
- Judge: brief 2, like-client 4, resolved 3, idea 3, finished 3, explanation 3 · sign-off: no
- Cobalt and mustard is a joyful, warm-bright pairing that suits her colouring and DNA. But it is built on the one skirt fabric that will suffer most in all-day rain. The stylist knowingly chose the less practical shoe, so this is a fair-weather look forced into a wet day.
- Failures: COULD_BE_MORE_PRACTICAL (The crepe pleated skirt m21 hangs below the knee-length trench in steady rain. The trench is also worn open, so the front panel gets soaked as well. Wet crepe drops its pleats and clings. Ankle-height Chelseas m60 leave wet tights exposed between hem and boot.); COULD_BE_MORE_PRACTICAL (The stylist admits the knee-high boots m67 would work better but kept m60 'for range'. Range should never beat function on a rain brief. The navy cropped cigarette trousers m27, tucked into m67, would keep the cobalt-plus-colour idea and be rain-proof.); UNFINISHED (The red bag m74 is called 'the pop' but is then hidden under the trench. Moving the black belt m85 between jumper and bag mid-commute is fussy, unworkable instruction.)

**Look 3: Stripe and Check Discovery** — Print-mixing with intent: a Breton under the never-worn check blazer, sharpened with a waist belt and a burgundy beret.
- Pieces: Breton stripe top · Oversized check blazer · Mid-blue straight jeans · Wide black leather belt · Black short rain boots · Black belted trench coat · Tan structured crossbody bag · Burgundy wool beret · Chunky gold hoop earrings
- How to wear: Tuck the Breton into the high-rise jeans and belt it with the wide black belt, so the waist reads clearly. Wear the oversized check blazer open over the top and push the sleeves up to the forearm so they don't bunch. Put the trench on over it, open and unbelted, so the check lapels and the Breton stripe show down the front. Don't belt the trench over the blazer. Wear the black rain boots, and the ankle-length jeans stay clear of the wet ground. Add the burgundy beret and gold hoops. Wear the tan crossbody under the trench. Indoors, take the trench off and the stripe and check mix is the whole look.
- Judge: brief 3, like-client 4, resolved 3, idea 4, finished 4, explanation 4 · sign-off: yes
- This is the best idea of the three. It finally unlocks the never-worn check blazer m45 with a narrow stripe at a different scale, giving a real, warm print mix with a romantic burgundy beret. It works indoors. Outdoors, the stacked layers and open trench compromise it.
- Failures: PROPORTION_PROBLEM (An oversized boyfriend blazer m45 under a belted, knee-length cotton trench m51 is a fit gamble on a 164cm frame. The blazer shoulders and length fight the trench. Pushed-up blazer sleeves under the trench sleeves will bunch. Wearing the trench open in steady rain to show the check is the wrong trade-off.); COSTUME (This is a mild risk. A Breton m06 with a beret m87 and a trench reads 'Parisienne' cliché. The check blazer saves it indoors, but outdoors with the trench on, the stripe-beret-trench is all that shows.); COULD_BE_MORE_PRACTICAL (Rubber rain boots m69 are right for the wet but not ideal for a lot of walking all day. The black belt m85 against the brown/rust check is a slightly cold note.)

_Stylist's note: The black trench is the only rain-ready coat in the wardrobe, so all three looks use it. The camel coat, puffer and faux fur are not rain-ready today. I avoided the full-length wide-leg trousers and flares because the hems would drag and wick in the wet. Each look has different shoes: knee-high boots, Chelsea boots and rain boots._

**Missed opportunity:** Leopard silk blouse m01 with its collar out under the cobalt merino m10, and navy cropped cigarette trousers m27 tucked into flat knee-high boots m67. Add the trench m51 belted and closed, silk floral scarf m84 at the neck to break the black and add a second print, burgundy beret m87, red mini bag m74 and gold hoops m80. That gives print-mixing, warm brights, rain-proof legs, warmth for 8°C and a polished office finish.

### Maya — r07: "I'm presenting to senior leadership next week. I want to look authoritative but still like me."

**Overall 7/10.** A thoughtful, mostly well-reasoned edit that respects her directives (flat shoes, covered arms), the weather and her known hits and misses, and reaches for under-used pieces (m42, m45). Look 2 is ready to send. Look 1 is a safe, proven reprise that would benefit from one sharper element. Look 3 has the best idea but the worst execution: oversized blazer plus pleated midi plus flats shortens and widens her, and layering the camel coat over the boyfriend blazer is unworkable. Re-route the blazer onto m23 and it becomes the hero look. Accessories (m71, m80, m82) are repeated identically across all three. m74, m84 or m83 could have given each look its own finish.

**Look 1: The Baroque Brief** — Her proven wrap dress, sharpened for the boardroom with opaque tights and knee-high boots.
- Pieces: Baroque print wrap midi dress · Black opaque tights · Black flat knee-high boots · Camel wool longline coat · Black leather tote · Chunky gold hoop earrings · Stack of gold bangles
- How to wear: Tie the wrap tight at the natural waist so the defined waist reads clearly. Wear opaque black tights and the flat knee-high boots, with the boot top sitting just under the hem to make one long, uninterrupted line. Add the chunky hoops and a few gold bangles pushed up the wrist. Wear the camel coat open over the dress on the way in. In a proper downpour, swap the camel coat for the black belted trench (m51), which is water-resistant.
- Judge: brief 4, like-client 5, resolved 4, idea 3, finished 4, explanation 4 · sign-off: yes
- A correct, low-risk choice. m30 is formality 4 with long sleeves and a marked waist, and the black tights into m67 under the midi hem give her short legs one continuous dark line, which is a genuinely good move. It is still a reprise rather than a sharpened version of her, and the brief asked for authority as well as comfort.
- Failures: SAFE_DEFAULT (This is essentially her proven gallery look (m30 + hoops) with tights and m67 swapped in. It is polished, but no 'one sharp element' is added for authority. A sharper finishing move would lift it from party to leadership, for example a crisp collar or an unexpected shoe.)

**Look 2: Cobalt Authority** — Colour-on-colour joy with one sharp, structured layer in a print-friendly pink, so authority comes from tailoring rather than black.
- Pieces: Cobalt merino jumper · Navy floral wide-leg trousers · Pink tweed cropped jacket · Black leather Chelsea boots · Black belted trench coat · Black leather tote · Chunky gold hoop earrings · Stack of gold bangles
- How to wear: Tuck the cobalt merino fully into the high-rise navy floral trousers so the waist is marked. Put the pink tweed jacket on over it and leave it open. It stops at the waist, so the trouser rise and the tucked jumper stay visible. Wear the trousers so the hems sit about 1cm off the floor and just cover the top of the flat Chelsea boots. If they are longer, get them taken up, because a hem dragging through drizzle will soak. Add the hoops and a few bangles pushed up over the jumper cuff. Wear the black belted trench over everything. It is water-resistant, so it handles both the drizzle and a downpour.
- Judge: brief 5, like-client 5, resolved 4, idea 4, finished 4, explanation 5 · sign-off: yes
- The strongest look in the set. It builds on a proven pairing (m20 + m10) and adds the barely-worn m42, whose pink picks up the trouser floral. That gives Chanel-ish structure that ends exactly at her waist, without the black-blazer trap from her known miss. The hem-length instruction for drizzle is the kind of real-life detail a top stylist adds.
- Failures: COULD_BE_MORE_PRACTICAL (m60 Chelsea boots are formality 2 and the most casual element in a pitch look. They are justified as mostly hidden under the hems and wet-proof, so this is minor. The black trench m51 also puts black near the face when buttoned, so advise wearing it open indoors and taking it off before presenting.)

**Look 3: Check Mate** — Her never-worn oversized check blazer, mixed with leopard in one warm palette, for a print-on-print leadership look with black as the punctuation.
- Pieces: Leopard print silk blouse · Oversized check blazer · Mustard pleated midi skirt · Wide black leather belt · Black opaque tights · Black flat knee-high boots · Camel wool longline coat · Black leather tote · Chunky gold hoop earrings · Stack of gold bangles
- How to wear: Tuck the leopard silk blouse into the high-waisted mustard pleated skirt and cinch the wide black belt over it at the waist. Wear the oversized check blazer open, so the belt shows, with the sleeves down to the wrist. Add black opaque tights and the flat knee-high boots, with the boot tops disappearing under the skirt hem. Add the hoops and bangles, then the camel coat over the top. Carry the black tote for the laptop. In a downpour, swap the camel coat for the black belted trench (m51), which is water-resistant. Try the blazer on before the day to check the shoulder fit, as she has never worn it.
- Judge: brief 3, like-client 4, resolved 2, idea 4, finished 3, explanation 3 · sign-off: no
- The idea is right: finally activating the 0-wear m45 check blazer with the m01 leopard in one warm palette is very Dries. But m21 is the wrong partner for it on her body. Pair the blazer with a long, high-rise trouser, or belt the blazer itself with m85, and this becomes the standout look instead of the weak one.
- Failures: PROPORTION_PROBLEM (The hip-length oversized boyfriend blazer m45 over the pleated A-line midi m21, with flat boots, puts volume on top and flare below. On a 164cm frame with short legs, the hip-length hem cuts her at the widest point and the midi plus knee boots shortens the leg further. A belt that only shows in the gap of an open blazer does not rescue the waist.); REPEATS_KNOWN_MISS (This is structurally close to her 'swamped' failure (volume top and bottom). The explanation waves this away by comparing the skirt to tulle, but the real problem there was the oversized top half, which is repeated here.); IMPRACTICAL (A straight longline camel coat m50 over an oversized boyfriend blazer will be tight through the shoulders and arms. Combined with an untested blazer, that is risky for a high-stakes presentation day.); WEAK_EXPLANATION (The palette logic is good: rust and cream check against tan and cream leopard against mustard. The proportion justification, however, is asserted rather than reasoned, and the coat-over-blazer fit is not addressed.)

_Stylist's note: Nothing in the wardrobe is missing for this brief. Looks 1 and 3 share the camel coat and the knee-high boots because they are the only polished, wet-proof choices. The trench in look 2 is the swap for a downpour in any of them._

**Missed opportunity:** Take Look 3's concept onto the most authoritative bottom in the wardrobe. Tuck m01 leopard silk blouse into m23 black high-rise pressed wide-leg trousers, wear m45 oversized check blazer over it (sleeves pushed or belted with m85 at the waist), and finish with m66 leopard loafers or m60 Chelsea boots, m80 hoops, m82 bangles and m71 tote, with m51 trench for the drizzle. The pressed crease and high rise lengthen her legs and balance the oversized blazer. The black reads as sharp punctuation rather than corporate because it sits away from her face under print. That is authority and personality in one.

### Maya — r08: "Wedding guest — outdoor afternoon ceremony, and the forecast says it might rain."

**Error:** 400 {"type":"error","error":{"type":"invalid_request_error","message":"Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits."},"request_id":"req_011ChDTFBV4fN1HfJV811VoS"}

### Daniel — r04: "It's raining all day and I'll be walking a lot. What should I wear?"

**Overall 6/10.** Looks 1 and 2 are sound, rideable and weather-aware. Look 2 in particular handles the rain and wind properly while giving him forest green. Look 3 needs reworking before it goes out: it repeats Look 1's jacket and trousers, picks the less weatherproof boots, puts cream wool against wax in a downpour, and contains leaked draft text about cord trousers. The set leans heavily on his existing uniform. The stylist note about no waterproof trousers is good. The whole set should be more candid that the hoodless d41 leaves his head exposed all day.

**Look 1: Waxed and Tailored** — A quiet charcoal-and-navy studio uniform with a waxed jacket over it, so the rain only gets the outer layer.
- Pieces: Charcoal lambswool roll-neck · Navy pleated wool trousers · Brown leather lug-sole boots · Olive waxed cotton jacket · Navy wool scarf · Grey cashmere beanie · Black roll-top leather backpack · Steel field watch · Brown leather belt
- How to wear: Wear the roll-neck untucked under the waxed jacket, or half-tucked at the front if you want a cleaner waist. Pull the tapered navy trousers down over the top of the boots so the hem sits just on the lug sole and doesn't wick water. Tuck the navy scarf inside the jacket collar so the wind can't get in. Wear the beanie under the corduroy collar. The jacket has no hood, so the beanie and collar are your head protection.
- Judge: brief 4, like-client 4, resolved 4, idea 3, finished 4, explanation 3 · sign-off: yes
- A sound, rideable, rain-aware look: d55 boots, the hip-length d41 waxed jacket, and the charcoal/navy base with olive and brown for a touch of warmth. It is essentially his uniform with a jacket on, so it is competent rather than inspired.
- Failures: WEAK_EXPLANATION (Calls d05 + d20 his 'proven winter pairing'. The proven presentation look was d05 with d21 grey flannel, not the navy trousers.); WEAK_EXPLANATION (Telling him to let the hem 'sit just on the lug sole so it doesn't wick water' contradicts itself. A hem resting on the sole is exactly what wicks.); COULD_BE_MORE_PRACTICAL (d41 has no hood, so on an all-day heavy-rain, strong-wind day the cashmere beanie d63 will soak through. The roll-neck plus scarf d62 is also redundant at the neck. The note should flag the head exposure more honestly, or point to d42 for the worst stretches.)

**Look 2: Green Under the Shell** — A layered, weatherproof commute that still looks like a considered knit-and-flannel outfit once the shell is off.
- Pieces: Forest green merino crew jumper · Grey flannel trousers · Brown leather lug-sole boots · Black technical rain shell · Charcoal quilted liner jacket · Navy wool scarf · Grey cashmere beanie · Black roll-top leather backpack · Steel field watch · Brown leather belt
- How to wear: Put the forest green merino on first, then the quilted liner, then the rain shell over both. Zip the shell fully and put the hood up over the beanie when you cycle. Wear the navy scarf under the shell collar. Roll the straight flannel hems up one turn, or use a cycle clip, so they clear the top of the lug-sole boots and stay out of the pedals and the puddles. Use the brown belt to match the boots. At the studio, take off the shell and liner and the green merino with grey flannel stands alone. Unroll the hems once you're inside and dry.
- Judge: brief 5, like-client 4, resolved 4, idea 4, finished 4, explanation 4 · sign-off: yes
- The most weather-honest answer: hooded shell d42 over liner d43 for wind and rain, rideable, with the explanation rightly noting the technical layers come off indoors. Forest green d12 against grey flannel answers his wish for colour in a tone that suits his cool colouring.
- Failures: COULD_BE_MORE_PRACTICAL (Grey flannel d21 is the trouser most likely to bag out and stay damp after heavy rain. The hem roll helps but doesn't fix this, and navy wool d20 would hold its shape better on a soaking day.); UNFINISHED (Once the shell is off, the green crew alone is slightly bare for a partner's studio day. A pale blue d02 collar under d12 would make the indoor look feel considered.)

**Look 3: Cream, Navy and Wax** — A warmer, softer take on his navy palette: cream cable knit, navy wool and olive wax, all in fabrics that cope with a wet day.
- Pieces: Cream fisherman jumper · Navy pleated wool trousers · Black leather Chelsea boots · Olive waxed cotton jacket · Navy wool scarf · Grey cashmere beanie · Black roll-top leather backpack · Steel field watch · Black leather belt
- How to wear: Wear the cream fisherman jumper untucked under the waxed jacket and keep the cable-knit collar visible above the jacket's corduroy collar. Tuck the navy scarf in so it doesn't brush the wax. Let the tapered navy trousers fall over the top of the Chelsea boots so the hem sits at the boot shaft rather than on the ground. Wear the black belt to match the boots. Add the beanie under the collar. The jacket has no hood, so the beanie and collar are your head protection. Push the jumper sleeves up a little if the cuffs ride short on your long arms.
- Judge: brief 3, like-client 3, resolved 3, idea 2, finished 3, explanation 2 · sign-off: no
- The cream knit is a nice nod to his texture aspiration, but this is Look 1 with a riskier jumper and worse boots for the weather. The explanation is visibly patched from a draft.
- Failures: WEAK_EXPLANATION (Leaked revision text the client never saw: 'keeps the warm cream, olive and brown-leaning idea', 'the cord trousers are swapped out', 'save the chocolate cord trousers for a drier day'. This reads as confusing internal notes, not client advice.); IMPRACTICAL (The stylist warns that the wax will mark the cream cable knit d10 at collar and cuffs, then recommends it anyway on a heavy-rain day. The advice to push the sleeves up under a rain jacket worsens the exposure.); COULD_BE_MORE_PRACTICAL (For walking a lot in heavy rain, the stylist chose black Chelsea boots d51, which they admit are the less weatherproof option. The d55 lug boots were the right call.); PROPORTION_PROBLEM (A chunky relaxed cable knit under a hip-length waxed jacket bunches at the hem and sleeves. The 'cable collar visible above the corduroy collar' instruction doesn't work with a crew-neck fisherman.); SAFE_DEFAULT (Same jacket d41 and same trousers d20 as Look 1, so this is barely a different look.); CLASH_WITHOUT_LOGIC (Black boots and black belt d66 sit awkwardly with olive wax and cream wool. That warm, earthy palette wants the brown leathers.)
- Code checks: TOO_SIMILAR — Shares most of its clothing with look 1.

_Stylist's note: There are no waterproof trousers in the wardrobe, so your legs will get wet in heavy rain whichever look you choose. The wool trousers cope best, and corduroy is best saved for a drier day. If it is an all-day soak, pack a spare pair of socks._

**Missed opportunity:** A layered texture look to replace Look 3: d05 charcoal roll-neck under the d34 forest green flannel overshirt, d20 navy wool trousers, d55 lug boots, d41 waxed jacket, d62 scarf and d65 belt. It gives real warmth and colour through the under-used green overshirt and a layer he can shed indoors, without the cream-under-wax risk. Pair it with a plain note that d42 is the only hooded option for the worst of the downpour.

### Daniel — r07: "I'm presenting to senior leadership next week. I want to look authoritative but still like me."

**Overall 7/10.** Competent, directive-compliant and well explained. Every look is rideable, no ties, no logos, cool colours at the face, and Look 1 is a safe, proven answer. The set leans heavily on d30, d51 and d66, so range is narrow. Look 2's six-layer ride plan would wreck the blazer and leave him overheated. Look 3 has the most interesting idea but is pitched below the 'authoritative' brief, and the obvious fix (carry the derbies) was missed. None of the looks addresses his long arms beyond a questionable sleeve-pushing tip. Send Looks 1 and 2 with a revised ride plan, and rework Look 3 before it goes out.

**Look 1: The Proven Winter Uniform, Re-cut for the Bike** — Your presentation formula (roll-neck, flannel, Chelsea boots) with a soft navy blazer replacing the overcoat that can't go on the bike.
- Pieces: Charcoal lambswool roll-neck · Grey flannel trousers · Navy unstructured wool blazer · Black leather Chelsea boots · Black leather belt · Olive waxed cotton jacket · Black roll-top leather backpack · Steel field watch
- How to wear: Wear the blazer over the roll-neck with the roll-neck collar sitting clean at the neck. Put the waxed jacket over the top for the ride and hang it up on arrival. Push the blazer sleeves back a touch on the bike, then reset the cuffs in the studio. Turn up the right flannel hem once for pedalling, then drop it before you present. The flannel's straight leg should break just on the Chelsea boot. Wear the black belt to match the boots.
- Judge: brief 5, like-client 4, resolved 4, idea 3, finished 4, explanation 4 · sign-off: yes
- The right first answer: the charcoal roll-neck, flannel and navy blazer read senior and quietly precise, and the waxed jacket makes it rideable in showers. It is essentially a repeat with a blazer swapped in, though, and the sleeve-pushing tip should go.
- Failures: SAFE_DEFAULT (This is his proven winter presentation look (d05/d21/d51) with d30 standing in for d40. It is correct and authoritative, but it ignores his stated wish for more warmth and texture beyond navy and grey.); WEAK_EXPLANATION ('Push the blazer sleeves back a touch on the bike' is odd advice for a man whose sleeves already run short on his long arms, and it creases unlined wool before a presentation. No guidance on whether the d30 hem sits under the hip-length d41 or peeks out below it.)

**Look 2: Green Under Navy** — Tonal navy tailoring lifted by forest green and a pale blue collar, for the warmth and texture you said you want.
- Pieces: Forest green merino crew jumper · Pale blue poplin shirt · Navy pleated wool trousers · Navy unstructured wool blazer · Black leather Chelsea boots · Black leather belt · Charcoal quilted liner jacket · Black technical rain shell · Navy wool scarf · Black roll-top leather backpack · Steel field watch
- How to wear: Wear the pale blue poplin shirt under the green merino, collar flat and outside the neckline, cuffs just visible below the jumper hem. Put the navy blazer over both and wear the pleated trousers with the black belt. For the ride, layer the charcoal quilted liner over the blazer and the black rain shell over the liner, with the navy scarf tucked inside the shell. At the studio take off the shell, the liner and the scarf, so you present in blazer and green merino. Let the tapered pleated hem sit just on the Chelsea boot, which is easy to pedal in.
- Judge: brief 4, like-client 4, resolved 4, idea 4, finished 3, explanation 4 · sign-off: yes
- Forest green d12 over the pale blue d02 collar under navy is exactly the gentle colour step his aspiration asks for, and it still reads tailored and senior. The ride-layer plan is over-engineered and needs rethinking so he doesn't present sweaty and rumpled.
- Failures: COULD_BE_MORE_PRACTICAL (Shirt, merino, blazer, quilted liner d43, shell d42 and scarf d62 is six layers for a 25-minute ride at 6°C. He will arrive overheated and the unlined d30 will be crushed under the liner just before a presentation. Better: ride in d43+d42 over shirt and jumper, carry the blazer flat in d60, or drop the liner.); UNFINISHED (The black belt d66 and black Chelsea d51 against navy pleats and forest green are a little hard. The look leans on the same blazer, boots and belt as Look 1, and no footwear thought is given beyond grip.)

**Look 3: Brown Cord, Navy Blazer** — The rarely worn chocolate cords finally earn a place: warm, textural and brown-toned under your soft navy blazer, with a striped collar for some detail.
- Pieces: Chocolate wide-wale corduroy trousers · Navy and white bengal stripe shirt · Navy merino crew jumper · Navy unstructured wool blazer · Brown leather lug-sole boots · Brown leather belt · Olive waxed cotton jacket · Grey cashmere beanie · Black roll-top leather backpack · Steel field watch
- How to wear: Wear the navy and white bengal stripe shirt with the collar open and flat over the neckline of the navy merino crew, and cuffs just showing below the jumper sleeves. Put the navy blazer over the top and wear the cords with the brown belt. Have the cord hem break just on top of the lug-sole boot and don't let it stack. Turn the right hem once for the ride. Put the waxed jacket over the blazer for the ride and pull the grey cashmere beanie on for the wind. Take the waxed jacket and beanie off at the studio. If the blazer shoulders bunch under the waxed jacket, carry the blazer flat and put it on at arrival.
- Judge: brief 3, like-client 4, resolved 3, idea 4, finished 4, explanation 4 · sign-off: no
- A genuinely good idea: the orphaned chocolate cords finally get used and become richer under navy. The execution, though, is pitched too casual for this specific brief.
- Failures: WRONG_REGISTER (Mild case. Wide-wale d26 with chunky lug-sole d55 drags the presentation toward weekend. The brief asks for 'authoritative', and the stylist admits this is the least formal look. It works for a studio day, less so in front of senior leadership.); COULD_BE_MORE_PRACTICAL (Riding in d55 and carrying the brown suede derbies d50 in d60 to change into on arrival would lift the formality without any rain risk. The stylist dismissed d50 outright instead.); CLASH_WITHOUT_LOGIC (Minor. The bengal stripe collar under a navy crew under a navy blazer is a lot of upper-body layering over a heavy cord. The stripe adds busyness rather than authority.)

_Stylist's note: Your overcoat and brown suede derbies stay home today, since neither is rain-ready or safe on the bike. I've kept the charcoal suit out entirely, as it's the combination that felt stiff before. Looks 1 and 2 are the closest to authoritative; Look 3 is the warmest and most textural but sits lower on formality, so choose it if you want to look more like yourself than formal. The wardrobe has no trouser clips, so I've used a single cuff turn for pedalling. Look 1 comes first because it's the best-proven answer for the presentation._

**Missed opportunity:** Look 3 should have been made presentation-grade so the cords carry authority rather than casualness. Pair d26 chocolate cords with d05 charcoal roll-neck and d30 navy blazer, and ride in d55 lug boots under d41 with d63. Then change into d50 brown suede derbies carried in d60, with the d65 brown belt. Warmth and texture come from the cord, the roll-neck keeps the look clean and senior without a tie, and the derbies replace the chunky boot for the room.

### Daniel — r08: "Wedding guest — outdoor afternoon ceremony, and the forecast says it might rain."

**Error:** 400 {"type":"error","error":{"type":"invalid_request_error","message":"Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits."},"request_id":"req_011ChDTDSLxe7UNWGMe1hEpL"}

### Sarah — r04: "It's raining all day and I'll be walking a lot. What should I wear?"

**Overall 6/10.** The stylist read the brief correctly: the trench (s44) is the anchor, satin, slides and the leather jacket are rightly ruled out, and there is an honest note that an umbrella is missing. Look 1 is genuinely good and close to sendable. However, all three looks share the same trench, white trainers and black crossbody, so the range is thin. Two of them rely on denim or pale chinos that will be soaked or splattered after a day of walking. The biggest misjudgement is dismissing the flat black Chelsea boots (s51) as 'warm' and 'off-palette' when they are the obvious rain-walking shoe and sit nowhere near her face. Send Look 1 with the boot swap and rework the other two around fabrics that handle wet.

**Look 1: Navy Shirt Dress, Trench On** — One navy shirt dress under the trench: clean, grown-up and low-effort in the rain.
- Pieces: Navy midi shirt dress · Beige trench coat · White leather trainers · Black nylon crossbody · Small gold hoops · Fine gold chain necklace · Silver watch
- How to wear: Belt the shirt dress and leave the top button open. Wear the trench over it, belted loosely or left open so the dress shows down the front. The midi hem sits well clear of the trainers, so nothing wicks on wet pavement. Wear the crossbody under the trench so it stays dry and your hands are free. Add the small hoops, the fine chain and the watch.
- Judge: brief 4, like-client 4, resolved 4, idea 3, finished 4, explanation 3 · sign-off: yes
- This is the strongest look and the one to send: navy shirt dress (s36) under the trench (s44) is grown-up, Jenni Kayne-ish and gets her out of black at the face. The idea is sound, but swap s50 for s51 and it becomes properly rain-proof as well as polished.
- Failures: COULD_BE_MORE_PRACTICAL (For a full day of walking in steady rain, the white leather trainers (s50) will soak through at the stitching and show every splash. The flat black Chelsea boots (s51) are the more rain-ready walking shoe. Black at the ankle is not near her face, so it does not break her colouring rule.); WEAK_EXPLANATION (The claim that the white trainers 'cope with wet ground' is overstated. The note that the midi hem 'sits well clear' skips the real issue: the dress hangs below the knee-length trench (s44) and will get wet. That is fine in cotton at 21°C, but it should be said.)

**Look 2: The Proven Shirt and Jeans, Rain Version** — Her linen shirt and light jeans formula, cuffed up and kept dry under the belted trench.
- Pieces: White linen shirt · Light-wash straight jeans · Beige trench coat · White leather trainers · Black nylon crossbody · Small gold hoops · Silver watch
- How to wear: Roll the jeans two or three turns to a cropped hem so they clear the trainers and don't soak up puddles. Half-tuck the front of the white linen shirt and push the sleeves to the elbow. Belt the trench when the rain is heavy so the shirt stays covered, and open it once the rain eases. Carry an umbrella for your head, since the trench has no hood. Wear the crossbody under the trench, and add the hoops and watch.
- Judge: brief 3, like-client 4, resolved 4, idea 2, finished 3, explanation 3 · sign-off: no
- It is a comfortable look, but it is the least weather-appropriate of the three: wet denim all day is exactly what a rain brief should avoid. It reads as recycling a known hit rather than styling for today.
- Failures: COULD_BE_MORE_PRACTICAL (Light-wash denim (s21) is the worst fabric choice for all-day rain and walking. Below the trench it gets heavy, cold-wet and slow to dry, and in 21°C humidity it will feel clammy. The stylist admits this, then dismisses it.); SAFE_DEFAULT (This simply re-runs her proven summer formula with a trench on top. It adds nothing toward 'more interesting'. The trench also hides the linen shirt (s07), which is the point of the formula.); UNFINISHED (The rolled jeans and white trainers bring the wet-feet problem from Look 1 back. There is also no thought about what happens to the white linen when the trench is opened in drizzle: it turns sheer and creased.)

**Look 3: Sage and Stone** — A quiet tonal palette of sage, beige and white that makes the trench feel considered rather than just practical.
- Pieces: Sage green tee · Beige chinos · Beige trench coat · White leather trainers · Black nylon crossbody · Small gold hoops · Fine gold chain necklace
- How to wear: Tuck the sage tee loosely at the front into the chinos. Cuff the chinos twice so the hem sits at the ankle and clears the white trainers, with no fabric dragging in the wet. Belt the trench when the rain is heavy and leave it open when it eases. Carry the crossbody under it. Add the hoops and the fine chain over the neckline of the tee.
- Judge: brief 3, like-client 4, resolved 3, idea 3, finished 3, explanation 4 · sign-off: no
- Using the under-worn sage tee (s15) at the face is a good instinct, and so is the soft palette. But light trousers and white shoes on a rain-walking day put look over function, and structurally it is Look 2 again with different colours.
- Failures: COULD_BE_MORE_PRACTICAL (Pale beige chinos (s25) and white trainers (s50) on wet pavement will show every mud splash by mid-morning. The tonal story sounds nice but does not survive a day of walking in the rain.); CLASH_WITHOUT_LOGIC (The black nylon crossbody (s61) cuts straight through a sage, stone and white tonal palette. The stylist protects the palette from the black boots but not from the black bag.); PROPORTION_PROBLEM (The beige trench (s44) over beige chinos (s25) with only a narrow strip of sage showing becomes a long, undifferentiated column of stone. On a 172cm frame it reads flat rather than considered, especially with the trench belted shut.)

_Stylist's note: Today's rain rules out the satin pieces (the cobalt skirt is one to style on a dry day), the leather jacket, the slides and the running shoes. The wardrobe has only one rain-ready outer layer, the trench, and the white trainers are the most comfortable walking shoe for the humidity, so both repeat across the looks. The black Chelsea boots are the only other option, but they are warm at 21°C and would break Look 3's palette. An umbrella is the one thing missing, so pack one._

**Missed opportunity:** s36 navy shirt dress + s44 trench + s51 black flat Chelsea boots + s61 nylon crossbody + s63 hoops + s65 watch. This is the same strong idea as Look 1, but with the only genuinely walk-all-day-in-rain shoe she owns. A stronger trouser alternative would be s05 navy tee + s30 navy pleated trousers (navy-on-navy, grown-up, wool blend that tolerates damp better than denim), worn with s44 + s51.

### Sarah — r07: "I'm presenting to senior leadership next week. I want to look authoritative but still like me."

**Overall 6/10.** Look 1 is sendable once it's belted and fully tucked, and the stylist's note honestly flags the missing lightweight blazer. Looks 2 and 3 both lean on the black polyester blazer s40. That reintroduces harsh black near her face, makes her too warm in humid weather, and repeats the same closer, which reduces the range. Look 3 also puts an untested bias satin skirt into a leadership room. The stylist overlooked s36, the navy shirt dress, which is arguably the best warm-weather authority piece she owns.

**Look 1: Tonal Blues, Sharp Trouser** — Quiet authority: one cool blue family, with a proper trouser doing the work.
- Pieces: Navy pleated trousers · Light blue oversized shirt · Silver ballet flats · Black leather tote · Small gold hoops · Silver watch
- How to wear: Tuck the light blue shirt in at the front only, or fully into the high-rise waist, so the pleats and wide straight leg show. Leave the top button or two undone and push the sleeves to the forearm so the oversized poplin looks deliberate. Let the trouser hem skim the top of the silver flats. Add the small gold hoops and the silver watch, and carry the black tote.
- Judge: brief 4, like-client 4, resolved 4, idea 3, finished 3, explanation 4 · sign-off: yes
- The strongest and most honest look here. s30 is the right anchor, and light blue s08 at the face is exactly her colouring. Belt it, fully tuck it, and it's ready to send.
- Failures: UNFINISHED (A full tuck into high-rise pleated s30 with no belt leaves the waist blank. The tan belt s68 would sharpen the line and warm the blues slightly, the step that turns 'tucked shirt' into 'dressed'.); COULD_BE_MORE_PRACTICAL (The 'front tuck only' option undercuts the authority she asked for. An oversized s08 half-tucked over pleats reads casual. Commit to a full tuck for the presentation.); WEAK_EXPLANATION (The note doesn't address the mixed metals: gold hoops s63 with silver watch s65 and silver flats s56. It's fine, but it should be explained as deliberate or simplified.)

**Look 2: The Sage Suit** — A matching set she's barely worn, dressed up like a suit: soft colour, full confidence.
- Pieces: Sage linen shirt (co-ord) · Sage linen trousers (co-ord) · Black oversized blazer · Silver ballet flats · Black leather tote · Fine gold chain necklace · Small gold hoops · Silver watch
- How to wear: Press the linen the day before. Wear the sage shirt and trousers together as a set, with the shirt tucked in so the waist is clean and the wide leg falls straight. Cuff the sleeves once at the wrist for a crisper line, and open the collar with the fine gold chain at the neckline. Put the black oversized blazer on open over the set for the presentation, with the sleeves pushed up slightly, and carry it in transit or take it off between meetings because it is warm in humidity. Finish with the silver flats, gold hoops, the watch and the black tote.
- Judge: brief 3, like-client 3, resolved 2, idea 3, finished 4, explanation 2 · sign-off: no
- Reviving the sage co-ord s17/s27 is a good instinct. The black blazer is the wrong closer: it reintroduces the harsh black she's trying to leave behind. The sage set worn alone, sharply pressed with belt s68 and silver flats s56, would be truer to her, if softer in authority.
- Failures: BAD_COLOUR_AT_FACE (An open black blazer s40 puts black lapels and shoulders right beside her face and frame. The claim that the sage 'keeps the black away from her face' is not true of an open jacket.); CLASH_WITHOUT_LOGIC (A hard black polyester blazer over soft sage linen breaks her low-contrast, soft-cool palette. It reads as the old black default dropped onto a new colour rather than a tonal suit.); COULD_BE_MORE_PRACTICAL (An all-linen set that creases on the commute, plus a warm polyester blazer at 24°C and humid, means she looks either crumpled or hot at the key moment.); WEAK_EXPLANATION (The explanation mis-states the colour-at-face effect and leans on formality numbers rather than visual reasoning.)

**Look 3: Cobalt, Finally** — Her unworn favourite colour turned into the confident centrepiece, with a blazer for the room.
- Pieces: Cobalt satin midi skirt · White linen shirt · Black oversized blazer · Black ballet flats · Black leather tote · Small gold hoops · Fine gold chain necklace
- How to wear: Tuck the white linen shirt fully into the cobalt satin midi skirt. Leave the collar open with the fine chain showing, and roll the sleeves once or twice. Wear the black oversized blazer open, with the sleeves pushed up slightly, and take it off between meetings if you're warm. Finish with the black ballet flats, gold hoops and the black tote.
- Judge: brief 2, like-client 3, resolved 3, idea 4, finished 3, explanation 3 · sign-off: no
- 'Cobalt, finally' is a real idea and the most interesting look on paper. But this brief is the wrong moment to debut it. Save s34 with s07 and slides s53 for after-work drinks.
- Failures: WRONG_REGISTER (A bias-cut satin midi s34 reads evening or event, not leadership review, especially in a very casual tech office. It risks looking like she's going out after rather than owning the room.); NOT_HER_STYLE (Bias-cut satin clings over slim hips and shows every line when she sits or stands to present. That is close to the body-skimming look she avoids, and she prefers relaxed, straight shapes.); IMPRACTICAL (Debuting a never-worn satin skirt at a high-stakes presentation is risky: untested fit, static, and visible sweat or creasing in humidity.); SAFE_DEFAULT (Black blazer s40, black flats s52 and black tote s60 frame the cobalt in black, which is her old default. It's a heavier and harsher frame than her colouring wants.)

_Stylist's note: Her wardrobe has only one tailored bottom (the navy trousers) and no lightweight tailored jacket. The black blazer is the only structured layer, and it is on the warm side for a humid day. A lightweight blazer in navy, soft grey or soft white would be the best addition for presenting._

**Missed opportunity:** Navy midi shirt dress s36 belted with tan belt s68, silver pointed flats s56, gold hoops s63 and silver watch s65. It is breathable cotton for 24°C humid weather, keeps navy at her face, gives a clean Jenni Kayne line and is authoritative without a blazer. A close second: navy pleated trousers s30 with sage linen shirt s17 fully tucked, belt s68 and flats s56. That breaks up the co-ord so the barely-worn shirt gets a tailored partner, with no black anywhere.

### Sarah — r08: "Wedding guest — outdoor afternoon ceremony, and the forecast says it might rain."

**Error:** 400 {"type":"error","error":{"type":"invalid_request_error","message":"Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits."},"request_id":"req_011ChDTD1t4EB7vznLCLYTLT"}

### Lena — r04: "It's raining all day and I'll be walking a lot. What should I wear?"

**Overall 6/10.** The stylist is honest about the real gap: there is no waterproof shell. They correctly choose the puffer and boots throughout and rightly drop the slip dress and the low-slung jeans. However, all three looks share the same outer layer, shoes, bag and jewellery, so the range is thin. Look 3 is admitted to be wrong for the day. The most useful technique, tights as a base layer under trousers, is missed, and the explanation misjudges which look is warmer. Look 1 is sendable. Looks 2 and 3 need reworking before they go out.

**Look 1: Gig Fit, Rain Edition** — Your favourite gig formula, because the short hem stays clear of puddles and the bike chain while tights and boots keep your legs covered and warm.
- Pieces: Grey oversized hoodie · Red tartan wool mini skirt · Black opaque tights · Black leather lace-up boots · Black cropped puffer · Chunky silver chain necklace · Black canvas tote
- How to wear: Pull the hoodie on over the tights and let it fall to mid-hip so the tartan hem shows just below it. Zip the cropped puffer over the top. Pull the hoodie hood out over the puffer collar and up on the walk, then down on the bike so you can see. Lace the boots tight for the pedals. Wear the chain over the hoodie, under the puffer.
- Judge: brief 3, like-client 5, resolved 4, idea 3, finished 4, explanation 4 · sign-off: yes
- This is the right instinct: her proven formula, with the hoodie hood out over the puffer collar as her only head cover. That is the smartest practical move in the whole set. The look is honest about the rain, but it is essentially a repeat.
- Failures: COULD_BE_MORE_PRACTICAL (After a full day of walking in 3°C rain, nylon tights (l13) under a mini (l07) will be wet against the skin, and the stylist doesn't flag this. The hoodie (l01) hem below the cropped puffer (l10) will also soak and stay cold. It is workable, but the leg warmth claimed for 'real warmth at 3°C' overstates what you get in all-day rain.); SAFE_DEFAULT (This is her known gig outfit with the puffer added. Using a proven win is reasonable, but the look adds no new idea beyond the rain notes.); WEAK_EXPLANATION ('Pull the hoodie on over the tights' is a garbled instruction. Hiding the chain (l14) under a zipped puffer makes it nearly pointless outdoors.)

**Look 2: Undone Utility** — Black cargos, a faded band tee and a grey hoodie: the Berlin studio-to-bar uniform, with the trouser hems tucked away from the wet.
- Pieces: Black band tee · Grey oversized hoodie · Black cargo trousers · Black leather lace-up boots · Black cropped puffer · Chunky silver chain necklace · Black canvas tote
- How to wear: Wear the band tee as the base and let its faded hem peek out under the hoodie. Tuck the cargo hems into the boots and lace tight, so nothing hangs near the chain or pedals and the twill can't drag in puddles. Zip the cropped puffer over the top, which keeps the shape short over the oversized hoodie. Wear the chain over the hoodie, under the puffer.
- Judge: brief 4, like-client 4, resolved 3, idea 2, finished 3, explanation 3 · sign-off: no
- This is the most practical base for a long wet walk, and the hood stays in play. However, it's under-thought: no tights underneath, a shaky tuck, and an explanation that gets the warmth comparison backwards.
- Failures: COULD_BE_MORE_PRACTICAL (The obvious move was missed: the 80-denier tights (l13) should go under the cargos (l06) as a base layer. That makes this the warmest legwear option, and the second layer still insulates once the twill is wet.); WEAK_EXPLANATION (The claim that legs are 'less warm than in a skirt with 80 denier tights' is dubious. Full-length twill is generally warmer than tights plus a mini, and this claim could steer her to the wrong look in the rain.); PROPORTION_PROBLEM (Relaxed cargos tucked into ankle-height boots (l11) will bunch and balloon at the ankle. Rolling or cuffing them would be cleaner. She also asked for oversized tops balanced with something fitted or short, and an oversized hoodie over relaxed trousers only gets that balance from the cropped puffer.); SAFE_DEFAULT (This is an all grey-and-black everyday uniform with the same hoodie-plus-puffer top half as Look 1. The tee (l02) under the hoodie is invisible except for a hem flash.)

**Look 3: Tartan and Forest** — Forest green knit over red tartan, held together by black tights, boots and puffer: a deliberate deep-colour grunge pairing that gets the skirt out more.
- Pieces: Forest green chunky jumper · Red tartan wool mini skirt · Black opaque tights · Black leather lace-up boots · Black cropped puffer · Chunky silver chain necklace · Black canvas tote
- How to wear: Pull the chunky jumper down loose so its hem hangs below the cropped puffer, with a flash of tartan showing beneath it. Zip the puffer fully to cover as much of the knit as possible and push the sleeves up. Wear the black tights and lace the boots tight. Wear the chain over the knit, under the puffer.
- Judge: brief 2, like-client 3, resolved 4, idea 4, finished 3, explanation 3 · sign-off: no
- Green against red is a genuine colour idea for her contrast colouring, and it gets the under-worn skirt out. But this is a dry-day look, and the stylist knew it and sent it for a rain brief anyway.
- Failures: COULD_BE_MORE_PRACTICAL (There is no hood anywhere in the look, so her head is uncovered in all-day 3°C rain. The cable knit (l04) hanging below the cropped puffer will act like a sponge.); IMPRACTICAL ('Push the sleeves up' in cold rain leaves forearms or knit cuffs exposed and wet, which actively undermines warmth.); NOT_HER_STYLE (A forest cable jumper over red tartan leans festive and preppy unless it is roughed up. Only the chain is doing that, and it is hidden under the puffer.); WEAK_EXPLANATION (The stylist calls it the weakest look in constant rain and suggests swapping the jumper for the hoodie, which turns it back into Look 1. If it's wrong for today, don't send it today.)
- Code checks: TOO_SIMILAR — Shares most of its clothing with look 1.

_Stylist's note: Nothing in your wardrobe is rain-ready: the puffer, leather jacket and white trainers are all flagged as not suited to sustained rain. I used the puffer in all three because it is the warmest layer you have, and it will only take the edge off, not keep you dry. I left out the leather jacket, the suede and leather trainers, the slip dress (delicate, thin, risky on the bike) and the baggy jeans (low-slung hems that would soak and drag). The real gap is a waterproof, hooded shell. Until you have one, get in out of the rain quickly, and don't count on the canvas tote keeping anything dry._

**Missed opportunity:** The best rain look layers rather than swaps. Put the tights (l13) under the cargos (l06), with cuffs rolled to boot height and laced tight in l11. Then the white ribbed tank (l03) as a base, the green jumper (l04) worn under the grey hoodie (l01) only if it isn't too bulky (otherwise the band tee, l02), with the hood up and out over the zipped puffer (l10). Add the chain (l14) and the tote (l15), lined with a plastic bag. Warm, hooded, bikeable, still grunge.

### Lena — r07: "I'm presenting to senior leadership next week. I want to look authoritative but still like me."

**Overall 4/10.** The gap note is honest and useful: it names a blazer, a collared or fine-knit top and straight black trousers as real buys. But the core claim that she has 'one usable bottom' is wrong. The black cargo trousers l06 are the obvious authority piece here, and they never appear. As a result, all three looks are the same green-jumper-and-tartan-mini base with a different jacket, so range is effectively zero. That base is her gig outfit, and the red-tartan-with-green-cable pairing drifts toward the preppy she explicitly rejects. Look 2 is the only one worth sending, as the 'most her' option. It should sit alongside an l06 trouser look and possibly the l08 layered slip dress, so Lena gets a real choice of how much authority to dial up. Look 3 should be cut.

**Look 1: Tartan Authority** — Slouchy knit over a sharp tartan mini, all in deep colours and anchored by black boots: authority with an edge.
- Pieces: Red tartan wool mini skirt · Forest green chunky jumper · Black opaque tights · Black leather lace-up boots · Vintage brown leather jacket · Chunky silver chain necklace · Black canvas tote
- How to wear: Half-tuck the front of the green jumper into the skirt so the waist shows and the knit stays oversized. Wear the black tights and lace-up boots, with the laces tight and neat. Put the leather jacket on over the jumper and leave it open. Wear the chain outside the jumper's neckline. Carry the tote across your body for the ride.
- Judge: brief 3, like-client 4, resolved 3, idea 2, finished 4, explanation 3 · sign-off: no
- Wearable and recognisably Lena, but it's a recycled gig look. The green-on-red-tartan pairing risks reading preppy rather than authoritative.
- Failures: SAFE_DEFAULT (This is essentially her gig outfit (l07 + l13 + l11) with l04 swapped for l01. It doesn't answer 'authoritative'. A red tartan mini is the lowest-authority bottom she owns for a leadership presentation, while black cargo trousers l06 sit unused.); CLASH_WITHOUT_LOGIC (Forest green cable knit l04 over red/black tartan l07 tips toward a Christmas or school-uniform, preppy read. That is exactly what her DNA rejects, and the brown leather l09 adds a fifth colour story without tying anything together.); COULD_BE_MORE_PRACTICAL (The open, warmth-3 leather jacket on a bike at 4°C in a cold wind will let the wind straight in. Fastening it for the ride, or using the puffer l10, would be warmer.); WEAK_EXPLANATION (It asserts this is 'the closest her wardrobe gets to senior leadership' without testing the obvious alternative, l06.)

**Look 2: Green Knit, Tartan Edge** — The deep green knit is the colour moment, with the tartan mini and black legs and boots underneath. The puffer is just for the ride, so the knit and chain are what leadership sees.
- Pieces: Forest green chunky jumper · Red tartan wool mini skirt · Black opaque tights · Black leather lace-up boots · Black cropped puffer · Chunky silver chain necklace · Black canvas tote
- How to wear: Push the jumper sleeves to the elbow and half-tuck just the front into the tartan skirt, so the knit stays oversized over the short fitted skirt. Wear the black tights and lace-up boots, laces tight and neat. Wear the chain outside the neckline, over the knit. Ride in the cropped puffer, which ends above the skirt hem and stays clear of the saddle, with the tote across your body. At the venue, take the puffer off and either stuff it into the tote or hang it up, so you present in the jumper, skirt and chain.
- Judge: brief 3, like-client 4, resolved 3, idea 3, finished 4, explanation 4 · sign-off: yes
- This is the most practical of the three. The cropped puffer l10 is right for a windy ride and stays clear of the saddle, and presenting in the knit with the chain l14 is a clear, deliberate decision. Still, a mini is a soft answer to 'authoritative'.
- Failures: SAFE_DEFAULT (It uses the same l04 + l07 + l13 + l11 base as Look 1. The only real change is the ride layer, l10.); CLASH_WITHOUT_LOGIC (The same green-knit-over-red-tartan issue remains. With no jacket on while she presents, it's even more exposed: the cable knit plus tartan mini reads collegiate.)
- Code checks: TOO_SIMILAR — Shares most of its clothing with look 1.

**Look 3: Leather Closed** — The vintage leather jacket, fastened, as the serious layer: a more buttoned-up, structured take on the same base, with her own history in it.
- Pieces: Vintage brown leather jacket · Forest green chunky jumper · Red tartan wool mini skirt · Black opaque tights · Black leather lace-up boots · Chunky silver chain necklace · Black canvas tote
- How to wear: Half-tuck the front of the green jumper into the tartan skirt, then fasten the leather jacket so its hip-length hem sits over the jumper and the knit doesn't hang below it. Push the jacket sleeves up slightly so the jumper cuffs show, and let the green collar and the chain sit at the neckline. Wear the black tights and lace-up boots with the laces tight and neat. Carry the tote across your body for the ride, and keep the jacket on while you present.
- Judge: brief 2, like-client 3, resolved 2, idea 2, finished 3, explanation 3 · sign-off: no
- Fastening the jacket doesn't create structure. It compresses a chunky knit into a bulky shape and keeps her in her coat for the presentation. This look should have been replaced.
- Failures: PROPORTION_PROBLEM (Fastening the boxy hip-length l09 over the chunky oversized cable knit l04 creates a bulky, straining torso. It also hides the half-tuck the styling notes ask for, so the instructions contradict themselves.); IMPRACTICAL (Presenting indoors in a fastened leather jacket over a warmth-4 wool jumper will be hot and stiff. Keeping outerwear on reads as 'just arrived', not authoritative.); SAFE_DEFAULT (The stylist admits this is a near-duplicate of Look 1. It adds nothing to the set.)
- Code checks: REPEATED_LOOK — Identical to look 1.; TOO_SIMILAR — Shares most of its clothing with look 1.; TOO_SIMILAR — Shares most of its clothing with look 2.

_Stylist's note: Honest gap: almost everything in this wardrobe is formality 1–2, and her only 3/5 piece (the satin slip dress) is too light for 4°C and risky on a bike. She has one usable top, one usable bottom and one usable pair of shoes today, so the three looks share a base and differ in outerwear and styling. A black blazer, a plain black or white collared shirt or fine-knit top, and straight black trousers would give her real authority for the presentation without losing her style._

**Missed opportunity:** The authority look this wardrobe can actually make:
- Forest green jumper l04, half-tucked into the black cargo trousers l06 so the waist shows over a long black leg column.
- Chunky black boots l11 for one dark line from waist to floor.
- Chunky silver chain l14 at the neck.
- Cropped puffer l10 for the ride, taken off to present; the open leather jacket l09 is the alternative.
- Tote l15.
It keeps her oversized-over-relaxed workwear (Our Legacy Work Shop) proportion, puts her best colour at her face, is warm and fine on a bike, and reads far more serious than a tartan mini. A strong second option the stylist dismissed too quickly is the 90s grunge layer: l08 slip dress with l04 worn over it, plus l13 tights, l11 boots and l09 jacket. The midi satin hem is the most 'senior' line she owns, and the tights and jumper make it warm enough.

### Lena — r08: "Wedding guest — outdoor afternoon ceremony, and the forecast says it might rain."

**Error:** 400 {"type":"error","error":{"type":"invalid_request_error","message":"Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits."},"request_id":"req_011ChDTEUAdrv8vyynF2MoAG"}

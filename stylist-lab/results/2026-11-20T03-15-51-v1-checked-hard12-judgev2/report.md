# v1-checked

Conditions in code → generate (Sonnet 5.5, high) → code checks → revise only if a check fails. Judge v2.

## Scorecard

| Metric | Value |
|---|---|
| Overall (1–10) | **5.8** |
| Stylist would sign off | 40.0% of looks |
| Looks with a critical failure | 5 of 36 |
| Critical failures (code checks / judge) | 0 / 5 |
| Answers the brief | 3.3 |
| Feels like the client | 3.8 |
| Visually resolved | 3.5 |
| Has an idea | 3.2 |
| Finished | 3.5 |
| Explanation | 3.5 |
| Uses the wardrobe's best | 3.1 |
| Range across the three looks | 2.9 |
| Cost per request (engine) | $0.064 |
| Model calls per request | 1.6 |
| Response time | 42.4s |
| Judge cost (whole run) | $0.954 |
| Errors | 0 |

## By wardrobe

| Wardrobe | Overall | Sign-off | Wardrobe's best |
|---|---|---|---|
| Maya — expressive print-led maximalist (London) | 6.0 | 44.4% | 3.3 |
| Daniel — tailored Scandinavian menswear (Copenhagen) | 5.5 | 33.3% | 3.0 |
| Sarah — basics-heavy casual (Sydney) | 6.3 | 55.6% | 3.3 |
| Lena — small streetwear/vintage wardrobe (Berlin) | 5.0 | 16.7% | 2.5 |

## Most common failures

| Failure | Count |
|---|---|
| COULD_BE_MORE_PRACTICAL | 20 |
| SAFE_DEFAULT | 14 |
| WEAK_EXPLANATION | 13 |
| PROPORTION_PROBLEM | 8 |
| UNFINISHED | 7 |
| NOT_HER_STYLE | 5 |
| BAD_COLOUR_AT_FACE | 5 |
| CLASH_WITHOUT_LOGIC | 4 |
| IMPRACTICAL | 3 |
| TOO_SIMILAR | 2 |
| REPEATS_KNOWN_MISS | 2 |
| WRONG_REGISTER | 1 |
| NO_REAL_TECHNIQUE | 1 |
| WRONG_FOR_WEATHER | 1 |

## Every case

### Maya — r04: "It's raining all day and I'll be walking a lot. What should I wear?"

**Overall 6/10.** The weather logic is mostly sound. The trench, tights, boots and rain boots are all reasonable, Look 2 is a safe and correct adaptation, and Look 1's cobalt-mustard pairing is a good idea.

The set is under-styled for a print-led client, though:
- Every look disappears into a black trench, black legs and a black bag outdoors.
- The silk scarf (m84) and red bag (m74), the obvious ways to put colour and print on top of the coat, are never used.
- Look 3's blazer-under-trench idea fails on proportion and practicality.
- The explanations overclaim: crepe is rain-safe, and Look 3 is 'best for a long walk' despite the bulk.

It is competent and wearable, but not yet what a top studio would send.

**Look 1: Mustard and Cobalt Downpour** — Colour-on-colour joy with a sharp waist, built to survive a wet walk.
- Pieces: Cobalt merino jumper · Mustard pleated midi skirt · Black opaque tights · Black flat knee-high boots · Black belted trench coat · Wide black leather belt · Chunky gold hoop earrings · Black leather tote
- How to wear: Tuck the cobalt merino fully into the high-waisted pleated skirt and cinch the wide black belt over the jumper at the narrowest point. Wear the opaque tights with the flat knee-high boots so the midi hem sits just over the boot tops and stays off the wet pavement. Belt the trench over the top and fold the collar flat so the cobalt and gold hoops show at the face.
- Judge: brief 4, like-client 3, resolved 4, idea 4, finished 3, explanation 3 · sign-off: yes
- The cobalt-and-mustard pairing (m10 + m21) extends her proven colour-on-colour formula well. With the knee-high boots and tights it's sensibly weatherproofed. But as styled, the street view is a black trench and black legs, and there is no print anywhere.
- Failures: UNFINISHED (Under a black trench (m51), with black tights, boots, belt and tote (m88/m67/m85/m71), it reads as all solids in a black frame. She is print-led. The silk floral scarf (m84) at the neck or the red mini bag (m74) would bring her DNA outside the coat.); WEAK_EXPLANATION ('The pleated crepe won't be harmed by rain' is wrong. Crepe can pucker and lose its pleats when wet, and the midi hem falls below the knee-length trench, so it will get wet.); COULD_BE_MORE_PRACTICAL (The wide black belt (m85) over a tucked jumper is hidden under a belted trench all day outside. It shows only indoors, where a bulky double waist is no help.)

**Look 2: Baroque in the Rain** — Her proven showpiece dress, made weatherproof and pitch-ready with a rain-ready trench and boots.
- Pieces: Baroque print wrap midi dress · Black opaque tights · Black leather Chelsea boots · Black belted trench coat · Burgundy wool beret · Chunky gold hoop earrings · Tan structured crossbody bag
- How to wear: Wear the wrap dress with black opaque tights and the Chelsea boots, and belt the trench at the waist over the wrap so the waistline carries through. Add the burgundy beret, pulled slightly to one side, to pick up the dress's burgundy. Wear the crossbody across the body to keep your hands free for walking and an umbrella.
- Judge: brief 4, like-client 5, resolved 4, idea 3, finished 4, explanation 4 · sign-off: yes
- The adaptation is smart. Swapping the suede boots (m61) for the Chelsea boots (m60) is right for rain, and the burgundy beret (m87) picks up the print and finishes the head. It is the most 'her' look of the three, though it is a safe one.
- Failures: SAFE_DEFAULT (This re-runs her best-known look (m30) and only swaps in rain gear. It's reliable but adds no new idea.); COULD_BE_MORE_PRACTICAL (The tan crossbody (m70) is compact. If this is an office day, there is nowhere for a laptop. The silky jersey midi hem will also sit below the trench and wick rain.)

**Look 3: Check Mate** — The never-worn oversized check blazer finally gets a purpose: casual stripes and denim with a tailored, eclectic edge.
- Pieces: Oversized check blazer · Breton stripe top · Mid-blue straight jeans · Wide black leather belt · Black short rain boots · Black belted trench coat · Chunky gold hoop earrings · Stack of gold bangles · Black leather tote
- How to wear: Tuck the Breton top into the high-rise jeans and add the wide black belt to mark the waist. Wear the check blazer open over it and push the sleeves up slightly so they don't bunch, then belt the trench over everything. The ankle-length jeans sit just above the rain boots so the hems stay dry. Add the hoops and the stack of gold bangles.
- Judge: brief 4, like-client 3, resolved 2, idea 3, finished 3, explanation 3 · sign-off: no
- The rain boots (m69) and ankle-length jeans are the most practical answer to a long wet walk, and trying the unworn check blazer is the right instinct. But burying it under a trench means nobody sees it outdoors, and indoors she gets bulk. The stylist admits as much and sends it anyway.
- Failures: PROPORTION_PROBLEM (An oversized boyfriend blazer (m45) under a belted trench (m51) on a 164cm hourglass with short legs means shoulders and sleeves fighting the coat and a swamped torso. This is close to her known 'too much volume' miss.); IMPRACTICAL (An oversized wool blazer will barely fit under a fitted gabardine trench. 'Push the sleeves up' contradicts wearing a coat over it, so she will be wrestling layers all day.); CLASH_WITHOUT_LOGIC (The wide black belt (m85) with the brown/rust check sits awkwardly. It is also invisible under two jackets, so it does nothing for the waist.); SAFE_DEFAULT (Breton, jeans and a blazer is the generic off-duty formula. Outside the coat, only black rubber boots and a black trench are seen.)

_Stylist's note: The black belted trench (m51) is the only rain-ready coat in the wardrobe, so it appears in every look. The camel coat, puffer and faux-fur are all marked not rain-ready today. The wardrobe has no rain-ready outerwear with colour or print, so the trench carries all three looks; the colour and print come from what is underneath._

**Missed opportunity:** A print-mixed, colour-forward rain look:
- Leopard silk blouse (m01) tucked into the mustard pleated midi skirt (m21), with the cobalt merino (m10) over it and the leopard collar out.
- Black opaque tights (m88) and flat knee-high boots (m67).
- Black trench (m51) with the rust/navy floral silk scarf (m84) knotted at the throat, so print shows outside and the black collar stays off her face.
- Burgundy beret (m87), red leather mini bag (m74) as a pop against the trench, and gold hoops (m80).
This brings leopard, floral and colour-blocking into a genuinely rain-ready outfit.

### Maya — r07: "I'm presenting to senior leadership next week. I want to look authoritative but still like me."

**Overall 6/10.** Look 1 is a safe, correct send that I would sign off. Look 2 falls back on the black blazer and near-total black that her history and Style DNA warn against. Look 3 has the right idea of finally wearing m45, but the cropped-trouser proportion and casual register undercut the 'authoritative' ask. The set is competent and directive-safe but misses the obvious synthesis: the check blazer as a print-mixed suit jacket over her leopard silk and pressed trousers. It also ignores other pitch-polish tools she owns, such as the emerald puff-sleeve blouse m02 as a sharp, colour-forward top and the waist-length pink tweed jacket m42, whose cropped length suits her proportions. Send Look 1 now, and revise Looks 2 and 3 before they reach her.

**Look 1: The Baroque Boardroom** — Your signature print dress, made pitch-ready with opaque tights, flat knee-high boots and a camel coat, so the print gives you presence without any fuss.
- Pieces: Baroque print wrap midi dress · Black opaque tights · Black flat knee-high boots · Camel wool longline coat · Black leather tote · Chunky gold hoop earrings · Stack of gold bangles
- How to wear: Wrap the dress snug so the waist seam sits at your natural waist, and check the neckline lies flat. Wear black opaque tights with the flat knee-high boots, which cover the leg from hem to boot top. Add the gold hoops and bangles and no other jewellery, so the print stays the focus. Wear the camel coat open over the dress on the way in and take it off at the door. Carry the black tote for your laptop.
- Judge: brief 4, like-client 5, resolved 4, idea 3, finished 4, explanation 4 · sign-off: yes
- A sound, weather-proof and directive-safe answer. The wrap dress (m30) marks her waist, covers her arms and puts warm burgundy and gold at her face, and the continuous black leg from m88 into m67 lengthens her short legs under a midi. It is a reprise rather than a step up in polish, but it would genuinely serve her.
- Failures: SAFE_DEFAULT (This is essentially the proven gallery look (m30) with tights and knee-high boots (m67/m88) swapped in. Nothing makes it read as 'pitch' rather than 'opening'. It lacks the one sharp, authority-signalling element her DNA calls for, for example pearl drops (m81) instead of the hoops for a more polished face, or a structured layer.)

**Look 2: Leopard Tailoring** — A sharp black trouser suit look, with your leopard silk as the personality and a belt to keep your waist in view.
- Pieces: Leopard print silk blouse · Black tailored wide-leg trousers · Wide black leather belt · Black tailored blazer · Black slingback kitten heels · Black belted trench coat · Black leather tote · Chunky gold hoop earrings · Stack of gold bangles
- How to wear: Tuck the leopard blouse fully into the high-rise trousers and fasten the wide black belt over it to mark your waist. Leave the top button undone and the cuffs unrolled so your arms stay covered. Wear the blazer open and shoulders square, with the gold hoops and bangles. The trouser hem should skim the top of the slingbacks, and the 4cm heel keeps the leg line long. Wear the belted trench for the commute.
- Judge: brief 4, like-client 2, resolved 3, idea 2, finished 3, explanation 3 · sign-off: no
- Authoritative, yes, but it is her Friday look in a corporate costume. Swapping m40 for the check blazer m45 would turn it into confident print-mixing and make this the best look of the set.
- Failures: REPEATS_KNOWN_MISS (It reaches for the black blazer (m40), which her own notes call her default safe layer and which made a colourful piece feel corporate before.); NOT_HER_STYLE (Everything is black except the blouse: m40, m23, m85, m65, m51 and m71. That drifts toward the corporate all-black she says would betray her style, with the leopard (m01) doing all the work.); BAD_COLOUR_AT_FACE (Black blazer lapels and a black trench frame her face. The stylist claims the leopard rescues this, but the black still dominates the upper body.); COULD_BE_MORE_PRACTICAL (Open-back slingbacks (m65) at 9°C in drizzle, with full-length wide-leg hems catching wet pavements. The stylist even admits they are cold. Chelsea boots (m60) would hide under the wide leg and stay dry.)

**Look 3: Check Blazer, Finally** — Your unworn oversized check blazer, kept in proportion by slim trousers and a pop of cobalt.
- Pieces: Oversized check blazer · Cobalt merino jumper · Navy cropped cigarette trousers · Wide black leather belt · Black leather Chelsea boots · Camel wool longline coat · Silk floral scarf · Black leather tote · Chunky gold hoop earrings
- How to wear: Tuck the cobalt merino into the navy cigarette trousers and fasten the black belt over it so your waist shows when the blazer is open. Wear the blazer open and slightly pushed up at the sleeves so the cuff doesn't swamp your hands. Tie the silk scarf loosely at your neck so the rust and navy repeat the blazer and trousers. Finish with the Chelsea boots and the gold hoops. Wear the camel coat over the top to travel.
- Judge: brief 3, like-client 4, resolved 3, idea 4, finished 4, explanation 4 · sign-off: no
- Good instinct: it finally activates the unworn check blazer (m45), cobalt (m10) against rust check is a smart complementary pairing, and the check plus floral scarf (m84) is real print-mixing. However, the stylist concedes this is the most relaxed look, which is the wrong direction for 'authoritative' at a senior presentation.
- Failures: PROPORTION_PROBLEM (A hip-length boyfriend blazer (m45) over cropped cigarette trousers (m27) cuts her leg twice, at the hip and again at the ankle. The crop also leaves a navy-to-black break at the Chelsea boot (m60). On a client with short legs relative to her torso, that shortens her. A full-length high-rise trouser would fix it.); CLASH_WITHOUT_LOGIC (The black belt (m85) and black boots drop stray black into a cobalt, navy and rust story. The black has no echo anywhere else in the look.)

_Stylist's note: Look 1 is the strongest answer to the brief. For the pitch, wear it with your camel coat, and keep the trench ready in case it pours._

**Missed opportunity:** Combine Looks 2 and 3: the oversized check blazer m45 worn open over the leopard silk blouse m01, fully tucked into the pressed black wide-leg trousers m23. Add Chelsea boots m60 hidden under the wide hem, hoops m80 and bangles m82, the trench m51 for the commute and the tote m71. It gives pressed-crease authority, warm brown and rust tones at the face, Dries-style print-mixing with intent, a first wear for her unworn blazer, and no black blazer.

### Maya — r08: "Wedding guest — outdoor afternoon ceremony, and the forecast says it might rain."

**Overall 6/10.** The stylist read the wardrobe well, reaching for the baroque wrap, the emerald velvet, the pink tweed and the never-worn check blazer, and was honest about the missing umbrella and the lack of formal rain-ready shoes. Execution against an outdoor, drizzly 9°C ceremony is uneven. Look 1 is the only one I'd send as-is, and even it lets a black trench dominate at the face where the m84 scarf belonged. Look 2 has the best idea but puts her in ballet flats on wet grass. Look 3 puts kitten heels, floor-skimming trousers and a non-waterproof wool coat into drizzle, and loses her waist under the oversized blazer. Swapping m67 boots into Look 2 and moving m45 onto the velvet slip would have made this a strong set.

**Look 1: Baroque Wrap, Weatherproofed** — Her signature baroque wrap, which already worked at a gallery opening, rebuilt for a wet outdoor wedding with a trench and flat boots.
- Pieces: Baroque print wrap midi dress · Black opaque tights · Black flat knee-high boots · Black belted trench coat · Tan structured crossbody bag · Chunky gold hoop earrings · Stack of gold bangles
- How to wear: Wrap the dress snugly so the waist is clearly marked. Wear black opaque tights with the flat knee-high boots, so the leg is one unbroken dark line that makes her legs look longer. Belt the trench over the dress at the natural waist and keep the collar up for the drizzle. Hoops and a few bangles, with the bangles pushed up the forearm so they sit clear of the sleeve cuff. The tan crossbody goes across the body so both hands are free for an umbrella.
- Judge: brief 4, like-client 4, resolved 4, idea 3, finished 4, explanation 4 · sign-off: yes
- This is the right practical answer. The m30 wrap has sleeves and is formality 4, and m67 boots with m88 tights handle wet grass and the cold. Once the black trench is belted over everything, though, the visible outfit is mostly black, which is exactly the trap of the black blazer over the red dress. It needs m84 at the neck to look like Maya rather than a commuter.
- Failures: BAD_COLOUR_AT_FACE (The black trench m51 with its collar turned up puts flat black right at her face. At an outdoor ceremony at 9°C the coat stays on, so this is what everyone sees. The silk floral scarf m84 (rust/navy/cream) knotted at the neck would fix it and add a second print to her baroque.); SAFE_DEFAULT (This is essentially a re-run of her proven gallery look (m30 with hoops) under a black coat. It is reliable but adds no wedding-specific lift. Pearl drops m81 or the burgundy beret m87 would have been an easy, weather-useful upgrade.)

**Look 2: Emerald and Pink, Romantic Edge** — Jewel-toned velvet with a sweet pink tweed jacket and red patent flats: joyful and romantic, with one sharp element in the waist-cropped jacket.
- Pieces: Emerald velvet slip dress · Pink tweed cropped jacket · Black opaque tights · Red patent Mary Jane flats · Black belted trench coat · Red leather mini shoulder bag · Pearl drop earrings
- How to wear: Wear the bias-cut emerald slip with the cropped tweed jacket buttoned or held closed at the waist, so the jacket hem sits on her waist. Add black opaque tights and the red patent Mary Janes. Pearl drops keep the face soft. Carry the red mini bag by its short strap. Travel in the belted trench to protect the velvet, which marks when wet, and take it off at the ceremony if it stops raining.
- Judge: brief 3, like-client 4, resolved 4, idea 4, finished 4, explanation 3 · sign-off: no
- Emerald velvet m38 with the pink tweed m42 is a genuinely joyful, Gucci-tinged idea that is right for her colouring. It also puts two under-worn pieces to work. The weak point is the shoes for an outdoor wet ceremony, and the look depends on the trench and an umbrella just to survive.
- Failures: COULD_BE_MORE_PRACTICAL (The red patent Mary Jane flats m62 are low-cut ballet flats. At an outdoor ceremony on drizzle-wet grass at 9°C her feet will get wet and cold. The flat knee-high boots m67 would keep the colour story and solve it.); COULD_BE_MORE_PRACTICAL (The note says to take the trench off if it stops raining. That would leave a velvet slip and a boxy boucle crop for standing outside at 9°C, which is too optimistic. Velvet that marks when wet is also a real risk in drizzle.); WEAK_EXPLANATION (Calling the boucle cropped jacket m42 the 'sharp element' doesn't hold, because boucle is soft and sweet. The link to her navy-floral, cobalt and red Mary Jane formula is also loose.)

**Look 3: Check Blazer, Finally Worn** — Her unworn oversized check blazer, finally in use, over gold satin and sharp black trousers for a warm and slightly unexpected wedding look.
- Pieces: Oversized check blazer · Gold satin V-neck camisole · Black tailored wide-leg trousers · Black slingback kitten heels · Camel wool longline coat · Beaded evening clutch · Chunky gold hoop earrings · Stack of gold bangles
- How to wear: Tuck the gold camisole into the high-rise black wide-leg trousers so the waist shows. Wear the blazer open with the sleeves pushed to the forearm, so the gold shows down the front and the line stays vertical. Wear the kitten heels so the trouser hem skims the floor and lengthens the leg. Add hoops and bangles, and carry the beaded clutch. Put the camel coat on over everything for the walk and the wait.
- Judge: brief 2, like-client 3, resolved 3, idea 3, finished 3, explanation 4 · sign-off: no
- Finally wearing the m45 check blazer is a good instinct, and rust check with gold satin m03 is a smart warm-colour pairing. But this version is styled for an indoor evening, not an outdoor ceremony in the wet. It belongs with the emerald velvet and boots instead.
- Failures: IMPRACTICAL (There are three problems for an outdoor ceremony in drizzle. The kitten-heel slingbacks m65 sink into grass and leave her feet bare to the wet and cold. The note itself tells her to 'stay on paths'. And m23 is styled to skim the floor, so the hems will soak up water and mud.); COULD_BE_MORE_PRACTICAL (The camel wool coat m50 is not rain-ready, and drizzle is the actual forecast, not a contingency. Making the trench a 'downpour swap' is backwards.); PROPORTION_PROBLEM (An oversized hip-length boyfriend blazer worn open over wide-leg trousers hides the defined waist she likes to mark, and cuts her short legs at the hip. The wide black belt m85 over the blazer would have restored the waist.); NOT_HER_STYLE (Black tailored trousers plus a single check reads more menswear-minimal than print-mixing and romantic. There is no second print or romantic note, apart from the beaded clutch m73.)

_Stylist's note: The wardrobe has no umbrella, so bring one. It matters most for looks 2 and 3, where the velvet and the camisole mark when wet. The black trench is the only rain-ready coat. There is also no flat, rain-ready shoe at formality 4–5. The flat knee-high boots and patent Mary Janes are the best available, and they hold up better on wet grass than the suede boots, calf-hair loafers or gold sandals._

**Missed opportunity:** Put the unworn check blazer to work on a weather-proof base: m38 emerald velvet slip dress with m45 oversized check blazer, cinched at the waist with m85 wide black belt. Add m88 tights and m67 flat knee-high boots, with m51 trench on top and m84 silk floral scarf at the neck to keep print near the face. Finish with m81 pearl drops and m74 red mini bag. Emerald against rust check is warm and Dries-like, the waist is marked, and the shoes and coat handle wet grass.

### Daniel — r04: "It's raining all day and I'll be walking a lot. What should I wear?"

**Overall 6/10.** The edit is sensible. Rain-incompatible pieces (suede, the overcoat, loafers) are correctly excluded, d55 and d41 are rightly made the backbone, and every look respects the cycling directive. However, Looks 1 and 3 share the same jacket, boots and all accessories, so the range is narrower than it appears. Only Look 2 deals with the hood problem, and it does so by burying its idea under black nylon. Look 3 has the most personality but puts cotton cords into all-day heavy rain. Some styling notes are garbled or inaccurate. The recommendation is competent and wearable, but it needs a second pass on head protection, layering warmth and trouser fabric before it reaches the client.

**Look 1: Waxed and Woolly** — Quiet charcoal, grey and olive, built to take the weather and still look like a studio partner.
- Pieces: Charcoal lambswool roll-neck · Grey flannel trousers · Brown leather lug-sole boots · Olive waxed cotton jacket · Navy wool scarf · Grey cashmere beanie · Brown leather belt · Steel field watch · Black roll-top leather backpack
- How to wear: Wear the roll-neck tucked loosely under the waxed jacket and keep the corduroy collar up against the wind. Roll the flannel trousers once or twice so the hem clears the lug-sole boots and stays out of the chain. Tuck the navy scarf inside the jacket front so it can't flap. Put the beanie on under the rain hood-free collar and carry everything in the roll-top backpack.
- Judge: brief 4, like-client 4, resolved 4, idea 3, finished 4, explanation 3 · sign-off: yes
- A dependable, correctly weighted rain look in colours that suit his cool colouring, and d55 is the right shoe for the day. The weak point is that d41 has no hood and there is no backup for the head in a full day of heavy rain.
- Failures: SAFE_DEFAULT (This is his proven winter presentation formula (d05 + d21 + boots) with d41 swapped in for the overcoat. It is sound, but it does nothing towards his stated wish to move beyond grey and navy.); COULD_BE_MORE_PRACTICAL (d41 has no hood. In all-day heavy rain with a lot of walking, the cashmere beanie (d63) will be soaked within the hour. Pack d42 in d60 for the worst downpours, or add d43 under d41 for extra warmth against the wind.); WEAK_EXPLANATION (Two instructions don't make sense. 'Put the beanie on under the rain hood-free collar' is garbled. 'Roll-neck tucked loosely under the waxed jacket' is not a real styling instruction. Rolling flannel hems is also clumsy on a 188cm frame; a trouser clip would be cleaner.)

**Look 2: Fisherman in the Rain** — Cream cable knit and navy tailoring, with the black shell kept as the quiet outer layer.
- Pieces: Cream fisherman jumper · Navy pleated wool trousers · Black leather Chelsea boots · Charcoal quilted liner jacket · Black technical rain shell · Navy wool scarf · Grey cashmere beanie · Steel field watch · Black roll-top leather backpack
- How to wear: Leave the chunky fisherman jumper untucked so the hem sits just below the waistband. Layer the light charcoal quilted liner over the jumper, then pull the black shell over both. The liner stays dry under the shell, and both are hip length so they clear the saddle. The pleated trousers are tapered, so they clear the chain without clips, and the hem should sit just above the Chelsea boot. Wrap the navy scarf once and tuck it into the shell, with the beanie for the ride.
- Judge: brief 4, like-client 3, resolved 3, idea 3, finished 4, explanation 3 · sign-off: no
- This is the most weather-proof of the three: it is the only look with a hood, and the warmth is ample. But the idea disappears under the shell, and the triple layering is bulky. Swapping d43 out, or using d41 with d42 packed, would keep the fisherman jumper visible.
- Failures: PROPORTION_PROBLEM (A chunky cable knit (d10) under a quilted liner (d43) under a shell (d42) is a lot of bulk. On his long arms it is likely to bunch at the cuffs and pull the shell sleeves even shorter.); NOT_HER_STYLE (Outdoors, what people actually see is black nylon shell, charcoal quilting, navy trousers and black boots. That reads technical and flat, not texture-led. The cream cable that is meant to be the point of the look is hidden all day.); WEAK_EXPLANATION ('Cream lifts the face' only applies indoors. The claim that tapered pleated trousers clear the chain without clips is doubtful.)

**Look 3: Forest and Chocolate** — Earthy green and brown tonal layering that finally gives the chocolate cords a purpose.
- Pieces: Forest green merino crew jumper · Chocolate wide-wale corduroy trousers · Brown leather lug-sole boots · Olive waxed cotton jacket · Navy wool scarf · Grey cashmere beanie · Brown leather belt · Steel field watch · Black roll-top leather backpack
- How to wear: Wear the forest green merino with the waxed jacket over it, and let the navy scarf show at the collar. Cuff the wide-wale cords two turns so they clear the boot, and keep the leg sitting relaxed over the lug sole. Use the brown belt to match the boots, and keep the beanie in the bag for site stops.
- Judge: brief 3, like-client 4, resolved 4, idea 4, finished 3, explanation 3 · sign-off: no
- This look has the strongest idea of the three and directly answers his wish for warmth and texture, using the under-worn d26 and d12. It is the right outfit on the wrong day: cotton cord in relentless rain undermines it.
- Failures: COULD_BE_MORE_PRACTICAL (Wide-wale cotton cord (d26) below a hip-length jacket in all-day heavy rain will soak, get heavy and stay cold at 5°C with wind. Cuffing it twice adds a bulky, wet roll at the ankle. This is the wrong day to debut the cords.); UNFINISHED (The beanie is kept in the bag 'for site stops', so he walks bareheaded in heavy rain under an unhooded jacket. A fine merino (d12) under d41 alone is also borderline for strong wind at 5°C. Layering d43 under d41 would fix the warmth.); WEAK_EXPLANATION (Forest green merino with an olive jacket is called 'green on green'. The real colour logic is never explained: brown sits low, and green and navy sit at the face.)

_Stylist's note: Suede pieces (d36, d50, d54), the overcoat (d40), the loafers (d53) and the silk tie (d67) were left out because of the rain and the bike. The Oxfords (d56) and the suit were skipped as well, since they weren't right for a wet cycling day. In Look 2 the quilted liner (d43) is worn only under the rain shell, so it stays dry._

**Missed opportunity:** d12 forest green merino + d43 quilted liner worn under d41 waxed jacket + d21 grey flannel trousers + d55 lug boots + d62 scarf + d63 beanie, with d42 shell packed in d60 for the hooded downpours. This gives the colour lift he wants at the face, wool legs that stay warm when damp, and enough insulation against the wind. It also uses the liner the way it was designed, without letting the technical shell become the visible look.

### Daniel — r07: "I'm presenting to senior leadership next week. I want to look authoritative but still like me."

**Overall 5/10.** Look 1 is safe and correct, and Look 3 is a smart use of the neglected corduroy that needs a sharper shoe. Look 2 is the weak link. It orphans the stiff worsted suit jacket over near-matching flannel, pairs it with lug boots, and buries it under a liner and technical shell for the ride. The stylist correctly saw that green is the answer to his aspiration but never put it in the obvious winning frame: d12 + d30 + d21 + d50. The outerwear thinking is honest about the wardrobe's lack of rain-ready tailored outerwear. It still needs a practical fix for blazer hems under hip-length jackets: carry the blazer folded in d60. The looks also lean heavily on the same formula, so range is limited.

**Look 1: Charcoal and Navy, Tonal** — His proven winter presentation formula, with the overcoat swapped for a blazer and waxed jacket so it can be ridden.
- Pieces: Charcoal lambswool roll-neck · Grey flannel trousers · Navy unstructured wool blazer · Black leather Chelsea boots · Black leather belt · Olive waxed cotton jacket · Navy wool scarf · Black roll-top leather backpack · Steel field watch
- How to wear: Roll-neck next to the skin, then the unstructured blazer, then the waxed jacket over both for the ride. Fold the navy scarf inside the waxed collar to block the wind. Roll the right trouser hem once for pedalling and drop it on arrival. Take the waxed jacket off at the door so the blazer and roll-neck are what the room sees. Black belt to match the black Chelsea boots.
- Judge: brief 4, like-client 4, resolved 4, idea 3, finished 4, explanation 4 · sign-off: yes
- A sound, low-risk presentation look that will work on the day. It is his own formula, honestly adapted for the bike, but it does nothing towards his aspiration. The ride layering needs a check: blazer hem against waxed-jacket length.
- Failures: SAFE_DEFAULT (This is his proven win (d05 + d21 + d51) with d30 standing in for the overcoat. That is a defensible choice for a high-stakes room, but it ignores his stated wish to move beyond navy and grey. Swapping d51/d66 for the brown suede derbies d50 and brown belt d65 would add warmth without losing authority.); COULD_BE_MORE_PRACTICAL (The unstructured blazer d30 is normally longer than the hip-length waxed jacket d41, so its hem may hang below and catch rain. Wax can also transfer onto the navy wool. The note should say to check the lengths, or to carry d30 folded in d60 and put it on at arrival.)

**Look 2: Green Under Charcoal** — A broken-up charcoal jacket in worsted against flannel and forest green merino, authoritative but warmer than his usual navy and grey.
- Pieces: Forest green merino crew jumper · Charcoal suit jacket · Grey flannel trousers · Brown leather lug-sole boots · Brown leather belt · Charcoal quilted liner jacket · Black technical rain shell · Navy wool scarf · Black roll-top leather backpack · Steel field watch
- How to wear: Wear the charcoal suit jacket on its own, without its matching trousers, over the green merino crew, with the mid-grey flannel trousers. The worsted against the flannel and the slightly different greys read as separates, not a suit. Brown belt to match the brown boots. For the ride, add the charcoal quilted liner jacket over the suit jacket, then the black rain shell over the liner, which keeps the liner dry, and fold the navy scarf inside the shell collar against the wind. Take the shell, liner and scarf off at the door so the jacket and green merino are what the room sees. The watch is the only accessory on show.
- Judge: brief 2, like-client 2, resolved 2, idea 3, finished 2, explanation 2 · sign-off: no
- The green merino d12 is exactly the right instinct, but it is wrapped in the wrong jacket, the wrong shoe and an unworkable commute stack. Put d12 under d30 with d21 and d50 and the idea would land.
- Failures: CLASH_WITHOUT_LOGIC (Orphaning the structured worsted suit jacket d31 over mid-grey flannel d21 is not a convincing break-up. Two close greys in different cloths read as a mismatched suit rather than deliberate separates. The worsted's smooth face also fights the flannel nap.); CLASH_WITHOUT_LOGIC (The chunky lug-sole boots d55 (formality 2) sit under the stiffest jacket he owns (formality 5) with no bridging piece. The stylist even hedges with 'swap to Chelsea boots if formal', which admits the look isn't settled.); IMPRACTICAL (For the ride, a structured suit jacket goes under the quilted liner d43 and then the technical shell d42. That crushes the shoulders and bunches the sleeves, and the light liner isn't cut to fit over tailoring. He would arrive creased to a senior leadership presentation.); NOT_HER_STYLE (The structured worsted d31 is the stiffest, least 'Daniel' piece in the wardrobe. It belongs to the full-suit outfit that felt over the top. Soft tailoring like d30 is his register.)

**Look 3: Chocolate Cord, Cool Blue** — Bringing the rarely worn chocolate corduroy into a presentation by putting tailoring and cool colour above it.
- Pieces: Pale blue poplin shirt · Forest green merino crew jumper · Navy unstructured wool blazer · Chocolate wide-wale corduroy trousers · Brown leather lug-sole boots · Brown leather belt · Olive waxed cotton jacket · Navy wool scarf · Black roll-top leather backpack · Steel field watch
- How to wear: Wear the pale blue poplin shirt open at the collar, with the green merino crew over it and the collar points laid out over the knit. Add the navy blazer over both. Wear the corduroy trousers with the brown belt and lug-sole boots. For the ride, put the waxed jacket over everything and the scarf inside the collar. Remove the waxed jacket on arrival.
- Judge: brief 3, like-client 4, resolved 4, idea 4, finished 3, explanation 4 · sign-off: no
- A genuinely good discovery look. Chocolate cord with navy, forest green and pale blue at the face is well judged for his cool colouring and answers his aspiration. For this particular brief, though, it needs d50 instead of d55 and a clear 'choose this if the room is relaxed' caveat.
- Failures: UNFINISHED (The lug-sole boots d55 pull an already soft wide-wale cord d26 further toward weekend. The brown suede derbies d50 (crepe sole, grips) would lift the lower half into presentation register and still be rideable.); COULD_BE_MORE_PRACTICAL (There is no pedalling note for relaxed wide-wale cord: it needs a hem roll or clip. The d30 blazer hem against the d41 waxed jacket has the same length and wax issue as Look 1.); WEAK_EXPLANATION (The look doesn't engage with whether wide-wale cord carries 'authoritative' for senior leadership. Calling it 'the softest of the three' isn't guidance; the client needs to know when to choose it.)

_Stylist's note: His only overcoat is not rain-ready and is awkward on a bike, so I've used the waxed jacket and shell for the ride. For Look 2, the quilted liner goes under the shell for warmth. If you take a tram or car on the day, the navy overcoat over Look 1 would be the sharpest finish. The wardrobe has no waterproof tailored outer layer, so the presentation pieces are best kept dry under the waxed jacket or shell. In a downpour wear the black shell over any of these and carry the blazer rolled in the backpack only if the shell won't fit over it._

**Missed opportunity:** The forest green merino d12 under the navy unstructured blazer d30, with grey flannel d21, brown suede derbies d50 and brown belt d65. Commute in d41 with d62 inside the collar and d63 against the wind. It is his proven presentation formula with the colour and warmth he asked for, and it keeps the soft tailoring that is his signature.

### Daniel — r08: "Wedding guest — outdoor afternoon ceremony, and the forecast says it might rain."

**Error:** 400 {"type":"error","error":{"type":"invalid_request_error","message":"Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits."},"request_id":"req_011ChDTEokrNzMpNtbpxRoRS"}

### Sarah — r04: "It's raining all day and I'll be walking a lot. What should I wear?"

**Overall 6/10.** The edit is sensible and honest. The stylist correctly identifies s44 as the only rain layer and s51 as the best wet-weather flat, flags that she has no waterproof shoes or umbrella, and keeps black away from her face throughout. Look 2 is the clear winner and fits her grown-up aspiration. Look 1 is competent but just repeats her existing formula. Look 3 sends a never-worn linen co-ord into all-day rain and long walks, adds hot, bulky layering and uses a fitted tee, so it should not go out as-is. Range is narrow: every look uses the same trench and crossbody, and two use the same trainers. Some of that is forced by the weather, but the shirt options (s08, s17 alone) could have varied the looks more intelligently.

**Look 1: Trench over Tonal Blues** — The easy jeans-and-tee uniform, sharpened with navy, light denim and a proper trench so it reads put-together even in the wet.
- Pieces: Navy tee · Light-wash straight jeans · White leather trainers · Beige trench coat · Black nylon crossbody · Small gold hoops · Silver watch
- How to wear: Tuck the front of the navy tee loosely into the high-rise jeans. Cuff the jeans twice to just above the ankle bone so the hem clears the trainers and doesn't wick up water. Belt the trench and turn the collar up. Wear the nylon crossbody under the trench so it stays dry, and add the small hoops and the watch.
- Judge: brief 4, like-client 4, resolved 4, idea 3, finished 4, explanation 4 · sign-off: yes
- A sound, flattering rain-day uniform. Navy at the face, the trench belted with its collar up and the crossbody under the coat are all right calls. It is the safe answer rather than the sharp one, and gold hoops with a silver watch is an unaddressed metal mix.
- Failures: SAFE_DEFAULT (This is her known jeans-and-tee formula with s05 swapped in for s07. It is correct, but it does nothing towards 'a bit more interesting'. The s08 light blue oversized shirt would have given the same tonal-blue idea more shape and polish at the face.); COULD_BE_MORE_PRACTICAL (s21 denim will get heavy and slow-drying in all-day rain even when cuffed, and the white leather s50 trainers will mark on wet pavements. Workable, but worth flagging.)

**Look 2: Navy Shirt Dress, Boots On** — One-piece dressing that looks grown-up and clean, with boots doing the wet-weather work.
- Pieces: Navy midi shirt dress · Black ankle boots · Beige trench coat · Black nylon crossbody · Small gold hoops · Fine gold chain necklace
- How to wear: Wear the shirt dress buttoned through with its own belt at the waist, and keep the top button open. Put the trench over it and belt it too, or leave it open with the belt tied loosely behind if the humidity feels heavy. Sleeves of the dress can be pushed to the elbow under the trench. Add the fine gold chain and small hoops, and wear the crossbody under the coat.
- Judge: brief 4, like-client 4, resolved 4, idea 4, finished 4, explanation 4 · sign-off: yes
- The strongest look. The grown-up s36 dress meets her 'more put-together' aspiration, the s51 Chelseas are genuinely the best wet-weather flat she owns, and the black stays at the feet as instructed. The two belts plus a midi peeking under the trench is a lot of horizontal line, but the navy-and-beige palette holds it together.
- Failures: COULD_BE_MORE_PRACTICAL (The s36 midi hem will hang below the knee-length s44 trench and catch rain and spray. Bare legs actually dry faster than denim, which the stylist could have said as a positive.)

**Look 3: Sage Co-ord, Rolled for Rain** — Finally wearing the sage linen set, dressed down with trainers and a trench so it feels relaxed rather than precious.
- Pieces: Sage linen shirt (co-ord) · Sage linen trousers (co-ord) · White fitted tee · White leather trainers · Beige trench coat · Black nylon crossbody · Small gold hoops · Silver watch
- How to wear: Wear the sage shirt open like a light overshirt over the white fitted tee, sleeves pushed up, with the tee tucked into the trousers. Roll the wide-leg trousers two or three turns to above the ankle so they clear the trainers and don't soak up water. Put the trench on top and keep the crossbody underneath it. Add the hoops and the watch.
- Judge: brief 2, like-client 4, resolved 3, idea 3, finished 3, explanation 4 · sign-off: no
- Reviving the sage set is a good instinct and the colour reasoning is right. The stylist honestly admits this is the least rain-proof look, which is exactly why it should have been rethought rather than sent. Use the sage shirt alone with denim on a wet day and save the full co-ord for a dry one.
- Failures: COULD_BE_MORE_PRACTICAL (Today is the wrong day to debut the s17/s27 linen co-ord she has worn once. Wide-leg linen trousers in all-day rain will soak, cling and crease, and rolled wide-leg linen unrolls when you walk a lot. A bad first outing risks her abandoning the set for good.); PROPORTION_PROBLEM (Three layers under the trench (s02 tee, open s17 shirt, then s44) add bulk at her broad shoulders. They are also hot in 21°C humidity.); NOT_HER_STYLE (The s02 fitted tee works against her preference for relaxed, straight shapes. The s01 boxy tee would have been the natural pick.)

_Stylist's note: Only the trench (s44) is rain-ready, so every look relies on it. The wardrobe has no waterproof shoes or umbrella, so the leather trainers and Chelsea boots are the best available. Keep the satin pieces, the leather jacket, the slides and the running shoes for a dry day._

**Missed opportunity:** Bring sage in without risking the linen trousers: s17 sage linen shirt worn as a relaxed overshirt over s01 white boxy tee, with s21 light-wash jeans cuffed above the ankle, s50 trainers, s44 trench belted, s68 tan belt echoing the trench, s61 crossbody under the coat, s63 hoops. It gives her flattering soft colour at the face and a 'more interesting' note, on rain-tolerant bottoms.

### Sarah — r07: "I'm presenting to senior leadership next week. I want to look authoritative but still like me."

**Overall 7/10.** This is a strong, well-reasoned set with a clear winner in Look 1. It makes good use of under-worn pieces (s30, s34, s17/s27, s56), and the stylist's note honestly names the missing lightweight non-black blazer. The weaknesses are three. Metals are mixed across the looks with no rationale; she is cool-toned and silver should lead. Look 2 is the co-ord worn exactly as bought rather than mined for a sharper combination. Look 3 reintroduces the black framing her history warns against.

**Look 1: Quiet Authority** — Tailored navy and soft blue, a crisp column that says senior without a black suit.
- Pieces: Navy pleated trousers · Light blue oversized shirt · Silver ballet flats · Black leather tote · Silver watch · Small gold hoops
- How to wear: Tuck the front of the light blue shirt fully into the high-rise pleated trousers and blouse the back slightly. Leave the top button undone and roll the sleeves to just below the elbow for a sharp, easy line. Keep the trouser hem long enough to skim the top of the silver flats. Wear the silver watch and small gold hoops, and carry the black tote.
- Judge: brief 5, like-client 5, resolved 4, idea 4, finished 4, explanation 4 · sign-off: yes
- This is the right answer. s30 is her only tailored piece, and s08 with s56 keeps it cool-toned, flat and recognisably her. Tucking the oversized shirt at the front is the correct move to stop the poplin widening her broad shoulders.
- Failures: WEAK_EXPLANATION (Gold hoops (s63) at the face are mixed with a silver watch (s65) and silver flats (s56). On a cool, low-contrast client, silver would be the more harmonious metal near the face. Mixing can be deliberate, but the stylist neither chose it on purpose nor explained it.); COULD_BE_MORE_PRACTICAL (The black tote (s60) is the one hard dark note in a soft navy and blue column. It is acceptable for practicality, but it should be acknowledged as a compromise rather than passed over.)

**Look 2: Sage Suit** — The co-ord worn as a deliberate monochrome suit, so it reads like a considered uniform.
- Pieces: Sage linen shirt (co-ord) · Sage linen trousers (co-ord) · Silver ballet flats · Black leather tote · Fine gold chain necklace · Silver watch
- How to wear: Wear the sage linen shirt and wide-leg trousers together as a set. Tuck the shirt in loosely at the front, or half-tuck it, and leave the top button open to show the fine gold chain. Keep the sleeves long and pushed up to the forearm, and steam the set the night before because linen creases. Add the silver ballet flats, silver watch and black tote.
- Judge: brief 3, like-client 5, resolved 4, idea 4, finished 4, explanation 5 · sign-off: yes
- This look is very her: tonal, minimal and a good rescue of a set worn once. The stylist was honest that it sits under the formality target. For a casual tech scale-up it works, but it is the weakest on authority.
- Failures: COULD_BE_MORE_PRACTICAL (An all-linen set (s17/s27) in humid 24°C will be creased by mid-morning, however well it was steamed. Rumpled linen undercuts 'authoritative' in a leadership review.); SAFE_DEFAULT (Wearing the co-ord as intended is the obvious use. Breaking it would give a sharper answer: s17 with the navy tailored s30 puts sage at the face and tailoring below.); WEAK_EXPLANATION (Gold chain (s64) with a silver watch (s65) and silver flats is mixed metal again with no rationale.)

**Look 3: Cobalt Moment** — Her never-worn cobalt satin skirt, grounded by a white shirt and a blazer, for authority with a spark.
- Pieces: Cobalt satin midi skirt · White linen shirt · Black oversized blazer · Black ballet flats · Black leather tote · Small gold hoops · Silver watch
- How to wear: Tuck the white linen shirt neatly into the satin skirt and open the collar by one button. Put the oversized black blazer over the top with the sleeves pushed up slightly, and take it off if the room or the day runs warm. Finish with black ballet flats, small gold hoops, the silver watch and the black tote.
- Judge: brief 3, like-client 3, resolved 3, idea 4, finished 3, explanation 3 · sign-off: no
- Styling the never-worn cobalt skirt is the right instinct, and cobalt with white is a good editorial pairing. The black blazer and shoes drag it back to her old default. Swap to s56 and either drop the blazer or wear it open and pushed back, and it becomes a strong look.
- Failures: BAD_COLOUR_AT_FACE (The black blazer's (s40) lapels frame her face. A white collar between them softens this but does not cancel it, and her profile says black near the face makes her look tired.); REPEATS_KNOWN_MISS (The black blazer, black flats (s52) and black tote (s60) rebuild the heavy black frame she has said felt dated, now around a cobalt skirt she bought to escape it. The silver flats (s56) would carry the cobalt far better.); PROPORTION_PROBLEM (Tucking a relaxed linen shirt (s07) into a bias-cut satin skirt (s34) creates lumps over the hip. Bias satin shows every ridge of a bulky tuck. A thinner, smoother top or a neat front-tuck only is needed.); COULD_BE_MORE_PRACTICAL (A polyester blazer in 24°C humidity is warm. Satin also marks with sweat and creases when she sits through a presentation.)

_Stylist's note: The wardrobe is thin on warm-weather tailoring: there is one pair of tailored trousers and one blazer, and the blazer is black. A lightweight blazer in navy, grey or soft white would suit her colouring better and give the sage and navy looks a stronger top layer. Look 1 is the strongest for the presentation. Look 3 is the boldest option and a good way to start wearing the cobalt skirt._

**Missed opportunity:** Break the co-ord: s17 sage linen shirt tucked into s30 navy pleated trousers, with s56 silver flats and s65 silver watch, and s44 beige trench over the arm for the commute. This puts a flattering soft cool colour at the face, keeps her only tailored piece doing the authority work, and avoids the full linen-crease risk of Look 2.

### Sarah — r08: "Wedding guest — outdoor afternoon ceremony, and the forecast says it might rain."

**Overall 6/10.** The stylist found the right anchors: the cobalt skirt, the sage co-ord and her only tailored trousers. The note on what the wardrobe lacks (a structured top, a clutch) is honest and useful. But the black blazer is used twice, putting black at her face despite her stated colouring issue, and it piles layers into a humid 24°C day. The rib tank is too casual for a wedding, and all three looks share the same bag, jewellery and trench, so range is thin. Look 2 is close to excellent with a shirt swap. Looks 1 and 3 need the blazer replaced and the silver flats brought in before they go to the client.

**Look 1: Navy Tailoring, Softened** — Quiet, grown-up tailoring in navy and cream, the polished version of her relaxed minimal style.
- Pieces: Navy pleated trousers · Cream ribbed tank · Black oversized blazer · Black ballet flats · Beige trench coat · Black nylon crossbody · Small gold hoops · Fine gold chain necklace · Silver watch
- How to wear: Tuck the cream ribbed tank into the high-rise navy pleated trousers so the wide-straight leg falls clean to the ankle. Wear the oversized black blazer open with the sleeves pushed up slightly. Take it off for the ceremony if the humidity builds. Add the fine gold chain, small hoops and silver watch, and carry the crossbody. Keep the trench folded or over your arm in the sun and belt it on if showers arrive.
- Judge: brief 3, like-client 3, resolved 3, idea 2, finished 3, explanation 3 · sign-off: no
- The navy pleated trousers (s30) are the right anchor for a rain-safe look, but this answer uses her two weakest moves: black at the face and a gym-level tank. Swap in s07 tucked with sleeves rolled, the silver flats (s56) and the trench as the only layer for a properly grown-up navy-and-white look.
- Failures: BAD_COLOUR_AT_FACE (The black polyester blazer (s40) frames her face with its lapels. The cream tank only partly softens it on low-contrast, cool colouring she has said goes harsh in black.); COULD_BE_MORE_PRACTICAL (At 24°C and humid, a polyester blazer plus a trench belted over it is heavy and hot. The trench (s44) alone could be the smart layer and the rain layer.); SAFE_DEFAULT (Navy trousers, black blazer, black flats and a black bag drift back towards her dark default. Navy against black reads muddy rather than chosen.); WRONG_REGISTER (Without the blazer (which she is told to remove), a rib-jersey tank (s13, formality 1/5) is too casual a top for a wedding. A tucked white linen shirt (s07) or the light blue poplin (s08) would hold the register.)

**Look 2: Cobalt Finally Gets Its Moment** — One strong cool colour with everything else kept soft and simple.
- Pieces: Cobalt satin midi skirt · Cream ribbed tank · Silver ballet flats · Beige trench coat · Black nylon crossbody · Small gold hoops · Fine gold chain necklace
- How to wear: Tuck the cream ribbed tank fully into the cobalt satin skirt so the bias-cut midi skims over her slim hips. Add the silver pointed flats, gold hoops and the fine chain, and leave the rest bare. Wear the trench open over the top as the arrival layer, and belt it if it rains. The trench ends at the knee, so a few centimetres of satin hem will still show below it. If a downpour hits, stay under cover, because satin water-spots.
- Judge: brief 3, like-client 4, resolved 4, idea 4, finished 3, explanation 4 · sign-off: yes
- This is the best idea in the set: it finally wears the never-worn cobalt skirt (s34) with silver flats and keeps everything calm, exactly 'interesting but not loud'. Upgrading the tank to the white linen shirt would make it the look to send first.
- Failures: COULD_BE_MORE_PRACTICAL (Satin (s34) and metallic flats (s56) are fragile on wet grass. This is honestly flagged, but it is the real risk on a rain forecast.); UNFINISHED (The rib tank (s13) is the most casual possible partner for satin. The proven white linen shirt (s07), tucked with sleeves pushed up, would be more grown-up, give ceremony coverage and suit her shoulders better.); UNFINISHED (The black nylon crossbody (s61) cheapens a satin look. It is unavoidable here, but wear it short and close, or skip it and use the trench pockets.); WEAK_EXPLANATION (It claims cobalt is one of her best colours 'near the face', but this is a skirt. The colour sits at the hem, not the face.)

**Look 3: Sage Co-ord, Dressed Up** — An easy tonal set in a soft cool green, worn crisp and finished with gold.
- Pieces: Sage linen shirt (co-ord) · Sage linen trousers (co-ord) · Black oversized blazer · Black ballet flats · Beige trench coat · Black nylon crossbody · Small gold hoops · Fine gold chain necklace · Silver watch
- How to wear: Steam the set well. Button the sage linen shirt up to the second button and tuck it in. Leave the sleeves unrolled so the cuffs just show below the sleeves of the oversized black blazer. Wear the blazer open over the shirt, and let the wide-leg trousers fall over the tops of the black flats. Add the chain, hoops and watch. Take the blazer off for the ceremony if the humidity builds, and carry it over your arm. Belt the trench over the blazer if it rains.
- Judge: brief 3, like-client 4, resolved 3, idea 3, finished 3, explanation 4 · sign-off: no
- A sage linen suit (s17+s27) is a genuinely good, very Jenni Kayne answer for a relaxed outdoor wedding, and the formality caveat is honest. Drop the black blazer, wear the set alone with the shirt collar open, add silver flats, and carry the trench for rain.
- Failures: BAD_COLOUR_AT_FACE (A black blazer (s40) over soft sage linen creates a hard contrast block. It fights her low-contrast colouring and the tonal idea.); COULD_BE_MORE_PRACTICAL (Three layers (shirt, blazer, belted trench) at 24°C and humid is too much. Linen will also crease and wilt under them.); UNFINISHED (Black round-toe flats (s52) weigh down a soft tonal set. The silver pointed flats (s56) would lift it and add the occasion polish it lacks.)

_Stylist's note: Nothing in this wardrobe is really wedding-level: every top is casual, there's no dressy bag or clutch, and the only dressy dress (black satin slip) is both black and delicate in rain, so I left it out. Look 1 is the safest in a shower and Look 2 is the dressiest. Look 3 is lifted by the blazer but still sits below the target. A simple structured top in soft white or dusty blue, plus a small clutch, would fill the gap._

**Missed opportunity:** Cobalt satin midi skirt (s34) with the white linen shirt (s07) tucked and sleeves pushed up, silver pointed flats (s56), gold hoops (s63), silver watch (s65), and the beige trench (s44) as the only layer. This is her proven top with her unworn statement piece: grown-up, cool-toned and wedding-appropriate without black near her face. For the rain-safe option, the navy shirt dress (s36) belted with the tan belt (s68), silver flats and the trench was overlooked.

### Lena — r04: "It's raining all day and I'll be walking a lot. What should I wear?"

**Overall 6/10.** The diagnosis is honest and correct: there is no rain-ready outerwear, the leather jacket and trainers are rightly excluded, the slip dress is rightly dismissed, and a waterproof shell is the right recommendation. Look 1 is sound. But the set is thin. Look 3 is a near-clone of Look 1 in weaker fabric. Look 2 knowingly sends her into all-day 3°C rain in a mini and nylon tights. The stylist also missed the practical tricks this wardrobe allows: tights as a base layer under trousers, the tank as a base layer, and the hoodie's hood out over the puffer. Competent and honest, but not the sharpest version of what this wardrobe could do.

**Look 1: Green Wool Undone** — Deep-green cable knit and black cargos, a cosy, slouchy Berlin walking uniform.
- Pieces: Forest green chunky jumper · Black cargo trousers · Black leather lace-up boots · Black cropped puffer · Chunky silver chain necklace · Black canvas tote
- How to wear: Wear the jumper alone over the cargos with the sleeves slightly pushed up. Let the hem hang below the cropped puffer so it stacks short over long. Tuck the cargo hems into the boots, or roll them twice, so nothing catches in the chain or pedals. Wear the chain outside the jumper's neckline. Carry the tote close to your body.
- Judge: brief 4, like-client 4, resolved 4, idea 3, finished 4, explanation 4 · sign-off: yes
- The right core answer. Wool is correctly favoured over cotton for damp, green sits at her face, and the cargos tucked into the boots work on the bike. It is a sensible uniform rather than a sharp idea, and it leaves her bare-headed in a day of rain.
- Failures: COULD_BE_MORE_PRACTICAL (For all-day 3°C rain there is no head cover. The jumper (l04) has no hood, unlike the hoodie (l01). The 80-denier tights (l13) could have gone under the cotton cargos (l06) as a thermal layer, and the white tank (l03) could have been a base under the knit. All three are free warmth gains from her own wardrobe.); NO_REAL_TECHNIQUE ('Sleeves slightly pushed up' is the wrong move in cold rain. It exposes the wrists at the puffer cuffs. It reads as a stock styling instruction rather than one written for this weather.)

**Look 2: Gig Skirt, Wet Weather Edition** — Her favourite gig formula (hoodie, tartan, tights, boots) adapted for a cold, wet day.
- Pieces: Grey oversized hoodie · Red tartan wool mini skirt · Black opaque tights · Black leather lace-up boots · Black cropped puffer · Chunky silver chain necklace · Black canvas tote
- How to wear: Wear the oversized hoodie loose over the tartan mini, with the hem sitting a little below the skirt's waistband. Put the tights on under the skirt and lace the boots firmly. Put the cropped puffer on top and wear the chain over the hoodie. Add the hood under the puffer if it helps on the bike, but keep the drawcords short so they don't dangle.
- Judge: brief 2, like-client 5, resolved 4, idea 3, finished 4, explanation 4 · sign-off: no
- This is unmistakably Lena and her proven favourite, and the hood under the puffer is a smart touch. But it is the wrong day for it: bare-ish wet legs for hours at 3°C. Hold it for a dry gig night.
- Failures: WRONG_FOR_WEATHER (Walking a lot in cold rain at 3°C, the 80-denier nylon tights (l13) and the wool mini (l07) below the cropped puffer (l10) will be soaked within the hour. That leaves her with wet nylon against her legs all day, and she will be properly cold. The stylist admits this, but admitting it does not make it a good answer to this brief.); SAFE_DEFAULT (The 'wet weather edition' is the known gig look with the puffer added on top. Nothing is genuinely adapted for rain. It should have been saved for a dry evening rather than offered for an all-day downpour.)

**Look 3: Band Tee Layered, Cargo Ready** — Music-led layering: faded band tee under a grey hoodie, with black cargos.
- Pieces: Black band tee · Grey oversized hoodie · Black cargo trousers · Black leather lace-up boots · Black cropped puffer · Chunky silver chain necklace · Black canvas tote
- How to wear: Wear the band tee as a base and let its boxy hem peek out below the hoodie. Push the hoodie sleeves up to the elbow. Tuck the cargos into the boots, or roll the cuffs, so the leg stays clear of the pedals. Wear the chain over the hoodie at the neckline, with the cropped puffer on top.
- Judge: brief 3, like-client 4, resolved 3, idea 2, finished 3, explanation 3 · sign-off: no
- Workable and on-DNA, but it is effectively Look 1 with a cotton top. It does not use its strongest rain asset, the hood, as the stylist could have done here.
- Failures: SAFE_DEFAULT (It shares five of seven pieces with Look 1 (l06, l11, l10, l14, l15). Only the top changes, and to the weaker cotton option. The stylist even calls it a back-up for when the jumper is in the wash, so it has no job of its own.); WEAK_EXPLANATION (It misses the one real advantage of this look in rain: the hoodie's hood. Worn out over the puffer collar, it gives her head cover that Look 1 cannot. Instead it advises pushing the sleeves up to the elbow in 3°C rain.); UNFINISHED (The band tee hem 'peeking' below the hoodie under a cropped puffer adds a third visible stacked hem. It is never resolved how this reads, and it is a thin cotton layer that adds little warmth.)

_Stylist's note: Her wardrobe has no rain-ready outerwear, so none of these looks can fully meet the brief. The cropped puffer is the warmest piece she owns but is not rain-ready, and neither is the leather jacket, so I kept the leather jacket and the white trainers out of every look. The slip dress is too delicate and light for cold rain and too risky on the bike. The most useful addition would be a hooded waterproof shell or rain jacket. Until then, keep the wet stretches short, carry the tote close to your body, and give the puffer and layers time to dry afterwards._

**Missed opportunity:** A true rain-day build: l03 white tank as base, then l01 hoodie with the hood pulled out over the collar of l10 cropped puffer for head cover. Put l13 tights under l06 cargos as a thermal layer, and tuck the cargos into l11 boots. Finish with l14 chain and l15 tote, with contents in a plastic bag inside. Alternatively, Look 1 with l13 under the cargos and l03 under l04. These moves give her far more warmth and protection from pieces she already owns.

### Lena — r07: "I'm presenting to senior leadership next week. I want to look authoritative but still like me."

**Overall 4/10.** The stylist made one decent outfit and sent it three times. Every look uses the same l04+l07+l13+l11+l14+l15 core, with only the outerwear changing, so there is no range. The brief, 'authoritative', is answered with her gig skirt in every option. The candour about the wardrobe's formality ceiling is good, and the 'leather jacket as tailoring' idea is the right thought. But the note wrongly claims nothing else works. The black cargo trousers (l06) are bike-safe and more serious than a mini, and the slip dress (l08) could be layered under the jumper for warmth with the hem managed for the ride. Either of those would have given her a genuinely different, more commanding choice. I would rework this to keep Look 3's jacket-as-blazer idea and build the other two looks around l06 and l08.

**Look 1: Deep Green, Sharp Edges** — Dark, tonal and deliberate: forest green and black-red tartan with leather over the top reads as someone who knows what she's saying.
- Pieces: Forest green chunky jumper · Red tartan wool mini skirt · Black opaque tights · Black leather lace-up boots · Vintage brown leather jacket · Chunky silver chain necklace · Black canvas tote
- How to wear: Tuck only the front of the jumper into the skirt so the A-line mini shows and the oversized knit doesn't swamp you. Opaque tights and boots keep the line long and dark. Wear the chain over the knit neckline, with the jacket zipped for the ride and off in the room. Boots go on laced tight so nothing catches the pedals, and the tote goes across your body.
- Judge: brief 3, like-client 4, resolved 3, idea 3, finished 4, explanation 3 · sign-off: no
- A credible, warm, very-her outfit, but it is her gig uniform in a green jumper rather than a considered answer to 'authoritative'. The tartan mini (l07) is the least authoritative bottom she owns for a senior-leadership room.
- Failures: SAFE_DEFAULT (This is her known gig formula (l07+l13+l11) with the hoodie swapped for l04. Nothing is done to raise authority beyond a darker top. The black cargo trousers l06 and the satin slip l08 were the obvious levers and were ignored.); PROPORTION_PROBLEM (A front tuck of a chunky cable knit (l04) into an A-line wool mini (l07) puts bulk right at the waist. A half-tuck or a fully untucked hem just covering the waistband would be cleaner.); WEAK_EXPLANATION ('Clean lines carry the authority' doesn't describe a cable knit over tartan. Telling her to wear the tote 'across your body' isn't possible with a large canvas tote (l15).)

**Look 2: Tartan Commander** — Let the tartan skirt be the statement: your gig-night signature turned into a room-owning outfit.
- Pieces: Red tartan wool mini skirt · Forest green chunky jumper · Black opaque tights · Black leather lace-up boots · Black cropped puffer · Chunky silver chain necklace · Black canvas tote
- How to wear: Wear the jumper fully tucked at the front and loose at the back, with sleeves pushed to mid-forearm so your hands look deliberate when you present. Put the puffer on for the ride and zip it up against the wind, then take it off before you walk in so the green and red are the first thing people see. Keep the chain short and visible at the neckline, and the boots laced tight.
- Judge: brief 2, like-client 4, resolved 3, idea 2, finished 3, explanation 2 · sign-off: no
- This is a duplicate presented as a new look. Swapping the commute coat is not a second outfit, and it wastes a slot that should have tested trousers or the slip dress.
- Failures: SAFE_DEFAULT (It uses the same l04/l07/l13/l11/l14/l15 as Look 1. The only change is l10 instead of l09, and that comes off before she walks in, so in the room it is literally Look 1.); WEAK_EXPLANATION (Calling it 'Tartan Commander' and saying tartan and knit 'do the work' on formality is not true. The stylist admits it is the weakest look but sends it anyway instead of offering a genuinely different option.)
- Code checks: TOO_SIMILAR — Shares most of its clothing with look 1.

**Look 3: Leather as Tailoring** — Use the boxy leather jacket as your blazer: structure on the shoulders, undone everywhere else.
- Pieces: Vintage brown leather jacket · White ribbed tank · Forest green chunky jumper · Red tartan wool mini skirt · Black opaque tights · Black leather lace-up boots · Chunky silver chain necklace · Black canvas tote
- How to wear: Wear the white ribbed tank as a slim base layer under the jumper, so the jumper stays comfortable if you warm up on the ride and you can push the sleeves up without losing coverage. Keep the jacket on in the room, since the boxy hip-length cut gives shoulder structure like tailoring. Roll the jumper's cuffs once so they sit at the wrist, and wear the chain over the knit. Keep the front tuck small so the skirt hem sits just under the jacket hem. Tights and boots stay laced and snug for the bike.
- Judge: brief 3, like-client 4, resolved 3, idea 4, finished 3, explanation 2 · sign-off: no
- 'Leather jacket as blazer' is the right instinct and the best idea in the set. But it is applied to the same skirt outfit, when l09 over a slimmer, longer, darker base would actually deliver the tailoring read it promises.
- Failures: SAFE_DEFAULT (It is a third use of the same jumper/skirt/tights/boots base. The hidden white tank (l03) is invisible padding, not a styling move.); WEAK_EXPLANATION (The note says 'everything else is flagged as too casual, too light or risky on the bike'. That is false for l06 black cargo trousers, which cycle perfectly and read more serious than a mini.); PROPORTION_PROBLEM (A boxy hip-length leather jacket over an oversized cable jumper over a short A-line skirt makes three volumes stacked. The jacket hem nearly meets the skirt hem, so the figure reads as one block.)
- Code checks: TOO_SIMILAR — Shares most of its clothing with look 1.

_Stylist's note: Your wardrobe doesn't have a piece above formality 2/5 that works on the bike in this cold, so these three looks rearrange the same few pieces. The satin slip dress is left out: it's too light for 4°C and the bias-cut midi hem is risky on the bike. A black blazer, or plain black straight-leg trousers with a fitted top, would give you real range for the presentation._

**Missed opportunity:** Two stronger routes were missed. The first is a long dark column: l08 black satin slip dress with l04 forest green jumper worn over it, so the satin shows as a midi skirt and gives a fluid, more grown-up line. Add l13 tights, l11 boots, l09 leather jacket kept on as the 'blazer', and l14 chain over the knit. This is 90s grunge, high-contrast green and black at the face, and the most authoritative silhouette she owns. The midi hem can be knotted or gathered at the side for the ride and released on arrival, and the tights and jumper make 4°C workable. The second, if she wants zero bike risk, is l06 black cargo trousers + l04 jumper (half-tuck) + l11 + l09 + l14. That is a tonal, sharp, Our Legacy-ish look that still reads as her.

### Lena — r08: "Wedding guest — outdoor afternoon ceremony, and the forecast says it might rain."

**Error:** 400 {"type":"error","error":{"type":"invalid_request_error","message":"Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits."},"request_id":"req_011ChDTDuPQjDxYa3ZY34Wt2"}

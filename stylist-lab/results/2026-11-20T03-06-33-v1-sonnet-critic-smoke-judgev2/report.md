# v1-sonnet-critic

Conditions in code → generate (Sonnet 5.5, high) → code checks → critique (claude-sonnet-5-5, medium) → revise (Sonnet 5.5, high) when needed. Judge v2.

## Scorecard

| Metric | Value |
|---|---|
| Overall (1–10) | **5.5** |
| Stylist would sign off | 41.7% of looks |
| Looks with a critical failure | 2 of 12 |
| Critical failures (code checks / judge) | 0 / 2 |
| Answers the brief | 3.3 |
| Feels like the client | 3.8 |
| Visually resolved | 3.2 |
| Has an idea | 3.3 |
| Finished | 3.0 |
| Explanation | 3.0 |
| Uses the wardrobe's best | 2.8 |
| Range across the three looks | 2.5 |
| Cost per request (engine) | $0.158 |
| Model calls per request | 3.0 |
| Response time | 99.9s |
| Judge cost (whole run) | $0.429 |
| Errors | 0 |

## By wardrobe

| Wardrobe | Overall | Sign-off | Wardrobe's best |
|---|---|---|---|
| Maya — expressive print-led maximalist (London) | 6.0 | 66.7% | 3.0 |
| Daniel — tailored Scandinavian menswear (Copenhagen) | 5.0 | 16.7% | 2.5 |

## Most common failures

| Failure | Count |
|---|---|
| COULD_BE_MORE_PRACTICAL | 11 |
| SAFE_DEFAULT | 6 |
| PROPORTION_PROBLEM | 6 |
| WEAK_EXPLANATION | 5 |
| UNFINISHED | 5 |
| WRONG_FOR_WEATHER | 2 |
| BAD_COLOUR_AT_FACE | 2 |
| NOT_HER_STYLE | 1 |
| CLASH_WITHOUT_LOGIC | 1 |

## Every case

### Maya — r04: "It's raining all day and I'll be walking a lot. What should I wear?"

**Overall 6/10.** Competent, careful rain logic, but uneven. Look 2 is a genuinely joyful answer that is close to finished. Look 1 is safe but sound. Look 3 is under-warm, risks a viscose skirt in steady rain, and reads all-black outdoors. All three repeat m51, m88, black boots and m80, so the range is thin. The trench constraint is real, which makes the missing scarf (m84) and the weak reasoning on the puffer and rain boots the bigger gaps. The scarf is the one piece that could have put print and warm colour at her face above a black coat every time.

**Look 1: Baroque Wrap in the Rain** — Her proven gallery-opening dress, made weatherproof with tights, flat knee-high boots and a belted trench, with burgundy and gold kept near her face.
- Pieces: Baroque print wrap midi dress · Black opaque tights · Black flat knee-high boots · Black belted trench coat · Burgundy wool beret · Tan structured crossbody bag · Chunky gold hoop earrings
- How to wear: Wear the wrap dress with the black opaque tights and the flat knee-high boots; the tights sit under the boots and the dress hem overlaps the boot shafts. Belt the trench firmly at the waist over the dress. Fold the trench collar flat and leave the top button undone so the baroque V and the gold hoops show at the neckline instead of a band of black. Put the burgundy beret on, pulled slightly to one side. Carry the tan crossbody across the body so your hands stay free.
- Judge: brief 4, like-client 4, resolved 4, idea 3, finished 4, explanation 4 · sign-off: yes
- A sound, honest weatherproofing of her proven m30 dress. The m87 beret repeating the dress's burgundy is the smartest move in the whole edit. It works and it's her, but outdoors it reads as a black-trench look with a nice hat.
- Failures: COULD_BE_MORE_PRACTICAL (The knee-length m51 leaves the lower m30 hem exposed all day in steady rain, and an unlined gabardine trench over a warmth-2 jersey dress is only just enough at 8°C with wind. The m84 silk scarf tucked into the collar would add warmth and more colour at the face.); SAFE_DEFAULT (Once the trench is belted shut, what people see on the street is black trench, black tights and black boots, with a burgundy beret. The dress that won compliments is mostly hidden, so the idea is more logistics than look.)

**Look 2: Mustard and Cobalt, Rain-Proofed** — Joyful warm-bright colour-on-colour, sharpened by a tucked waist, a pleated midi and a flash of red.
- Pieces: Cobalt merino jumper · Mustard pleated midi skirt · Black opaque tights · Black leather Chelsea boots · Black belted trench coat · Red leather mini shoulder bag · Chunky gold hoop earrings · Stack of gold bangles
- How to wear: Tuck the regular-fit cobalt merino fully into the high-waisted mustard pleated skirt so the waistline shows. Add black opaque tights and the Chelsea boots. Belt the trench firmly at the waist so the shape stays neat and the pleats don't bulk out over the hips. The skirt will drop below the trench hem as a deliberate flash of mustard. Stack the gold bangles on one wrist and wear the hoops. Carry the red mini bag on your shoulder under the trench or hold it close.
- Judge: brief 4, like-client 4, resolved 4, idea 4, finished 3, explanation 3 · sign-off: yes
- The strongest look. Cobalt, mustard, red and gold is joyful primary colour-on-colour that builds on her proven m10 pairing, and tucking into the high-waisted m21 respects her proportions. It needed one more step: m84 at the neck to turn colour-only into her colour-plus-print signature.
- Failures: WEAK_EXPLANATION (The note says nothing printed is suitable for rain today. That's untrue: m84 (rust/navy/cream floral silk scarf) knotted at the neck under the trench collar is standard rain wear. It would bring print and warmth to an otherwise print-free look.); UNFINISHED (Nothing at the head or neck in breezy all-day rain, and nothing breaks the black trench at the face except the cobalt crew neck. The m84 scarf is the obvious finishing piece.); COULD_BE_MORE_PRACTICAL (Ankle Chelsea boots (m60) under a midi skirt leave tights exposed to splashback on a heavy walking day. The m21 crepe hem will also take the rain below the trench.)

**Look 3: Stripe Meets Floral** — A discovery look that puts the under-worn black floral slip skirt to work, with a stripe on top for deliberate print-mixing.
- Pieces: Breton stripe top · Black floral slip skirt · Black opaque tights · Black flat knee-high boots · Black belted trench coat · Black leather tote · Chunky gold hoop earrings
- How to wear: Tuck the Breton top into the slip skirt so the waist is clear. Wear the black opaque tights and the flat knee-high boots; the skirt hem falls over the boot shafts, so no fabric touches the ground. Belt the trench at the waist and keep the collar flat, so the cream and navy of the boat neck show. Wear the gold hoops and carry the tote on your shoulder.
- Judge: brief 2, like-client 3, resolved 2, idea 3, finished 2, explanation 3 · sign-off: no
- Putting the under-worn m25 to work is a good instinct, but it's the wrong day for it. The look is cold, risks the fabric, and is almost entirely black once the trench is on. Swapping in m10 and the m74 red bag would have rescued it.
- Failures: WRONG_FOR_WEATHER (A cotton Breton (m06, warmth 2) and thin viscose slip skirt (m25, warmth 1) under an unlined gabardine trench, at 8°C with wind and steady rain all day on foot. She'll be cold. The stylist admits it and offers m10 as an optional swap instead of committing to it.); COULD_BE_MORE_PRACTICAL (The stylist excluded silks for fabric damage, then put a bias-cut viscose skirt in the rain. Viscose spots, shrinks and loses its drape when wet, and the midi hem sits below the knee-length trench.); SAFE_DEFAULT (The street view is black trench, black-ground skirt hem, black tights, black knee boots and a black tote (m71). Close to the corporate all-black she says betrays her.); UNFINISHED (There's no warm colour accessory. m74 red bag or m87 beret would pick up the skirt's red and pull warmth to the face.); WEAK_EXPLANATION ('Navy and black are both dark grounds so it hangs together' and 'gold hoops pick up the yellow' are assertions, not reasons. The narrow stripe and the small floral are also similar in scale, which the explanation ignores.)

_Stylist's note: Only the black belted trench (m51) is rain-ready, so it appears in every look. The camel coat, faux fur and puffer would get soaked. I have left out the full-length wide-leg trousers, silks, velvet and suede today because the hems would wick up water and the fabrics would be damaged. I dropped the check blazer for today: it is too bulky under the trench and not practical to carry on a wet commute. It would be much better on a dry day with a cream or ivory top and camel or olive trousers, which keeps its warm palette. The wardrobe is thin on rain-ready print pieces, so the main print today is the baroque dress, with the stripe and floral mix as the second. The trench is black in every look, so I've put warm colour near her face and kept the collar flat to stop it dominating._

**Missed opportunity:** m10 cobalt merino tucked into m21 mustard pleated skirt, with m88 tights and m67 knee-high boots (dry legs, no splashed tights) under m51 belted trench. Add m84 rust/navy/cream silk scarf knotted high at the neck, m87 burgundy beret, m74 red mini bag, and m80 hoops plus m82 bangles. That combination is warm, rain-ready and colour-on-colour with a print at the face, so it's fully her. Also worth noting: m69 rain boots were never considered, and m53 navy puffer was dismissed as 'would get soaked', which is wrong for nylon. Styled with m84 and m87 it's the warmest honest option for an all-day walk.

### Maya — r08: "Wedding guest — outdoor afternoon ceremony, and the forecast says it might rain."

**Overall 6/10.** The stylist was honest about the constraints. They admit the black trench is her only rain coat and that nothing reaches formality 5 for wet grass, and they correctly avoid the suede boots, the 9cm emerald pumps and the sleeveless pieces. Look 1 is her proven baroque dress made rain-ready, and Look 3 is a genuinely inspired velvet-and-boucle idea. Look 2 is the weak link: too cold and too casual for an outdoor November wedding, and its puff sleeves are buried under the coat. Across the set the black trench frames all three looks without anything to soften black at her face. The m84 silk scarf was the obvious fix and was never used. Look 3 needed a wedding-worthy bag rather than the tan work crossbody.

**Look 1: Baroque Romance, Rain-Ready** — Her best-loved print wrap dress, finished with a bright red accent and a beaded clutch to lift it to wedding level.
- Pieces: Baroque print wrap midi dress · Black opaque tights · Red patent Mary Jane flats · Black belted trench coat · Chunky gold hoop earrings · Beaded evening clutch
- How to wear: Wear the wrap dress with the black opaque tights and the red patent Mary Janes. Belt the trench and turn the collar up for the walk there and back. At the ceremony, if the drizzle is light, open the trench and tie the belt loosely behind you so the wrap waist and the baroque print show. If it gets heavier, belt it back up. Wear the chunky gold hoops and nothing on the wrists, so the dress cuffs stay clean. Carry the beaded clutch under your arm, under the trench, to keep it out of the drizzle.
- Judge: brief 4, like-client 5, resolved 4, idea 4, finished 4, explanation 4 · sign-off: yes
- This is the right anchor. m30 is her proven best piece, it is long-sleeved and waist-defining, and the stylist correctly swapped the suede boots out for the red patent m62, a rain-safe flat. The beaded clutch lifts it to wedding level, and tying the trench belt behind her is a real styling move. It needed the m84 scarf to finish it and to soften the black frame.
- Failures: BAD_COLOUR_AT_FACE (The m51 black trench, worn with the collar turned up for most of an outdoor ceremony, puts stark black right at her face. The m84 rust/navy/cream silk scarf knotted at the neck would have broken that up. It would also have added warmth and a second print to mix with the baroque.); COULD_BE_MORE_PRACTICAL (Dress (warmth 2), tights and an unlined cotton trench is borderline for standing still outside at 9°C. A scarf at the neck or a fine layer would have been worth suggesting.)

**Look 2: Garden Party Trousers** — Printed wide-leg trousers with a jewel-emerald blouse, pearls and a red pop, polished but not stiff.
- Pieces: Navy floral wide-leg trousers · Green puff-sleeve poplin blouse · Black leather Chelsea boots · Black belted trench coat · Pearl drop earrings · Red leather mini shoulder bag
- How to wear: Tuck the emerald puff-sleeve blouse into the high-rise navy floral trousers so the waist is clear and the puffed sleeves stand out. Wear the Chelsea boots with the trouser hem just skimming the top of the boot, and check in the mirror that it doesn't drag. Add the pearl drops. Carry the red mini bag on its short strap so your hands are free for an umbrella-less drizzle. Keep the belted trench on all through the ceremony and turn the collar up.
- Judge: brief 2, like-client 4, resolved 3, idea 3, finished 3, explanation 3 · sign-off: no
- The emerald-into-floral colour logic is good and the high-rise wide leg suits her proportions. But as a November outdoor wedding answer it is cold, under-dressed, and its statement is hidden under a coat all afternoon.
- Failures: WRONG_FOR_WEATHER (A cotton poplin blouse (m02) and crepe trousers (m20) under an unlined gabardine trench will leave her properly cold standing through an outdoor ceremony at 9°C in drizzle. The stylist flags this but offers no warming layer.); PROPORTION_PROBLEM (The structured puff sleeves of m02 get crushed under a belted m51 that, by the stylist's own instruction, stays on the whole ceremony. So the look's main point is never seen.); COULD_BE_MORE_PRACTICAL (m60 Chelsea boots (formality 2) and an all-formality-3 outfit sit noticeably under register for a wedding, even a creative one.); SAFE_DEFAULT (This is essentially a variation on her known navy-floral colour-on-colour outfit, re-pitched as wedding wear without the formality or warmth that job needs.)

**Look 3: Emerald Velvet, Pink Tweed** — A rich velvet slip finished with a pink tweed jacket cropped at the waist: jewel colour plus romantic texture, in a polished shape.
- Pieces: Emerald velvet slip dress · Pink tweed cropped jacket · Black opaque tights · Black flat knee-high boots · Black belted trench coat · Tan structured crossbody bag · Chunky gold hoop earrings · Stack of gold bangles
- How to wear: Wear the emerald velvet slip with the black opaque tights and the flat knee-high boots, with the hem falling over the boot tops. Put the pink tweed jacket on open, so it stops at her waist and shows the dress's line. Wear the gold hoops and stack the bangles on one wrist. Put the belted trench over everything for the journey and keep it on until you are under cover, as velvet is delicate if wet. Carry the tan crossbody across the body so your hands are free.
- Judge: brief 4, like-client 5, resolved 4, idea 5, finished 3, explanation 4 · sign-off: yes
- This is the most editorial idea of the three: emerald velvet against pink boucle is pure toned-down Michele-era Gucci, and it activates two pieces she has worn once each. The cropped m42 keeps her waist visible and covers her arms. The flat knee boots with tights are smart wet-ground choices. The bag lets it down.
- Failures: UNFINISHED (The m70 tan crossbody is her everyday work bag. It drops the register, and the strap drags across the velvet and boucle. The m73 beaded clutch or the m74 red mini bag belonged here.); COULD_BE_MORE_PRACTICAL (Velvet in drizzle marks easily. The advice to keep the trench on is right, but it means the best part of the look may stay covered.)

_Stylist's note: The black belted trench is the only rain-ready coat, so all three looks use it. The camel coat is warmer but not rain-ready, so swap it in only if the drizzle stops. She has no umbrella, so in a proper downpour belt the trench, turn the collar up and stay under cover. None of her tops reach formality 4, and she has no formality 5 shoes that cope with wet grass, so the rain-ready options top out at formality 3 to 4._

**Missed opportunity:** Replace Look 2 with print-mixing that is both warm and wedding-ready: m21 mustard pleated midi skirt with the m01 leopard silk blouse tucked in (long sleeves, high waist), m88 tights, m67 flat knee-high boots, m84 silk scarf at the neck to break the black of the m51 trench, m80 hoops and the m73 beaded clutch. That gives her a saffron-family warm bright, her signature leopard, and a waist-marking midi that is warmer and dressier than poplin and floral trousers.

### Daniel — r04: "It's raining all day and I'll be walking a lot. What should I wear?"

**Overall 6/10.** The edits are honest and responsible: the overcoat, suede and loafers are rightly excluded, and the note that his legs will get wet whatever he wears is the kind of candour I want. But the set leans on what keeps out water rather than on what keeps Daniel looking like Daniel. Look 1 is the safe, correct answer. Look 2 lets a black tech shell become the visible outfit. Look 3 has the best colour idea but is too bulky under the wax. The stylist never thought to put the d43 liner under the d41 waxed jacket, the obvious warmth fix, and twice chose cotton trousers over wool despite saying wool is better when damp. Fix Look 2's outer layer and Look 3's bulk before sending.

**Look 1: Wax and Roll-Neck** — Charcoal lambswool and raw denim under a waxed jacket: quiet, textured and fully rideable in a wet gale.
- Pieces: Olive waxed cotton jacket · Charcoal lambswool roll-neck · Raw indigo selvedge jeans · Brown leather belt · Brown leather lug-sole boots · Navy wool scarf · Grey cashmere beanie · Black roll-top leather backpack
- How to wear: Wear the charcoal roll-neck under the waxed jacket, folded once so it sits flat under the corduroy collar. Cuff the jeans once so the hem clears the top of the boots and stays away from the chain. Wear the brown belt to match the boots. Tuck the navy scarf inside the jacket front so it can't flap on the bike. The beanie goes under the helmet, and everything goes in the roll-top backpack.
- Judge: brief 4, like-client 4, resolved 4, idea 3, finished 4, explanation 3 · sign-off: yes
- Sound, rideable and very him: wax, lambswool, denim and lug soles (d55) is the honest backbone of the set. It is the reliable answer rather than an inspired one, and the jeans are the weak link for an all-day soaking.
- Failures: COULD_BE_MORE_PRACTICAL (d23 raw denim gets heavy, cold and slow-drying once soaked. For a full day of walking at 5°C, wool (d20 or d25) is the warmer choice when wet, which the stylist's own note admits. Dismissing flannel for soaking up water while choosing denim is inconsistent.); COULD_BE_MORE_PRACTICAL (d41 is only warmth 3. In a strong wind at 5°C, adding the d43 quilted liner under the wax would make this properly warm for a long day outdoors.); SAFE_DEFAULT (Charcoal, indigo and navy under olive is his comfort zone. It does nothing for his stated wish for more warmth and texture beyond the jacket itself.)

**Look 2: Cream Cable, Black Shell** — A chunky cream fisherman knit kept warm and dry under a quilted liner and a plain black shell, with the texture coming out when the shell comes off.
- Pieces: Black technical rain shell · Charcoal quilted liner jacket · Cream fisherman jumper · Olive fatigue trousers · Black leather belt · Black leather Chelsea boots · Navy wool scarf · Grey cashmere beanie · Black roll-top leather backpack
- How to wear: Layer in this order: cream fisherman jumper, then the charcoal quilted liner, then the black shell on top. Keep the jumper hem inside the liner and the shell so nothing hangs near the saddle or chain. Zip the shell up to the chin and tuck the navy scarf fully underneath it. The hood goes up only when the wind demands it. Cuff the olive trousers once so the hem sits clear of the Chelsea boots and the pedals. Wear the black belt. The beanie goes under the helmet or hood.
- Judge: brief 4, like-client 2, resolved 3, idea 3, finished 3, explanation 2 · sign-off: no
- The most weatherproof option and a nice idea indoors, but the outside of this look is a black tech shell over fatigues. That is not Our Legacy or Margaret Howell. Swapping the shell for d41 over d43, keeping the cream cable, would have kept both the idea and his identity.
- Failures: NOT_HER_STYLE (Outdoors, what shows is d42 black technical shell zipped to the chin, with the hood up, over d24 fatigues. That reads as technical gear worn as the look, which is close to what his Style DNA says would betray him. The cream knit only appears indoors.); PROPORTION_PROBLEM (A chunky cable d10 under the slim d43 liner and the shell will bunch at the arms and torso, and on a 188cm frame it risks pulling the shell sleeves short.); WEAK_EXPLANATION (The claim that cotton sateen d24 is 'the best water-shedder' is dubious. Cotton soaks and chills when wet, so it is a worse choice than wool for a full day of rain at 5°C.); BAD_COLOUR_AT_FACE (A black shell collar zipped to the chin is harsh against his low-medium-contrast, cool, soft colouring. Navy or charcoal would sit better.); COULD_BE_MORE_PRACTICAL (Three warm layers plus a hood while walking a lot is likely to overheat him, and then he is damp from the inside.)

**Look 3: Green, Oatmeal and Wax** — A layered wool look in woodland tones that puts the under-worn forest merino and oatmeal cardigan to work under the waxed jacket.
- Pieces: Olive waxed cotton jacket · Oatmeal shawl-collar cardigan · Forest green merino crew jumper · Navy pleated wool trousers · Brown leather belt · Brown leather lug-sole boots · Grey cashmere beanie · Black roll-top leather backpack
- How to wear: Wear the forest green merino as the base, with the oatmeal cardigan over it as a mid-layer. Lay the shawl collar flat inside the waxed jacket's corduroy collar and keep the cardigan closed so it doesn't hang below the jacket hem. Let the green show at the neckline. Push the merino sleeves up a little if they ride short on his long arms. Cuff the tapered navy trousers once so the hem clears the lug-sole boots and the chain. Wear the brown belt. Wear the beanie and carry everything in the backpack. No scarf, because the shawl collar covers the neck.
- Judge: brief 3, like-client 4, resolved 3, idea 4, finished 3, explanation 3 · sign-off: no
- The right instinct: forest green d12 at the face with oatmeal texture answers his wish for warmth and colour, and wool legs are the sensible wet-weather choice. The execution is too bulky to be precise. The flatter d34 forest overshirt or the d43 liner under the wax would have delivered the same palette cleanly.
- Failures: PROPORTION_PROBLEM (A chunky shawl-collar cardigan d33 under a fitted, hip-length waxed jacket d41 is bulky. Its hem is likely to drop below the jacket, and keeping it closed doesn't fix length. The shawl collar will fight the corduroy collar and may stop the jacket closing at the throat in a gale.); WEAK_EXPLANATION ('Push the merino sleeves up if they ride short' makes no sense: the merino is buried under the cardigan and jacket. It doesn't solve his long-arm issue.); COULD_BE_MORE_PRACTICAL (Dropping the scarf in strong wind and heavy rain leaves the neck exposed whenever the jacket can't zip fully over the bulky collar. d20, his best pleated studio trousers, will take road spray and lose their line.)

_Stylist's note: No bottom in the wardrobe is waterproof and there are no rain trousers, so below the hip you will get wet in a downpour whichever look you pick. Olive sateen sheds water best, denim is the sturdiest, and wool stays warmer than flannel or cord when damp. The cords and grey flannel are better kept for a drier day. The overcoat is out because it is not rain-ready and tangles on the bike. The suede shoes, suede trucker and navy suede trainers are out because of the rain. The loafers are out because they are slippery on wet pedals. The tie is not used._

**Missed opportunity:** d41 waxed jacket over d43 quilted liner for real wind protection. Underneath, d12 forest green merino, which gives colour at the face without a bulky mid-layer. Then d20 navy pleated wool trousers or d25 black wool drawstring trousers, since wool stays warm when wet. Finish with d55 lug-sole boots, d62 navy scarf, d63 beanie and d60 backpack. The result is warm, rideable, walkable all day, and moves him toward green and texture without any technical look.

### Daniel — r08: "Wedding guest — outdoor afternoon ceremony, and the forecast says it might rain."

**Overall 4/10.** The stylist correctly found the suit-softening idea in Look 2 and was honest that there is no umbrella. But the plan defaults to the casual olive waxed jacket over wedding tailoring in all three looks, and it overrates the risk of passing showers to a wool overcoat. Looks 1 and 3 are studio smart-casual with a blazer, too low for a wedding guest and too alike to each other. The plan never addresses the dress code or the knitted tie d67, and it repeatedly tells a long-armed client to push his sleeves up. Every look shares the same shoes, coat, belt and watch, so the range is thin. One strong idea, poorly finished, plus two filler looks.

**Look 1: Shirt, Knit and Blazer** — His proven navy-and-grey tailoring, lifted for a wedding with a crisp pale blue collar and a rain-ready coat.
- Pieces: Pale blue poplin shirt · Navy merino crew jumper · Navy unstructured wool blazer · Grey flannel trousers · Black leather Chelsea boots · Olive waxed cotton jacket · Navy wool scarf · Black leather belt · Steel field watch
- How to wear: Wear the pale blue poplin shirt open at the collar with no tie. Put the navy merino crew over it so the shirt collar sits outside the neckline and the cuffs show. Add the unstructured navy blazer and push its sleeves up slightly so a little shirt cuff shows at the wrist. Keep the grey flannel trousers at a full straight break on the Chelsea boots, with the black belt. Wear the olive waxed jacket over the top and tuck the navy scarf inside it against the wind. Check the forecast that morning: if it is fully dry, the navy overcoat (d40) can replace the waxed jacket. If any showers are forecast, wear the waxed jacket. It is rain-ready and can stay on through the ceremony.
- Judge: brief 3, like-client 3, resolved 2, idea 2, finished 3, explanation 2 · sign-off: no
- A competent cold-weather smart-casual outfit, but for a wedding it reads as a studio day with a blazer. The sleeve-pushing advice is wrong for his body.
- Failures: SAFE_DEFAULT (This is his studio smart-casual (d04 + d21) with a blazer added. For a wedding it sits at the bottom of the register, while the suit d31/d32 and overcoat d40 are available. The stylist admits the 3/5 pieces pull it down but never asks what the dress code is.); PROPORTION_PROBLEM (Shirt d02, crew d04, blazer d30 and scarf d62 all sit under the hip-length waxed jacket d41. That is four layers of bulk. The blazer hem will likely hang below the waxed jacket, which looks muddled on a 188cm frame.); PROPORTION_PROBLEM (Telling a long-armed client to push his blazer sleeves up works against his known issue: it shortens the sleeve further and looks casual in wedding tailoring. Sleeves should sit full length with the shirt cuff just showing naturally.); WEAK_EXPLANATION (The note says the roll-neck version 'did not' read as dressed. That misreads his history: the d05 roll-neck + d21 + d51 + d40 look is recorded as a success that felt sharp. The note also calls d41 'the only rain-ready coat that works over tailoring' without weighing d40, which handles passing showers fine for an afternoon.)

**Look 2: Green Under Charcoal** — A charcoal suit softened with forest green knitwear, so it reads as dressed and warm rather than stiff.
- Pieces: Charcoal suit jacket · Charcoal suit trousers · Forest green merino crew jumper · Black leather Chelsea boots · Olive waxed cotton jacket · Black leather belt · Steel field watch
- How to wear: Wear the forest green merino crew directly under the suit jacket, with no shirt and no tie. Check that the jacket cuff clears the jumper cuff, since your long arms make short sleeves obvious. Keep the trousers straight with a slight break over the Chelsea boots, and wear the black belt. Put the olive waxed jacket over the top for the journey and the ceremony. Its corduroy collar can stay turned up in the wind. The suit jacket hem may show slightly below the waxed jacket, which is fine.
- Judge: brief 3, like-client 4, resolved 3, idea 4, finished 2, explanation 3 · sign-off: no
- This is the right instinct. Use the suit, and fix what made it stiff last time with forest green merino d12 and the rubber-soled d51 instead of a poplin shirt and Oxfords. But it is let down by the waxed jacket over the suit and the missing scarf. Swap to d40 + d62 and it's a sign-off.
- Failures: PROPORTION_PROBLEM (The structured suit jacket d31 will hang below the hip-length waxed jacket d41, and the stylist calls this 'fine'. It isn't: it chops his long frame and looks like a mismatch rather than a choice.); COULD_BE_MORE_PRACTICAL (The navy wool overcoat d40 is the right register over a suit. Dense wool sheds passing showers at an afternoon ceremony. Keeping the olive waxed jacket on through the ceremony is the weaker trade-off here.); UNFINISHED (There is no scarf at 6°C in wind with a bare crew neckline. The navy scarf d62 is in the wardrobe and goes unused. There is also no note on the dress code, or on the optional d02 shirt or d67 knitted tie if the invitation calls for one.)

**Look 3: Green and Navy Pleats** — A softer, warmer take on navy tailoring: green merino and pleated trousers in place of the usual grey.
- Pieces: Forest green merino crew jumper · Navy pleated wool trousers · Navy unstructured wool blazer · Black leather Chelsea boots · Olive waxed cotton jacket · Black leather belt · Steel field watch
- How to wear: Wear the forest green merino crew under the unstructured navy blazer, with the blazer worn open. Let the single-pleat navy trousers hang with a clean break over the Chelsea boots and wear the black belt. The blazer and trousers are close in colour but different in cut, so treat them as a navy base with the green as the point. Push the blazer sleeves up slightly so the jumper cuff shows. Put the olive waxed jacket over the top for the journey and the ceremony.
- Judge: brief 2, like-client 3, resolved 2, idea 2, finished 2, explanation 2 · sign-off: no
- The weakest of the three: under-dressed for a wedding and visually unresolved in navy-on-navy. It brings in green, but Look 2 already does that better.
- Failures: CLASH_WITHOUT_LOGIC (The navy blazer d30 and navy pleated trousers d20 are two different navies in different cloths. Together they read as a suit that doesn't match, not as a deliberate tonal base. The stylist names the problem but doesn't solve it.); SAFE_DEFAULT (This is his everyday studio uniform (navy crew + d20) with the green swapped in. It is too casual for a wedding guest and largely repeats Look 1's blazer-and-crew formula.); UNFINISHED (The scarf is mentioned only as an afterthought and not included in the pieces, even though the text admits this is the lightest look at the neck. The same push-up-sleeves advice is repeated for a long-armed client.)

_Stylist's note: There is no umbrella in the wardrobe. The waxed jacket (d41) is the only rain-ready coat that works over tailoring, so it is the default for all three looks. The navy overcoat (d40) looks best but is not rain-ready, so wear it only if the forecast that morning is fully dry. The black rain shell (d42) is technical gear and would have to come off before the ceremony, so keep it as a backup for the journey only. If you cycle, wear the waxed jacket, keep the Chelsea boots for grip and avoid the loafers, which are slippery on wet pedals._

**Missed opportunity:** Make the suit the hero and dress it properly for a cold outdoor wedding, building on his proven winter look: charcoal suit d31/d32 with the charcoal lambswool roll-neck d05 or forest green merino d12, black Chelsea boots d51 for wet grass, navy overcoat d40 and navy scarf d62, plus the steel watch d64. If the invitation calls for a tie, switch to the pale blue poplin d02 with the burgundy knitted silk tie d67. That tie is the one textured, warm-coloured piece he owns that suits a wedding. Keep the rain shell d42 for the journey only, and note plainly that an umbrella is the missing piece.

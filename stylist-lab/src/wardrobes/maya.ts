import type { Wardrobe } from '../types';
import { it } from './helpers';

// Expressive, print-led maximalist in London. Modelled on the lost real
// wardrobe: rich in prints, colour and dresses, with one over-relied-on black
// blazer, several never-worn pieces, and colours that drain her near the face.
export const maya: Wardrobe = {
  key: 'maya',
  label: 'Maya — expressive print-led maximalist (London)',
  heroItemId: 'm45',
  defaultWeather: { tempC: 9, conditions: 'overcast with light drizzle' },
  client: {
    name: 'Maya', age: 34, pronouns: 'she/her',
    location: { city: 'London', hemisphere: 'north', climate: 'temperate maritime; mild wet winters' },
    body: '164cm, hourglass with a defined waist. Likes outfits that mark the waist and high-rise bottoms; legs are short relative to her torso.',
    colouring: 'Warm undertone, medium depth, medium-high contrast (dark brown hair, warm olive skin, brown eyes). Warm brights (tomato red, saffron, emerald, cobalt) and warm neutrals flatter. Icy pastels (mint, powder blue) and stark black worn right at the face can drain her.',
    lifestyle: 'Creative director at a design agency. Office 3 days a week, monthly client pitches, gallery openings, dinners out, weekend markets with her partner. Takes the Tube and walks a lot; occasionally cycles.',
    workDressCode: 'Creative smart-casual: expression is welcome, but client pitches need polish.',
    styleDNA: {
      summary: 'Print-led, colourful and eclectic. Mixes prints with intent and likes a joyful, slightly romantic look with one sharp element.',
      keywords: ['print-mixing', 'colour-forward', 'eclectic', 'romantic edge', 'joyful'],
      references: ['Dries Van Noten', 'Susie Lau (Susie Bubble)', 'Ganni', 'Rixo', 'Alessandro Michele-era Gucci, toned down'],
      antiReferences: ['head-to-toe beige minimalism', 'corporate all-black', 'athleisure'],
      aspiration: 'Wants to look more polished at client pitches without losing her personality.',
    },
    directives: [
      'Avoids heels higher than 7cm.',
      'Prefers her arms covered at the office.',
      'No strapless.',
    ],
    history: {
      worked: [
        { itemIds: ['m30', 'm61', 'm80'], note: 'Gallery opening — felt completely like herself, lots of compliments.' },
        { itemIds: ['m01', 'm24', 'm60', 'm80'], note: 'Her go-to Friday look.' },
        { itemIds: ['m20', 'm10', 'm62'], note: 'Colour-on-colour felt joyful.' },
      ],
      didntWork: [
        { itemIds: ['m33', 'm40'], note: 'The black blazer made the red dress feel corporate at a party.' },
        { itemIds: ['m22', 'm09'], note: 'Too much volume top and bottom — felt swamped.' },
      ],
    },
  },
  items: [
    // Tops
    it('m01', 'top', 'Leopard print silk blouse', ['tan', 'black', 'cream'], 'leopard, medium scale', 'silk', 'relaxed button-up, long sleeves', 3, 2, 9, 'fluid drape, subtle sheen'),
    it('m02', 'top', 'Green puff-sleeve poplin blouse', ['emerald'], 'solid', 'cotton poplin', 'boxy, hip length, structured puff sleeves', 3, 2, 2, 'crisp'),
    it('m03', 'top', 'Gold satin V-neck camisole', ['gold'], 'solid', 'satin', 'slim, thin straps', 3, 1, 1, 'high sheen'),
    it('m04', 'top', 'White cotton crew-neck tee', ['white'], 'solid', 'cotton jersey', 'regular fit', 1, 2, 15),
    it('m05', 'top', 'Black fine-rib long-sleeve tee', ['black'], 'solid', 'rib jersey', 'slim, crew neck', 2, 2, 12),
    it('m06', 'top', 'Breton stripe top', ['navy', 'cream'], 'narrow horizontal stripe', 'cotton', 'regular, boat neck, long sleeves', 2, 2, 6),
    it('m07', 'top', 'Tomato red knit tank', ['tomato red'], 'solid', 'fine knit', 'slim, sleeveless', 2, 1, 3),
    it('m08', 'top', 'Mint ruffle-collar blouse', ['mint green'], 'solid', 'georgette', 'relaxed, high ruffled neck, long sleeves', 3, 1, 0, 'bought for a wedding, never re-worn'),
    it('m09', 'top', 'Cream cable-knit jumper', ['cream'], 'cable knit', 'chunky wool', 'oversized', 2, 4, 7),
    it('m10', 'top', 'Cobalt merino jumper', ['cobalt blue'], 'solid', 'fine merino', 'regular, crew neck', 2, 3, 4),
    it('m11', 'top', 'Black sheer polka-dot blouse', ['black', 'white'], 'polka dot, small', 'chiffon', 'relaxed, sheer sleeves', 3, 1, 2),
    it('m12', 'top', 'Pink and orange abstract print shirt', ['hot pink', 'orange'], 'abstract, large scale', 'viscose', 'oversized camp collar, short sleeves', 2, 1, 1),
    it('m13', 'top', 'Ivory silk shirt', ['ivory'], 'solid', 'silk', 'relaxed, long sleeves', 3, 2, 5),
    // Bottoms
    it('m20', 'bottom', 'Navy floral wide-leg trousers', ['navy', 'pink', 'green'], 'floral, medium scale', 'crepe', 'high-rise wide-leg, full length', 3, 2, 4),
    it('m21', 'bottom', 'Mustard pleated midi skirt', ['mustard'], 'solid', 'crepe', 'high-waisted, pleated A-line midi', 3, 2, 3),
    it('m22', 'bottom', 'Powder blue tulle midi skirt', ['powder blue'], 'solid', 'layered tulle', 'full midi', 3, 1, 1),
    it('m23', 'bottom', 'Black tailored wide-leg trousers', ['black'], 'solid', 'wool blend', 'high-rise wide-leg, pressed crease', 4, 3, 10),
    it('m24', 'bottom', 'Mid-blue straight jeans', ['mid blue'], 'solid', 'denim', 'high-rise straight, ankle length', 1, 3, 14),
    it('m25', 'bottom', 'Black floral slip skirt', ['black', 'red', 'yellow'], 'floral, small scale', 'viscose', 'bias-cut midi', 3, 1, 2),
    it('m26', 'bottom', 'Camel corduroy flares', ['camel'], 'solid', 'corduroy', 'high-rise flare', 2, 4, 3),
    it('m27', 'bottom', 'Navy cropped cigarette trousers', ['navy'], 'solid', 'stretch cotton', 'slim, cropped at the ankle', 3, 2, 6),
    it('m28', 'bottom', 'Black leather mini skirt', ['black'], 'solid', 'leather', 'A-line mini', 2, 3, 1, 'she feels it is too young for her now'),
    it('m29', 'bottom', 'Olive cargo trousers', ['olive'], 'solid', 'cotton twill', 'relaxed tapered', 1, 3, 5),
    // Dresses and one-pieces
    it('m30', 'dress', 'Baroque print wrap midi dress', ['burgundy', 'gold', 'navy'], 'baroque, large scale', 'silky jersey', 'wrap front, defined waist, long sleeves, midi', 4, 2, 8),
    it('m31', 'dress', 'Black lace midi dress', ['black'], 'lace', 'corded lace', 'sleeveless column, midi', 4, 1, 2),
    it('m32', 'dress', 'Saffron beaded maxi dress', ['saffron yellow'], 'all-over beading', 'chiffon', 'sleeveless column maxi', 5, 1, 1),
    it('m33', 'dress', 'Cherry red ruched maxi dress', ['cherry red'], 'solid', 'jersey', 'sleeveless, ruched, close-fitting maxi', 4, 1, 1),
    it('m34', 'dress', 'Navy floral wrap dress', ['navy', 'white'], 'floral, small scale', 'viscose', 'knee-length wrap, flutter sleeves', 3, 2, 5),
    it('m35', 'dress', 'Black and white geometric shift dress', ['black', 'white'], 'geometric, bold', 'crepe', 'straight shift, knee length, short sleeves', 3, 2, 2),
    it('m36', 'dress', 'Eiffel Tower novelty print tea dress', ['cream', 'blue'], 'novelty print, small scale', 'cotton', 'fit-and-flare midi, short sleeves', 2, 1, 1, 'novelty print — easy to look costume-y'),
    it('m37', 'dress', 'Leopard wide-leg jumpsuit', ['tan', 'black'], 'leopard, large scale', 'crepe', 'sleeveless, belted, wide-leg', 3, 1, 2),
    it('m38', 'dress', 'Emerald velvet slip dress', ['emerald'], 'solid', 'velvet', 'bias-cut slip, midi', 4, 2, 1),
    // Layers (need a base underneath)
    it('m40', 'layer', 'Black tailored blazer', ['black'], 'solid', 'wool', 'single-breasted, structured, hip length', 4, 3, 20, 'her default safe layer'),
    it('m41', 'layer', 'Burgundy longline cardigan', ['burgundy'], 'solid', 'knit', 'relaxed, open front, longline', 2, 3, 6),
    it('m42', 'layer', 'Pink tweed cropped jacket', ['pink', 'cream'], 'boucle tweed', 'boucle', 'boxy, cropped at the waist', 3, 3, 1),
    it('m43', 'layer', 'Olive bomber jacket', ['olive'], 'solid', 'nylon', 'cropped bomber', 1, 3, 3),
    it('m44', 'layer', 'Washed black denim shirt-jacket', ['washed black'], 'solid', 'denim', 'boxy overshirt', 1, 3, 5),
    it('m45', 'layer', 'Oversized check blazer', ['brown', 'rust', 'cream'], 'check, large scale', 'wool', 'oversized boyfriend fit, hip length', 3, 3, 0, 'bought last season; she has not found what to wear it with'),
    // Outerwear
    it('m50', 'outerwear', 'Camel wool longline coat', ['camel'], 'solid', 'wool', 'longline straight, below the knee', 3, 5, 12),
    it('m51', 'outerwear', 'Black belted trench coat', ['black'], 'solid', 'cotton gabardine', 'belted, knee length', 3, 3, 6, 'water-resistant'),
    it('m52', 'outerwear', 'Leopard faux-fur coat', ['tan', 'black'], 'leopard, large scale', 'faux fur', 'oversized, hip length', 2, 5, 2),
    it('m53', 'outerwear', 'Navy puffer coat', ['navy'], 'solid', 'nylon', 'mid-length puffer', 1, 5, 8, 'practical; she thinks it looks dull'),
    // Shoes
    it('m60', 'shoes', 'Black leather Chelsea boots', ['black'], 'solid', 'leather', 'flat ankle boot', 2, 4, 25),
    it('m61', 'shoes', 'Tan suede block-heel ankle boots', ['tan'], 'solid', 'suede', '5cm block heel', 3, 3, 7, 'suede — not for heavy rain'),
    it('m62', 'shoes', 'Red patent Mary Jane flats', ['red'], 'solid', 'patent leather', 'flat', 3, 2, 4),
    it('m63', 'shoes', 'White leather trainers', ['white'], 'solid', 'leather', 'flat, minimal', 1, 2, 18),
    it('m64', 'shoes', 'Gold strappy sandals', ['gold'], 'solid', 'metallic leather', '6cm block heel', 4, 1, 2),
    it('m65', 'shoes', 'Black slingback kitten heels', ['black'], 'solid', 'leather', '4cm kitten heel, pointed toe', 4, 2, 6),
    it('m66', 'shoes', 'Leopard calf-hair loafers', ['tan', 'black'], 'leopard', 'calf hair', 'flat loafer', 3, 2, 3),
    it('m67', 'shoes', 'Black flat knee-high boots', ['black'], 'solid', 'leather', 'flat, knee high', 3, 4, 4),
    it('m68', 'shoes', 'Emerald suede pumps', ['emerald'], 'solid', 'suede', '9cm stiletto', 4, 2, 0, 'too high for her'),
    it('m69', 'shoes', 'Black short rain boots', ['black'], 'solid', 'rubber', 'flat, ankle height', 1, 3, 3),
    // Bags
    it('m70', 'bag', 'Tan structured crossbody bag', ['tan'], 'solid', 'leather', 'compact, structured', 3, 2, 15),
    it('m71', 'bag', 'Black leather tote', ['black'], 'solid', 'leather', 'large, soft', 3, 2, 20),
    it('m72', 'bag', 'Raffia basket bag', ['natural'], 'woven', 'raffia', 'round basket', 1, 1, 3),
    it('m73', 'bag', 'Beaded evening clutch', ['multicolour'], 'beaded', 'beads', 'small clutch', 5, 1, 1),
    it('m74', 'bag', 'Red leather mini shoulder bag', ['red'], 'solid', 'leather', 'small, short strap', 3, 2, 4),
    // Jewellery and accessories
    it('m80', 'jewellery', 'Chunky gold hoop earrings', ['gold'], 'solid', 'gold-plated', 'medium chunky hoops', 3, 1, 20),
    it('m81', 'jewellery', 'Pearl drop earrings', ['pearl', 'gold'], 'solid', 'pearl', 'small drops', 4, 1, 3),
    it('m82', 'jewellery', 'Stack of gold bangles', ['gold'], 'solid', 'gold-plated', 'mixed bangles', 3, 1, 6),
    it('m83', 'jewellery', 'Resin flower statement earrings', ['orange', 'pink'], 'solid', 'resin', 'large', 2, 1, 1),
    it('m84', 'accessory', 'Silk floral scarf', ['rust', 'navy', 'cream'], 'floral', 'silk', 'square', 3, 2, 4),
    it('m85', 'accessory', 'Wide black leather belt', ['black'], 'solid', 'leather', 'wide waist belt', 3, 2, 3),
    it('m86', 'accessory', 'Tortoiseshell sunglasses', ['tortoiseshell'], 'tortoiseshell', 'acetate', 'oversized', 2, 1, 10),
    it('m87', 'accessory', 'Burgundy wool beret', ['burgundy'], 'solid', 'wool', 'beret', 2, 4, 2),
    it('m88', 'accessory', 'Black opaque tights', ['black'], 'solid', 'nylon', '60 denier', 2, 4, 9),
  ],
};

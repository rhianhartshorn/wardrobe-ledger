import type { Wardrobe } from '../types';
import { it } from './helpers';

// A small (15-piece) streetwear/vintage student wardrobe in Berlin in late
// autumn. Tests range from very little, and honesty when a brief (e.g. a
// wedding) is beyond what the wardrobe can do.
export const lena: Wardrobe = {
  key: 'lena',
  label: 'Lena — small streetwear/vintage wardrobe (Berlin)',
  heroItemId: 'l07',
  defaultWeather: { tempC: 4, conditions: 'grey and dry, cold wind' },
  client: {
    name: 'Lena', age: 22, pronouns: 'she/her',
    location: { city: 'Berlin', hemisphere: 'north', climate: 'continental; cold winters' },
    body: '167cm, slim, straight frame. Likes oversized tops balanced with something fitted or short.',
    colouring: 'Neutral undertone, medium depth, high contrast (black hair, fair skin, dark eyes). Black, white, deep green and red all work on her.',
    lifestyle: 'Design student. Studio, lectures, part-time job in a café, gigs and bars at night. Walks and cycles everywhere. Small budget.',
    workDressCode: 'None at university; plain black at the café.',
    styleDNA: {
      summary: 'Streetwear with vintage and grunge touches: oversized, a bit undone, music-led.',
      keywords: ['streetwear', 'vintage', 'grunge', 'undone', 'music'],
      references: ['Berlin club style', '90s grunge', 'Paloma Elsesser off-duty', 'Our Legacy Work Shop'],
      antiReferences: ['preppy', 'anything too polished or "corporate"'],
    },
    directives: ['Needs to be able to walk and cycle in everything.'],
    history: {
      worked: [{ itemIds: ['l01', 'l07', 'l13', 'l11'], note: 'Her favourite gig outfit.' }],
      didntWork: [],
    },
  },
  items: [
    it('l01', 'top', 'Grey oversized hoodie', ['grey marl'], 'solid', 'cotton fleece', 'oversized', 1, 3, 30),
    it('l02', 'top', 'Black band tee', ['black', 'white'], 'graphic print', 'cotton', 'boxy, faded', 1, 2, 25),
    it('l03', 'top', 'White ribbed tank', ['white'], 'solid', 'rib jersey', 'slim', 1, 1, 15),
    it('l04', 'top', 'Forest green chunky jumper', ['forest green'], 'cable knit', 'wool blend', 'oversized', 2, 4, 12),
    it('l05', 'bottom', 'Baggy light-wash jeans', ['light blue'], 'solid', 'denim', 'baggy, low-slung', 1, 3, 28),
    it('l06', 'bottom', 'Black cargo trousers', ['black'], 'solid', 'cotton twill', 'relaxed, cargo pockets', 1, 3, 20),
    it('l07', 'bottom', 'Red tartan wool mini skirt', ['red', 'black'], 'tartan', 'wool', 'A-line mini', 2, 3, 6),
    it('l08', 'dress', 'Black satin slip dress', ['black'], 'solid', 'satin', 'bias-cut, thin straps, midi', 3, 1, 3),
    it('l09', 'outerwear', 'Vintage brown leather jacket', ['brown'], 'solid', 'leather', 'boxy, hip length', 2, 3, 18),
    it('l10', 'outerwear', 'Black cropped puffer', ['black'], 'solid', 'nylon', 'cropped puffer', 1, 5, 14),
    it('l11', 'shoes', 'Black leather lace-up boots', ['black'], 'solid', 'leather', 'chunky-soled lace-up ankle boot', 2, 4, 35),
    it('l12', 'shoes', 'Retro white and green trainers', ['white', 'green'], 'solid', 'leather and suede', 'low-top', 1, 2, 20),
    it('l13', 'accessory', 'Black opaque tights', ['black'], 'solid', 'nylon', '80 denier', 2, 4, 15),
    it('l14', 'jewellery', 'Chunky silver chain necklace', ['silver'], 'solid', 'steel', 'chunky chain', 2, 1, 20),
    it('l15', 'bag', 'Black canvas tote', ['black'], 'solid', 'canvas', 'large tote', 1, 2, 30),
  ],
};

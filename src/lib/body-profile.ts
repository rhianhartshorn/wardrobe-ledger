export type BodyProfile = {
  height: 'petite' | 'average' | 'tall' | '';
  bodyShape: 'hourglass' | 'pear' | 'apple' | 'rectangle' | 'athletic' | '';
  features: string[];
  fitPreference: 'relaxed' | 'tailored' | 'mix' | '';
  undertone: 'warm' | 'cool' | 'neutral' | '';
  hairTone: 'light' | 'medium' | 'dark' | 'red' | 'grey' | '';
};

export const EMPTY_PROFILE: BodyProfile = {
  height: '', bodyShape: '', features: [], fitPreference: '', undertone: '', hairTone: '',
};

export function profileToContext(p: BodyProfile): string {
  if (!p.height && !p.bodyShape && !p.undertone) return '';
  const parts: string[] = [];

  if (p.height) {
    const h = { petite: "petite (under 5'4\")", average: "average height (5'4\"–5'7\")", tall: "tall (above 5'7\")" }[p.height];
    parts.push(h);
  }
  if (p.bodyShape) {
    const s = {
      hourglass: 'hourglass body shape (balanced shoulders and hips, defined waist)',
      pear: 'pear body shape (narrower shoulders, fuller hips and thighs)',
      apple: 'apple body shape (fuller through the torso and midsection)',
      rectangle: 'rectangle body shape (similar shoulder and hip width, straighter silhouette)',
      athletic: 'athletic body shape (broader shoulders, leaner hips)',
    }[p.bodyShape];
    parts.push(s);
  }
  if (p.features.length) parts.push(`styling priorities: ${p.features.join(', ')}`);
  if (p.fitPreference) {
    const f = {
      relaxed: 'prefers relaxed, easy-fitting clothes',
      tailored: 'prefers structured, tailored pieces',
      mix: 'comfortable with both relaxed and tailored fits',
    }[p.fitPreference];
    parts.push(f);
  }
  if (p.undertone) {
    const u = {
      warm: 'warm skin undertone (golden/peachy/olive)',
      cool: 'cool skin undertone (pink/rosy/blue-toned)',
      neutral: 'neutral skin undertone',
    }[p.undertone];
    parts.push(u);
  }
  if (p.hairTone) {
    const hair = {
      light: 'light/blonde hair',
      medium: 'medium brown hair',
      dark: 'dark brown or black hair',
      red: 'red or auburn hair',
      grey: 'grey or silver-white hair',
    }[p.hairTone];
    parts.push(hair);
  }
  return `Client profile: ${parts.join('; ')}.`;
}

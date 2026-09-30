export type InspirationImage = { thumbnailUrl: string; sourceUrl: string };

export type StyleGroup = { groupName: string; mood: string; itemIds: string[] };
export type StyleTwin = { name: string; why: string; matchStrength: 'high' | 'medium' | 'low'; images?: InspirationImage[] };

export type StyleReadResult = {
  archetype: string;
  archetypeDescription: string;
  styleKeywords: string[];
  styleTwins: StyleTwin[];
  brandStatement: string;
  narrativeArc: string;
  nextChapter: string;
  colorStory: string;
  wardrobeStrengths: string[];
  wardrobeGaps: string[];
  styleGroups: StyleGroup[];
  // Operational Style DNA — machine-usable dimensions and concrete,
  // client-specific reference points, persisted alongside the descriptive
  // reading so downstream recommendation calls can condition on them
  // directly instead of a fixed universal aesthetic. See
  // wardrobe-brain.ts ClientAestheticLens.
  colourAppetite?: string;
  patternAppetite?: string;
  contrastPreference?: string;
  visualDensity?: string;
  noveltyAppetite?: string;
  minimalismTolerance?: string;
  tailoringPreference?: string;
  silhouettePreferences?: string[];
  styleReferences?: string[];
  antiReferences?: string[];
};

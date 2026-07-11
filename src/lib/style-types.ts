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
};

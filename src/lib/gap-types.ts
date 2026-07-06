export type WardrobeGap = {
  priority: 'high' | 'medium' | 'low';
  gap: string;
  why: string;
  suggestion: string;
};

export type GapAnalysisResult = {
  summary: string;
  gaps: WardrobeGap[];
};

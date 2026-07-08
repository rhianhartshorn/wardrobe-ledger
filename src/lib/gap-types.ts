export type WardrobeGap = {
  priority: 'high' | 'medium' | 'low';
  gap: string;
  why: string;
  suggestion: string;
};

export type DontBuy = {
  category: string;    // e.g. "black knitwear"
  reason: string;      // e.g. "You already own 4 pieces — more won't solve anything"
};

export type GapAnalysisResult = {
  summary: string;
  gaps: WardrobeGap[];
  dontBuy?: DontBuy[];
};

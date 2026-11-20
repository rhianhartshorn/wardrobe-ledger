// Shapes shared by every engine, the checks and the judge. Deliberately the
// same shapes the app will feed the engine later, so integration is an import.

export type Category =
  | 'top'        // base layer worn on its own: tee, shirt, blouse, knit jumper
  | 'bottom'
  | 'dress'      // dresses and jumpsuits (covers top + bottom)
  | 'layer'      // blazer, cardigan, overshirt, jacket worn indoors — needs a base underneath
  | 'outerwear'  // coats and outdoor jackets
  | 'shoes'
  | 'bag'
  | 'jewellery'
  | 'accessory'; // belts, scarves, hats, tights, sunglasses

export type Item = {
  id: string;
  category: Category;
  name: string;
  colours: string[];      // dominant first
  pattern: string;        // 'solid', or a description incl. scale
  material: string;
  silhouette: string;     // cut, length, rise, heel height, etc.
  formality: 1 | 2 | 3 | 4 | 5; // 1 very casual … 5 black tie
  warmth: 1 | 2 | 3 | 4 | 5;    // 1 hot weather … 5 deep winter
  notes?: string;         // visual notes, condition, the client's own feelings about it
  wears: number;          // times actually worn
};

export type ClientProfile = {
  name: string;
  age: number;
  pronouns: string;
  location: { city: string; hemisphere: 'north' | 'south'; climate: string };
  body: string;
  colouring: string;
  lifestyle: string;
  workDressCode: string;
  styleDNA: {
    summary: string;
    keywords: string[];
    references: string[];      // who/what her style genuinely resembles
    antiReferences: string[];  // what would betray her style
    aspiration?: string;       // where she wants her style to go
  };
  directives: string[];        // permanent preferences — must always hold
  history: {
    worked: Array<{ itemIds: string[]; note: string }>;
    didntWork: Array<{ itemIds: string[]; note: string }>;
  };
};

export type Weather = { tempC: number; conditions: string };

export type Wardrobe = {
  key: string;
  label: string;
  client: ClientProfile;
  items: Item[];
  defaultWeather: Weather;
  heroItemId: string; // used by the "how do I wear X" request
};

export type StyleRequest = {
  key: string;
  kind: string;
  text: string;            // may contain {hero}
  weather?: Weather;       // overrides the wardrobe's default
  occasionFormality?: number;
};

export type Look = {
  title: string;
  idea: string;            // the point of view, in one line
  itemIds: string[];
  anchorItemId: string;
  howToWear: string;       // the specific styling moves
  why: string;             // why it works for this client and brief
};

export type StylistOutput = {
  looks: Look[];
  note?: string;           // e.g. honest limits of the wardrobe for this brief
};

export type CallRecord = {
  stage: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costUsd: number;
  latencyMs: number;
};

export type EngineContext = {
  wardrobe: Wardrobe;
  request: StyleRequest & { resolvedText: string; weather: Weather; date: string };
};

export type EngineResult = {
  output: StylistOutput;
  calls: CallRecord[];
  trace?: unknown; // intermediate steps, kept for diagnosing failures
};

export type Engine = {
  name: string;
  description: string;
  run(ctx: EngineContext): Promise<EngineResult>;
};

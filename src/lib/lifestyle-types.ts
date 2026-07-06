export type LifestyleProfile = {
  workDressCode: '' | 'None' | 'Casual' | 'Smart Casual' | 'Business Casual' | 'Business Formal' | 'Uniform';
  occasions: string[];          // multi-select from OCCASION_OPTIONS
  travelFrequency: '' | 'Rarely' | 'A few times a year' | 'Monthly' | 'Frequently';
  climate: '' | 'Hot / Tropical' | 'Temperate' | 'Cold' | 'Mixed / Four seasons';
  fitComfort: string[];         // multi-select from FIT_COMFORT_OPTIONS
  avoidances: string;           // free text: things they hate wearing
};

export const WORK_DRESS_CODES = [
  'None', 'Casual', 'Smart Casual', 'Business Casual', 'Business Formal', 'Uniform',
] as const;

export const OCCASION_OPTIONS = [
  'Office / Work', 'Formal events', 'Casual weekends', 'Date nights',
  'Travel', 'Active / Gym', 'Cocktail parties', 'Beach / Resort', 'Weddings',
] as const;

export const TRAVEL_OPTIONS = [
  'Rarely', 'A few times a year', 'Monthly', 'Frequently',
] as const;

export const CLIMATE_OPTIONS = [
  'Hot / Tropical', 'Temperate', 'Cold', 'Mixed / Four seasons',
] as const;

export const FIT_COMFORT_OPTIONS = [
  'Oversized', 'Fitted / Tailored', 'Relaxed / Flowy', 'Cropped tops',
  'High heels', 'Flat shoes only', 'Skirts / Dresses', 'Trousers only',
  'Shorts', 'Sleeveless', 'Low necklines',
] as const;

export function EMPTY_LIFESTYLE(): LifestyleProfile {
  return {
    workDressCode: '',
    occasions: [],
    travelFrequency: '',
    climate: '',
    fitComfort: [],
    avoidances: '',
  };
}

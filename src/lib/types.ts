// Types for the Gut Training Protocol Generator

export type Sport = 'triathlon' | 'cycling' | 'gravel' | 'running';

export type TriathlonEvent = 'sprint' | 'olympic' | 'half-ironman' | 'ironman';
export type CyclingEvent = 'criterium' | 'road-race-short' | 'road-race-long' | 'gran-fondo' | 'century';
export type GravelEvent = 'gravel-short' | 'gravel-long' | 'ultra-gravel';
export type RunningEvent = '10k' | 'half-marathon' | 'marathon' | '50k' | '100k' | '100-mile';

export type EventType = TriathlonEvent | CyclingEvent | GravelEvent | RunningEvent;

export type GIFrequency = 'rarely' | 'sometimes' | 'often' | 'very-often';
export type Gender = 'male' | 'female' | 'prefer-not-to-say';
export type TimelineChoice = '4-6-weeks' | '6-10-weeks' | '10+-weeks';
export type SessionsPerWeek = 1 | 2 | 3;

export interface AthleteProfile {
  sport: Sport;
  event: EventType;
  finishTimeMinutes: number;
  currentIntake: number; // g/h
  giFrequency: GIFrequency;
  gender: Gender;
}

export interface TimeSavingsResult {
  target: 60 | 90 | 120;
  carbGap: number;
  baseRate: number;
  baseImprovement: number;
  genderModifier: number;
  durationModifier: number;
  giModifier: number;
  totalImprovementPercent: number;
  timeSavedMinutes: number;
  variance: number;
  minutesLow: number;
  minutesHigh: number;
  giFrequencyPercent: number;
  eventDurationHours: number;
}

// Alias used throughout the app for the primary time-savings result
export type CalculationResult = TimeSavingsResult;

export interface ProtocolResult {
  totalWeeks: number;
  weeklyIncrease: number;
  baseWeeks: number;
  giTimeModifier: number;
  gapModifier: number;
  phases: ProtocolPhase[];
  recommendedTimeline: TimelineChoice;
}

export interface ProtocolPhase {
  weekStart: number;
  weekEnd: number;
  targetIntake: number;
  phaseName: string;
}

export interface FullCalculation {
  profile: AthleteProfile;
  timeSavings: TimeSavingsResult;
  protocol?: ProtocolResult;
  timelineChoice?: TimelineChoice;
  sessionsPerWeek?: SessionsPerWeek;
}

// Event display names
export const eventDisplayNames: Record<EventType, string> = {
  'sprint': 'Sprint Triathlon',
  'olympic': 'Olympic Triathlon',
  'half-ironman': 'Half Ironman / 70.3',
  'ironman': 'Full Ironman',
  'criterium': 'Criterium',
  'road-race-short': 'Road Race (Kurzdistanz, 60-100km)',
  'road-race-long': 'Road Race (Langdistanz, 100-180km)',
  'gran-fondo': 'Gran Fondo (120-160km)',
  'century': 'Century Ride (160km+)',
  'gravel-short': 'Gravel Race (80-120km)',
  'gravel-long': 'Gravel Race (120-200km)',
  'ultra-gravel': 'Ultra Gravel (200km+)',
  '10k': '10K',
  'half-marathon': 'Halbmarathon',
  'marathon': 'Marathon',
  '50k': '50k Ultra',
  '100k': '100k Ultra',
  '100-mile': '100 Mile Ultra',
};

export const sportDisplayNames: Record<Sport, string> = {
  'triathlon': 'Triathlon',
  'cycling': 'Cycling',
  'gravel': 'Gravel',
  'running': 'Running / Ultra Running',
};

export const sportEvents: Record<Sport, EventType[]> = {
  triathlon: ['sprint', 'olympic', 'half-ironman', 'ironman'],
  cycling: ['criterium', 'road-race-short', 'road-race-long', 'gran-fondo', 'century'],
  gravel: ['gravel-short', 'gravel-long', 'ultra-gravel'],
  running: ['10k', 'half-marathon', 'marathon', '50k', '100k', '100-mile'],
};

export const giFrequencyToPercent: Record<GIFrequency, number> = {
  'rarely': 5,
  'sometimes': 20,
  'often': 40,
  'very-often': 55,
};

/**
 * Check if an event is considered a "short distance" where pre-event loading
 * is more important than intra-event nutrition
 */
export function isShortDistanceEvent(sport: Sport, event: EventType): boolean {
  // Triathlon: Sprint is short
  if (sport === 'triathlon' && event === 'sprint') return true;
  
  // Running: 10K is short
  if (sport === 'running' && event === '10k') return true;
  
  // Cycling: Criterium and short road races are short
  if (sport === 'cycling' && (event === 'criterium' || event === 'road-race-short')) return true;
  
  return false;
}

export const giFrequencyLabels: Record<GIFrequency, string> = {
  'rarely': 'Rarely (<10% of the time)',
  'sometimes': 'Sometimes (10-30%)',
  'often': 'Often (30-50%)',
  'very-often': 'Very Often (>50%)',
};

export const intakeRanges = [
  { label: '<30g/h', value: 25 },
  { label: '30-45g/h', value: 37 },
  { label: '45-60g/h', value: 52 },
  { label: '60-75g/h', value: 67 },
  { label: '75-90g/h', value: 82 },
  { label: '90-105g/h', value: 97 },
  { label: '105g+/h', value: 112 },
];


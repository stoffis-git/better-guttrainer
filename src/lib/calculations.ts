/**
 * Gut Training Protocol Calculator
 * Complete implementation of the 9-step time savings and 5-step protocol calculations
 */

import {
  AthleteProfile,
  TimeSavingsResult,
  ProtocolResult,
  ProtocolPhase,
  TimelineChoice,
  giFrequencyToPercent,
} from './types';

/**
 * Determine target intake based on current intake (stepwise progression)
 * CRITICAL: Never skip levels! 60 -> 90 -> 120
 */
export function determineTarget(currentIntake: number): 60 | 90 | 120 {
  if (currentIntake < 60) return 60;
  if (currentIntake < 90) return 90;
  return 120;
}

/**
 * Calculate time savings towards a fixed target intake (60, 90, or 120 g/h).
 * Used e.g. for displaying maximal potential at 90 g/h on the results page.
 */
export function calculateTimeSavingsToTarget(
  profile: AthleteProfile,
  target: 60 | 90 | 120
): TimeSavingsResult {
  return calculateTimeSavingsForTarget(profile, target);
}

/**
 * Internal helper: core 9-step time-savings calculation for a given target.
 * This allows us to reuse the exact same logic both for the "next step"
 * and for fixed targets like 90g/h when showing maximal potential.
 */
function calculateTimeSavingsForTarget(
  profile: AthleteProfile,
  target: 60 | 90 | 120
): TimeSavingsResult {
  const giFrequencyPercent = giFrequencyToPercent[profile.giFrequency];
  const eventDurationHours = profile.finishTimeMinutes / 60;

  // STEP 1: Calculate carb gap
  const carbGap = target - profile.currentIntake;

  // Edge case: if currentIntake >= target, return zero savings
  if (carbGap <= 0) {
    return {
      target,
      carbGap: 0,
      baseRate: 0,
      baseImprovement: 0,
      genderModifier: profile.gender === 'female' ? 0.92 : 1.0,
      durationModifier: 1.0,
      giModifier: 1.0,
      totalImprovementPercent: 0,
      timeSavedMinutes: 0,
      variance: 0,
      minutesLow: 0,
      minutesHigh: 0,
      giFrequencyPercent,
      eventDurationHours,
    };
  }

  // STEP 2-3: Calculate base improvement with segmented rates
  // NEW: 3-tier rate structure (60-90, 90-105, 105-120)
  // For intake < 60, use 60-90 rate (1.25%) as approximation
  let baseImprovement = 0;
  let currentLevel = profile.currentIntake;

  // Segment 1: 60-90g/h at 1.25% per 10g/h
  // Handles gap from currentLevel to min(90, target)
  // If currentLevel < 60, we apply 1.25% rate for the entire gap to target (if target <= 90)
  if (target >= 60) {
    const segmentEnd = Math.min(90, target);
    if (currentLevel < segmentEnd) {
      const segmentGap = segmentEnd - currentLevel;
      if (segmentGap > 0) {
        baseImprovement += (segmentGap / 10) * 0.0125;
        currentLevel = segmentEnd;
      }
    }
  }

  // Segment 2: 90-105g/h at 0.6% per 10g/h
  // Only applies if target > 90 and we've processed segment 1
  if (target > 90 && currentLevel >= 90) {
    const segmentEnd = Math.min(105, target);
    if (currentLevel < segmentEnd) {
      const segmentGap = segmentEnd - currentLevel;
      if (segmentGap > 0) {
        baseImprovement += (segmentGap / 10) * 0.006;
        currentLevel = segmentEnd;
      }
    }
  }

  // Segment 3: 105-120g/h at 0.25% per 10g/h
  // Only applies if target > 105 and we've processed segment 2
  if (target > 105 && currentLevel >= 105) {
    const segmentEnd = Math.min(120, target);
    if (currentLevel < segmentEnd) {
      const segmentGap = segmentEnd - currentLevel;
      if (segmentGap > 0) {
        baseImprovement += (segmentGap / 10) * 0.0025;
      }
    }
  }

  // Average base rate for reporting (weighted by gap segments)
  const baseRate = baseImprovement / (carbGap / 10) || 0;

  // STEP 4: Apply gender modifier
  // NEW: 0.92 for female (was 0.95)
  const genderModifier = profile.gender === 'female' ? 0.92 : 1.0;
  let adjustedImprovement = baseImprovement * genderModifier;

  // STEP 5: Apply duration modifier
  // NEW: 5-tier structure with damping for short events
  let durationModifier: number;
  if (eventDurationHours < 2) {
    durationModifier = 0.7;
  } else if (eventDurationHours < 3) {
    durationModifier = 0.9;
  } else if (eventDurationHours < 6) {
    durationModifier = 1.0;
  } else if (eventDurationHours < 8) {
    durationModifier = 1.25;
  } else {
    durationModifier = 1.4;
  }
  adjustedImprovement = adjustedImprovement * durationModifier;

  // STEP 6: Apply GI issues modifier (conditional based on duration)
  // NEW: Conditional logic - higher modifier for non-ultra events
  let giModifier: number;
  if (giFrequencyPercent > 30) {
    giModifier = eventDurationHours >= 8 ? 1.2 : 1.35;
  } else {
    giModifier = 1.0;
  }
  adjustedImprovement = adjustedImprovement * giModifier;

  // STEP 7: Calculate absolute time savings
  const timeSavedMinutes = profile.finishTimeMinutes * adjustedImprovement;

  // STEP 8: Determine confidence variance
  // NEW: 3-tier variance structure
  let variance: number;
  if (target <= 90) {
    variance = 0.20; // ±20%
  } else if (target <= 105) {
    variance = 0.35; // ±35%
  } else {
    variance = 0.55; // ±55%
  }

  // STEP 9: Calculate final range
  let minutesLow = timeSavedMinutes * (1 - variance);
  let minutesHigh = timeSavedMinutes * (1 + variance);

  // Floor at 0 (no negative minutes)
  if (minutesLow < 0) minutesLow = 0;

  // Round to nearest integer
  minutesLow = Math.round(minutesLow);
  minutesHigh = Math.round(minutesHigh);

  return {
    target,
    carbGap,
    baseRate,
    baseImprovement,
    genderModifier,
    durationModifier,
    giModifier,
    totalImprovementPercent: adjustedImprovement * 100,
    timeSavedMinutes,
    variance,
    minutesLow,
    minutesHigh,
    giFrequencyPercent,
    eventDurationHours,
  };
}

/**
 * Public API: calculate time savings towards the next recommended step.
 * Uses the stepwise determineTarget logic (60 -> 90 -> 120).
 */
export function calculateTimeSavings(profile: AthleteProfile): TimeSavingsResult {
  const target = determineTarget(profile.currentIntake);
  return calculateTimeSavingsForTarget(profile, target);
}

/**
 * Calculate recommended timeline based on gap size and GI frequency
 */
export function recommendTimeline(carbGap: number, giFrequencyPercent: number): TimelineChoice {
  if (giFrequencyPercent >= 50) {
    return '10+-weeks';
  } else if (giFrequencyPercent >= 30) {
    return carbGap <= 20 ? '6-10-weeks' : '10+-weeks';
  } else {
    if (carbGap <= 20) return '4-6-weeks';
    if (carbGap <= 35) return '6-10-weeks';
    return '10+-weeks';
  }
}

// Constants
export const MIN_WEEKLY_INCREASE = 2.5; // Minimum weekly increase in g/h

/**
 * Calculate modifiers for protocol duration (shared logic for validation and calculation)
 */
export function calculateProtocolModifiers(
  giFrequencyPercent: number,
  carbGap: number
): { giTimeModifier: number; gapModifier: number } {
  // GI frequency modifier
  let giTimeModifier: number;
  if (giFrequencyPercent < 10) {
    giTimeModifier = 1.0;
  } else if (giFrequencyPercent < 30) {
    giTimeModifier = 1.2;
  } else if (giFrequencyPercent < 50) {
    giTimeModifier = 1.4;
  } else {
    giTimeModifier = 1.6;
  }

  // Carb gap modifier
  let gapModifier: number;
  if (carbGap <= 15) {
    gapModifier = 0.9;
  } else if (carbGap <= 25) {
    gapModifier = 1.0;
  } else if (carbGap <= 40) {
    gapModifier = 1.2;
  } else {
    gapModifier = 1.4;
  }

  return { giTimeModifier, gapModifier };
}

/**
 * Validate if a protocol duration would be valid (not auto-shortened)
 * Returns true if the duration is valid, false if it would be auto-shortened
 */
export function isValidProtocolDuration(
  baseWeeks: number,
  carbGap: number,
  giFrequencyPercent: number
): boolean {
  if (carbGap <= 0) return true; // No gap means all durations are valid

  const { giTimeModifier, gapModifier } = calculateProtocolModifiers(giFrequencyPercent, carbGap);
  
  // Calculate total weeks after modifiers
  let totalWeeks = baseWeeks * giTimeModifier * gapModifier;
  totalWeeks = Math.round(totalWeeks);

  // Calculate weekly increase
  const weeklyIncrease = carbGap / totalWeeks;

  // Check if this would trigger auto-shortening
  return weeklyIncrease >= MIN_WEEKLY_INCREASE;
}

/**
 * Calculate protocol length using the complete 5-step formula
 */
export function calculateProtocol(
  carbGap: number,
  giFrequencyPercent: number,
  timelineChoice: TimelineChoice,
  currentIntake: number,
  targetIntake: number
): ProtocolResult {
  // STEP 1: Base weeks from user choice - USER SELECTION IS FINAL
  let totalWeeks: number;
  if (timelineChoice === '4-6-weeks') {
    totalWeeks = 4;
  } else if (timelineChoice === '6-10-weeks') {
    totalWeeks = 8;
  } else {
    totalWeeks = 12;
  }

  // STEP 2-3: Calculate modifiers (for reference only, NOT applied to totalWeeks)
  const { giTimeModifier, gapModifier } = calculateProtocolModifiers(giFrequencyPercent, carbGap);

  // User selection is FINAL - do NOT apply modifiers to change totalWeeks
  // Modifiers are only used for validation (disabling tiles) and reference

  // Calculate baseWeeks for reference (what user selected)
  const baseWeeks = totalWeeks;

  // Calculate weekly increase for reference (will be recalculated later)
  let weeklyIncrease = carbGap / totalWeeks;

  // NEW CORE LOGIC: Session-based increment progression
  // Calculate increments at the SESSION level, not week level
  const SESSIONS_PER_WEEK = 3;
  const totalSessions = totalWeeks * SESSIONS_PER_WEEK;
  const MIN_SESSION_INCREMENT = 2; // Minimum 2g per session increment
  
  // Calculate how many 2g increments we can fit
  const maxIncrements = Math.floor(carbGap / MIN_SESSION_INCREMENT);
  // Note: remainder (< 2g) will be handled in final adjustment
  
  // Distribute increments evenly across all sessions
  // Each increment adds 2g, so we need to space them out evenly
  const allSessionDosages: number[] = [];
  let currentDosage = currentIntake;
  let incrementsUsed = 0;
  
  for (let i = 0; i < totalSessions; i++) {
    // Calculate if this session should get an increment
    // Distribute maxIncrements evenly across totalSessions
    // Use floating point calculation to determine target increment index
    const targetIncrementIndex = Math.floor((i + 1) * maxIncrements / totalSessions);
    
    if (targetIncrementIndex > incrementsUsed) {
      // This session gets an increment
      currentDosage += MIN_SESSION_INCREMENT;
      incrementsUsed++;
    }
    
    // Cap at target (safety check)
    currentDosage = Math.min(currentDosage, targetIntake);
    allSessionDosages.push(currentDosage);
  }
  
  // Ensure final session hits exact target
  const finalSessionIndex = totalSessions - 1;
  const finalDosage = allSessionDosages[finalSessionIndex];
  if (finalDosage !== targetIntake) {
    const diff = targetIntake - finalDosage;
    
    // Distribute the exact difference needed across sessions
    // Work backwards from the final session to distribute remainder
    let remainingDiff = diff;
    for (let i = totalSessions - 1; i >= 0 && remainingDiff > 0; i--) {
      const currentDosage = allSessionDosages[i];
      const maxIncrease = targetIntake - currentDosage;
      const increase = Math.min(remainingDiff, maxIncrease);
      allSessionDosages[i] += increase;
      remainingDiff -= increase;
    }
    
    // Force final session to exact target (safety check)
    allSessionDosages[finalSessionIndex] = targetIntake;
  }
  
  // Group sessions into weeks for weeklyTargets (for backwards compatibility)
  const weeklyTargets: number[] = [];
  for (let week = 0; week < totalWeeks; week++) {
    // Use session 3 of each week as the week target
    const session3Index = week * SESSIONS_PER_WEEK + 2;
    weeklyTargets.push(allSessionDosages[session3Index] || targetIntake);
  }
  
  // Build increment schedule (for backwards compatibility)
  // Track which sessions have increments
  const incrementSchedule: number[] = [];
  for (let i = 1; i < totalSessions; i++) {
    if (allSessionDosages[i] > allSessionDosages[i - 1]) {
      const weekIndex = Math.floor(i / SESSIONS_PER_WEEK);
      if (!incrementSchedule.includes(weekIndex)) {
        incrementSchedule.push(weekIndex);
      }
    }
  }
  incrementSchedule.sort((a, b) => a - b);
  
  // Store session dosages for calculateWeekSessions
  // We'll store this in a way that calculateWeekSessions can access it
  // For now, we'll pass it through weeklyTargets and calculate on-the-fly
  
  // For backwards compatibility: Calculate weeklyIncrease as average
  weeklyIncrease = carbGap / totalWeeks;

  // For backwards compatibility: Keep deprecated fields
  const baseIncrease = Math.floor(carbGap / totalWeeks);
  const remainder = carbGap % totalWeeks;

  // Generate phase structure
  const phases = generatePhases(currentIntake, targetIntake, totalWeeks);

  return {
    totalWeeks,
    weeklyIncrease: Math.max(MIN_WEEKLY_INCREASE, Math.round(weeklyIncrease)), // For backwards compatibility (average)
    baseIncrease, // @deprecated - kept for backwards compatibility
    remainder, // @deprecated - kept for backwards compatibility
    weeklyTargets, // NEW: Array of target intake per week (0-indexed)
    incrementSchedule, // NEW: Week indices where 3g increments occur
    baseWeeks,
    giTimeModifier,
    gapModifier,
    phases,
    recommendedTimeline: recommendTimeline(carbGap, giFrequencyPercent),
  };
}


/**
 * Calculate session dosages for a specific week
 * NEW: Uses session-based progression calculated in calculateProtocol
 * Returns dosages for up to 3 sessions per week
 */
export function calculateWeekSessions(
  week: number,           // 1-indexed week number
  weeklyTargets: number[], // Array of targets per week (0-indexed) - used for backwards compat
  totalWeeks: number,
  currentIntake: number,
  targetIntake: number
): { session1: number; session2: number; session3: number } {
  const SESSIONS_PER_WEEK = 3;
  const weekIndex = week - 1; // Convert to 0-indexed
  
  // Recalculate session dosages using the same logic as in calculateProtocol
  // This ensures consistency
  const carbGap = targetIntake - currentIntake;
  const totalSessions = totalWeeks * SESSIONS_PER_WEEK;
  const MIN_SESSION_INCREMENT = 2;
  
  // Calculate how many 2g increments we can fit
  const maxIncrements = Math.floor(carbGap / MIN_SESSION_INCREMENT);
  // Note: remainder (< 2g) will be handled in final adjustment
  
  // Distribute increments evenly across all sessions
  const allSessionDosages: number[] = [];
  let currentDosage = currentIntake;
  let incrementsUsed = 0;
  
  for (let i = 0; i < totalSessions; i++) {
    // Calculate if this session should get an increment
    const targetIncrementIndex = Math.floor((i + 1) * maxIncrements / totalSessions);
    
    if (targetIncrementIndex > incrementsUsed) {
      // This session gets an increment
      currentDosage += MIN_SESSION_INCREMENT;
      incrementsUsed++;
    }
    
    // Cap at target (safety check)
    currentDosage = Math.min(currentDosage, targetIntake);
    allSessionDosages.push(currentDosage);
  }
  
  // Ensure final session hits exact target
  const finalSessionIndex = totalSessions - 1;
  const finalDosage = allSessionDosages[finalSessionIndex];
  if (finalDosage !== targetIntake) {
    const diff = targetIntake - finalDosage;
    
    // Distribute the exact difference needed across sessions
    // Work backwards from the final session
    let remainingDiff = diff;
    for (let i = totalSessions - 1; i >= 0 && remainingDiff > 0; i--) {
      const currentDosage = allSessionDosages[i];
      const maxIncrease = targetIntake - currentDosage;
      const increase = Math.min(remainingDiff, maxIncrease);
      allSessionDosages[i] += increase;
      remainingDiff -= increase;
    }
    
    // Force final session to exact target (safety check)
    allSessionDosages[finalSessionIndex] = targetIntake;
  }
  
  // Get sessions for this week
  const session1Index = weekIndex * SESSIONS_PER_WEEK;
  const session2Index = weekIndex * SESSIONS_PER_WEEK + 1;
  const session3Index = weekIndex * SESSIONS_PER_WEEK + 2;
  
  return {
    session1: allSessionDosages[session1Index] || currentIntake,
    session2: allSessionDosages[session2Index] || currentIntake,
    session3: allSessionDosages[session3Index] || targetIntake
  };
}

/**
 * Generate week-by-week phases for the protocol
 */
function generatePhases(
  currentIntake: number,
  targetIntake: number,
  totalWeeks: number
): ProtocolPhase[] {
  const phases: ProtocolPhase[] = [];
  const carbGap = targetIntake - currentIntake;
  
  // Calculate increment per 2-week block
  const numBlocks = Math.ceil(totalWeeks / 2);
  const incrementPerBlock = carbGap / numBlocks;

  let weekStart = 1;
  let currentTarget = currentIntake;

  // Phase names based on position
  const phaseNames = [
    'Baseline',
    'Foundation Building',
    'Progressive Increase',
    'Approaching Target',
    'Target Achievement',
    'Consolidation',
  ];

  for (let i = 0; i < numBlocks; i++) {
    const weekEnd = Math.min(weekStart + 1, totalWeeks);
    currentTarget = Math.round(currentIntake + incrementPerBlock * (i + 1));
    
    // Cap at target
    if (currentTarget > targetIntake) currentTarget = targetIntake;

    const phaseName = phaseNames[Math.min(i, phaseNames.length - 1)];

    phases.push({
      weekStart,
      weekEnd,
      targetIntake: currentTarget,
      phaseName,
    });

    weekStart = weekEnd + 1;
    if (weekStart > totalWeeks) break;
  }

  return phases;
}

/**
 * Format time in minutes to HH:MM:SS string
 */
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  const secs = Math.round((minutes % 1) * 60);
  return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse time string HH:MM:SS to minutes
 */
export function parseTime(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 60 + parts[1] + parts[2] / 60;
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

/**
 * Get practical product translation for intake
 */
export function getIntakeTranslation(intake: number): string {
  // 1 gel ≈ 22g, 1 bottle (500ml) ≈ 40g, 1 bar ≈ 30g
  const gels = Math.round(intake / 22);
  const bottles = Math.round(intake / 40);
  
  if (intake <= 40) {
    return `~${gels} gel${gels !== 1 ? 's' : ''}/hr`;
  } else if (intake <= 60) {
    return `~1 bottle + ${Math.round((intake - 40) / 22)} gel/hr`;
  } else if (intake <= 80) {
    return `~1.5 bottles + 1 gel/hr`;
  } else if (intake <= 100) {
    return `~2 bottles + ${Math.round((intake - 80) / 22)} gel${gels > 1 ? 's' : ''}/hr`;
  } else {
    return `~2-3 bottles + ${Math.round((intake - 80) / 22)} gels/hr`;
  }
}

/**
 * Get numeric intake value (currently state already stores concrete g/h)
 */
export function getIntakeMidpoint(intake: number): number {
  return intake;
}

/**
 * Get product equivalent description for intake level
 */
export function getProductEquivalent(intake: number): string {
  if (intake <= 30) return '~1 gel/hr';
  if (intake <= 45) return '~1-2 gels/hr';
  if (intake <= 60) return '~1 bottle + 1 gel/hr';
  if (intake <= 75) return '~1 bottle + 2 gels/hr';
  if (intake <= 90) return '~2 bottles or 1 bottle + 2-3 gels/hr';
  if (intake <= 105) return '~2 bottles + 1 gel/hr';
  return '~2-3 bottles + 2 gels/hr';
}


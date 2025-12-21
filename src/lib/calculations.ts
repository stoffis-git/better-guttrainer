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
  // STEP 1: Base weeks from user choice
  let baseWeeks: number;
  if (timelineChoice === '4-6-weeks') {
    baseWeeks = 4;
  } else if (timelineChoice === '6-10-weeks') {
    baseWeeks = 8;
  } else {
    baseWeeks = 12;
  }

  // STEP 2-3: Calculate modifiers (using shared function)
  const { giTimeModifier, gapModifier } = calculateProtocolModifiers(giFrequencyPercent, carbGap);

  // STEP 4: Calculate total weeks
  // When user explicitly chooses a timeline, respect their choice as the primary target
  // Apply modifiers but ensure we stay close to the chosen baseWeeks
  let totalWeeks = baseWeeks * giTimeModifier * gapModifier;
  totalWeeks = Math.round(totalWeeks);

  // For user-selected timelines, prioritize respecting their choice
  // Only apply minimum weekly increase constraint if it would result in a significantly different timeline
  const MAX_WEEKS_SMALL_GAP = 8; // for carbGap ≤ 15

  let weeklyIncrease = carbGap / totalWeeks;

  // Only adjust if weekly increase is very small AND the adjustment wouldn't drastically change the timeline
  if (weeklyIncrease < MIN_WEEKLY_INCREASE && carbGap > 0) {
    const maxWeeksByIncrease = Math.floor(carbGap / MIN_WEEKLY_INCREASE);
    
    // If the calculated max weeks is close to baseWeeks (within 1 week), use baseWeeks
    // Otherwise, use the calculated value but ensure we don't go too far from baseWeeks
    if (Math.abs(maxWeeksByIncrease - baseWeeks) <= 1) {
      // Stay with baseWeeks if close
      totalWeeks = baseWeeks;
    } else if (maxWeeksByIncrease < baseWeeks) {
      // If we can't maintain baseWeeks, use calculated value but ensure reasonable minimum
      if (carbGap <= 15) {
        totalWeeks = Math.min(maxWeeksByIncrease, MAX_WEEKS_SMALL_GAP);
      } else {
        totalWeeks = Math.max(4, maxWeeksByIncrease);
      }
    } else {
      // If calculated weeks is higher, use it (user gets a more conservative timeline)
      totalWeeks = maxWeeksByIncrease;
    }
    
    // Recalculate weekly increase
    weeklyIncrease = carbGap / totalWeeks;
  } else {
    // If weekly increase is acceptable, ensure we respect baseWeeks as minimum
    // (unless modifiers suggest a longer timeline, which is fine)
    if (totalWeeks < baseWeeks) {
      totalWeeks = baseWeeks;
      weeklyIncrease = carbGap / totalWeeks;
    }
  }

  // Final safety check: ensure minimum of 2 weeks
  if (totalWeeks < 2) totalWeeks = 2;

  // NEW CORE LOGIC: Increment-based progression
  const { weeklyTargets, incrementSchedule } = calculateIncrementSchedule(
    carbGap,
    totalWeeks,
    currentIntake,
    targetIntake
  );

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
 * Calculate increment schedule and weekly targets using 3g minimum increments
 */
function calculateIncrementSchedule(
  carbGap: number,
  totalWeeks: number,
  currentIntake: number,
  targetIntake: number
): { weeklyTargets: number[]; incrementSchedule: number[] } {
  // Edge case: no gap or negative gap
  if (carbGap <= 0) {
    return {
      weeklyTargets: Array(totalWeeks).fill(currentIntake),
      incrementSchedule: [],
    };
  }

  const MIN_INCREMENT = 3; // Never suggest <3g changes

  // Calculate how many 3g increments are needed
  const numberOfIncrements = Math.floor(carbGap / MIN_INCREMENT);
  const finalAdjustment = carbGap % MIN_INCREMENT; // Leftover grams (<3g)

  // Schedule increments evenly across protocol
  const incrementSchedule: number[] = []; // Week indices where increments happen (0-indexed)

  if (numberOfIncrements === 0) {
    // Gap < 3g: single increment in final week
    incrementSchedule.push(totalWeeks - 1); // 0-indexed
    
  } else if (numberOfIncrements >= totalWeeks) {
    // More increments than weeks: multiple increments per week needed
    // This shouldn't happen with modifiers, but guard against it
    // Distribute as evenly as possible
    for (let i = 0; i < totalWeeks; i++) {
      incrementSchedule.push(i);
    }
    
  } else {
    // Normal case: fewer increments than weeks
    // Space them evenly across the protocol
    const spacing = totalWeeks / numberOfIncrements;
    
    for (let i = 0; i < numberOfIncrements; i++) {
      const weekIndex = Math.round(spacing * (i + 1)) - 1;
      incrementSchedule.push(weekIndex);
    }
  }

  // Ensure last week always contains an increment (to hit exact target)
  if (!incrementSchedule.includes(totalWeeks - 1)) {
    incrementSchedule.push(totalWeeks - 1);
  }

  // Sort and deduplicate
  const uniqueSchedule = [...new Set(incrementSchedule)].sort((a, b) => a - b);

  // Build week-by-week targets
  const weeklyTargets: number[] = [];
  let cumulativeIncrease = 0;

  for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex++) {
    if (uniqueSchedule.includes(weekIndex)) {
      // This week gets an increment
      cumulativeIncrease += MIN_INCREMENT;
    }
    
    const weekTarget = currentIntake + cumulativeIncrease;
    weeklyTargets.push(weekTarget);
  }

  // Final week adjustment: ensure exact target
  const projectedFinal = weeklyTargets[totalWeeks - 1];
  if (projectedFinal !== targetIntake) {
    // Add/subtract the difference to final week
    const diff = targetIntake - projectedFinal;
    weeklyTargets[totalWeeks - 1] = targetIntake;
    
    // If diff is significant (>= MIN_INCREMENT), we need to adjust
    // This means our increment count was slightly off
    if (Math.abs(diff) >= MIN_INCREMENT) {
      // Adjust the last increment week
      const lastIncrementWeek = uniqueSchedule[uniqueSchedule.length - 1];
      if (lastIncrementWeek >= 0 && lastIncrementWeek < totalWeeks) {
        weeklyTargets[lastIncrementWeek] += diff;
        // Recalculate from that point forward
        for (let i = lastIncrementWeek + 1; i < totalWeeks; i++) {
          weeklyTargets[i] = weeklyTargets[lastIncrementWeek];
        }
        weeklyTargets[totalWeeks - 1] = targetIntake; // Final week always exact
      }
    } else {
      // Small adjustment (<3g): just add to final week
      weeklyTargets[totalWeeks - 1] = targetIntake;
    }
  }

  return {
    weeklyTargets,
    incrementSchedule: uniqueSchedule,
  };
}

/**
 * Calculate session dosages for a specific week
 * Returns dosages for up to 3 sessions per week
 */
export function calculateWeekSessions(
  week: number,           // 1-indexed week number
  weeklyTargets: number[], // Array of targets per week (0-indexed)
  totalWeeks: number,
  currentIntake: number,
  targetIntake: number
): { session1: number; session2: number; session3: number } {
  const MIN_INCREMENT = 3;
  const weekIndex = week - 1; // Convert to 0-indexed
  const weekTarget = weeklyTargets[weekIndex];
  
  // Determine if this week has within-week progression
  let withinWeekIncrement = 0;
  
  if (week === totalWeeks) {
    // Last week: all sessions at target (consolidation)
    withinWeekIncrement = 0;
    
  } else if (weekIndex > 0) {
    // Check if there's a jump from previous week
    const previousWeekTarget = weeklyTargets[weekIndex - 1];
    const weeklyJump = weekTarget - previousWeekTarget;
    
    if (weeklyJump >= 6) {
      // Large jump (6+g): add small gradient within week
      // Use 30% of jump, max 3g
      withinWeekIncrement = Math.min(3, Math.floor(weeklyJump * 0.3));
    } else {
      // Small/no jump: flat week
      withinWeekIncrement = 0;
    }
  }
  
  // Calculate sessions
  if (withinWeekIncrement === 0) {
    // Flat week: all sessions identical
    return {
      session1: weekTarget,
      session2: weekTarget,
      session3: weekTarget
    };
    
  } else {
    // Gradient week: progressive within week
    const session1 = weekTarget;
    const session2 = weekTarget + Math.round(withinWeekIncrement * 0.5);
    const session3 = weekTarget + withinWeekIncrement;
    
    // Enforce 3g minimum between sessions (or make them equal)
    let finalSession2 = session2;
    let finalSession3 = session3;
    
    if (session2 - session1 < MIN_INCREMENT) {
      finalSession2 = session1;
    }
    if (finalSession3 - finalSession2 < MIN_INCREMENT) {
      finalSession3 = finalSession2;
    }
    
    // Cap at target
    finalSession2 = Math.min(finalSession2, targetIntake);
    finalSession3 = Math.min(finalSession3, targetIntake);
    
    return {
      session1: session1,
      session2: finalSession2,
      session3: finalSession3
    };
  }
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


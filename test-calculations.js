/**
 * Quick test script for calculation formula
 * Run with: node test-calculations.js
 */

// Mock the types and calculations
// This is a simplified version for testing

const giFrequencyToPercent = {
  'rarely': 5,
  'sometimes': 20,
  'often': 40,
  'very-often': 55,
};

function determineTarget(currentIntake) {
  if (currentIntake < 60) return 60;
  if (currentIntake < 90) return 90;
  return 120;
}

function calculateTimeSavings(profile) {
  const giFrequencyPercent = giFrequencyToPercent[profile.giFrequency];
  const eventDurationHours = profile.finishTimeMinutes / 60;
  const target = determineTarget(profile.currentIntake);
  const carbGap = target - profile.currentIntake;

  if (carbGap <= 0) {
    return {
      timeSavedMinutes: 0,
      minutesLow: 0,
      minutesHigh: 0,
      target,
      carbGap: 0,
    };
  }

  // Calculate base improvement with segmented rates
  let baseImprovement = 0;
  let currentLevel = profile.currentIntake;

  // Segment 1: 60-90g/h at 1.25% per 10g/h
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
  if (target > 105 && currentLevel >= 105) {
    const segmentEnd = Math.min(120, target);
    if (currentLevel < segmentEnd) {
      const segmentGap = segmentEnd - currentLevel;
      if (segmentGap > 0) {
        baseImprovement += (segmentGap / 10) * 0.0025;
      }
    }
  }

  // Apply modifiers
  const genderModifier = profile.gender === 'female' ? 0.92 : 1.0;
  let adjustedImprovement = baseImprovement * genderModifier;

  // Duration modifier
  let durationModifier;
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

  // GI modifier
  let giModifier;
  if (giFrequencyPercent > 30) {
    giModifier = eventDurationHours >= 8 ? 1.2 : 1.35;
  } else {
    giModifier = 1.0;
  }
  adjustedImprovement = adjustedImprovement * giModifier;

  // Calculate time savings
  const timeSavedMinutes = profile.finishTimeMinutes * adjustedImprovement;

  // Variance
  let variance;
  if (target <= 90) {
    variance = 0.20;
  } else if (target <= 105) {
    variance = 0.35;
  } else {
    variance = 0.55;
  }

  let minutesLow = timeSavedMinutes * (1 - variance);
  let minutesHigh = timeSavedMinutes * (1 + variance);
  if (minutesLow < 0) minutesLow = 0;
  minutesLow = Math.round(minutesLow);
  minutesHigh = Math.round(minutesHigh);

  return {
    timeSavedMinutes,
    minutesLow,
    minutesHigh,
    target,
    carbGap,
    baseImprovement,
    genderModifier,
    durationModifier,
    giModifier,
    variance,
  };
}

// Test scenarios
const scenarios = [
  {
    name: 'S1 - Marathon-Läufer',
    profile: {
      currentIntake: 60,
      finishTimeMinutes: 180,
      giFrequency: 'sometimes',
      gender: 'male',
    },
  },
  {
    name: 'S2 - Ironman 70.3 (weiblich)',
    profile: {
      currentIntake: 70,
      finishTimeMinutes: 360,
      giFrequency: 'often',
      gender: 'female',
    },
  },
  {
    name: 'S3a - Ultra ohne GI-Issues',
    profile: {
      currentIntake: 50,
      finishTimeMinutes: 600,
      giFrequency: 'sometimes',
      gender: 'male',
    },
  },
  {
    name: 'S3b - Ultra mit GI-Issues',
    profile: {
      currentIntake: 50,
      finishTimeMinutes: 600,
      giFrequency: 'often',
      gender: 'male',
    },
  },
  {
    name: 'E1 - Minimaler Gap',
    profile: {
      currentIntake: 85,
      finishTimeMinutes: 120,
      giFrequency: 'rarely',
      gender: 'male',
    },
  },
  {
    name: 'E2 - Maximaler Gap (weiblich, lang)',
    profile: {
      currentIntake: 30,
      finishTimeMinutes: 480,
      giFrequency: 'very-often',
      gender: 'female',
    },
  },
  {
    name: 'E3 - 120g/h Target',
    profile: {
      currentIntake: 80,
      finishTimeMinutes: 720,
      giFrequency: 'sometimes',
      gender: 'male',
    },
  },
  {
    name: 'E4 - Kurzdistanz',
    profile: {
      currentIntake: 40,
      finishTimeMinutes: 90,
      giFrequency: 'rarely',
      gender: 'female',
    },
  },
];

console.log('🧪 Testing Updated Calculation Formula\n');
console.log('='.repeat(60));

scenarios.forEach((scenario) => {
  const result = calculateTimeSavings(scenario.profile);
  console.log(`\n${scenario.name}:`);
  console.log(`  Input: ${scenario.profile.currentIntake}g/h → ${result.target}g/h (gap: ${result.carbGap}g/h)`);
  console.log(`  Duration: ${(scenario.profile.finishTimeMinutes / 60).toFixed(1)}h`);
  console.log(`  Base Improvement: ${(result.baseImprovement * 100).toFixed(3)}%`);
  console.log(`  Modifiers: Gender=${result.genderModifier}, Duration=${result.durationModifier}, GI=${result.giModifier}`);
  console.log(`  Total Improvement: ${(result.baseImprovement * result.genderModifier * result.durationModifier * result.giModifier * 100).toFixed(3)}%`);
  console.log(`  timeSavedMinutes = ${result.timeSavedMinutes.toFixed(2)}`);
  console.log(`  Range: [${result.minutesLow} - ${result.minutesHigh}] min`);
});

console.log('\n' + '='.repeat(60));
console.log('\n✅ Test run complete\n');


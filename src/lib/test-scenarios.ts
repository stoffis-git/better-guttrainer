/**
 * Test scenarios for updated calculation formula
 * Run with: npx tsx src/lib/test-scenarios.ts
 */

import { calculateTimeSavings, calculateTimeSavingsToTarget } from './calculations';
import type { AthleteProfile } from './types';

interface TestScenario {
  name: string;
  profile: AthleteProfile;
  expected?: {
    timeSavedMinutes?: number;
    minutesLow?: number;
    minutesHigh?: number;
  };
}

const scenarios: TestScenario[] = [
  // S1 - Marathon-Läufer
  {
    name: 'S1 - Marathon-Läufer',
    profile: {
      sport: 'running',
      event: 'marathon',
      currentIntake: 60,
      finishTimeMinutes: 180, // 3h
      giFrequency: 'sometimes', // 20%
      gender: 'male',
    },
  },
  // S2 - Ironman 70.3 (weiblich)
  {
    name: 'S2 - Ironman 70.3 (weiblich)',
    profile: {
      sport: 'triathlon',
      event: 'half-ironman',
      currentIntake: 70,
      finishTimeMinutes: 360, // 6h
      giFrequency: 'often', // 40%
      gender: 'female',
    },
  },
  // S3a - Ultra ohne GI-Issues
  {
    name: 'S3a - Ultra ohne GI-Issues',
    profile: {
      sport: 'running',
      event: '100k',
      currentIntake: 50,
      finishTimeMinutes: 600, // 10h
      giFrequency: 'sometimes', // 20%
      gender: 'male',
    },
  },
  // S3b - Ultra mit GI-Issues
  {
    name: 'S3b - Ultra mit GI-Issues',
    profile: {
      sport: 'running',
      event: '100k',
      currentIntake: 50,
      finishTimeMinutes: 600, // 10h
      giFrequency: 'often', // 40%
      gender: 'male',
    },
  },
  // E1 - Minimaler Gap
  {
    name: 'E1 - Minimaler Gap',
    profile: {
      sport: 'running',
      event: '10k',
      currentIntake: 85,
      finishTimeMinutes: 120, // 2h
      giFrequency: 'rarely', // 5%
      gender: 'male',
    },
  },
  // E2 - Maximaler Gap (weiblich, lang)
  {
    name: 'E2 - Maximaler Gap (weiblich, lang)',
    profile: {
      sport: 'running',
      event: '100-mile',
      currentIntake: 30,
      finishTimeMinutes: 480, // 8h
      giFrequency: 'very-often', // 55%
      gender: 'female',
    },
  },
  // E3 - 120g/h Target
  {
    name: 'E3 - 120g/h Target',
    profile: {
      sport: 'running',
      event: '100-mile',
      currentIntake: 80,
      finishTimeMinutes: 720, // 12h
      giFrequency: 'sometimes', // 20%
      gender: 'male',
    },
  },
  // E4 - Kurzdistanz
  {
    name: 'E4 - Kurzdistanz',
    profile: {
      sport: 'running',
      event: '10k',
      currentIntake: 40,
      finishTimeMinutes: 90, // 1.5h
      giFrequency: 'rarely', // 5%
      gender: 'female',
    },
  },
];

function runTests() {
  console.log('🧪 Testing Updated Calculation Formula\n');
  console.log('='.repeat(60));

  scenarios.forEach((scenario) => {
    const result = calculateTimeSavings(scenario.profile);
    const max90 = calculateTimeSavingsToTarget(scenario.profile, 90);

    console.log(`\n${scenario.name}:`);
    console.log(`  Input: ${scenario.profile.currentIntake}g/h → ${result.target}g/h`);
    console.log(`  Event Duration: ${result.eventDurationHours.toFixed(1)}h`);
    console.log(`  Gender: ${scenario.profile.gender} (modifier: ${result.genderModifier})`);
    console.log(`  GI Frequency: ${result.giFrequencyPercent}% (modifier: ${result.giModifier})`);
    console.log(`  Duration Modifier: ${result.durationModifier}`);
    console.log(`  Base Improvement: ${(result.baseImprovement * 100).toFixed(3)}%`);
    console.log(`  Total Improvement: ${result.totalImprovementPercent.toFixed(3)}%`);
    console.log(`  timeSavedMinutes = ${result.timeSavedMinutes.toFixed(2)}`);
    console.log(`  Range (nächster Schritt): [${result.minutesLow} - ${result.minutesHigh}] min`);
    console.log(`  Max. Potenzial bei 90g/h: [${max90.minutesLow} - ${max90.minutesHigh}] min`);
    
    if (scenario.expected) {
      if (scenario.expected.timeSavedMinutes) {
        const diff = Math.abs(result.timeSavedMinutes - scenario.expected.timeSavedMinutes);
        const percentDiff = (diff / scenario.expected.timeSavedMinutes) * 100;
        if (percentDiff > 15) {
          console.log(`  ⚠️  WARNING: Expected ~${scenario.expected.timeSavedMinutes}min, got ${result.timeSavedMinutes.toFixed(2)}min (${percentDiff.toFixed(1)}% diff)`);
        } else {
          console.log(`  ✓ Within expected range`);
        }
      }
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Test run complete\n');
}

// Run tests if executed directly
if (require.main === module) {
  runTests();
}

export { runTests, scenarios };


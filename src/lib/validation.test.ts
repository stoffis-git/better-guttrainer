/**
 * Validation Tests for Gut Training Calculator
 * These 5 test scenarios verify correct implementation per specification
 * 
 * Run with: npx tsx src/lib/validation.test.ts
 */

import { calculateTimeSavings, calculateProtocol, recommendTimeline } from './calculations';
import { AthleteProfile, giFrequencyToPercent } from './types';

interface TestCase {
  name: string;
  profile: AthleteProfile;
  expected: {
    target: 60 | 90 | 120;
    minutesLow: number;
    minutesHigh: number;
    protocolWeeks?: number;
    protocolTimeline?: '4-6-weeks' | '6-10-weeks' | '10+-weeks';
  };
}

const testCases: TestCase[] = [
  // Test 1: Baseline (No GI Issues)
  {
    name: 'Test 1: Baseline (No GI Issues)',
    profile: {
      sport: 'triathlon',
      event: 'half-ironman',
      finishTimeMinutes: 300, // 5:00:00
      currentIntake: 65,
      giFrequency: 'rarely', // 5%
      gender: 'male',
    },
    expected: {
      target: 90,
      minutesLow: 4,
      minutesHigh: 7,
      protocolWeeks: 8,
      protocolTimeline: '6-10-weeks',
    },
  },
  
  // Test 2: With GI Issues
  {
    name: 'Test 2: With GI Issues',
    profile: {
      sport: 'triathlon',
      event: 'half-ironman',
      finishTimeMinutes: 300, // 5:00:00
      currentIntake: 65,
      giFrequency: 'often', // 40%
      gender: 'male',
    },
    expected: {
      target: 90,
      minutesLow: 5,
      minutesHigh: 9,
      protocolWeeks: 11,
      protocolTimeline: '6-10-weeks', // User chooses 6-10 weeks
    },
  },
  
  // Test 3: Stepwise Target (should be 60, NOT 90)
  // Note: Using 30g/h to match spec example exactly
  {
    name: 'Test 3: Stepwise Target',
    profile: {
      sport: 'running',
      event: 'marathon',
      finishTimeMinutes: 270, // 4:30:00
      currentIntake: 30, // Changed from 35 to match spec Example 3
      giFrequency: 'sometimes', // 20%
      gender: 'female',
    },
    expected: {
      target: 60, // NOT 90!
      minutesLow: 4,
      minutesHigh: 7,
    },
  },
  
  // Test 4: Elite Athlete
  {
    name: 'Test 4: Elite Athlete',
    profile: {
      sport: 'triathlon',
      event: 'ironman',
      finishTimeMinutes: 660, // 11:00:00
      currentIntake: 95,
      giFrequency: 'rarely', // 5%
      gender: 'male',
    },
    expected: {
      target: 120,
      minutesLow: 1, // Rounds from 1.15 (5.77 * 0.2)
      minutesHigh: 10,
      protocolWeeks: 8,
      protocolTimeline: '6-10-weeks',
    },
  },
  
  // Test 5: Severe GI Issues
  {
    name: 'Test 5: Severe GI Issues',
    profile: {
      sport: 'running',
      event: '100k',
      finishTimeMinutes: 720, // 12:00:00
      currentIntake: 45,
      giFrequency: 'very-often', // 55%
      gender: 'female',
    },
    expected: {
      target: 60,
      minutesLow: 10,
      minutesHigh: 16,
      protocolWeeks: 17,
      protocolTimeline: '10+-weeks', // Recommended for severe GI
    },
  },
];

function runTests() {
  console.log('========================================');
  console.log('GUT TRAINING CALCULATOR VALIDATION TESTS');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n${testCase.name}`);
    console.log('-'.repeat(40));
    
    const result = calculateTimeSavings(testCase.profile);
    const giPercent = giFrequencyToPercent[testCase.profile.giFrequency];
    
    let testPassed = true;
    const issues: string[] = [];

    // Check target
    if (result.target !== testCase.expected.target) {
      testPassed = false;
      issues.push(`Target: expected ${testCase.expected.target}, got ${result.target}`);
    }

    // Check minutes range
    if (result.minutesLow !== testCase.expected.minutesLow) {
      testPassed = false;
      issues.push(`Minutes Low: expected ${testCase.expected.minutesLow}, got ${result.minutesLow}`);
    }
    if (result.minutesHigh !== testCase.expected.minutesHigh) {
      testPassed = false;
      issues.push(`Minutes High: expected ${testCase.expected.minutesHigh}, got ${result.minutesHigh}`);
    }

    // Check protocol weeks if specified
    if (testCase.expected.protocolWeeks && testCase.expected.protocolTimeline) {
      const timeline = testCase.expected.protocolTimeline;
      const protocol = calculateProtocol(
        result.carbGap,
        giPercent,
        timeline,
        testCase.profile.currentIntake,
        result.target
      );
      if (protocol.totalWeeks !== testCase.expected.protocolWeeks) {
        testPassed = false;
        issues.push(`Protocol Weeks: expected ${testCase.expected.protocolWeeks}, got ${protocol.totalWeeks} (timeline: ${timeline})`);
      }
    }

    // Output
    console.log(`Input: ${testCase.profile.gender}, ${testCase.profile.event}, ${testCase.profile.finishTimeMinutes}min, ${testCase.profile.currentIntake}g/h, ${giPercent}% GI`);
    console.log(`Target: ${result.target}g/h`);
    console.log(`Time Saved: ${result.minutesLow}-${result.minutesHigh} minutes`);
    console.log(`Raw Time Saved: ${result.timeSavedMinutes.toFixed(2)} min`);
    console.log(`Total Improvement: ${result.totalImprovementPercent.toFixed(3)}%`);
    console.log(`GI Modifier: ${result.giModifier}x`);
    
    if (testCase.expected.protocolWeeks && testCase.expected.protocolTimeline) {
      const timeline = testCase.expected.protocolTimeline;
      const protocol = calculateProtocol(
        result.carbGap,
        giPercent,
        timeline,
        testCase.profile.currentIntake,
        result.target
      );
      console.log(`Protocol: ${protocol.totalWeeks} weeks (${timeline})`);
    }

    if (testPassed) {
      console.log('✅ PASSED');
      passed++;
    } else {
      console.log('❌ FAILED');
      issues.forEach(issue => console.log(`   - ${issue}`));
      failed++;
    }
  }

  console.log('\n========================================');
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('========================================');
  
  return failed === 0;
}

// Run if executed directly
runTests();

export { runTests, testCases };


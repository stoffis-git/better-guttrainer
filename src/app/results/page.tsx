'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { calculateTimeSavings, calculateTimeSavingsToTarget, getIntakeMidpoint } from '@/lib/calculations';
import { giFrequencyToPercent, eventDisplayNames, isShortDistanceEvent, sportDisplayNames } from '@/lib/types';
import type { AthleteProfile, CalculationResult } from '@/lib/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ResultsScreen from '@/components/screens/ResultsScreen';

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Header />
      <ResultsScreen />
      <Footer />
    </div>
  );
}


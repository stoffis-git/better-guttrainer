'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { calculateProtocol, recommendTimeline, getIntakeMidpoint } from '@/lib/calculations';
import { giFrequencyToPercent, isShortDistanceEvent } from '@/lib/types';
import type { TimelineChoice } from '@/lib/types';

export default function ProtocolSetupScreen() {
  const router = useRouter();
  const { state, setProtocolResult, setAnswer } = useApp();
  const [timeline, setTimeline] = useState<TimelineChoice | null>(null);
  const frequency = state.frequency || 2;

  const calcResult = state.calculationResult;
  const currentIntake = getIntakeMidpoint(state.currentIntake!);
  const giPercent = giFrequencyToPercent[state.giFrequency!];

  // Basis-Empfehlung aus der Berechnung
  const baseTimeline = useMemo(() => {
    if (!calcResult) return '6-10-weeks';
    return recommendTimeline(calcResult.carbGap, giPercent);
  }, [calcResult, giPercent]);

  // Sicherheitsfaktor: bei aktuellen Aufnahmen ≥90g/h keine zu aggressive Progression empfehlen
  const safetyAdjustedTimeline = useMemo<TimelineChoice>(() => {
    if (!calcResult) return '6-10-weeks';
    if (currentIntake < 90) return baseTimeline;

    // Ab 90g/h bevorzugen wir mindestens den mittleren Zeitrahmen
    if (baseTimeline === '4-6-weeks') {
      return '6-10-weeks';
    }
    return baseTimeline;
  }, [baseTimeline, calcResult, currentIntake]);

  if (!calcResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Keine Berechnungsdaten gefunden. Bitte starte die Analyse erneut.</p>
      </div>
    );
  }

  const handleGenerate = () => {
    const selectedTimeline = timeline || safetyAdjustedTimeline;
    const protocol = calculateProtocol(
      calcResult.carbGap,
      giPercent,
      selectedTimeline,
      currentIntake,
      calcResult.target
    );
    setProtocolResult(protocol);
    router.push('/protocol-results');
  };

  const timelineOptions: { value: TimelineChoice; label: string; desc: string; rate: string }[] = [
    { value: '4-6-weeks', label: '4 Wochen', desc: 'Schnelle Progression, hohe Trainingsdisziplin nötig', rate: '~2g/Woche' },
    { value: '6-10-weeks', label: '8 Wochen', desc: 'Gleichgewicht aus Tempo und Anpassung', rate: '~1,2g/Woche' },
    { value: '10+-weeks', label: '12 Wochen', desc: 'Konservativ, geringstes GI-Risiko', rate: '~0,7g/Woche' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <a
          href="/results"
          className="flex items-center gap-2 text-sm md:text-base text-black/70 hover:text-black transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Zurück zum Ergebnis
        </a>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 pt-6 pb-0 md:pb-2">
        <div className="max-w-xl mx-auto space-y-10">
          {/* Short distance disclaimer */}
          {state.sport && state.event && isShortDistanceEvent(state.sport, state.event) && (
            <p className="text-xs text-zinc-500 text-center">
              Hinweis: Bei kürzeren Distanzen wie dieser macht das Carb- und Elektrolyte-Loading vor dem Event den Großteil einer guten Fueling-Strategie aus – nicht deine Intra-Nutrition!
            </p>
          )}
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-medium">Dein Protokoll</h1>
            <p className="text-zinc-500">
              {currentIntake}g/h auf {calcResult.target}g/h
            </p>
          </div>

          {/* Timeline Selection */}
          <div className="space-y-4">
            <h2 className="text-label">Wähle deinen Zeitrahmen</h2>
            <div className="space-y-3">
              {timelineOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeline(option.value)}
                  className={`w-full p-5 rounded-xl border text-left transition-all ${
                    (timeline || safetyAdjustedTimeline) === option.value
                      ? 'border-black bg-black text-white'
                      : 'border-black/10 hover:border-black/30 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{option.label}</span>
                        {safetyAdjustedTimeline === option.value && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            (timeline || safetyAdjustedTimeline) === option.value
                              ? 'bg-white/20 text-white'
                              : 'bg-black/10 text-black/70'
                          }`}>
                            Empfohlen
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${
                        (timeline || safetyAdjustedTimeline) === option.value
                          ? 'text-white/80'
                          : 'text-black/60'
                      }`}>
                        {option.desc}
                      </p>
                    </div>
                    <span className={`text-sm ${
                      (timeline || safetyAdjustedTimeline) === option.value
                        ? 'text-white/80'
                        : 'text-black/60'
                    }`}>
                      {option.rate}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Training Frequency */}
          <div className="space-y-4">
            <h2 className="text-label">Trainingshäufigkeit</h2>
            <p className="text-sm text-zinc-500">Wie viele Einheiten <span className="font-medium">über 2 Stunden</span> schaffst du pro Woche?</p>
            <div className="grid grid-cols-3 gap-3">
              {([1, 2, 3] as const).map((num) => (
                <button
                  key={num}
                  onClick={() => setAnswer('frequency', num)}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    frequency === num
                      ? 'border-black bg-black text-white'
                      : 'border-black/10 hover:border-black/30 bg-white'
                  }`}
                >
                  <span className="text-2xl font-medium">{num}{num === 3 && '+'}</span>
                  <p className={`text-xs mt-1 ${frequency === num ? 'text-white/80' : 'text-black/60'}`}>
                    Einheit{num > 1 ? 'en' : ''}
                  </p>
                </button>
              ))}
            </div>
            {frequency >= 2 && (
              <p className="text-xs text-black/60 mb-4">✓ Empfohlen für bestmögliche Anpassung</p>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 pt-2 md:pt-0 pb-12 md:pb-[146px]">
        <div className="max-w-xl mx-auto">
          <button
            onClick={handleGenerate}
            className="w-full btn-primary text-lg py-5"
          >
            Protokoll erstellen →
          </button>
        </div>
      </footer>
    </div>
  );
}

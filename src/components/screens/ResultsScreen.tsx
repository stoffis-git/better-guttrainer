'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { calculateTimeSavings, calculateTimeSavingsToTarget, getIntakeMidpoint } from '@/lib/calculations';
import { giFrequencyToPercent, eventDisplayNames, isShortDistanceEvent, sportDisplayNames } from '@/lib/types';
import type { AthleteProfile, CalculationResult } from '@/lib/types';

// Helper for header time display (HH:MMh)
function formatHoursMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.floor(totalMinutes % 60);
  return `${h}:${m.toString().padStart(2, '0')}h`;
}

// Weeks helper as specified
function getAvailableWeekOptions(currentIntake: number, nextStep: number): number[] {
  const gap = nextStep - currentIntake;
  const baseWeeks = Math.ceil((gap / 10) * 4); // 4 Wochen pro 10g/h

  const minWeeks = Math.max(4, baseWeeks - 2);
  const maxWeeks = baseWeeks + 6;

  const options: number[] = [];
  for (let w = minWeeks; w <= maxWeeks; w += 2) {
    options.push(w);
  }

  return options;
}

export default function ResultsScreen() {
  const router = useRouter();
  const { state, setCalculationResult } = useApp();
  const [showDetails, setShowDetails] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: "better Gut-Training Tool",
      text: "Berechne dein individuelles Gut-Training Protokoll",
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled, ignore
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        // Simple toast notification
        const toast = document.createElement('div');
        toast.textContent = 'Link kopiert';
        toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg text-sm z-50';
        document.body.appendChild(toast);
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 2000);
      } catch (err) {
        console.error('Failed to copy to clipboard', err);
      }
    }
  };

  // Fast path: if intake already >=120g/h, congratulate and finish
  // This check must come BEFORE profile validation to handle early exits from questionnaire
  if (state.currentIntake !== undefined) {
    const currentIntakeNum = getIntakeMidpoint(state.currentIntake);
    if (currentIntakeNum >= 120) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-xl text-center space-y-6">
            <h1 className="text-3xl font-semibold">Starke Leistung!</h1>
            <p className="text-lg text-zinc-600">
              Du liegst bereits bei oder über 120 g/h – das ist ein Niveau, das nur wenige Athlet:innen dauerhaft erreichen.
              Für dich ist keine weitere Optimierung vorgesehen. Bleib bei deinem etablierten Protokoll, tracke Verträglichkeit, und passe nur bei Bedarf minimal an.
            </p>
            <a
              href="/"
              className="btn-primary bg-black text-white hover:bg-black hover:text-white px-10 py-4 text-lg inline-block"
            >
              Neue Berechnung starten
            </a>
          </div>
        </div>
      );
    }
  }

  const profile: AthleteProfile | null = useMemo(() => {
    if (
      !state.sport ||
      !state.event ||
      state.finishTimeMinutes === undefined ||
      state.currentIntake === undefined ||
      !state.giFrequency ||
      !state.gender
    ) {
      return null;
    }
    return {
      sport: state.sport,
      event: state.event,
      finishTimeMinutes: state.finishTimeMinutes,
      currentIntake: state.currentIntake,
      giFrequency: state.giFrequency,
      gender: state.gender,
    };
  }, [state]);

  const result: CalculationResult | null = useMemo(() => {
    if (!profile) return null;
    return calculateTimeSavings(profile);
  }, [profile]);

  // Persist result in global state without causing render loops
  useEffect(() => {
    if (result) {
      // Only update if result actually changed (compare key values to avoid infinite loops)
      const currentResult = state.calculationResult;
      if (
        !currentResult ||
        currentResult.target !== result.target ||
        currentResult.carbGap !== result.carbGap ||
        currentResult.minutesLow !== result.minutesLow ||
        currentResult.minutesHigh !== result.minutesHigh
      ) {
        setCalculationResult(result);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, state.calculationResult]); // Compare values to prevent infinite loops

  if (!profile || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Es fehlen Angaben. Bitte starte die Abfrage erneut.</p>
      </div>
    );
  }

  const currentIntakeNum = getIntakeMidpoint(profile.currentIntake);
  // Dynamic values for the new layout
  const eventTypeLabel = sportDisplayNames[profile.sport];
  const distanceLabel = eventDisplayNames[profile.event];
  const currentTimeLabel = formatHoursMinutes(profile.finishTimeMinutes);

  const nextStep = result.target;
  const timeSavedNextStepMin = result.minutesLow;
  const timeSavedNextStepMax = result.minutesHigh;

  const weekOptions = getAvailableWeekOptions(currentIntakeNum, nextStep);
  const weekMin = weekOptions[0];
  const weekMax = weekOptions[weekOptions.length - 1];

  const progressPercent = (currentIntakeNum / 120) * 100;
  const currentPositionPercent = Math.max(0, Math.min((currentIntakeNum / 120) * 100, 100));
  const nextStepPositionPercent = Math.max(0, Math.min((nextStep / 120) * 100, 100));
  const recommended90PositionPercent = Math.max(0, Math.min((90 / 120) * 100, 100));

  // Abstand zwischen aktuellem Stand und Ziel, um Text-Überlagerungen zu vermeiden
  const markerDistance = Math.abs(currentPositionPercent - nextStepPositionPercent);
  const markersTooClose = markerDistance < 20; // in Prozentpunkten – aktiviert bei Differenzen < 20%

  const maxPotential90 = calculateTimeSavingsToTarget(profile, 90);

  // Research section visibility (fallabhängig)
  const showPerformanceOptimizationStudies = currentIntakeNum < 90;
  const showAdvancedProtocolStudies = currentIntakeNum >= 90 && nextStep === 120;

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Sektion 1: Header */}
      <section className="border-b border-black/5 bg-white">
        <div className="max-w-[2000px] mx-auto px-8 py-14">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <p className="text-base md:text-lg font-semibold tracking-[0.18em] text-black/70">
              DEIN PERFORMANCE-POTENZIAL
            </p>
            <p className="text-xs md:text-sm text-black/60">
              {eventTypeLabel} • {distanceLabel} • Deine Zeit: {currentTimeLabel}
            </p>
          </div>
        </div>
      </section>

      {/* Sektion 2: Hero Number + Quick Win Box */}
      <section className="border-b border-black/5 bg-white">
        <div className="max-w-[2000px] mx-auto px-8 py-16">
          <div className="max-w-4xl mx-auto space-y-10">
            {/* Hero number */}
            <div className="space-y-4 text-center">
              <p className="text-sm md:text-base uppercase tracking-[0.2em] text-black/60">Spare bis zu</p>
              <p className="font-semibold tracking-tight leading-tight">
                <span className="text-6xl md:text-7xl">
                  {timeSavedNextStepMin}–{timeSavedNextStepMax}
                </span>{' '}
                <span className="text-2xl md:text-3xl align-baseline">Minuten</span>
              </p>
              <p className="text-base md:text-lg text-black/60">
                Alleine durch Optimierung deiner Nutrition!
              </p>
            </div>

            {/* Quick Win Box */}
            <div className="space-y-4">
              <div className="rounded-xl border border-black/10 p-[2px]">
                <div className="rounded-[10px] border border-black/10 bg-black/3 px-6 py-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-6 text-xl md:text-2xl font-medium max-w-full mx-auto" style={{ maxWidth: '375px' }}>
                      <span className="whitespace-nowrap">{currentIntakeNum} g/h</span>
                      <div className="flex items-center flex-1 min-w-0 max-w-[200px]">
                        <div className="flex-1 h-px bg-black/30"></div>
                        <span className="mx-1 text-xs text-black/30">►</span>
                      </div>
                      <span className="whitespace-nowrap">{nextStep} g/h</span>
                    </div>
                    <p className="text-base md:text-lg text-center text-black/60">
                      ✓ Realistisch zwischen {weekMin}-{weekMax} Wochen erreichbar
                    </p>
                  </div>
                </div>
              </div>
          </div>

            {/* CTA Button between Sektion 2 and 3 */}
            <div className="flex justify-center">
          <a
            href="/protocol-setup"
                className="btn-primary bg-black text-white hover:bg-black hover:text-white px-12 py-4 text-lg md:text-xl inline-block"
          >
                Mein {nextStep} g/h-Protokoll downloaden
          </a>
            </div>
          </div>
        </div>
      </section>

      {/* Sektion 3: Progression */}
      <section className="bg-white border-b border-black/5">
        <div className="max-w-[2000px] mx-auto px-8 pt-14 pb-24">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-base md:text-lg font-semibold tracking-[0.18em] uppercase text-black/70">
              DEIN LEISTUNGSPOTENTIAL
            </h2>

            {/* Progress Bar */}
            <div className="space-y-4">
              <div className="relative w-full h-28 md:h-24">
                {/* Statik: Marker oberhalb der Leiste */}
                {/* 0 g/h Marker */}
                <div className="absolute left-0 top-3 flex flex-col items-start text-xs md:text-sm text-black/60">
                  <span>0 g/h</span>
                </div>

                {/* 90 g/h Marker */}
                <div
                  className="absolute top-3 flex flex-col items-center text-xs md:text-sm text-black/60"
                  style={{ left: `${recommended90PositionPercent}%`, transform: 'translateX(-50%)' }}
                >
                  <span>90 g/h</span>
                </div>

                {/* 120 g/h Marker */}
                <div className="absolute right-0 top-3 flex flex-col items-end text-xs md:text-sm text-black/60">
                  <span>120 g/h</span>
                </div>

                {/* Progress bar */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2">
                  <div className="w-full h-2 rounded-full bg-black/5 overflow-hidden">
                    <div
                      className="h-full bg-black rounded-full"
                      style={{ width: `${Math.max(0, Math.min(progressPercent, 100))}%` }}
                    />
                  </div>
                </div>

                {/* Kleiner statischer Strich bei 90 g/h auf der Leiste */}
                <div
                  className="absolute h-4 w-px bg-black"
                  style={{ left: `${recommended90PositionPercent}%`, top: '50%', transform: 'translateX(-50%) translateY(-50%)' }}
                />

                {/* Dynamik: Aktuell & Ziel unterhalb der Leiste – mit fixer vertikaler Position */}
                {!markersTooClose ? (
                  <>
                    {/* Aktueller Stand */}
                    <div
                      className="absolute flex flex-col items-center gap-1 text-xs md:text-sm"
                      style={{ left: `${currentPositionPercent}%`, top: 'calc(50% + 14px)', transform: 'translateX(-50%)' }}
                    >
                      <span className="text-sm text-black">↑</span>
                      <span className="text-black whitespace-nowrap text-base md:text-lg font-medium">
                        {currentIntakeNum} g/h
                      </span>
                      <span className="text-sm md:text-base text-black/70 whitespace-nowrap">Aktuell</span>
                    </div>

                    {/* Ziel (nextStep) */}
                    <div
                      className="absolute flex flex-col items-center gap-1 text-xs md:text-sm text-black/70"
                      style={{ left: `${nextStepPositionPercent}%`, top: 'calc(50% + 14px)', transform: 'translateX(-50%)' }}
                    >
                      <span className="text-sm">↑</span>
                      <span className="whitespace-nowrap text-base md:text-lg font-medium">
                        {nextStep} g/h
                      </span>
                      <span className="text-sm md:text-base text-black/70 whitespace-nowrap">Ziel</span>
                    </div>
                  </>
                ) : (
                  /* Wenn Marker zu nah beieinander liegen, zusammenfassen - aber beide Pfeile behalten */
                  <>
                    {/* Pfeil für Aktuell */}
                    <div
                      className="absolute flex flex-col items-center"
                      style={{ left: `${currentPositionPercent}%`, top: 'calc(50% + 14px)', transform: 'translateX(-50%)' }}
                    >
                      <span className="text-sm text-black">↑</span>
                    </div>
                    {/* Pfeil für Ziel */}
                    <div
                      className="absolute flex flex-col items-center"
                      style={{ left: `${nextStepPositionPercent}%`, top: 'calc(50% + 14px)', transform: 'translateX(-50%)' }}
                    >
                      <span className="text-sm text-black/70">↑</span>
                    </div>
                    {/* Zusammengefasste Zahlen und Labels in der Mitte */}
                    <div
                      className="absolute flex flex-col items-center gap-1 text-xs md:text-sm text-black"
                      style={{
                        left: `${(currentPositionPercent + nextStepPositionPercent) / 2}%`,
                        top: 'calc(50% + 32px)',
                        transform: 'translateX(-50%)',
                      }}
                    >
                      <span className="whitespace-nowrap text-base md:text-lg font-medium">
                        {currentIntakeNum} → {nextStep} g/h
                      </span>
                      <span className="text-sm md:text-base text-black/70 whitespace-nowrap">
                        Aktuell → Ziel
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Max potential at 90g/h – nur anzeigen, wenn Hauptziel nicht 90 ist UND aktuelle Aufnahme <90g/h */}
            {nextStep !== 90 && currentIntakeNum < 90 && (
              <p className="mt-10 md:mt-12 text-lg md:text-xl text-black font-medium">
                Maximales Potenzial bei 90 g/h:{' '}
                <span className="font-semibold">
                  {maxPotential90.minutesLow}-{maxPotential90.minutesHigh} Minuten gesamt
                </span>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Untere Sektionen – unverändert lassen */}
      <section className="section-light">
        <div className="max-w-[2000px] mx-auto px-8 py-20">
          <div className="max-w-4xl mx-auto space-y-14">
            {/* Short distance disclaimer */}
            {isShortDistanceEvent(profile.sport, profile.event) && (
              <p className="text-xs text-zinc-500">
                Hinweis: Bei kürzeren Distanzen wie dieser macht das Carb- und Elektrolyte-Loading vor dem Event den Großteil einer guten Fueling-Strategie aus – nicht deine Intra-Nutrition!
              </p>
            )}
            {/* The Opportunity */}
            <div className="space-y-4">
              <h3 className="text-base md:text-lg font-semibold tracking-[0.18em] uppercase text-zinc-500">
                Die Chance
              </h3>
              {currentIntakeNum >= 90 ? (
                <>
                  <p className="text-lg md:text-xl text-zinc-800">
                    Du nimmst aktuell {currentIntakeNum}g Kohlenhydrate pro Stunde auf. Eine Steigerung auf {result.target}g/h
                    {result.target === 120 && ' nutzt dein maximales Kohlenhydrat-Aufnahme­potenzial aus und verbessert Regeneration sowie Erholung.'}
                  </p>
                  <ul className="space-y-2 text-base md:text-lg text-zinc-600">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                      Geringere Marker für muskuläre Schäden während langer Events
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                      Verbesserte Erholung und Regeneration nach dem Wettkampf
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                      Erhaltung der neuromuskulären Funktion über viele Stunden
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                      Optimierte Substrateverfügbarkeit für fortgeschrittene Athlet:innen
                    </li>
                  </ul>
                </>
              ) : (
                <>
                  <p className="text-lg md:text-xl text-zinc-800">
                    Du nimmst aktuell {currentIntakeNum}g Kohlenhydrate pro Stunde auf. Eine Steigerung auf {result.target}g/h
                    {result.target === 60 && ' würde einige Vorteile bringen.'}
                    {result.target === 90 && ' erschließt deutlich höhere Kohlenhydrat-Oxidationsraten.'}
                  </p>
                  <ul className="space-y-2 text-base md:text-lg text-zinc-600">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                      Verzögerte Glykogenentleerung
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                      Stabilere Leistung und Pace in der letzten Rennstunde
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                      Geringeres Risiko für Hungerast (»Bonk«)
                    </li>
                  </ul>
                </>
              )}
            </div>

            {/* Research */}
            <div className="space-y-6">
              <h3 className="text-base md:text-lg font-semibold tracking-[0.18em] uppercase text-zinc-500">
                Was die Forschung zeigt
              </h3>

            {/* PERFORMANCE-OPTIMIERUNG (60-90g/h) – nur bei aktuellen Aufnahmen <90g/h */}
            {showPerformanceOptimizationStudies && (
              <div className="space-y-3 text-base md:text-lg text-zinc-600">
                <div className="p-4 bg-white rounded-xl border border-zinc-200">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium text-zinc-800">Costa et al. (2017)</p>
                    <a
                      href="https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0173-6"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-zinc-600 transition-colors"
                      aria-label="Externer Link zur Studie Costa et al. (2017)"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.6}
                          d="M7 5h8m0 0v8m0-8L9 11"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.6}
                          d="M5 9v6h6"
                        />
                      </svg>
                    </a>
                  </div>
                  <p>
                    Athlet:innen, die ihren Darm auf 90g/h trainierten, verbesserten ihre Leistung in Ausdauerstudien
                    im Schnitt um 5,2&nbsp;% (p=0,009).
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-zinc-200">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium text-zinc-800">Stellingwerff &amp; Cox (2014)</p>
                    <a
                      href="https://link.springer.com/article/10.1007/s40279-014-0184-6"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-zinc-600 transition-colors"
                      aria-label="Externer Link zur Studie Stellingwerff & Cox (2014)"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.6}
                          d="M7 5h8m0 0v8m0-8L9 11"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.6}
                          d="M5 9v6h6"
                        />
                      </svg>
                    </a>
                  </div>
                  <p>
                    Systematisches Review: 2–3&nbsp;% Zeitverbesserung, wenn von moderater zu optimaler
                    Kohlenhydrat­zufuhr bei Wettkämpfen &gt;2,5&nbsp;h gesteigert wird.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-zinc-200">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium text-zinc-800">
                      Pfeiffer et al. (2012)
                    </p>
                    <a
                      href="https://link.springer.com/article/10.1007/s00421-011-2159-0"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-zinc-600 transition-colors"
                      aria-label="Externer Link zur Studie Pfeiffer et al. (2012)"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.6}
                          d="M7 5h8m0 0v8m0-8L9 11"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.6}
                          d="M5 9v6h6"
                        />
                      </svg>
                    </a>
                  </div>
                  <p>
                    Bis zu ~8&nbsp;% bessere Performance mit Glukose+Fruktose-Mischungen bei Aufnahmen bis 90g/h und
                    höherer GI-Toleranz in realen Wettkämpfen.
                  </p>
                </div>

              <div className="p-4 bg-white rounded-xl border border-zinc-200">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium text-zinc-800">
                      Jeukendrup (2014)
                    </p>
                    <a
                      href="https://link.springer.com/article/10.1007/s40279-014-0148-z"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-zinc-600 transition-colors"
                      aria-label="Externer Link zur Studie Jeukendrup (2014)"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.6}
                          d="M7 5h8m0 0v8m0-8L9 11"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.6}
                          d="M5 9v6h6"
                        />
                      </svg>
                    </a>
                  </div>
                  <p>
                    Schritt in Richtung personalisierte Sportnutrition: zeigt, wie 60–90g/h (und darüber) je nach
                    Athlet:in 8–15&nbsp;% der Performance bei langen und Ultra-Events erklären können.
                  </p>
                </div>
              </div>
            )}

            {/* FORTGESCHRITTENE PROTOKOLLE (90-120g/h) – nur bei fortgeschrittenen Zielen */}
            {showAdvancedProtocolStudies && (
              <div className="space-y-3 text-base md:text-lg text-zinc-600">
                <div className="p-4 bg-white rounded-xl border border-zinc-200">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium text-zinc-800">Viribay et al. (2020)</p>
                    <a
                      href="https://www.mdpi.com/2072-6643/12/5/1367"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-zinc-600 transition-colors"
                      aria-label="Externer Link zur Studie Viribay et al. (2020)"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.6}
                          d="M7 5h8m0 0v8m0-8L9 11"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.6}
                          d="M5 9v6h6"
                        />
                      </svg>
                    </a>
                  </div>
                  <p>
                    Elite-Bergmarathonläufer:innen mit 120g/h während des Rennens zeigten geringere Marker für
                    muskuläre Schäden und bessere Erholung.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-zinc-200">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium text-zinc-800">Urdampilleta et al. (2020)</p>
                    <a
                      href="https://www.mdpi.com/2072-6643/12/9/2634"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-zinc-600 transition-colors"
                      aria-label="Externer Link zur Studie Urdampilleta et al. (2020)"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.6}
                          d="M7 5h8m0 0v8m0-8L9 11"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.6}
                          d="M5 9v6h6"
                        />
                      </svg>
                    </a>
                  </div>
                  <p>
                    Systematisches Review zu Trails &amp; Ultras: zeigt, wie hohe Carb-Zufuhr und Hydration helfen,
                    neuromuskuläre Funktion und Performance über viele Stunden zu erhalten.
                  </p>
                </div>

              <div className="p-4 bg-white rounded-xl border border-zinc-200">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium text-zinc-800">
                      Costa et al. (2019)
                    </p>
                    <a
                      href="https://www.mdpi.com/2076-3921/8/7/203"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-zinc-600 transition-colors"
                      aria-label="Externer Link zur Studie Costa et al. (2019)"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.6}
                          d="M7 5h8m0 0v8m0-8L9 11"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.6}
                          d="M5 9v6h6"
                        />
                      </svg>
                    </a>
                  </div>
                  <p>
                    Zweiwöchiges »Gut-Training« mit sehr hoher Carb-Zufuhr machte 120g/h im Labor tolerierbar und
                    verbesserte v.a. Substrateverfügbarkeit und Recovery – ein Hinweis, dass 90–120g/h primär für
                    fortgeschrittene Athlet:innen sinnvoll sind.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Calculation Breakdown (collapsible) */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-zinc-200 text-sm font-medium text-zinc-800"
            >
              <span>So wurde gerechnet</span>
              <span className="text-xs text-zinc-500">{showDetails ? 'Ausblenden' : 'Details anzeigen'}</span>
            </button>
            {showDetails && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-4 bg-white rounded-xl border border-zinc-200">
                    <p className="text-zinc-500">Carb-Gap</p>
                    <p className="font-medium text-zinc-800">+{result.carbGap}g/h</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-zinc-200">
                    <p className="text-zinc-500">Basisrate</p>
                    <p className="font-medium text-zinc-800">0,70&nbsp;% pro 10g/h</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-zinc-200">
                    <p className="text-zinc-500">Geschlechts­faktor</p>
                    <p className="font-medium text-zinc-800">{profile.gender === 'female' ? '0.95×' : '1×'}</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-zinc-200">
                    <p className="text-zinc-500">Dauer ({(profile.finishTimeMinutes / 60).toFixed(1)} Std.)</p>
                    <p className="font-medium text-zinc-800">{result.durationModifier.toFixed(1)}×</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-zinc-200">
                    <p className="text-zinc-500">GI-Potenzial</p>
                    <p className="font-medium text-zinc-800">{result.giModifier.toFixed(1)}×</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-zinc-200">
                    <p className="text-zinc-500">Gesamtverbesserung</p>
                    <p className="font-medium text-zinc-800">{result.totalImprovementPercent.toFixed(2)}%</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-500">
                  {result.target === 120 
                    ? 'Breiter Bereich (±80&nbsp;%) zeigt: Die Evidenz für sehr hohe Aufnahmen (120g/h) ist noch im Aufbau.'
                    : 'Schmaler Bereich (±25&nbsp;%) zeigt: Für diese Aufnahmemenge liegt konsistente Evidenz vor.'}
                </p>
              </div>
            )}
          </div>
        </div>
        </div>
      </section>

      {/* Share Button */}
      <footer className="px-6 pt-12 pb-24">
        <div className="max-w-xl mx-auto">
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 border border-black/10 hover:border-black/30 bg-white text-black rounded-full transition-colors font-medium"
            aria-label="Tool teilen"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Tool Teilen
          </button>
        </div>
      </footer>
    </div>
  );
}

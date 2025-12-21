'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { getIntakeMidpoint, getProductEquivalent } from '@/lib/calculations';
import { isShortDistanceEvent, sportDisplayNames, eventDisplayNames } from '@/lib/types';

// Helper for header time display (HH:MMh)
function formatHoursMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.floor(totalMinutes % 60);
  return `${h}:${m.toString().padStart(2, '0')}h`;
}

export default function ProtocolResultsScreen() {
  const router = useRouter();
  const { state } = useApp();
  const protocol = state.protocolResult;
  const currentIntake = getIntakeMidpoint(state.currentIntake!);
  const calcResult = state.calculationResult;
  
  // Derive targetIntake from last phase or calculation result
  const targetIntake = protocol?.phases && protocol.phases.length > 0 
    ? protocol.phases[protocol.phases.length - 1].targetIntake 
    : calcResult?.target || 0;
  
  // Get carbGap from calculation result
  const carbGap = calcResult?.carbGap || 0;

  if (!protocol) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Es wurde noch kein Protokoll erstellt. Bitte starte die Analyse erneut.</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  // Sport-specific training guidance
  const sportGuidance = {
    triathlon: {
      session: 'Lange Radtour (3–4 Stunden)',
      why: 'Einfacher als Laufen zu trainieren (weniger GI-Beschwerden durch Aufprall)',
      strategy: [
        'Erste 30 Min: Leichtes Tempo, keine Zufuhr',
        'Stunden 1–3: Teste die volle wöchentliche Zielzufuhr (siehe Progressionsplan)',
        'Letzte 30 Min: Teste Wettkampfprodukte bei der Zielzufuhr',
      ],
      raceDay: [
        '70% der Zufuhr auf dem Rad',
        '30% der Zufuhr beim Laufen',
        'Gel bei T1 (Radaufstieg) konsumieren',
        'Gel direkt nach dem Rad bei T2 konsumieren',
      ],
    },
    cycling: {
      session: 'Lange Tour (4+ Stunden)',
      why: 'Längere Dauer ermöglicht mehrere Zufuhrfenster',
      strategy: [
        'Erste 30 Min: Leichtes Fahren, keine Zufuhr',
        'Stunden 1–3: Teste die volle wöchentliche Zielzufuhr bei Wettkampfintensität',
        'Stunde 4+: Simuliere Wettkampfbedingungen mit der Zielzufuhr',
      ],
      raceDay: [
        'Wenn möglich, erste 2 Stunden vorladen',
        'Timer für regelmäßige Zufuhr-Erinnerungen setzen',
        'Flaschenübergaben üben, wenn Support vorhanden',
      ],
    },
    gravel: {
      session: 'Lange Gravel-Tour (3–5 Stunden)',
      why: 'Gemischtes Terrain hilft beim Üben der Zufuhr unter verschiedenen Bedingungen',
      strategy: [
        'Erste 30 Min: Leichtes Tempo, keine Zufuhr',
        'Stunden 1–3: Teste die volle wöchentliche Zielzufuhr',
        'Zufuhr auf schwierigen Abschnitten üben',
        'Taschenzugängliche Ernährung testen',
      ],
      raceDay: [
        'Vor technischen Abschnitten vorladen',
        'Einfache Abschnitte für größere Zufuhr nutzen',
        'Wettkampfernährung in leicht zugänglichen Taschen',
      ],
    },
    running: {
      session: 'Langer Lauf mit Gehpausen (2–3 Stunden)',
      why: 'Gehintervalle ermöglichen einfachere Zufuhr',
      strategy: [
        'Erste 30 Min: Leichtes Tempo, nur Hydration',
        'Stunden 1–2: Teste die volle wöchentliche Zielzufuhr',
        'Zufuhr während Gehintervallen üben',
        'Verschiedene Produktformate testen (Gels vs. Getränke)',
      ],
      raceDay: [
        'Ernährung an Verpflegungsstationen aufnehmen',
        'Bei Bedarf durch Verpflegungsstationen gehen',
        'Wettkampfmarken vor dem Event üben',
      ],
    },
  };

  const guidance = sportGuidance[state.sport!] || sportGuidance.cycling;

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="px-6 py-6 border-b border-black/5">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <a
            href="/protocol-setup"
            className="flex items-center gap-2 text-black/70 hover:text-black transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück
          </a>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-black/80 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Protokoll downloaden
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-12 border-b border-black/5">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h1 className="text-3xl font-medium">Dein Gut-Training-Protokoll</h1>
          
          {/* Input Summary - Minimal */}
          <div className="pt-4">
            <p className="text-xs text-black/50 space-x-3">
              {state.sport && <span>{sportDisplayNames[state.sport]}</span>}
              {state.event && <span>• {eventDisplayNames[state.event]}</span>}
              {state.finishTimeMinutes && (
                <span>• {formatHoursMinutes(state.finishTimeMinutes)}</span>
              )}
              {state.giFrequency && (
                <span>• {state.giFrequency === 'rarely' ? 'Selten' : state.giFrequency === 'sometimes' ? 'Gelegentlich' : state.giFrequency === 'often' ? 'Häufig' : 'Sehr häufig'} GI-Beschwerden</span>
              )}
              {state.gender && (
                <span>• {state.gender === 'male' ? 'Männlich' : state.gender === 'female' ? 'Weiblich' : 'Keine Angabe'}</span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Content - Light */}
      <section className="section-light px-6 py-12">
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Short distance disclaimer */}
          {state.sport && state.event && isShortDistanceEvent(state.sport, state.event) && (
            <p className="text-xs text-black/60 text-center">
              Hinweis: Bei kürzeren Distanzen wie dieser macht das Carb- und Elektrolyte-Loading vor dem Event den Großteil einer guten Fueling-Strategie aus – nicht deine Intra-Nutrition!
            </p>
          )}
          
          {/* Overview Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-white rounded-xl border border-black/10">
              <p className="text-lg sm:text-xl md:text-2xl font-medium text-black break-words">{currentIntake}→{targetIntake}</p>
              <p className="text-xs text-black/60 mt-1">Ziel (g/h)</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-white rounded-xl border border-black/10">
              <p className="text-lg sm:text-xl md:text-2xl font-medium text-black">{protocol.totalWeeks}</p>
              <p className="text-xs text-black/60 mt-1">Wochen</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-white rounded-xl border border-black/10">
              <p className="text-lg sm:text-xl md:text-2xl font-medium text-black">{state.frequency || 2}x</p>
              <p className="text-xs text-black/60 mt-1">/Woche</p>
            </div>
          </div>

          {/* Progression Schedule */}
          <div className="space-y-6">
            <div>
              <h2 className="text-label text-black/70">Progressionsplan</h2>
              {protocol.weeklyIncrease >= 2.0 ? (
                <p className="text-sm text-black/60 mt-2">
                  Pro Woche: <strong>{state.frequency || 2} lange Einheit{state.frequency !== 1 ? 'en' : ''}</strong> über 2 Stunden. 
                  Eine Test-Einheit (zum Ende der Woche) testet die neue Stufe, die anderen bereiten vor.
                </p>
              ) : (
                <p className="text-sm text-black/60 mt-2">
                  Pro Woche: <strong>{state.frequency || 2} lange Einheit{state.frequency !== 1 ? 'en' : ''}</strong> über 2 Stunden. 
                  Bei kleinen wöchentlichen Steigerungen verwenden alle Einheiten die gleiche progressive Dosierung.
                </p>
              )}
            </div>
            
          <div className="space-y-4">
              {Array.from({ length: protocol.totalWeeks }, (_, weekIndex) => {
                const week = weekIndex + 1;
                // Find the phase that covers this week
                const phase = protocol.phases.find(
                  p => week >= p.weekStart && week <= p.weekEnd
                ) || protocol.phases[protocol.phases.length - 1];
                
                // Calculate linear distribution
                const carbGap = targetIntake - currentIntake;
                const baseIncrease = protocol.baseIncrease;
                const remainder = protocol.remainder;
                
                // Calculate intake for this specific week using linear distribution
                // This ensures: Sum of all increases = carbGap (no rounding errors, no jumps!)
                let currentWeekTarget: number;
                if (week === 1) {
                  currentWeekTarget = currentIntake;
                } else {
                  // Calculate remainder positions for even distribution
                  const remainderPositions: number[] = [];
                  for (let i = 0; i < remainder; i++) {
                    remainderPositions.push(Math.floor((i + 0.5) * protocol.totalWeeks / remainder));
                  }
                  // Count remainder bonuses for weeks before this week
                  const remainderCount = remainderPositions.filter(pos => pos < week - 1).length;
                  
                  // Calculate intake: Start + (baseIncrease * weeks before this) + remainder bonuses
                  currentWeekTarget = currentIntake + baseIncrease * (week - 1) + remainderCount;
                }
                
                // For last week: Ensure exact target is reached
                // This handles any edge cases and guarantees we reach the target
                if (week === protocol.totalWeeks) {
                  currentWeekTarget = targetIntake;
                }
                
                const cappedTarget = currentWeekTarget;
                
                // ADAPTIVE LOGIK basierend auf weeklyIncrease (for backwards compatibility)
                const weeklyIncrease = protocol.weeklyIncrease;
                const hasKeySession = weeklyIncrease >= 2.0;
                
                // Trainings-Dosierung (für Standard-Einheiten)
                let trainingDosage: number;
                if (hasKeySession) {
                  // Große Steigerung: Vorherige Woche Schlüssel-Dosierung
                  // Use linear distribution for previous week's key session dosage
                  if (week === 1) {
                    trainingDosage = currentIntake;
                  } else {
                    // Previous week's key session dosage
                    const prevWeek = week - 1;
                    const remainderPositions: number[] = [];
                    for (let i = 0; i < remainder; i++) {
                      remainderPositions.push(Math.floor((i + 0.5) * protocol.totalWeeks / remainder));
                    }
                    const remainderCount = remainderPositions.filter(pos => pos < prevWeek).length;
                    trainingDosage = currentIntake + baseIncrease * (prevWeek - 1) + remainderCount;
                  }
                } else {
                  // Kleine Steigerung: Alle Einheiten gleich (progressive Dosierung)
                  trainingDosage = cappedTarget;
                }
                
                // Schlüsseleinheit-Dosierung (nur bei großen Steigerungen)
                // Use linear distribution for key session dosage
                let keySessionDosage: number;
                if (week === 1) {
                  // Week 1: Test first increase
                  const remainderPositions: number[] = [];
                  for (let i = 0; i < remainder; i++) {
                    remainderPositions.push(Math.floor((i + 0.5) * protocol.totalWeeks / remainder));
                  }
                  const remainderCount = remainderPositions.filter(pos => pos < 1).length;
                  keySessionDosage = Math.min(currentIntake + baseIncrease + remainderCount, targetIntake);
                } else if (week === protocol.totalWeeks) {
                  // Last week: explicit target
                  keySessionDosage = targetIntake;
                } else {
                  // Current week target intake using linear distribution
                  const remainderPositions: number[] = [];
                  for (let i = 0; i < remainder; i++) {
                    remainderPositions.push(Math.floor((i + 0.5) * protocol.totalWeeks / remainder));
                  }
                  const remainderCount = remainderPositions.filter(pos => pos < week).length;
                  keySessionDosage = Math.min(currentIntake + baseIncrease * week + remainderCount, targetIntake);
                }
                
                // Anzahl der Standard-Einheiten
                const numStandardSessions = hasKeySession ? (state.frequency || 2) - 1 : (state.frequency || 2);
                
                return (
                  <div key={week} className="bg-white rounded-xl border border-black/10 overflow-hidden">
                    {/* Week Header */}
                    <div className="bg-black/5 px-4 py-3 border-b border-black/10">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-black">Woche {week}</h3>
                        <span className="text-xs px-2 py-1 bg-black/10 rounded text-black/70">{phase.phaseName}</span>
                      </div>
                    </div>
                    
                    {/* Sessions */}
                    <div className="p-4 space-y-3">
                      {hasKeySession ? (
                        <>
                          {/* Standard-Einheiten zuerst (bei großen Steigerungen) */}
                          {/* Bei 3+ Einheiten: Jede Standard-Einheit separat auflisten */}
                          {numStandardSessions > 0 && (state.frequency && state.frequency >= 3 ? (
                            // 3+ Einheiten: Standard-Einheiten separat auflisten
                            Array.from({ length: numStandardSessions }, (_, idx) => (
                              <div key={idx} className="p-3 bg-white rounded-lg border border-black/5">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-medium text-black/70 uppercase tracking-wide">Standard-Einheit</span>
                                      {state.frequency && state.frequency >= 3 && idx === 0 && (
                                        <span className="text-xs text-black/50">(z.B. Montag)</span>
                                      )}
                                      {state.frequency && state.frequency >= 3 && idx === 1 && (
                                        <span className="text-xs text-black/50">(z.B. Mittwoch)</span>
                                      )}
                                    </div>
                                    <p className="text-sm text-black/60 mb-1">
                                      Lange Einheit über 2 Stunden – Bereitet den Darm vor
                                    </p>
                                    <p className="text-xs text-black/50 font-medium">
                                      Moderate Intensität (Zone 2, Aerobe Zone)
                                    </p>
                                  </div>
                                  <div className="flex-shrink-0 text-right">
                                    <p className="text-lg font-semibold text-black">
                                      {trainingDosage}g/h
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            // 2 Einheiten: Eine Standard-Einheit
                            <div className="p-3 bg-white rounded-lg border border-black/5">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-black/70 uppercase tracking-wide">Standard-Einheit</span>
                                  </div>
                                  <p className="text-sm text-black/60 mb-1">
                                    Lange Einheit über 2 Stunden – Bereitet den Darm vor
                                  </p>
                                  <p className="text-xs text-black/50 font-medium">
                                    Moderate Intensität (Zone 2, Aerobe Zone)
                                  </p>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                  <p className="text-lg font-semibold text-black">
                                    {trainingDosage}g/h
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Test-Einheit zuletzt (bei großen Steigerungen) */}
                          <div className="p-3 bg-black/3 rounded-lg border border-black/10">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-black/70 uppercase tracking-wide">Test-Einheit</span>
                                  <span className="text-xs text-black/50">(zum Ende der Woche)</span>
                                </div>
                                <p className="text-sm text-black/60 mb-1">
                                  Lange Einheit ({guidance.session}) – Entscheidungsmoment: Bei erfolgreicher Toleranz Freigabe für nächste Woche
                                </p>
                                <p className="text-xs text-black/50 font-medium">
                                  Wettkampfintensität (Race Pace, Zone 3-4)
                                </p>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <p className="text-lg font-semibold text-black">
                                  {keySessionDosage}g/h
                                </p>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Kleine Steigerung: Alle Einheiten gleich */
                        Array.from({ length: numStandardSessions }, (_, idx) => (
                          <div key={idx} className="p-3 bg-white rounded-lg border border-black/5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-black/70 uppercase tracking-wide">Lange Einheit</span>
                                  {state.frequency && state.frequency >= 3 && idx === 0 && (
                                    <span className="text-xs text-black/50">(z.B. Montag)</span>
                                  )}
                                  {state.frequency && state.frequency >= 3 && idx === 1 && (
                                    <span className="text-xs text-black/50">(z.B. Mittwoch)</span>
                                  )}
                                  {state.frequency && state.frequency >= 3 && idx === 2 && (
                                    <span className="text-xs text-black/50">(z.B. Freitag)</span>
                                  )}
                                </div>
                                <p className="text-sm text-black/60 mb-1">
                                  Alle Einheiten verwenden die gleiche progressive Dosierung
                                </p>
                                <p className="text-xs text-black/50 font-medium">
                                  Moderate bis Wettkampfintensität (Zone 2-3)
                                </p>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <p className="text-lg font-semibold text-black">
                                  {trainingDosage}g/h
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Einheiten-Definition */}
          <div className="space-y-4">
            <h2 className="text-label text-black/70">Einheiten-Definition</h2>
            
            {protocol.weeklyIncrease >= 2.0 ? (
              /* Große Steigerung: Unterscheidung Standard/Test-Einheit */
              <>
                <div className="p-6 bg-white rounded-xl border border-black/10 space-y-4">
                  <div>
                    <h3 className="font-medium text-black mb-2">Standard-Einheiten (zu Beginn der Woche)</h3>
                    <p className="text-sm text-black/70 mb-3">
                      Verwenden die <strong>vorherige Woche Zielzufuhr</strong> (in Woche 1 = Start-Dosierung). 
                      Bereiten den Darm vor und ermöglichen progressive Adaption ohne Überforderung.
                    </p>
                  </div>
                </div>
                
            <div className="p-6 bg-white rounded-xl border border-black/10 space-y-4">
                  <div>
                    <h3 className="font-medium text-black mb-2">Test-Einheit (zum Ende der Woche)</h3>
                    <p className="text-sm text-black/70 mb-3">
                      Testet die <strong>aktuelle Woche Zielzufuhr</strong> – die neue, höhere Stufe. 
                      <strong> Entscheidungsmoment:</strong> Bei erfolgreicher Toleranz Freigabe für die nächste Woche. 
                      Bei Problemen: Aktuelles Level halten oder reduzieren.
                    </p>
                  </div>
              <div>
                    <p className="font-medium text-black mb-1">Zentrale Einheit: {guidance.session}</p>
                    <p className="text-sm text-black/60">Warum: {guidance.why}</p>
              </div>
              <div>
                    <p className="text-sm font-medium text-black/70 mb-2">Ablauf:</p>
                <ul className="space-y-1">
                  {guidance.strategy.map((item, idx) => (
                    <li key={idx} className="text-sm text-black/70 flex items-start gap-2">
                      <span className="text-black/40">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
                  </div>
                </div>
              </>
            ) : (
              /* Kleine Steigerung: Vereinfachte Strategie */
              <div className="p-6 bg-white rounded-xl border border-black/10 space-y-4">
                <div>
                  <h3 className="font-medium text-black mb-2">Lange Einheiten</h3>
                  <p className="text-sm text-black/70 mb-3">
                    Bei kleinen wöchentlichen Steigerungen verwenden <strong>alle Einheiten die gleiche progressive Dosierung</strong> 
                    (aktuelle Woche Zielzufuhr). Keine Unterscheidung zwischen Standard und Test-Einheit nötig.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-black mb-1">Zentrale Einheit: {guidance.session}</p>
                  <p className="text-sm text-black/60">Warum: {guidance.why}</p>
              </div>
              <div>
                  <p className="text-sm font-medium text-black/70 mb-2">Ablauf:</p>
                <ul className="space-y-1">
                    {guidance.strategy.map((item, idx) => (
                    <li key={idx} className="text-sm text-black/70 flex items-start gap-2">
                      <span className="text-black/40">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            )}
            
          </div>

          {/* Progress Tracking */}
          <div className="space-y-4">
            <h2 className="text-label text-black/70">Fortschritt verfolgen</h2>
            <p className="text-sm text-black/70">Bewerte nach jeder Test-Einheit die folgenden Punkte:</p>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="p-4 bg-white rounded-xl border border-black/10">
                <p className="font-medium text-black text-sm">Zielzufuhr erreicht?</p>
                <p className="text-xs text-black/60 mt-1">Ja / Teilweise / Nein</p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-black/10">
                <p className="font-medium text-black text-sm">GI-Symptome (1–10)</p>
                <p className="text-xs text-black/60 mt-1">1 = keine, 10 = sehr stark</p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-black/10">
                <p className="font-medium text-black text-sm">Subjektive Schwierigkeit (1–10)</p>
                <p className="text-xs text-black/60 mt-1">1 = sehr leicht, 10 = kaum machbar</p>
              </div>
            </div>
            <div className="p-4 bg-black/5 rounded-xl">
              <p className="text-sm font-medium text-black/70 mb-2">Automatische Anpassungsregeln:</p>
              <ul className="space-y-1 text-sm text-black/70">
                <li>• Symptome ≥6 über 2 Wochen → Zufuhr um 15g/h reduzieren, für 2 Wochen halten</li>
                <li>• Symptome 4–6 über 2 Wochen → Aktuelles Level für eine weitere Woche halten</li>
                <li>• Schwierigkeit ≥8 → Anderes Produktformat testen (z.B. eher Drink statt Gel)</li>
                <li>• Symptome &lt;3 UND Zielzufuhr erreicht → bereit für +5g/h Steigerung</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - CTA */}
      <footer className="px-6 pt-12 pb-24 border-t border-black/5">
        <div className="max-w-3xl mx-auto space-y-4">
          <button
            onClick={handlePrint}
            className="w-full bg-black text-white px-6 py-4 rounded-lg hover:bg-black/80 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Protokoll downloaden
          </button>
          <a
            href="/"
            className="block w-full btn-primary text-center"
          >
            Neue Berechnung starten
          </a>
        </div>
      </footer>
    </div>
  );
}

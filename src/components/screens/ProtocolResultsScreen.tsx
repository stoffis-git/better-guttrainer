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
        'Stunden 1–3: Übe deine wöchentliche Zielzufuhr',
        'Letzte 30 Min: Teste Wettkampfprodukte',
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
        'Stunden 1–3: Übe Zielzufuhr bei Wettkampfintensität',
        'Stunde 4+: Simuliere Wettkampfbedingungen mit Wettkampfprodukten',
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
        'Zufuhr auf schwierigen Abschnitten üben',
        'Taschenzugängliche Ernährung testen',
        'Wettkampfproduktmix simulieren',
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
          <a
            href="/"
            className="text-sm text-black/70 hover:text-black transition-colors"
          >
            Neu starten
          </a>
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
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-xl border border-black/10">
              <p className="text-2xl font-medium text-black">{currentIntake}→{targetIntake}</p>
              <p className="text-xs text-black/60 mt-1">Ziel (g/h)</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-black/10">
              <p className="text-2xl font-medium text-black">{protocol.totalWeeks}</p>
              <p className="text-xs text-black/60 mt-1">Wochen</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-black/10">
              <p className="text-2xl font-medium text-black">{state.frequency || 2}</p>
              <p className="text-xs text-black/60 mt-1">Einheiten/Woche</p>
            </div>
          </div>

          {/* Progression Schedule */}
          <div className="space-y-4">
            <h2 className="text-label text-black/70">Progressionsplan</h2>
            <div className="bg-white rounded-xl border border-black/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-black/5 border-b border-black/10">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-black/70">Woche</th>
                    <th className="px-4 py-3 text-left font-medium text-black/70">Zielzufuhr</th>
                    <th className="px-4 py-3 text-left font-medium text-black/70">Wöchentliche Steigerung</th>
                    <th className="px-4 py-3 text-left font-medium text-black/70">Phase</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: protocol.totalWeeks }, (_, weekIndex) => {
                    const week = weekIndex + 1;
                    // Find the phase that covers this week
                    const phase = protocol.phases.find(
                      p => week >= p.weekStart && week <= p.weekEnd
                    ) || protocol.phases[protocol.phases.length - 1];
                    
                    // Calculate intake for this specific week
                    const weeklyIncrease = protocol.weeklyIncrease;
                    const weekIntake = Math.round((currentIntake + weeklyIncrease * weekIndex) * 10) / 10;
                    const cappedIntake = Math.min(weekIntake, targetIntake);
                    
                    return (
                      <tr key={week} className="border-b border-black/5 last:border-0">
                        <td className="px-4 py-3 text-black/70 font-medium">
                          Woche {week}
                      </td>
                      <td className="px-4 py-3">
                          <span className="font-medium text-black">{cappedIntake}g/h</span>
                        </td>
                        <td className="px-4 py-3 text-black/60">
                          {week === 1 ? '—' : `+${weeklyIncrease.toFixed(1)}g/h`}
                      </td>
                        <td className="px-4 py-3 text-black/70 text-xs">{phase.phaseName}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Training Session */}
          <div className="space-y-4">
            <h2 className="text-label text-black/70">Schlüsseleinheit</h2>
            <div className="p-6 bg-white rounded-xl border border-black/10 space-y-4">
              <div>
                <p className="font-medium text-black">Zentrale Einheit: {guidance.session}</p>
                <p className="text-sm text-black/60 mt-1">Warum: {guidance.why}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-black/70 mb-2">Ablauf der Einheit:</p>
                <ul className="space-y-1">
                  {guidance.strategy.map((item, idx) => (
                    <li key={idx} className="text-sm text-black/70 flex items-start gap-2">
                      <span className="text-black/40">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-black/70 mb-2">Race-Day-Strategie:</p>
                <ul className="space-y-1">
                  {guidance.raceDay.map((item, idx) => (
                    <li key={idx} className="text-sm text-black/70 flex items-start gap-2">
                      <span className="text-black/40">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Progress Tracking */}
          <div className="space-y-4">
            <h2 className="text-label text-black/70">Fortschritt verfolgen</h2>
            <p className="text-sm text-black/70">Bewerte nach jeder Schlüsseleinheit die folgenden Punkte:</p>
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

      {/* Footer - Black */}
      <footer className="px-6 py-8 border-t border-black/5">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4">
          <button
            onClick={handlePrint}
            className="flex-1 btn-secondary flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Protokoll drucken / speichern
          </button>
          <a
            href="/"
            className="flex-1 btn-primary text-center"
          >
            Neue Berechnung starten
          </a>
        </div>
      </footer>
    </div>
  );
}

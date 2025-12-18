'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { getIntakeMidpoint, getProductEquivalent } from '@/lib/calculations';
import { isShortDistanceEvent } from '@/lib/types';

export default function ProtocolResultsScreen() {
  const router = useRouter();
  const { state } = useApp();
  const protocol = state.protocolResult;
  const currentIntake = getIntakeMidpoint(state.currentIntake!);

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
      session: 'Long bike ride (3–4 hours)',
      why: 'Easier to train gut than running (less GI distress from impact)',
      strategy: [
        'First 30 min: Easy pace, no fueling',
        'Hours 1–3: Practice your weekly target intake',
        'Final 30 min: Test race-day products',
      ],
      raceDay: [
        '70% of intake on bike',
        '30% of intake on run',
        'Consume gel at T1 (bike mount)',
        'Consume gel immediately post-bike at T2',
      ],
    },
    cycling: {
      session: 'Long ride (4+ hours)',
      why: 'Extended duration allows for multiple fueling windows',
      strategy: [
        'First 30 min: Easy spin, no fueling',
        'Hours 1–3: Practice target intake at race intensity',
        'Hour 4+: Simulate race conditions with race products',
      ],
      raceDay: [
        'Front-load first 2 hours if possible',
        'Set timer for regular intake reminders',
        'Practice bottle handoffs if in events with support',
      ],
    },
    gravel: {
      session: 'Long gravel ride (3–5 hours)',
      why: 'Mixed terrain helps practice eating in varied conditions',
      strategy: [
        'Practice eating on rough sections',
        'Test pocket-accessible nutrition',
        'Simulate race-day product mix',
      ],
      raceDay: [
        'Front-load before technical sections',
        'Use easy sections for larger intake',
        'Keep race nutrition in easy-access pockets',
      ],
    },
    running: {
      session: 'Long run with walking breaks (2–3 hours)',
      why: 'Walking intervals allow for easier intake',
      strategy: [
        'First 30 min: Easy pace, hydration only',
        'Practice intake during walking intervals',
        'Test different product formats (gels vs. drinks)',
      ],
      raceDay: [
        'Take nutrition at aid stations',
        'Walk through aid stations if needed',
        'Practice race-day brands before event',
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
          <p className="text-xl text-black/70">
            {currentIntake}g/h → {protocol.targetIntake}g/h in {protocol.totalWeeks} Wochen
          </p>
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
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-xl border border-black/10">
              <p className="text-2xl font-medium text-black">{currentIntake}→{protocol.targetIntake}</p>
              <p className="text-xs text-black/60 mt-1">Ziel (g/h)</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-black/10">
              <p className="text-2xl font-medium text-black">{protocol.totalWeeks}</p>
              <p className="text-xs text-black/60 mt-1">Wochen</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-black/10">
              <p className="text-2xl font-medium text-black">{protocol.trainingFrequency}</p>
              <p className="text-xs text-black/60 mt-1">Einheiten/Woche</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-black/10">
              <p className="text-2xl font-medium text-black">~{Math.round(protocol.carbGap / (protocol.totalWeeks / 2))}g</p>
              <p className="text-xs text-black/60 mt-1">Alle 2 Wochen</p>
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
                    <th className="px-4 py-3 text-left font-medium text-black/70">Phase</th>
                  </tr>
                </thead>
                <tbody>
                  {protocol.phases.map((phase, idx) => (
                    <tr key={idx} className="border-b border-black/5 last:border-0">
                      <td className="px-4 py-3 text-black/70">
                        {phase.startWeek === phase.endWeek 
                          ? `Woche ${phase.startWeek}` 
                          : `Wochen ${phase.startWeek}–${phase.endWeek}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-black">{phase.targetIntake}g/h</span>
                      </td>
                      <td className="px-4 py-3 text-black/70">{phase.name}</td>
                    </tr>
                  ))}
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

          {/* Product Strategy */}
          <div className="space-y-4">
            <h2 className="text-label text-black/70">Produkt-Strategie</h2>
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-xl border border-black/10">
                <p className="font-medium text-black">Phase 1: Wochen 1–4 (Basis)</p>
                <p className="text-sm text-black/60 mt-1">
                  Bleibe zunächst bei vertrauten Produkten. Ziel: Volumentoleranz aufbauen. Empfohlen: maltodextrinbasierte Sportgetränke.
                </p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-black/10">
                <p className="font-medium text-black">Phase 2: Wochen 5–8 (Optimierung)</p>
                <p className="text-sm text-black/60 mt-1">
                  Führe Dual-Source-Produkte (2:1 Glukose:Fruktose) ein. Starte mit ca. 50/50-Mischung mit deinen gewohnten Produkten.
                </p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-black/10">
                <p className="font-medium text-black">Phase 3: Woche 9+ (Race-Prep)</p>
                <p className="text-sm text-black/60 mt-1">
                  Lege deine Race-Day-Produkte fest. Wechsele zu 100&nbsp;% auf deine Wettkampfernährung. Keine neuen Experimente!
                </p>
              </div>
            </div>
            <div className="p-4 bg-black/5 rounded-xl">
              <p className="text-sm text-black/70">
                <span className="font-medium">So erreichst du {protocol.targetIntake}g/h:</span>{' '}
                {getProductEquivalent(protocol.targetIntake)}
              </p>
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

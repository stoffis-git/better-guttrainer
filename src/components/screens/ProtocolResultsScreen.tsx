'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useApp } from '@/lib/store';
import { getIntakeMidpoint, getProductEquivalent, calculateWeekSessions } from '@/lib/calculations';
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

  const handlePrint = async () => {
    // Dynamically import html2pdf only on client side
    const html2pdf = (await import('html2pdf.js')).default;
    
    // Get the content element to capture
    const element = document.getElementById('protocol-content');
    if (!element) return;

    // Hide elements that shouldn't be in PDF
    const elementsToHide = document.querySelectorAll('[data-pdf-exclude]');
    const originalDisplays: (string | null)[] = [];
    elementsToHide.forEach((el) => {
      const htmlEl = el as HTMLElement;
      originalDisplays.push(htmlEl.style.display);
      htmlEl.style.display = 'none';
    });

    // Add readable URL to product tile button (temporarily)
    const productButton = document.querySelector('[data-product-tile-button]');
    let urlTextAdded = false;
    if (productButton) {
      const existingUrlText = productButton.parentElement?.querySelector('.pdf-url-text');
      if (!existingUrlText) {
        const urlText = document.createElement('div');
        urlText.className = 'pdf-url-text text-white/90 text-xs mt-2';
        urlText.textContent = 'www.get-better.co/pure-carb';
        urlText.style.fontSize = '10pt';
        urlText.style.marginTop = '8px';
        productButton.parentElement?.appendChild(urlText);
        urlTextAdded = true;
      }
    }

    // Configure PDF options
    const opt = {
      margin: [15, 15, 15, 15] as [number, number, number, number], // 15mm margins
      filename: `gut-training-protokoll-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'mm', 
        format: [148, 0] as [number, number], // A5 width (148mm), height auto
        orientation: 'portrait' as const
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      // Generate and download PDF
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      // Restore hidden elements
      elementsToHide.forEach((el, index) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.display = originalDisplays[index] || '';
      });

      // Remove added URL text
      if (urlTextAdded && productButton) {
        const urlText = productButton.parentElement?.querySelector('.pdf-url-text');
        if (urlText) {
          urlText.remove();
        }
      }
    }
  };

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
      <header className="px-6 pt-6 pb-4" data-pdf-exclude>
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <a
            href="/protocol-setup"
            className="flex items-center gap-2 text-sm md:text-base text-black/70 hover:text-black transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück zum Ergebnis
          </a>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full hover:bg-black/80 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Protokoll downloaden
          </button>
        </div>
      </header>

      {/* Content wrapper for PDF */}
      <div id="protocol-content">
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
                
                // NEW: Use weeklyTargets array and calculateWeekSessions
                const weeklyTargets = protocol.weeklyTargets || [];
                
                // Fallback for backwards compatibility (if weeklyTargets not available)
                if (weeklyTargets.length === 0) {
                  // Legacy calculation - should not happen with new protocol
                  const weekTarget = week === 1 ? currentIntake : 
                    (week === protocol.totalWeeks ? targetIntake : 
                    currentIntake + Math.floor((targetIntake - currentIntake) / protocol.totalWeeks) * (week - 1));
                  weeklyTargets.push(weekTarget);
                }
                
                // Calculate session dosages for this week
                const sessions = calculateWeekSessions(
                  week,
                  weeklyTargets,
                  protocol.totalWeeks,
                  currentIntake,
                  targetIntake
                );
                
                // Determine if this week has within-week progression (gradient)
                const weekTarget = weeklyTargets[weekIndex] || currentIntake;
                const previousWeekTarget = weekIndex > 0 ? weeklyTargets[weekIndex - 1] : currentIntake;
                const weeklyJump = weekTarget - previousWeekTarget;
                const hasGradient = (weeklyJump >= 6 && week !== protocol.totalWeeks);
                
                // For backwards compatibility: Check if we should show "test session" style
                // (only for large weekly increases, similar to old hasKeySession logic)
                const weeklyIncrease = protocol.weeklyIncrease;
                const showTestSessionStyle = weeklyIncrease >= 2.0 && hasGradient;
                
                // Anzahl der Standard-Einheiten
                const numStandardSessions = showTestSessionStyle ? (state.frequency || 2) - 1 : (state.frequency || 2);
                
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
                      {showTestSessionStyle ? (
                        <>
                          {/* Standard-Einheiten zuerst (bei großen Steigerungen) */}
                          {/* Bei 3+ Einheiten: Jede Standard-Einheit separat auflisten */}
                          {numStandardSessions > 0 && (state.frequency && state.frequency >= 3 ? (
                            // 3+ Einheiten: Standard-Einheiten separat auflisten
                            Array.from({ length: numStandardSessions }, (_, idx) => {
                              // For gradient weeks, show progressive dosages
                              let sessionDosage = sessions.session1;
                              if (hasGradient) {
                                if (idx === 0) sessionDosage = sessions.session1;
                                else if (idx === 1) sessionDosage = sessions.session2;
                                else sessionDosage = sessions.session2; // Use session2 for additional sessions
                              }
                              
                              return (
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
                                        {sessionDosage}g/h
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
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
                                    {hasGradient ? sessions.session1 : sessions.session1}g/h
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
                                  {hasGradient ? sessions.session3 : sessions.session1}g/h
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
                                  {sessions.session1}g/h
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

      {/* Pure Carb Promotion */}
      <section className="px-6 pt-12 pb-8">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl text-white overflow-hidden relative flex" style={{ backgroundColor: '#B0B5B2' }}>
            {/* Image - 50% on mobile, 1/3 on desktop, borderless */}
            <div className="w-1/2 md:w-1/3 relative flex-shrink-0">
              <Image
                src="https://cdn.shopify.com/s/files/1/0873/9700/7685/files/TV_101_7d3bd0ed-458c-466c-856f-1a1398da6b20.jpg?v=1763976690"
                alt="Pure Carb Produktbild"
                width={400}
                height={400}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
            {/* Content - 50% on mobile, 2/3 on desktop */}
            <div className="w-1/2 md:w-2/3 p-6 md:p-8 relative z-10 flex flex-col justify-center">
              <h3 className="text-xl md:text-2xl font-medium mb-2">Pure Carb – Deine optimale Energiequelle</h3>
              <p className="text-white/80 text-sm md:text-base mb-4">
                Geschmacksneutral und maximal magenfreundlich.
                Von 30–120g/h dosierbar – perfekt für dein Gut-Training.
              </p>
              <div>
              <a
                href="https://get-better.co/pure-carb"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full hover:bg-white/90 transition-colors font-medium text-sm w-fit"
                data-product-tile-button
              >
                <span className="md:inline hidden">Pure Carb entdecken</span>
                <span className="md:hidden">Entdecken</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* Footer - CTA */}
      <footer className="px-6 pt-12 pb-24 border-t border-black/5" data-pdf-exclude>
        <div className="max-w-3xl mx-auto space-y-4">
          <button
            onClick={handlePrint}
            className="w-full bg-black text-white px-6 py-4 rounded-full hover:bg-black/80 transition-colors flex items-center justify-center gap-2 font-medium"
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

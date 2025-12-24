'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function LandingScreen() {
  const { clearQuestionnaire } = useApp();

  // Clear questionnaire answers when visiting landing page (starting fresh)
  // Results are preserved so "zurück zum ergebnis" navigation still works
  useEffect(() => {
    clearQuestionnaire();
  }, [clearQuestionnaire]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Header />
      
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative bg-cover bg-center" style={{ backgroundImage: 'url(https://cdn.shopify.com/s/files/1/0873/9700/7685/files/better_gut-trainer_kachel-banner.jpg?v=1766541976)' }}>
        {/* 50% Black Overlay */}
        <div className="absolute inset-0 bg-black/50 z-0"></div>
        
        <div className="max-w-2xl mx-auto text-center space-y-8 relative z-10">
          {/* Headline */}
          <h1 className="text-headline leading-tight text-white">
            Wie viel Zeit kostet dich dein untrainierter Darm?
          </h1>
          
          <div style={{ height: '24px' }} />


          {/* Subheadline */}
          <div className="text-subheadline max-w-lg mx-auto space-y-2">
            <p className="text-white" style={{ color: 'white' }}>
              Berechne dein Potenzial – basierend auf Distanz, aktueller Zufuhr und Belastungsverträglichkeit.
            </p>
          </div>
        

          {/* Extra spacing for visual balance */}
          <div className="h-6 md:h-10"></div>






          {/* CTA */}
          <div className="pt-4">
            <Link
              href="/questionnaire/1"
              className="bg-white text-black hover:bg-white/90 text-lg px-10 py-4 inline-block rounded-full font-medium transition-colors"
            >
              Zeitersparnis berechnen →
            </Link>
          </div>

          {/* Meta */}
          <p className="text-base md:text-sm text-white/80">
            60 Sekunden · 6 Fragen · dein Ergebnis sofort
          </p>
          
        </div>
      </section>

      {/* Secondary Concept Framing Section */}
      <section className="border-t border-black/5 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="text-center space-y-6">
            <h2 className="text-2xl md:text-3xl font-medium text-black">
              Warum dein Darm über deine Wettkampf-Performance entscheidet
            </h2>
            <p className="text-base md:text-lg text-black/70 leading-relaxed max-w-2xl mx-auto">
              Deine Leistung hängt nicht davon ab, wie viele Kohlenhydrate du zuführst – sondern wie viel dein Darm unter Belastung tatsächlich aufnehmen kann. Das ist trainierbar. In 4-12 Wochen.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-black/5 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 - Trust & Credibility */}
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-black text-white flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-black">Evidenzbasiert</h3>
              <p className="text-base md:text-sm text-black/60 leading-relaxed">
                Basierend auf Studien mit messbaren Ergebnissen: +30-50% Kohlenhydrat-Toleranz nach 8-12 Wochen systematischem Training.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-black text-white flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-medium text-black">Personalisiert</h3>
              <p className="text-base md:text-sm text-black/60 leading-relaxed">
                Abgestimmt auf deine Sportart, Wettkampfdistanz, Physiologie und aktuelle Verpflegungsgewohnheiten.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-black text-white flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="font-medium text-black">Umsetzbar</h3>
              <p className="text-base md:text-sm text-black/60 leading-relaxed">
                Erhalte einen Wochenplan fürs Darm-Training, mit dem du direkt ins Training einsteigen kannst.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Scientific citations remain in footer */}
      <footer className="border-t border-black/5 px-6 py-8 bg-white">
        <p className="text-center text-sm md:text-xs text-black/50">
          Basierend auf Forschung von Costa et al. (2017), Stellingwerff & Cox (2014), Viribay et al. (2020)
        </p>
      </footer>
      
      <Footer />
    </div>
  );
}

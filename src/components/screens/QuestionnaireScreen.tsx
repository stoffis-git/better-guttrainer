'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { eventDisplayNames, isShortDistanceEvent } from '@/lib/types';
import type { Sport, EventType, GIFrequency, Gender } from '@/lib/types';

// Event options per sport
const eventsBySport: Record<Sport, { value: EventType; label: string }[]> = {
  triathlon: [
    { value: 'sprint', label: 'Sprint' },
    { value: 'olympic', label: 'Olympic' },
    { value: 'half-ironman', label: '70.3 / Half Ironman' },
    { value: 'ironman', label: 'Full Ironman' },
  ],
  cycling: [
    { value: 'road-race-short', label: 'Road Race (Kurzdistanz, 60-100km)' },
    { value: 'road-race-long', label: 'Road Race (Langdistanz, 100-180km)' },
    { value: 'gran-fondo', label: 'Gran Fondo (120-160km)' },
    { value: 'century', label: 'Century Ride (160km+)' },
  ],
  gravel: [
    { value: 'gravel-short', label: 'Gravel 80-120km' },
    { value: 'gravel-long', label: 'Gravel 120-200km' },
    { value: 'ultra-gravel', label: 'Ultra Gravel 200km+' },
  ],
  running: [
    { value: '10k', label: '10K' },
    { value: 'half-marathon', label: 'Halbmarathon' },
    { value: 'marathon', label: 'Marathon' },
    { value: '50k', label: '50K Ultra' },
    { value: '100k', label: '100K Ultra' },
    { value: '100-mile', label: '100 Mile' },
  ],
};


const intakeOptions: { value: number; label: string }[] = [
  { value: 25, label: 'Unter 30 g/h' },
  { value: 30, label: '30 g/h' },
  { value: 45, label: '45 g/h' },
  { value: 60, label: '60 g/h' },
  { value: 80, label: '80 g/h' },
  { value: 90, label: '90 g/h' },
  { value: 100, label: '100 g/h' },
  { value: 110, label: '110 g/h' },
  { value: 120, label: '120 g/h' },
  { value: 125, label: '> 120 g/h' },
];

const giOptions: { value: GIFrequency; label: string; percent: string }[] = [
  { value: 'rarely', label: 'Selten', percent: '~5%' },
  { value: 'sometimes', label: 'Manchmal', percent: '~20%' },
  { value: 'often', label: 'Oft', percent: '~40%' },
  { value: 'very-often', label: 'Sehr häufig', percent: '~55%' },
];

type AnimPhase = 'idle' | 'out-forward' | 'in-forward' | 'out-back' | 'in-back';

export default function QuestionnaireScreen() {
  const { state, setAnswer, setScreen } = useApp();
  const [step, setStep] = useState(1);
  const [animPhase, setAnimPhase] = useState<AnimPhase>('idle');
  const totalSteps = 6;

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!state.sport;
      case 2: return !!state.event;
      case 3: return state.finishTimeMinutes !== undefined && state.finishTimeMinutes > 0;
      case 4: return !!state.currentIntake;
      case 5: return !!state.giFrequency;
      case 6: return !!state.gender;
      default: return false;
    }
  };

  const goToStep = (next: number, direction: 'forward' | 'back') => {
    if (next === step || next < 1 || next > totalSteps) return;
    setAnimPhase(direction === 'forward' ? 'out-forward' : 'out-back');
    setTimeout(() => {
      setStep(next);
      setAnimPhase(direction === 'forward' ? 'in-forward' : 'in-back');
      setTimeout(() => setAnimPhase('idle'), 250);
    }, 250);
  };

  const handleNext = () => {
    if (step < totalSteps) {
      goToStep(step + 1, 'forward');
    } else {
      setScreen('results');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      goToStep(step - 1, 'back');
    } else {
      setScreen('landing');
    }
  };

  const progress = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      {/* Header */}
      <header className="px-6 py-6 border-b border-black/5">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-black/60">Frage {step} von {totalSteps}</span>
            <span className="text-sm text-black/60">{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill bg-black" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      {/* Short distance disclaimer - sticky */}
      {step > 2 && state.sport && state.event && isShortDistanceEvent(state.sport, state.event) && (
        <div className="sticky top-0 z-10 px-6 py-3 bg-white">
          <div className="max-w-xl mx-auto">
            <div className="flex items-start gap-3 p-3 bg-black/5 rounded-lg border border-black/10">
              <svg className="w-5 h-5 text-black flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs text-black/70 leading-relaxed">
                Hinweis: Bei kürzeren Distanzen wie dieser macht das Carb- und Elektrolyte-Loading vor dem Event den Großteil einer guten Fueling-Strategie aus – nicht deine Intra-Nutrition!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div
          className={`w-full max-w-xl question-container ${
            animPhase === 'out-forward'
              ? 'question-animating-out-forward'
              : animPhase === 'in-forward'
              ? 'question-animating-in-forward'
              : animPhase === 'out-back'
              ? 'question-animating-out-back'
              : animPhase === 'in-back'
              ? 'question-animating-in-back'
              : ''
          }`}
        >
          {step === 1 && <Question1Sport onSelect={() => goToStep(2, 'forward')} />}
          {step === 2 && <Question2Event onSelect={() => goToStep(3, 'forward')} />}
          {step === 3 && <Question3Time />}
          {step === 4 && <Question4Intake onSelect={() => goToStep(5, 'forward')} />}
          {step === 5 && <Question5GI onSelect={() => goToStep(6, 'forward')} />}
          {step === 6 && <Question6Gender onSelect={() => setScreen('results')} />}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-black/5">
        <div className="max-w-xl mx-auto flex justify-between">
          <button
            onClick={handleBack}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`btn-primary flex items-center gap-2 ${!canProceed() ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {step === totalSteps ? 'Ergebnis anzeigen' : 'Weiter'}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}

// Question 1: Sport
function Question1Sport({ onSelect }: { onSelect: () => void }) {
  const { state, setAnswer } = useApp();
  const sports: { value: Sport; label: string }[] = [
    { value: 'triathlon', label: 'Triathlon' },
    { value: 'cycling', label: 'Cycling' },
    { value: 'gravel', label: 'Gravel' },
    { value: 'running', label: 'Running / Ultra' },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-medium mb-3">Was ist deine Hauptsportart?</h2>
        <p className="text-black/60">Wähle die Sportart, für die du aktuell trainierst.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {sports.map((sport) => (
          <button
            key={sport.value}
            onClick={() => {
              setAnswer('sport', sport.value);
              setAnswer('event', undefined as unknown as EventType);
              onSelect();
            }}
            className={`p-5 rounded-xl border text-left transition-all ${
              state.sport === sport.value
                ? 'border-black bg-black text-white'
                : 'border-black/10 hover:border-black/30 bg-white'
            }`}
          >
            <span className="font-medium">{sport.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Question 2: Event
function Question2Event({ onSelect }: { onSelect: () => void }) {
  const { state, setAnswer } = useApp();
  const events = state.sport ? eventsBySport[state.sport] : [];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-medium mb-3">Welche Wettkampfdistanz?</h2>
        <p className="text-black/60">Wähle den Wettkampf, auf den du dich vorbereitest.</p>
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <button
            key={event.value}
            onClick={() => {
              setAnswer('event', event.value);
              onSelect();
            }}
            className={`w-full p-5 rounded-xl border text-left transition-all ${
              state.event === event.value
                ? 'border-black bg-black text-white'
                : 'border-black/10 hover:border-black/30 bg-white'
            }`}
          >
            <span className="font-medium">{event.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Question 3: Finish Time
function Question3Time() {
  const { state, setAnswer } = useApp();
  const [hours, setHours] = useState(state.finishTimeMinutes ? Math.floor(state.finishTimeMinutes / 60) : 5);
  const [minutes, setMinutes] = useState(state.finishTimeMinutes ? Math.floor(state.finishTimeMinutes % 60) : 0);

  const updateTime = (h: number, m: number) => {
    const totalMinutes = h * 60 + m;
    setHours(h);
    setMinutes(m);
    setAnswer('finishTimeMinutes', totalMinutes);
  };

  useEffect(() => {
    if (state.finishTimeMinutes === undefined) {
      setAnswer('finishTimeMinutes', hours * 60 + minutes);
    }
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-medium mb-3">Was ist deine aktuelle Zeit für diese Distanz?</h2>
        <p className="text-black/60">
          Für {state.event ? eventDisplayNames[state.event as EventType] : 'dein Event'}
        </p>
      </div>

      <div className="flex items-center justify-center gap-4">
        <div className="text-center">
          <label className="block text-xs text-black/60 uppercase tracking-wide mb-2">Stunden</label>
          <input
            type="number"
            min={1}
            max={33}
            value={hours}
            onChange={(e) => updateTime(Math.max(1, Math.min(33, parseInt(e.target.value) || 1)), minutes)}
            className="w-24 text-center text-2xl font-medium"
          />
        </div>
        <span className="text-3xl text-black/30 mt-6">:</span>
        <div className="text-center">
          <label className="block text-xs text-black/60 uppercase tracking-wide mb-2">Minuten</label>
          <input
            type="number"
            min={0}
            max={59}
            value={minutes.toString().padStart(2, '0')}
            onChange={(e) => updateTime(hours, Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
            className="w-24 text-center text-2xl font-medium"
          />
        </div>
      </div>

      <p className="text-center text-sm text-black/60">
        Gesamt: {hours}h {minutes}min ({hours * 60 + minutes} Minuten)
      </p>
    </div>
  );
}

// Question 4: Current Intake
function Question4Intake({ onSelect }: { onSelect: () => void }) {
  const { state, setAnswer, setScreen } = useApp();

  return (
    <div className="space-y-8">
      <div className="text-center">
          <h2 className="text-2xl font-medium mb-3">Aktuelle Kohlenhydratmenge im Wettkampf?</h2>
          <p className="text-black/60">Schätze, wie viele Gramm Kohlenhydrate du pro Stunde im Schnitt zuführst.</p>
      </div>

      <div className="space-y-3">
        {intakeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setAnswer('currentIntake', option.value);
              // If intake is very high (>=120g/h), skip to finish/results
              if (option.value >= 120) {
                setScreen('results');
                return;
              }
              onSelect();
            }}
            className={`w-full p-5 rounded-xl border text-left transition-all flex justify-between items-center ${
              state.currentIntake === option.value
                ? 'border-black bg-black text-white'
                : 'border-black/10 hover:border-black/30 bg-white'
            }`}
          >
            <span className="font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Question 5: GI Issues
function Question5GI({ onSelect }: { onSelect: () => void }) {
  const { state, setAnswer } = useApp();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-medium mb-3">Wie häufig hast du Magen-Darm-Beschwerden?</h2>
        <p className="text-black/60">Im Wettkampf oder bei intensiven Trainingssessions.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {giOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setAnswer('giFrequency', option.value);
              onSelect();
            }}
            className={`p-5 rounded-xl border text-left transition-all ${
              state.giFrequency === option.value
                ? 'border-black bg-black text-white'
                : 'border-black/10 hover:border-black/30 bg-white'
            }`}
          >
            <span className="block font-medium">{option.label}</span>
            <span className={`text-sm ${state.giFrequency === option.value ? 'text-white/80' : 'text-black/50'}`}>
              {option.percent} of sessions
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Question 6: Gender
function Question6Gender({ onSelect }: { onSelect: () => void }) {
  const { state, setAnswer } = useApp();
  const genders: { value: Gender; label: string }[] = [
    { value: 'male', label: 'Männlich' },
    { value: 'female', label: 'Weiblich' },
    { value: 'prefer-not-to-say', label: 'Keine Angabe' },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-medium mb-3">Biologisches Geschlecht</h2>
        <p className="text-black/60">Wird genutzt, um die Stoffwechsel-Berechnung fein anzupassen.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {genders.map((gender) => (
          <button
            key={gender.value}
            onClick={() => {
              setAnswer('gender', gender.value);
              onSelect();
            }}
            className={`p-5 rounded-xl border text-center transition-all ${
              state.gender === gender.value
                ? 'border-black bg-black text-white'
                : 'border-black/10 hover:border-black/30 bg-white'
            }`}
          >
            <span className="font-medium">{gender.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

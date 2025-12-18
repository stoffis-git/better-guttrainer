'use client';

import { useState, useCallback, useMemo } from 'react';
import { AppContext, AppState, initialState, Screen } from '@/lib/store';
import type { CalculationResult, ProtocolResult } from '@/lib/types';
import LandingScreen from './screens/LandingScreen';
import QuestionnaireScreen from './screens/QuestionnaireScreen';
import ResultsScreen from './screens/ResultsScreen';
import ProtocolSetupScreen from './screens/ProtocolSetupScreen';
import ProtocolResultsScreen from './screens/ProtocolResultsScreen';

export function GutTrainerApp() {
  const [state, setState] = useState<AppState>(initialState);

  const setScreen = useCallback((screen: Screen) => {
    setState(prev => ({ ...prev, screen }));
  }, []);

  const setAnswer = useCallback(<K extends keyof AppState>(key: K, value: AppState[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  const setCalculationResult = useCallback((result: CalculationResult) => {
    setState(prev => ({ ...prev, calculationResult: result }));
  }, []);

  const setProtocolResult = useCallback((result: ProtocolResult) => {
    setState(prev => ({ ...prev, protocolResult: result }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const contextValue = useMemo(() => ({
    state,
    setScreen,
    setAnswer,
    setCalculationResult,
    setProtocolResult,
    reset,
  }), [state, setScreen, setAnswer, setCalculationResult, setProtocolResult, reset]);

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-black text-white">
        {state.screen === 'landing' && <LandingScreen />}
        {state.screen === 'questionnaire' && <QuestionnaireScreen />}
        {state.screen === 'results' && <ResultsScreen />}
        {state.screen === 'protocol-setup' && <ProtocolSetupScreen />}
        {state.screen === 'protocol-results' && <ProtocolResultsScreen />}
      </div>
    </AppContext.Provider>
  );
}

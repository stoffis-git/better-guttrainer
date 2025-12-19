'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { AppContext, type AppContextType, type AppState, initialState } from '@/lib/store';

const STORAGE_KEY = 'guttrainer-state';

function loadState(): AppState {
  if (typeof window === 'undefined') return initialState;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Remove screen from stored state (we don't persist routing)
      const { screen, ...rest } = parsed;
      return { ...initialState, ...rest };
    }
  } catch (e) {
    console.warn('Failed to load state from localStorage', e);
  }
  return initialState;
}

function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  try {
    // Don't persist screen (routing state)
    const { screen, ...toSave } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('Failed to save state to localStorage', e);
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  const setScreen = useCallback((screen: AppState['screen']) => {
    setState(prev => ({ ...prev, screen }));
  }, []);

  const setAnswer = useCallback(<K extends keyof AppState>(key: K, value: AppState[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  const setCalculationResult = useCallback((result: AppState['calculationResult']) => {
    setState(prev => ({ ...prev, calculationResult: result }));
  }, []);

  const setProtocolResult = useCallback((result: AppState['protocolResult']) => {
    setState(prev => ({ ...prev, protocolResult: result }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearQuestionnaire = useCallback(() => {
    // Clear questionnaire answers and results when restarting
    // This ensures a fresh start when user begins a new questionnaire
    setState(prev => ({
      ...prev,
      sport: undefined,
      event: undefined,
      finishTimeMinutes: undefined,
      currentIntake: undefined,
      giFrequency: undefined,
      gender: undefined,
      calculationResult: undefined,
      protocolResult: undefined,
    }));
  }, []);

  const contextValue = useMemo<AppContextType>(() => ({
    state,
    setScreen,
    setAnswer,
    setCalculationResult,
    setProtocolResult,
    reset,
    clearQuestionnaire,
  }), [state, setScreen, setAnswer, setCalculationResult, setProtocolResult, reset, clearQuestionnaire]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}


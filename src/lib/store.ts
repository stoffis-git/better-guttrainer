/**
 * Simple state management for the questionnaire flow
 * Using React context to avoid external dependencies
 * State is persisted to localStorage to survive route changes
 */

import { createContext, useContext } from 'react';
import type {
  Sport,
  EventType,
  GIFrequency,
  Gender,
  TimelineChoice,
  CalculationResult,
  ProtocolResult,
} from './types';

export type Screen = 'landing' | 'questionnaire' | 'results' | 'protocol-setup' | 'protocol-results';

export interface AppState {
  screen: Screen;
  
  // Questionnaire answers
  sport?: Sport;
  event?: EventType;
  finishTimeMinutes?: number;
  currentIntake?: number;
  giFrequency?: GIFrequency;
  gender?: Gender;
  
  // Protocol setup
  frequency?: 1 | 2 | 3;
  
  // Results
  calculationResult?: CalculationResult;
  protocolResult?: ProtocolResult;
}

export interface AppContextType {
  state: AppState;
  setScreen: (screen: Screen) => void;
  setAnswer: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  setCalculationResult: (result: CalculationResult) => void;
  setProtocolResult: (result: ProtocolResult) => void;
  reset: () => void;
  clearQuestionnaire: () => void;
}

export const initialState: AppState = {
  screen: 'landing',
};

export const AppContext = createContext<AppContextType | null>(null);

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

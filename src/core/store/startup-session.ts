import { useSyncExternalStore } from 'react';

export type StartupPhase = 'splash' | 'auth' | 'app';

type StartupSessionState = {
  hasCompletedSplash: boolean;
  isAuthenticated: boolean;
  phase: StartupPhase;
};

const initialState: StartupSessionState = {
  hasCompletedSplash: false,
  isAuthenticated: false,
  phase: 'splash',
};

let state = initialState;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(updater: (currentState: StartupSessionState) => StartupSessionState) {
  state = updater(state);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

export function useStartupSession() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const startupSessionActions = {
  completeSplash() {
    setState((currentState) => ({
      ...currentState,
      hasCompletedSplash: true,
      phase: currentState.isAuthenticated ? 'app' : 'auth',
    }));
  },
  setAuthenticated(isAuthenticated: boolean) {
    setState((currentState) => ({
      ...currentState,
      isAuthenticated,
      phase: currentState.hasCompletedSplash ? (isAuthenticated ? 'app' : 'auth') : 'splash',
    }));
  },
  reset() {
    state = initialState;
    emit();
  },
};

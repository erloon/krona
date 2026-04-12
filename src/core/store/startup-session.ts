import { useSyncExternalStore } from 'react';

import type { StoredAuthSession } from '@/features/auth/shared/types/auth';

export type StartupPhase = 'splash' | 'auth' | 'app';

type StartupSessionState = {
  hasCompletedSplash: boolean;
  isHydrating: boolean;
  isAuthenticated: boolean;
  session: StoredAuthSession | null;
  phase: StartupPhase;
};

const initialState: StartupSessionState = {
  hasCompletedSplash: false,
  isHydrating: true,
  isAuthenticated: false,
  session: null,
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
      phase: resolvePhase({
        hasCompletedSplash: true,
        isHydrating: currentState.isHydrating,
        isAuthenticated: currentState.isAuthenticated,
      }),
    }));
  },
  finishHydration(session: StoredAuthSession | null) {
    setState((currentState) => ({
      ...currentState,
      isHydrating: false,
      session,
      isAuthenticated: Boolean(session),
      phase: resolvePhase({
        hasCompletedSplash: currentState.hasCompletedSplash,
        isHydrating: false,
        isAuthenticated: Boolean(session),
      }),
    }));
  },
  setSession(session: StoredAuthSession | null) {
    setState((currentState) => ({
      ...currentState,
      session,
      isAuthenticated: Boolean(session),
      phase: resolvePhase({
        hasCompletedSplash: currentState.hasCompletedSplash,
        isHydrating: currentState.isHydrating,
        isAuthenticated: Boolean(session),
      }),
    }));
  },
  reset() {
    state = initialState;
    emit();
  },
};

function resolvePhase(input: Pick<StartupSessionState, 'hasCompletedSplash' | 'isHydrating' | 'isAuthenticated'>): StartupPhase {
  if (!input.hasCompletedSplash || input.isHydrating) {
    return 'splash';
  }

  return input.isAuthenticated ? 'app' : 'auth';
}

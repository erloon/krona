import { useSyncExternalStore } from 'react';

import type { StoredAuthSession } from '@/features/auth/shared/types/auth';

export type StartupPhase = 'splash' | 'auth' | 'pin-setup' | 'pin-unlock' | 'app';
type TargetPhase = Exclude<StartupPhase, 'splash'>;

type StartupSessionState = {
  hasCompletedSplash: boolean;
  isHydrating: boolean;
  isAuthenticated: boolean;
  session: StoredAuthSession | null;
  phase: StartupPhase;
  targetPhase: TargetPhase;
  securityMessage: string | null;
  databaseKey: string | null;
};

const initialState: StartupSessionState = {
  hasCompletedSplash: false,
  isHydrating: true,
  isAuthenticated: false,
  session: null,
  phase: 'splash',
  targetPhase: 'auth',
  securityMessage: null,
  databaseKey: null,
};

let state = initialState;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function resolvePhase(input: Pick<StartupSessionState, 'hasCompletedSplash' | 'isHydrating' | 'targetPhase'>): StartupPhase {
  if (!input.hasCompletedSplash || input.isHydrating) {
    return 'splash';
  }

  return input.targetPhase;
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
        targetPhase: currentState.targetPhase,
      }),
    }));
  },
  finishHydration(
    session: StoredAuthSession | null,
    targetPhase: TargetPhase = session ? 'pin-unlock' : 'auth',
    options?: {
      securityMessage?: string | null;
      databaseKey?: string | null;
    }
  ) {
    setState((currentState) => ({
      ...currentState,
      isHydrating: false,
      session,
      isAuthenticated: Boolean(session),
      targetPhase,
      securityMessage: options?.securityMessage ?? null,
      databaseKey: targetPhase === 'app' ? options?.databaseKey ?? null : null,
      phase: resolvePhase({
        hasCompletedSplash: currentState.hasCompletedSplash,
        isHydrating: false,
        targetPhase,
      }),
    }));
  },
  setPendingSession(
    session: StoredAuthSession,
    targetPhase: Extract<TargetPhase, 'pin-setup' | 'pin-unlock'>,
    securityMessage: string | null = null
  ) {
    setState((currentState) => ({
      ...currentState,
      session,
      isAuthenticated: true,
      targetPhase,
      securityMessage,
      databaseKey: null,
      phase: resolvePhase({
        hasCompletedSplash: currentState.hasCompletedSplash,
        isHydrating: currentState.isHydrating,
        targetPhase,
      }),
    }));
  },
  unlockApp(databaseKey: string) {
    setState((currentState) => ({
      ...currentState,
      targetPhase: 'app',
      databaseKey,
      phase: resolvePhase({
        hasCompletedSplash: currentState.hasCompletedSplash,
        isHydrating: currentState.isHydrating,
        targetPhase: 'app',
      }),
    }));
  },
  signOut(securityMessage: string | null = null) {
    setState((currentState) => ({
      ...currentState,
      session: null,
      isAuthenticated: false,
      targetPhase: 'auth',
      securityMessage,
      databaseKey: null,
      phase: resolvePhase({
        hasCompletedSplash: currentState.hasCompletedSplash,
        isHydrating: currentState.isHydrating,
        targetPhase: 'auth',
      }),
    }));
  },
  setSecurityMessage(securityMessage: string | null) {
    setState((currentState) => ({
      ...currentState,
      securityMessage,
    }));
  },
  reset() {
    state = initialState;
    emit();
  },
};

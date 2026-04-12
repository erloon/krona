import type { AuthenticatedUser, StoredAuthSession } from '@/features/auth/shared/types/auth';

import { fetchGoogleUserProfile } from '../../infrastructure/google/googleProfileClient';
import { authSessionStorage } from '../../infrastructure/storage/authSessionStorage';

type CompleteGoogleSignInInput = {
  accessToken: string;
  idToken?: string;
};

export const authSessionService = {
  async signInWithGoogle({ accessToken, idToken }: CompleteGoogleSignInInput) {
    const user = await fetchGoogleUserProfile(accessToken);
    return authSessionService.createLocalSession(user, idToken);
  },
  async signInWithLocalProfile(user: AuthenticatedUser) {
    return authSessionService.createLocalSession(user);
  },
  async createLocalSession(user: AuthenticatedUser, idToken?: string) {
    const session: StoredAuthSession = {
      provider: 'google',
      user,
      idToken,
      issuedAt: Date.now(),
    };

    await authSessionStorage.save(session);

    return session;
  },
  restoreSession() {
    return authSessionStorage.load();
  },
  signOut() {
    return authSessionStorage.clear();
  },
};

export type AuthService = {
  signInWithGoogle(input: CompleteGoogleSignInInput): Promise<StoredAuthSession>;
  restoreSession(): Promise<StoredAuthSession | null>;
  signOut(): Promise<void>;
};

export type { AuthenticatedUser };

import React from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';

import {
  getGoogleClientIdError,
  getGooglePlatformClientId,
  googleAuthConfig,
  isExpoGoGoogleBypassAvailable,
} from '@/core/config/google-auth';
import { startupSessionActions } from '@/core/store/startup-session';

import { authSessionService } from '../../application/services/authSessionService';
import { localSecurityService } from '../../application/services/localSecurityService';

function buildGooglePromptError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Logowanie przez Google nie powiodło się. Spróbuj ponownie.';
}

export function useGoogleSignIn() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const platformClientId = getGooglePlatformClientId();
  const authModules = React.useMemo(() => loadGoogleAuthModules(), []);

  React.useEffect(() => {
    authModules?.webBrowser.maybeCompleteAuthSession();
  }, [authModules]);

  const redirectUri = React.useMemo(
    () =>
      authModules?.authSession.makeRedirectUri({
        scheme: 'krona',
        path: 'oauthredirect',
      }) ?? null,
    [authModules]
  );

  const authRequestConfig = React.useMemo(
    () =>
      authModules && redirectUri
        ? {
            clientId: platformClientId ?? 'missing-google-client-id',
            webClientId: googleAuthConfig.webClientId,
            androidClientId: googleAuthConfig.androidClientId,
            iosClientId: googleAuthConfig.iosClientId,
            redirectUri,
            scopes: ['openid', 'profile', 'email'],
            selectAccount: true,
          }
        : null,
    [authModules, platformClientId, redirectUri]
  );

  const requestResult = authModules && authRequestConfig
    ? authModules.google.useAuthRequest(authRequestConfig)
    : [null, null, null];
  const request = requestResult[0];
  const promptAsync = requestResult[2];

  async function signIn() {
    const runtimeSupport = localSecurityService.getRuntimeSupport();

    if (isExpoGoGoogleBypassAvailable()) {
      setError(null);
      setIsPending(true);

      try {
        const session = await authSessionService.signInWithLocalProfile(
          googleAuthConfig.expoGoFallbackUser
        );

        if (Platform.OS === 'web') {
          startupSessionActions.finishHydration(session, 'app', {
            securityMessage: runtimeSupport.supported ? null : runtimeSupport.message,
          });
          router.replace('/(app)');
          return;
        }

        const hasPin = await localSecurityService.hasPin(session.user.id);

        startupSessionActions.setPendingSession(
          session,
          hasPin ? 'pin-unlock' : 'pin-setup'
        );
        router.replace(hasPin ? '/(auth)/pin-unlock' : '/(auth)/pin-setup');
      } catch (signInError) {
        setError(buildGooglePromptError(signInError));
      } finally {
        setIsPending(false);
      }

      return;
    }

    if (!platformClientId) {
      setError(getGoogleClientIdError());
      return;
    }

    if (!authModules || !promptAsync) {
      setError(
        'Ta wersja aplikacji nie zawiera natywnych modułów logowania. Zainstaluj nowy build po dodaniu expo-secure-store i expo-crypto.'
      );
      return;
    }

    if (!request) {
      setError('Logowanie Google nie jest jeszcze gotowe. Odczekaj chwilę i spróbuj ponownie.');
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      const result = await promptAsync();

      if (result.type === 'cancel' || result.type === 'dismiss') {
        setError('Logowanie przez Google zostało anulowane.');
        return;
      }

      if (result.type !== 'success') {
        const providerMessage = result.type === 'error' ? result.error?.description : null;
        setError(providerMessage ?? 'Google nie zwrócił poprawnej odpowiedzi logowania.');
        return;
      }

      const accessToken = result.authentication?.accessToken ?? result.params.access_token;
      const idToken = result.authentication?.idToken ?? result.params.id_token;

      if (!accessToken) {
        throw new Error(
          Platform.OS === 'android'
            ? 'Google nie zwrócił access token. Sprawdź Android OAuth client ID i redirect URI.'
            : 'Google nie zwrócił access token.'
        );
      }

      const session = await authSessionService.signInWithGoogle({
        accessToken,
        idToken,
      });

      if (Platform.OS === 'web') {
        startupSessionActions.finishHydration(session, 'app', {
          securityMessage: runtimeSupport.supported ? null : runtimeSupport.message,
        });
        router.replace('/(app)');
        return;
      }

      const hasPin = await localSecurityService.hasPin(session.user.id);

      startupSessionActions.setPendingSession(
        session,
        hasPin ? 'pin-unlock' : 'pin-setup'
      );
      router.replace(hasPin ? '/(auth)/pin-unlock' : '/(auth)/pin-setup');
    } catch (signInError) {
      setError(buildGooglePromptError(signInError));
    } finally {
      setIsPending(false);
    }
  }

  return {
    error,
    isPending,
    signIn,
  };
}

type GoogleAuthModules = {
  authSession: {
    makeRedirectUri(input: { scheme: string; path: string }): string;
  };
  google: {
    useAuthRequest(config: {
      clientId: string;
      webClientId?: string;
      androidClientId?: string;
      iosClientId?: string;
      redirectUri: string;
      scopes: string[];
      selectAccount: boolean;
    }): [unknown, null, ((options?: object) => Promise<AuthPromptResult>) | null];
  };
  webBrowser: {
    maybeCompleteAuthSession(): void;
  };
};

type AuthPromptResult = {
  type: 'cancel' | 'dismiss' | 'success' | 'error';
  authentication?: {
    accessToken?: string;
    idToken?: string;
  } | null;
  params: Record<string, string>;
  error?: {
    description?: string;
  } | null;
};

function loadGoogleAuthModules(): GoogleAuthModules | null {
  try {
    return {
      // Lazy load so login can fail gracefully on binaries missing native auth modules.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      authSession: require('expo-auth-session') as GoogleAuthModules['authSession'],
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      google: require('expo-auth-session/providers/google') as GoogleAuthModules['google'],
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      webBrowser: require('expo-web-browser') as GoogleAuthModules['webBrowser'],
    };
  } catch {
    return null;
  }
}

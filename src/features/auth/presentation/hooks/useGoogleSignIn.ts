import React from 'react';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';

import {
  getGoogleClientIdError,
  getGooglePlatformClientId,
  googleAuthConfig,
  isExpoGoGoogleBypassAvailable,
} from '@/core/config/google-auth';
import { startupSessionActions } from '@/core/store/startup-session';

import { authSessionService } from '../../application/services/authSessionService';

WebBrowser.maybeCompleteAuthSession();

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

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'krona',
    path: 'oauthredirect',
  });

  const [request, , promptAsync] = Google.useAuthRequest({
    clientId: platformClientId ?? 'missing-google-client-id',
    webClientId: googleAuthConfig.webClientId,
    androidClientId: googleAuthConfig.androidClientId,
    iosClientId: googleAuthConfig.iosClientId,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
    selectAccount: true,
  });

  async function signIn() {
    if (isExpoGoGoogleBypassAvailable()) {
      setError(null);
      setIsPending(true);

      try {
        const session = await authSessionService.signInWithLocalProfile(
          googleAuthConfig.expoGoFallbackUser
        );

        startupSessionActions.setSession(session);
        router.replace('/(app)');
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

      startupSessionActions.setSession(session);
      router.replace('/(app)');
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

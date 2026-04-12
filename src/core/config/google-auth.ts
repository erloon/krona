import { Platform } from 'react-native';
import Constants, { AppOwnership } from 'expo-constants';

import type { AuthenticatedUser } from '@/features/auth/shared/types/auth';

type GooglePlatform = 'android' | 'ios' | 'web';

export const googleAuthConfig = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  expoGoBypassEnabled: process.env.EXPO_PUBLIC_GOOGLE_EXPO_GO_BYPASS === 'true',
  expoGoFallbackUser: {
    id: process.env.EXPO_PUBLIC_GOOGLE_FALLBACK_USER_ID ?? 'expo-go-dev-user',
    email: process.env.EXPO_PUBLIC_GOOGLE_FALLBACK_EMAIL ?? 'dev@krona.local',
    name: process.env.EXPO_PUBLIC_GOOGLE_FALLBACK_NAME ?? 'Expo Go Developer',
    avatarUrl: process.env.EXPO_PUBLIC_GOOGLE_FALLBACK_AVATAR_URL,
  } satisfies AuthenticatedUser,
} as const;

export function getGooglePlatformClientId(platform: GooglePlatform = getCurrentGooglePlatform()) {
  switch (platform) {
    case 'android':
      return googleAuthConfig.androidClientId;
    case 'ios':
      return googleAuthConfig.iosClientId;
    case 'web':
    default:
      return googleAuthConfig.webClientId;
  }
}

export function getGoogleClientIdError(platform: GooglePlatform = getCurrentGooglePlatform()) {
  switch (platform) {
    case 'android':
      if (isExpoGoGoogleBypassAvailable()) {
        return 'Google OAuth nie działa w Expo Go, ale aktywny jest lokalny bypass logowania dla developmentu.';
      }

      return 'Brakuje EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID. Dodaj Android OAuth client ID dla com.sparkdatapl.krona wraz z poprawnym SHA-1 i SHA-256.';
    case 'ios':
      return 'Brakuje EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID. Dodaj iOS OAuth client ID, aby włączyć logowanie na iOS.';
    case 'web':
    default:
      return 'Brakuje EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID. Dodaj web OAuth client ID, aby włączyć logowanie Google na web.';
  }
}

function getCurrentGooglePlatform(): GooglePlatform {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    return Platform.OS;
  }

  return 'web';
}

export function isExpoGoGoogleBypassAvailable() {
  return Platform.OS !== 'web' &&
    Constants.appOwnership === AppOwnership.Expo &&
    googleAuthConfig.expoGoBypassEnabled;
}

import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

import {
  startupSessionActions,
  useStartupSession,
} from '@/core/store/startup-session';
import { SplashBrandScreen } from '@/features/splash/presentation/screens/SplashBrandScreen';

export default function HomeScreen() {
  const router = useRouter();
  const { phase } = useStartupSession();

  useEffect(() => {
    if (phase !== 'splash') {
      return;
    }

    const timeoutId = setTimeout(() => {
      startupSessionActions.completeSplash();
    }, 1400);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === 'auth') {
      router.replace('/(auth)/login');
    }

    if (phase === 'app') {
      router.replace('/(app)/index');
    }
  }, [phase, router]);

  return <SplashBrandScreen />;
}

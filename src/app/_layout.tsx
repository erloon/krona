import 'expo-dev-client';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/global.css';
import { startupSessionActions, useStartupSession } from '@/core/store/startup-session';
import { DatabaseProvider } from '@/core/providers/DatabaseProvider';
import { authSessionService } from '@/features/auth/application/services/authSessionService';
import { localSecurityService } from '@/features/auth/application/services/localSecurityService';
import { CalculatorDataProvider } from '@/features/calculator/presentation/hooks/CalculatorDataProvider';
import { colors } from '@/shared/theme';

export default function RootLayout() {
  const { databaseKey, phase } = useStartupSession();

  React.useEffect(() => {
    let isMounted = true;

    const support = localSecurityService.getRuntimeSupport();

    if (!support.supported) {
      if (Platform.OS !== 'web') {
        startupSessionActions.finishHydration(null, 'auth', {
          securityMessage: support.message,
        });
        return () => {
          isMounted = false;
        };
      }
    }

    authSessionService.restoreSession().then(async (session) => {
      if (!isMounted) {
        return;
      }

      if (Platform.OS === 'web') {
        startupSessionActions.finishHydration(session, session ? 'app' : 'auth', {
          securityMessage: support.supported ? null : support.message,
        });
        return;
      }

      if (!session) {
        startupSessionActions.finishHydration(null, 'auth');
        return;
      }

      const hasPin = await localSecurityService.hasPin(session.user.id);

      if (!isMounted) {
        return;
      }

      startupSessionActions.finishHydration(
        session,
        hasPin ? 'pin-unlock' : 'pin-setup'
      );
    }).catch(() => {
      if (isMounted) {
        startupSessionActions.finishHydration(null, 'auth');
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const content = (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background.page,
          },
        }}
      />
    </>
  );

  return (
    <SafeAreaProvider>
      {phase === 'app' && (Platform.OS === 'web' || databaseKey) ? (
        <DatabaseProvider databaseKey={databaseKey ?? ''}>
          <CalculatorDataProvider>{content}</CalculatorDataProvider>
        </DatabaseProvider>
      ) : (
        content
      )}
    </SafeAreaProvider>
  );
}

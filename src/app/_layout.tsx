import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/global.css';
import { startupSessionActions } from '@/core/store/startup-session';
import { DatabaseProvider } from '@/core/providers/DatabaseProvider';
import { authSessionService } from '@/features/auth/application/services/authSessionService';
import { CalculatorDataProvider } from '@/features/calculator/presentation/hooks/CalculatorDataProvider';
import { colors } from '@/shared/theme';

export default function RootLayout() {
  React.useEffect(() => {
    let isMounted = true;

    authSessionService
      .restoreSession()
      .then((session) => {
        if (isMounted) {
          startupSessionActions.finishHydration(session);
        }
      })
      .catch(() => {
        if (isMounted) {
          startupSessionActions.finishHydration(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <CalculatorDataProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: colors.background.page,
              },
            }}
          />
        </CalculatorDataProvider>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}

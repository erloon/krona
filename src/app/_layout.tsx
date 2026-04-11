import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/global.css';
import { DatabaseProvider } from '@/core/providers/DatabaseProvider';
import { colors } from '@/shared/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: colors.background.page,
            },
          }}
        />
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}

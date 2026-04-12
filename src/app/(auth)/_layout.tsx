import React from 'react';
import { Redirect, Stack } from 'expo-router';

import { useStartupSession } from '@/core/store/startup-session';

export default function AuthLayout() {
  const { phase, isHydrating } = useStartupSession();

  if (isHydrating || phase === 'splash') {
    return null;
  }

  if (phase === 'app') {
    return <Redirect href="/(app)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

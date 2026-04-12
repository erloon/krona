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

  if (phase === 'pin-setup') {
    return <Redirect href="/(auth)/pin-setup" />;
  }

  if (phase === 'pin-unlock') {
    return <Redirect href="/(auth)/pin-unlock" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

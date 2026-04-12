import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStartupSession } from '@/core/store/startup-session';
import { colors, spacing, typography } from '@/shared/theme';

export default function AppLayout() {
  const insets = useSafeAreaInsets();
  const { phase, isHydrating } = useStartupSession();

  if (isHydrating || phase === 'splash') {
    return null;
  }

  if (phase !== 'app') {
    if (phase === 'pin-setup') {
      return <Redirect href="/(auth)/pin-setup" />;
    }

    if (phase === 'pin-unlock') {
      return <Redirect href="/(auth)/pin-unlock" />;
    }

    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      initialRouteName="dashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarShowLabel: true,
        tabBarStyle: {
          height: 76 + insets.bottom,
          paddingTop: spacing.sm,
          paddingBottom: Math.max(spacing.md, insets.bottom),
          backgroundColor: colors.background.surface,
          borderTopColor: colors.border.input,
        },
        tabBarLabelStyle: {
          ...typography.bodySmall,
          fontWeight: '600',
          marginTop: spacing.xs,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Pulpit',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="incomes"
        options={{
          title: 'Przychody',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="money-bill-1-wave" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="costs"
        options={{
          title: 'Koszty',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="receipt-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ustawienia',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

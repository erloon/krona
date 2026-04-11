import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, spacing, typography } from '@/shared/theme';

export default function AppLayout() {
  return (
    <Tabs
      initialRouteName="dashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarShowLabel: true,
        tabBarStyle: {
          height: 76,
          paddingTop: spacing.sm,
          paddingBottom: spacing.md,
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
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="incomes"
        options={{
          title: 'Incomes',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="money-bill-1-wave" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="costs"
        options={{
          title: 'Costs',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="receipt-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

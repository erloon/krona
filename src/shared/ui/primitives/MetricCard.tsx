import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/theme';

import { SurfaceCard } from './SurfaceCard';

type MetricCardProps = {
  label: string;
  amount: string;
  currency?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  onPress?: ((event: GestureResponderEvent) => void) | undefined;
};

export function MetricCard({
  label,
  amount,
  currency = 'PLN',
  accessibilityLabel,
  accessibilityHint,
  onPress,
}: MetricCardProps) {
  const content = (
    <SurfaceCard style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.amount}>{amount}</Text>
        <Text style={styles.currency}>{currency}</Text>
      </View>
    </SurfaceCard>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed ? styles.pressed : null]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: radius.card,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  card: {
    gap: spacing.sm,
    minHeight: 128,
    justifyContent: 'space-between',
  },
  label: {
    ...typography.sectionLabel,
    color: colors.text.secondary,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  amount: {
    ...typography.metricValueCompact,
    color: colors.text.primary,
  },
  currency: {
    ...typography.caption,
    color: colors.text.subtle,
  },
});

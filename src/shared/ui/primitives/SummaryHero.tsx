import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/shared/theme';

import { SurfaceCard } from './SurfaceCard';

type SummaryHeroProps = {
  eyebrow: string;
  amount: string;
  currency: string;
  statusLabel?: string;
};

export function SummaryHero({
  eyebrow,
  amount,
  currency,
  statusLabel,
}: SummaryHeroProps) {
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <View style={styles.valueRow}>
          <Text style={styles.amount}>{amount}</Text>
          <Text style={styles.currency}>{currency}</Text>
        </View>
      </View>
      {statusLabel ? <Text style={styles.status}>{statusLabel}</Text> : null}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  copy: {
    gap: spacing.sm,
  },
  eyebrow: {
    ...typography.sectionLabel,
    color: colors.text.secondary,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amount: {
    ...typography.heroTitle,
    color: colors.brand.primary,
  },
  currency: {
    ...typography.metricValueCompact,
    color: colors.brand.primary,
  },
  status: {
    ...typography.caption,
    color: colors.text.subtle,
  },
});

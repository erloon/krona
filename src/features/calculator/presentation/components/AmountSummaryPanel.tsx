import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/shared/theme';

type AmountSummaryPanelProps = {
  grossAmount: string;
  netAmount: string;
  vatAmount: string;
  vatLabel: string;
  currency: string;
};

export function AmountSummaryPanel({
  grossAmount,
  netAmount,
  vatAmount,
  vatLabel,
  currency,
}: AmountSummaryPanelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>ŁĄCZNIE BRUTTO</Text>
      <View style={styles.hero}>
        <Text style={styles.amount}>{grossAmount}</Text>
        <Text style={styles.currency}>{currency}</Text>
      </View>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>NETTO</Text>
          <Text style={styles.metricValue}>
            {netAmount} {currency}
          </Text>
        </View>
        <View style={[styles.metric, styles.metricRight]}>
          <Text style={styles.metricLabel}>{vatLabel}</Text>
          <Text style={styles.metricValue}>
            {vatAmount} {currency}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  label: {
    ...typography.sectionLabel,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  amount: {
    ...typography.display,
    color: colors.text.primary,
  },
  currency: {
    ...typography.metricValueCompact,
    color: colors.brand.primary,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.lg,
  },
  metric: {
    flex: 1,
    gap: spacing.xs,
  },
  metricRight: {
    alignItems: 'flex-end',
  },
  metricLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  metricValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '700',
  },
});

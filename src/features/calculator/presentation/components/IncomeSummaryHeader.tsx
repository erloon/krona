import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/shared/theme';

type IncomeSummaryHeaderProps = {
  title: string;
  totalLabel: string;
  totalAmount: string;
  totalCurrency: string;
  vatAmount: string;
  pitAmount: string;
};

export function IncomeSummaryHeader({
  title,
  totalLabel,
  totalAmount,
  totalCurrency,
  vatAmount,
  pitAmount,
}: IncomeSummaryHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{totalLabel}</Text>
        <View style={styles.totalValueRow}>
          <Text style={styles.totalAmount}>{totalAmount}</Text>
          <Text style={styles.totalCurrency}>{totalCurrency}</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>VAT:</Text>
          <Text style={styles.metricValue}>{vatAmount}</Text>
          <Text style={styles.metricCurrency}>PLN</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>PIT:</Text>
          <Text style={styles.metricValue}>{pitAmount}</Text>
          <Text style={styles.metricCurrency}>PLN</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    paddingTop: spacing.xs,
  },
  title: {
    ...typography.heroTitle,
    color: colors.text.primary,
  },
  totalRow: {
    gap: spacing.xs,
  },
  totalLabel: {
    ...typography.bodyMedium,
    color: colors.text.subtle,
  },
  totalValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  totalAmount: {
    ...typography.metricValue,
    color: colors.brand.primary,
  },
  totalCurrency: {
    ...typography.metricValueCompact,
    color: colors.brand.primary,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metricLabel: {
    ...typography.sectionLabel,
    color: colors.text.subtle,
  },
  metricValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '700',
  },
  metricCurrency: {
    ...typography.caption,
    color: colors.text.subtle,
  },
});

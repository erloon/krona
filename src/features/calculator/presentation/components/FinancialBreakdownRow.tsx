import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/shared/theme';

type FinancialBreakdownRowProps = {
  label: string;
  amount: string;
  currency?: string;
};

export function FinancialBreakdownRow({
  label,
  amount,
  currency = 'PLN',
}: FinancialBreakdownRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.amount}>{amount}</Text>
        <Text style={styles.currency}>{currency}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  amount: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '700',
  },
  currency: {
    ...typography.caption,
    color: colors.text.subtle,
  },
});

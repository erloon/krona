import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/theme';
import { StatusTag } from '@/shared/ui/primitives/StatusTag';

import { RecordActionRow } from './RecordActionRow';

type IncomeListItemCardProps = {
  title: string;
  metadata: string;
  amount: string;
  currency: string;
  vatLabel: string;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  deleteDisabled?: boolean;
};

export function IncomeListItemCard({
  title,
  metadata,
  amount,
  currency,
  vatLabel,
  onEdit,
  onDuplicate,
  onDelete,
  deleteDisabled = false,
}: IncomeListItemCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.metadata}>{metadata}</Text>
        </View>

        <View style={styles.amountWrap}>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>{amount}</Text>
            <Text style={styles.currency}>{currency}</Text>
          </View>
          <StatusTag label={vatLabel} />
        </View>
      </View>

      <RecordActionRow deleteDisabled={deleteDisabled} onDelete={onDelete} onDuplicate={onDuplicate} onEdit={onEdit} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.background.surface,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '700',
  },
  metadata: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  amountWrap: {
    alignItems: 'flex-end',
    gap: spacing.xs,
    maxWidth: '42%',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  amount: {
    ...typography.metricValueCompact,
    color: colors.text.primary,
  },
  currency: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});

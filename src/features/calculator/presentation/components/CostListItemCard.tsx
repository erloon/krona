import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/theme';
import { StatusTag } from '@/shared/ui/primitives/StatusTag';

import { RecordActionRow } from './RecordActionRow';

type CostListItemCardProps = {
  title: string;
  metadata: string;
  amount: string;
  vatLabel: string;
  categoryLabel: string;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  deleteDisabled?: boolean;
};

export function CostListItemCard({
  title,
  metadata,
  amount,
  vatLabel,
  categoryLabel,
  onEdit,
  onDuplicate,
  onDelete,
  deleteDisabled = false,
}: CostListItemCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.metadata}>{metadata}</Text>
        </View>

        <View style={styles.amountWrap}>
          <Text style={styles.amount}>{amount}</Text>
          <View style={styles.tags}>
            <StatusTag label={categoryLabel} />
            <StatusTag label={vatLabel} />
          </View>
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
    gap: spacing.sm,
    maxWidth: '44%',
  },
  amount: {
    ...typography.metricValueCompact,
    color: colors.text.primary,
    textAlign: 'right',
  },
  tags: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
});

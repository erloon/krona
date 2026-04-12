import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/theme';
import { InfoBanner } from '@/shared/ui/primitives/InfoBanner';
import { StatusTag } from '@/shared/ui/primitives/StatusTag';

import { RecordActionRow } from './RecordActionRow';

type CostListItemCardProps = {
  title: string;
  amount: string;
  netAmount: string;
  fxLabel?: string | null;
  vatLabel: string;
  categoryLabel: string;
  deductionLabel: string;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  actionDisabled?: boolean;
  duplicateLoading?: boolean;
};

export function CostListItemCard({
  title,
  amount,
  netAmount,
  fxLabel,
  vatLabel,
  categoryLabel,
  deductionLabel,
  onEdit,
  onDuplicate,
  onDelete,
  deleteDisabled = false,
  actionDisabled = false,
  duplicateLoading = false,
}: CostListItemCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <StatusTag label={categoryLabel} />
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.amountWrap}>
          <Text style={styles.amount}>{amount}</Text>
          <Text style={styles.metadata}>{vatLabel} | Netto: {netAmount} PLN</Text>
          {fxLabel ? <Text style={styles.metadata}>{fxLabel}</Text> : null}
        </View>
      </View>

      <InfoBanner message={deductionLabel} />

      <RecordActionRow
        actionDisabled={actionDisabled}
        deleteDisabled={deleteDisabled}
        duplicateLoading={duplicateLoading}
        entityLabel="koszt"
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onEdit={onEdit}
        title={title}
      />
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
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'right',
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
});

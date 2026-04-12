import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { IncomeValidationWarning } from '@/features/calculator/domain/services/validateIncomeBusinessRules';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { StatusTag } from '@/shared/ui/primitives/StatusTag';
import { ValidationWarningsList } from '@/shared/ui/primitives/ValidationWarning';

import { RecordActionRow } from './RecordActionRow';

type IncomeListItemCardProps = {
  clientName: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  vatLabel: string;
  warnings?: readonly IncomeValidationWarning[];
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  actionDisabled?: boolean;
  duplicateLoading?: boolean;
  deleteDisabled?: boolean;
};

export function IncomeListItemCard({
  clientName,
  invoiceNumber,
  amount,
  currency,
  vatLabel,
  warnings = [],
  onEdit,
  onDuplicate,
  onDelete,
  actionDisabled = false,
  duplicateLoading = false,
  deleteDisabled = false,
}: IncomeListItemCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>KLIENT</Text>
            <Text style={styles.metaValue}>{clientName}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>NUMER</Text>
            <Text style={styles.metaValue}>{invoiceNumber}</Text>
          </View>
        </View>

        <View style={styles.amountWrap}>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>{amount}</Text>
            <Text style={styles.currency}>{currency}</Text>
          </View>
          <StatusTag label={vatLabel} />
        </View>
      </View>

      {warnings.length > 0 ? (
        <ValidationWarningsList warnings={warnings.map((w) => w.message)} />
      ) : null}

      <RecordActionRow
        actionDisabled={actionDisabled}
        deleteDisabled={deleteDisabled}
        duplicateLoading={duplicateLoading}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onEdit={onEdit}
        title={clientName}
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
    minWidth: 0,
    gap: spacing.sm,
  },
  metaRow: {
    gap: spacing.xxs,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.text.subtle,
  },
  metaValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flexShrink: 1,
    fontWeight: '700',
  },
  amountWrap: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: spacing.xs,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    flexWrap: 'nowrap',
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

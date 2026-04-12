import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '@/shared/theme';
import { SurfaceCard } from '@/shared/ui/primitives/SurfaceCard';

import { FinancialBreakdownRow } from './FinancialBreakdownRow';

type BreakdownRow = {
  key: string;
  label: string;
  amount: string;
};

type FinancialBreakdownCardProps = {
  title: string;
  summaryLabel: string;
  summaryAmount: string;
  rows: readonly BreakdownRow[];
  expanded: boolean;
  onToggle: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function FinancialBreakdownCard({
  title,
  summaryLabel,
  summaryAmount,
  rows,
  expanded,
  onToggle,
  accessibilityLabel,
  accessibilityHint,
}: FinancialBreakdownCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <SurfaceCard padded={false} style={styles.card}>
        <Pressable
          accessibilityHint={accessibilityHint}
          accessibilityLabel={accessibilityLabel ?? title}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={onToggle}
          style={({ pressed }) => [styles.summaryButton, pressed ? styles.summaryButtonPressed : null]}
        >
          <View style={styles.summaryCopy}>
            <View style={styles.dot} />
            <View style={styles.summaryText}>
              <Text style={styles.summaryLabel}>{summaryLabel}</Text>
              <Text style={styles.summaryAmount}>{summaryAmount} PLN</Text>
            </View>
          </View>
          <MaterialCommunityIcons
            color={colors.text.secondary}
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={22}
          />
        </Pressable>

        {expanded ? (
          <View style={styles.rows}>
            {rows.map((row, index) => (
              <View
                key={row.key}
                style={index < rows.length - 1 ? styles.rowWithDivider : null}
              >
                <FinancialBreakdownRow amount={row.amount} label={row.label} />
              </View>
            ))}
          </View>
        ) : null}
      </SurfaceCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  title: {
    ...typography.sectionLabel,
    color: colors.text.secondary,
  },
  card: {
    overflow: 'hidden',
    borderRadius: radius.card,
  },
  summaryButton: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background.surfaceContainerLow,
  },
  summaryButtonPressed: {
    backgroundColor: colors.background.surfaceContainerHigh,
  },
  summaryCopy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
  },
  summaryText: {
    gap: spacing.xs,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  summaryAmount: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '700',
  },
  rows: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background.surface,
  },
  rowWithDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
});

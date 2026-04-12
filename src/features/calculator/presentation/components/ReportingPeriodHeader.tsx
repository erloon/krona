import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/shared/theme';
import { IconButton } from '@/shared/ui/primitives/IconButton';
import { StatusTag } from '@/shared/ui/primitives/StatusTag';
import { SurfaceCard } from '@/shared/ui/primitives/SurfaceCard';

type ReportingPeriodHeaderProps = {
  title: string;
  periodLabel: string;
  statusLabel?: string;
  description: string;
  onPreviousPress: () => void;
  onNextPress: () => void;
  navigationDisabled?: boolean;
};

export function ReportingPeriodHeader({
  title,
  periodLabel,
  statusLabel = 'Okres aktywny',
  description,
  onPreviousPress,
  onNextPress,
  navigationDisabled = false,
}: ReportingPeriodHeaderProps) {
  return (
    <SurfaceCard>
      <View style={styles.topRow}>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.periodLabel}>{periodLabel}</Text>
        </View>
        <StatusTag label={statusLabel} />
      </View>

      <Text style={styles.description}>{description}</Text>

      <View style={styles.actions}>
        <IconButton
          accessibilityLabel="Poprzedni miesiąc"
          accessibilityHint="Przełącza widok na poprzedni okres raportowy."
          disabled={navigationDisabled}
          filled
          icon="chevron-left"
          onPress={onPreviousPress}
        />
        <IconButton
          accessibilityLabel="Następny miesiąc"
          accessibilityHint="Przełącza widok na następny okres raportowy."
          disabled={navigationDisabled}
          filled
          icon="chevron-right"
          onPress={onNextPress}
        />
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  topRow: {
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
    ...typography.sectionLabel,
    color: colors.text.secondary,
  },
  periodLabel: {
    ...typography.screenTitle,
    color: colors.text.primary,
  },
  description: {
    ...typography.bodySmall,
    marginTop: spacing.md,
    color: colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});

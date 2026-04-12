import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/shared/theme';
import { IconButton } from '@/shared/ui/primitives/IconButton';

type ReportingPeriodHeaderProps = {
  periodLabel: string;
  onPreviousPress: () => void;
  onNextPress: () => void;
  onCalendarPress?: () => void;
  navigationDisabled?: boolean;
};

export function ReportingPeriodHeader({
  periodLabel,
  onPreviousPress,
  onNextPress,
  onCalendarPress,
  navigationDisabled = false,
}: ReportingPeriodHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <Text style={styles.periodLabel}>{periodLabel}</Text>
      </View>

      <View style={styles.actions}>
        <IconButton
          accessibilityLabel="Poprzedni miesiąc"
          accessibilityHint="Przełącza widok na poprzedni okres raportowy."
          disabled={navigationDisabled}
          icon="chevron-left"
          onPress={onPreviousPress}
        />
        <IconButton
          accessibilityLabel="Następny miesiąc"
          accessibilityHint="Przełącza widok na następny okres raportowy."
          disabled={navigationDisabled}
          icon="chevron-right"
          onPress={onNextPress}
        />
        {onCalendarPress ? (
          <IconButton
            accessibilityLabel="Wybierz okres raportowy"
            accessibilityHint="Otwiera wybór miesiąca i roku."
            disabled={navigationDisabled}
            icon="calendar-month-outline"
            onPress={onCalendarPress}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
  },
  periodLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: 'auto',
  },
});

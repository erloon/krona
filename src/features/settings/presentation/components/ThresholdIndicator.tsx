import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/shared/theme';
import { ProgressBar } from '@/shared/ui/primitives/ProgressBar';

type ThresholdIndicatorProps = {
  taxYear: number;
  taxationFormLabel: string;
};

const LABELS = ['< 60k', '60k - 300k', '> 300k'];

export function ThresholdIndicator({
  taxYear,
  taxationFormLabel,
}: ThresholdIndicatorProps) {
  const isLumpSum = taxationFormLabel === 'Ryczałt';

  return (
    <View style={styles.container}>
      <Text style={styles.intro}>
        Wysokość składki zależy od formy opodatkowania i przychodu.
      </Text>
      <View style={styles.row}>
        <Text style={styles.caption}>
          {isLumpSum ? 'Progi przychodowe (Ryczałt)' : 'Składka wyliczana z dochodu'}
        </Text>
        <Text style={styles.year}>Rok {taxYear}</Text>
      </View>
      <ProgressBar activeIndex={isLumpSum ? 1 : undefined} labels={LABELS} />
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Bieżący poziom:</Text>
        <Text style={styles.summaryValue}>
          {isLumpSum ? '60k - 300k PLN' : 'zależny od miesięcznego dochodu'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  intro: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  caption: {
    ...typography.caption,
    color: colors.text.primary,
  },
  year: {
    ...typography.micro,
    color: colors.brand.primary,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.whisper,
  },
  summaryLabel: {
    ...typography.bodySmall,
    color: colors.text.primary,
  },
  summaryValue: {
    ...typography.bodySmall,
    color: colors.brand.primary,
    fontWeight: '700',
  },
});

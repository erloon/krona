import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/theme';

type ProgressBarProps = {
  labels?: string[];
  activeIndex?: number;
  progress?: number;
};

export function ProgressBar({ labels = [], activeIndex, progress }: ProgressBarProps) {
  const clampedProgress =
    typeof progress === 'number' ? Math.max(0, Math.min(1, progress)) : null;

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        {clampedProgress !== null ? (
          <View style={[styles.progressFill, { width: `${clampedProgress * 100}%` }]} />
        ) : (
          labels.map((label, index) => (
            <View
              key={label}
              style={[
                styles.segment,
                index === activeIndex ? styles.segmentActive : null,
                index < labels.length - 1 ? styles.segmentGap : null,
              ]}
            />
          ))
        )}
      </View>
      {labels.length > 0 ? (
        <View style={styles.labels}>
          {labels.map((label, index) => (
            <Text
              key={label}
              style={[styles.label, index === activeIndex ? styles.labelActive : null]}
            >
              {label}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 6,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.background.surface,
  },
  segment: {
    flex: 1,
    height: '100%',
    backgroundColor: 'rgba(0, 117, 222, 0.16)',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
  },
  segmentActive: {
    backgroundColor: colors.brand.primary,
  },
  segmentGap: {
    marginRight: 2,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: {
    ...typography.micro,
    color: colors.text.secondary,
  },
  labelActive: {
    color: colors.brand.primary,
  },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/theme';

type ProgressBarProps = {
  labels: string[];
  activeIndex?: number;
};

export function ProgressBar({ labels, activeIndex }: ProgressBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.track}>
        {labels.map((label, index) => (
          <View
            key={label}
            style={[
              styles.segment,
              index === activeIndex ? styles.segmentActive : null,
              index < labels.length - 1 ? styles.segmentGap : null,
            ]}
          />
        ))}
      </View>
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

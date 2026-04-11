import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/theme';

type LoadingIndicatorProps = {
  label?: string;
  variant?: 'static' | 'subtle';
};

export function LoadingIndicator({
  label = 'Uruchamianie modułów...',
  variant = 'static',
}: LoadingIndicatorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            variant === 'subtle' ? styles.fillSubtle : styles.fillStatic,
          ]}
        />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
  },
  track: {
    width: 44,
    height: 3,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: '#e6e2de',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
  },
  fillStatic: {
    width: '34%',
    marginLeft: '18%',
  },
  fillSubtle: {
    width: '24%',
    marginLeft: '38%',
    opacity: 0.72,
  },
  label: {
    ...typography.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

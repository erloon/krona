import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '@/shared/theme';

type SurfaceCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
};

export function SurfaceCard({
  children,
  style,
  padded = true,
}: SurfaceCardProps) {
  return <View style={[styles.base, padded && styles.padded, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderColor: colors.border.whisper,
    borderRadius: radius.card,
    backgroundColor: colors.background.surface,
    ...shadows.card,
  },
  padded: {
    padding: spacing.xl,
  },
});

import React from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { colors, radius, shadows, spacing } from '@/shared/theme';

type SurfaceCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
} & ViewProps;

export function SurfaceCard({
  children,
  style,
  padded = true,
  ...rest
}: SurfaceCardProps) {
  return (
    <View {...rest} style={[styles.base, padded && styles.padded, style]}>
      {children}
    </View>
  );
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

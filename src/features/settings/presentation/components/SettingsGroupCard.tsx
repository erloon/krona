import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme';

type SettingsGroupCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SettingsGroupCard({ children, style }: SettingsGroupCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.whisper,
    borderRadius: radius.paper,
    backgroundColor: colors.background.surfaceContainerLow,
    padding: spacing.lg,
  },
});

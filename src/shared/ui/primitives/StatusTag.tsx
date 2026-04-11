import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/theme';

type StatusTagProps = {
  label: string;
  style?: StyleProp<ViewStyle>;
};

export function StatusTag({ label, style }: StatusTagProps) {
  return (
    <View style={[styles.tag, style]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    borderRadius: radius.paper,
    backgroundColor: colors.background.badge,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.brand.primary,
  },
});

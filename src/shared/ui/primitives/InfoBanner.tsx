import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '@/shared/theme';

type InfoBannerProps = {
  message: string;
};

export function InfoBanner({ message }: InfoBannerProps) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons color={colors.brand.primary} name="information" size={16} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.whisper,
    borderRadius: radius.paper,
    backgroundColor: colors.background.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  message: {
    ...typography.caption,
    flex: 1,
    color: colors.text.secondary,
  },
});

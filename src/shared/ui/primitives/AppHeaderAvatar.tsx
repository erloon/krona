import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/theme';

type AppHeaderAvatarProps = {
  initials?: string;
};

export function AppHeaderAvatar({ initials = 'K' }: AppHeaderAvatarProps) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarLabel}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
  },
  avatarLabel: {
    ...typography.caption,
    color: colors.text.primary,
  },
});

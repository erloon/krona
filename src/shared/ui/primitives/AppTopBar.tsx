import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/shared/theme';

type AppTopBarProps = {
  title: string;
  leadingContent?: React.ReactNode;
  trailingContent?: React.ReactNode;
};

export function AppTopBar({
  title,
  leadingContent,
  trailingContent,
}: AppTopBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leading}>
        {leadingContent ? <View style={styles.leadingSlot}>{leadingContent}</View> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.trailing}>{trailingContent}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  leading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  leadingSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.brandCompact,
    color: colors.text.primary,
  },
  trailing: {
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/shared/theme';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  trailingContent?: React.ReactNode;
};

export function SectionHeader({ title, subtitle, trailingContent }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailingContent ? <View>{trailingContent}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.sectionLabel,
    color: colors.text.secondary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, spacing, typography } from '@/shared/theme';
import { SecondaryButton } from './SecondaryButton';

type EmptyStateVariant = 'default' | 'error' | 'first-use';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const variantIcons: Record<EmptyStateVariant, IconName> = {
  default: 'file-document-outline',
  error: 'alert-circle-outline',
  'first-use': 'plus-circle-outline',
};

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
  variant?: EmptyStateVariant;
};

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  variant = 'default',
}: EmptyStateProps) {
  const iconName: IconName = icon ?? variantIcons[variant];

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons color={colors.text.secondary} name={iconName} size={22} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <View style={styles.actionWrap}>
          <SecondaryButton label={actionLabel} onPress={onAction} fullWidth={false} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: colors.background.surfaceContainer,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    textAlign: 'center',
  },
  description: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  actionWrap: {
    marginTop: spacing.sm,
  },
});

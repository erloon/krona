import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/theme';

type ToggleSwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
};

export function ToggleSwitch({
  value,
  onValueChange,
  label,
  description,
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <View style={styles.container}>
      {label ? (
        <View style={styles.copy}>
          <Text style={styles.label}>{label}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
      ) : null}
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
        disabled={disabled}
        onPress={() => onValueChange(!value)}
        style={[
          styles.track,
          value ? styles.trackActive : null,
          disabled ? styles.trackDisabled : null,
        ]}
      >
        <View style={[styles.thumb, value ? styles.thumbActive : null]} />
      </Pressable>
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
  label: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
  },
  description: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  track: {
    width: 34,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: 2,
  },
  trackActive: {
    backgroundColor: colors.brand.primary,
  },
  trackDisabled: {
    opacity: 0.45,
  },
  thumb: {
    width: 16,
    height: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.background.surface,
  },
  thumbActive: {
    transform: [{ translateX: 14 }],
  },
});

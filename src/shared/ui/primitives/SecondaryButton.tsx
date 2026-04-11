import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/theme';

type SecondaryButtonProps = {
  label: string;
  onPress?: ((event: GestureResponderEvent) => void) | undefined;
  disabled?: boolean;
  fullWidth?: boolean;
  leadingAccessory?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SecondaryButton({
  label,
  onPress,
  disabled = false,
  fullWidth = true,
  leadingAccessory,
  style,
}: SecondaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <View style={styles.content}>
        {leadingAccessory ? <View style={styles.accessory}>{leadingAccessory}</View> : null}
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.standard,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.input,
    backgroundColor: colors.background.surface,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    backgroundColor: colors.background.alt,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.9,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  accessory: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.button,
    color: colors.text.primary,
    textAlign: 'center',
  },
});

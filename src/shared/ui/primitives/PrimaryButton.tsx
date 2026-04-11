import React from 'react';
import {
  Pressable,
  PressableStateCallbackType,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/theme';

type PrimaryButtonProps = {
  label: string;
  onPress?: ((event: GestureResponderEvent) => void) | undefined;
  disabled?: boolean;
  fullWidth?: boolean;
  leadingAccessory?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  fullWidth = true,
  leadingAccessory,
  style,
}: PrimaryButtonProps) {
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
    borderRadius: radius.micro,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.brand.primary,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    backgroundColor: colors.brand.primaryActive,
    transform: [{ scale: 0.98 }],
  } satisfies StyleProp<ViewStyle> | PressableStateCallbackType,
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  accessory: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.button,
    color: colors.text.inverse,
    textAlign: 'center',
  },
});

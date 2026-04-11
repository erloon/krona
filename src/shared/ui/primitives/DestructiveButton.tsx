import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/theme';

type DestructiveButtonProps = {
  label: string;
  onPress?: ((event: GestureResponderEvent) => void) | undefined;
  disabled?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  leadingAccessory?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function DestructiveButton({
  label,
  onPress,
  disabled = false,
  fullWidth = true,
  loading = false,
  leadingAccessory,
  style,
}: DestructiveButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.text.inverse} size="small" />
        ) : (
          <>
            {leadingAccessory ? <View style={styles.accessory}>{leadingAccessory}</View> : null}
            <Text style={styles.label}>{label}</Text>
          </>
        )}
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
    backgroundColor: colors.brand.destructive,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    backgroundColor: colors.brand.destructiveActive,
    transform: [{ scale: 0.98 }],
  },
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
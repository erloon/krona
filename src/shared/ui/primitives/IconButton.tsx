import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, radius, spacing } from '@/shared/theme';

type IconButtonProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress?: ((event: GestureResponderEvent) => void) | undefined;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  color?: string;
  size?: number;
  filled?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  color = colors.text.secondary,
  size = 20,
  filled = false,
  disabled = false,
  loading = false,
  style,
}: IconButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        filled ? styles.filled : null,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      <View style={styles.iconWrap}>
        {loading ? (
          <ActivityIndicator color={color} size="small" />
        ) : (
          <MaterialCommunityIcons
            color={disabled ? colors.text.muted : color}
            name={icon}
            size={size}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.standard,
  },
  filled: {
    backgroundColor: colors.background.surfaceContainerLow,
  },
  pressed: {
    backgroundColor: colors.background.surfaceContainerHigh,
    transform: [{ scale: 0.96 }],
  },
  disabled: {
    opacity: 0.5,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
});

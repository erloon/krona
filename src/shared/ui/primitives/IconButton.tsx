import React from 'react';
import {
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
  color?: string;
  size?: number;
  filled?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  color = colors.text.secondary,
  size = 20,
  filled = false,
  disabled = false,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        filled ? styles.filled : null,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons color={disabled ? colors.text.muted : color} name={icon} size={size} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 40,
    height: 40,
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

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

import { colors, radius, shadows } from '@/shared/theme';

type FloatingActionButtonProps = {
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress?: ((event: GestureResponderEvent) => void) | undefined;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function FloatingActionButton({
  icon = 'plus',
  onPress,
  accessibilityLabel,
  style,
}: FloatingActionButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        pressed ? styles.pressed : null,
        style,
      ]}
    >
      <View style={styles.inner}>
        <MaterialCommunityIcons color={colors.text.inverse} name={icon} size={24} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.card,
    backgroundColor: colors.brand.primary,
    ...shadows.soft,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.97 }],
  },
  inner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.card,
    backgroundColor: colors.brand.primary,
  },
});

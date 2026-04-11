import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { SecondaryButton } from '@/shared/ui/primitives/SecondaryButton';

type GoogleSignInButtonProps = {
  onPress?: () => void;
  disabled?: boolean;
};

export function GoogleSignInButton({
  onPress,
  disabled = true,
}: GoogleSignInButtonProps) {
  return (
    <SecondaryButton
      disabled={disabled}
      label="Sign in with Google"
      leadingAccessory={<Text style={styles.googleGlyph}>G</Text>}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  googleGlyph: {
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '700',
    color: '#4285F4',
  },
});

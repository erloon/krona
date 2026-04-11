import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  helperText?: string;
  suffix?: string;
};

export function TextField({ label, helperText, suffix, style, ...props }: TextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputShell}>
        <TextInput
          placeholderTextColor={colors.text.muted}
          style={[styles.input, suffix ? styles.inputWithSuffix : null, style]}
          {...props}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  inputShell: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.whisper,
    borderRadius: radius.paper,
    backgroundColor: colors.background.surface,
    paddingHorizontal: spacing.md,
  },
  input: {
    ...typography.bodySmall,
    flex: 1,
    minHeight: 44,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  inputWithSuffix: {
    paddingRight: spacing.sm,
  },
  suffix: {
    ...typography.bodySmall,
    color: colors.brand.primary,
    fontWeight: '700',
  },
  helper: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});

import React from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/theme';

type TextAreaFieldProps = TextInputProps & {
  label: string;
  helperText?: string;
};

export function TextAreaField({ label, helperText, style, ...props }: TextAreaFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        multiline
        placeholderTextColor={colors.text.muted}
        style={[styles.input, style]}
        textAlignVertical="top"
        {...props}
      />
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
  input: {
    ...typography.bodySmall,
    minHeight: 84,
    borderWidth: 1,
    borderColor: colors.border.whisper,
    borderRadius: radius.paper,
    backgroundColor: colors.background.surface,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  helper: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});

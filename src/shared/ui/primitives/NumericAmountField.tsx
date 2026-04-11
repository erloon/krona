import React from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/theme';

type NumericAmountFieldProps = TextInputProps & {
  label: string;
  suffix: string;
};

export function NumericAmountField({
  label,
  style,
  suffix,
  ...props
}: NumericAmountFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputShell}>
        <TextInput
          keyboardType="decimal-pad"
          placeholderTextColor={colors.text.muted}
          style={[styles.input, style]}
          {...props}
        />
        <Text style={styles.suffix}>{suffix}</Text>
      </View>
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
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.whisper,
    borderRadius: radius.card,
    backgroundColor: colors.background.surface,
    paddingHorizontal: spacing.lg,
  },
  input: {
    ...typography.metricValue,
    flex: 1,
    color: colors.text.primary,
    paddingVertical: spacing.md,
  },
  suffix: {
    ...typography.metricValueCompact,
    color: colors.text.secondary,
    opacity: 0.65,
  },
});

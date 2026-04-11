import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/theme';

export type ChipSelectorOption<T extends string> = {
  label: string;
  value: T;
};

type ChipSelectorProps<T extends string> = {
  label: string;
  options: ChipSelectorOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
};

export function ChipSelector<T extends string>({
  label,
  options,
  value,
  onValueChange,
}: ChipSelectorProps<T>) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              key={option.value}
              onPress={() => onValueChange(option.value)}
              style={({ pressed }) => [
                styles.chip,
                selected ? styles.chipSelected : null,
                pressed ? styles.chipPressed : null,
              ]}
            >
              <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: 40,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.whisper,
    borderRadius: radius.standard,
    backgroundColor: colors.background.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  chipSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primary,
  },
  chipPressed: {
    opacity: 0.92,
  },
  chipLabel: {
    ...typography.button,
    color: colors.text.primary,
  },
  chipLabelSelected: {
    color: colors.text.inverse,
  },
});

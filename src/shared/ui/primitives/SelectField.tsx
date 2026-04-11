import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '@/shared/theme';

export type SelectOption<TValue extends string> = {
  label: string;
  value: TValue;
  description?: string;
};

type SelectFieldProps<TValue extends string> = {
  label: string;
  value: TValue;
  options: SelectOption<TValue>[];
  onValueChange: (value: TValue) => void;
};

export function SelectField<TValue extends string>({
  label,
  value,
  options,
  onValueChange,
}: SelectFieldProps<TValue>) {
  const [visible, setVisible] = useState(false);
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value]
  );

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <Pressable onPress={() => setVisible(true)} style={styles.trigger}>
          <Text style={styles.value}>{selectedOption?.label}</Text>
          <MaterialCommunityIcons
            color={colors.text.secondary}
            name="chevron-down"
            size={20}
          />
        </Pressable>
      </View>

      <Modal animationType="fade" transparent visible={visible}>
        <Pressable onPress={() => setVisible(false)} style={styles.backdrop}>
          <Pressable style={styles.sheet}>
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onValueChange(option.value);
                    setVisible(false);
                  }}
                  style={[styles.option, isSelected ? styles.optionSelected : null]}
                >
                  <View style={styles.optionCopy}>
                    <Text style={[styles.optionLabel, isSelected ? styles.optionLabelSelected : null]}>
                      {option.label}
                    </Text>
                    {option.description ? (
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    ) : null}
                  </View>
                  {isSelected ? (
                    <MaterialCommunityIcons
                      color={colors.brand.primary}
                      name="check-circle"
                      size={18}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  trigger: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.whisper,
    borderRadius: radius.paper,
    backgroundColor: colors.background.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  value: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.text.primary,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
  },
  sheet: {
    borderRadius: radius.card,
    backgroundColor: colors.background.surface,
    padding: spacing.md,
    gap: spacing.xs,
  },
  option: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: radius.paper,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  optionSelected: {
    backgroundColor: colors.background.badge,
  },
  optionCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  optionLabel: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
  },
  optionLabelSelected: {
    color: colors.brand.primary,
  },
  optionDescription: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});

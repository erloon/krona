import React from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { TextField } from '@/shared/ui/primitives/TextField';
import { ToggleSwitch } from '@/shared/ui/primitives/ToggleSwitch';

type ReliefToggleRowProps = {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  nestedLabel?: string;
  nestedValue?: string;
  nestedSuffix?: string;
  onNestedChange?: (value: string) => void;
  disabled?: boolean;
};

export function ReliefToggleRow({
  label,
  description,
  value,
  onValueChange,
  nestedLabel,
  nestedValue,
  nestedSuffix,
  onNestedChange,
  disabled = false,
}: ReliefToggleRowProps) {
  return (
    <View style={styles.container}>
      <ToggleSwitch
        description={description}
        disabled={disabled}
        label={label}
        onValueChange={onValueChange}
        value={value}
      />
      {value && nestedLabel && onNestedChange ? (
        <View style={styles.nested}>
          <TextField
            keyboardType="numeric"
            label={nestedLabel}
            onChangeText={onNestedChange}
            suffix={nestedSuffix}
            value={nestedValue}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  nested: {
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(0, 117, 222, 0.16)',
  },
});

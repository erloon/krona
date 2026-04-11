import React from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '@/shared/theme';

type SearchFieldProps = Omit<TextInputProps, 'style'>;

export function SearchField(props: SearchFieldProps) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        color={colors.text.muted}
        name="magnify"
        size={20}
        style={styles.icon}
      />
      <TextInput
        placeholderTextColor={colors.text.muted}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(26, 28, 28, 0.08)',
    borderRadius: radius.paper,
    backgroundColor: colors.background.surface,
    paddingHorizontal: spacing.md,
  },
  icon: {
    marginTop: 1,
  },
  input: {
    ...typography.bodySmall,
    flex: 1,
    minHeight: 48,
    color: colors.text.primary,
  },
});

import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '@/shared/theme';

type ValidationWarningProps = {
  message: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Displays a single validation warning message with a warning icon.
 * Used in income forms and income list cards to show business rule warnings.
 */
export function ValidationWarning({ message, style }: ValidationWarningProps) {
  return (
    <View style={[styles.container, style]}>
      <MaterialCommunityIcons
        color={colors.feedback.warning}
        name="alert-circle-outline"
        size={16}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

type ValidationWarningsListProps = {
  warnings: readonly string[];
  style?: StyleProp<ViewStyle>;
};

/**
 * Displays a list of validation warning messages.
 */
export function ValidationWarningsList({ warnings, style }: ValidationWarningsListProps) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <View style={[styles.listContainer, style]}>
      {warnings.map((warning, index) => (
        <ValidationWarning key={index} message={warning} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.paper,
    backgroundColor: colors.feedback.warningBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  message: {
    ...typography.caption,
    flex: 1,
    color: colors.feedback.warning,
  },
  listContainer: {
    gap: spacing.sm,
  },
});
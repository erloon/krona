import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '@/shared/theme';

type BlankTabScreenProps = {
  title: string;
  description?: string;
};

export function BlankTabScreen({
  title,
  description = 'This screen is scaffolded and intentionally left empty for now.',
}: BlankTabScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.page,
    backgroundColor: colors.background.page,
  },
  title: {
    ...typography.screenTitle,
    color: colors.text.primary,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    marginTop: spacing.md,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 320,
  },
});

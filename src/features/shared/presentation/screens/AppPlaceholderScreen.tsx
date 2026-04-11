import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, spacing, typography } from '@/shared/theme';
import { SurfaceCard } from '@/shared/ui/primitives/SurfaceCard';

export function AppPlaceholderScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <SurfaceCard style={styles.card}>
          <Text style={styles.title}>Authenticated app shell</Text>
          <Text style={styles.body}>
            This route group is scaffolded for the future post-login experience.
          </Text>
        </SurfaceCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.alt,
  },
  screen: {
    flex: 1,
    paddingHorizontal: spacing.page,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: layout.authNarrowWidth,
  },
  title: {
    ...typography.screenTitle,
    color: colors.text.primary,
  },
  body: {
    ...typography.body,
    marginTop: spacing.md,
    color: colors.text.secondary,
  },
});

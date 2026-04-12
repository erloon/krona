import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { colors, radius, spacing, typography } from '@/shared/theme';
import { ScreenContainer } from '@/shared/ui/layout/ScreenContainer';
import { AppTopBar } from '@/shared/ui/primitives/AppTopBar';
import { IconButton } from '@/shared/ui/primitives/IconButton';
import { PrimaryButton } from '@/shared/ui/primitives/PrimaryButton';
import { SecondaryButton } from '@/shared/ui/primitives/SecondaryButton';

export function AddCostScreen() {
  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <AppTopBar
        leadingContent={
          <IconButton accessibilityLabel="Wróć" icon="arrow-left" onPress={() => router.back()} />
        }
        title="Dodaj koszt"
      />

      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons color={colors.brand.primary} name="receipt-text-edit-outline" size={28} />
        </View>
        <Text style={styles.title}>Formularz dodawania kosztu będzie dopięty w następnym kroku</Text>
        <Text style={styles.description}>
          Nawigacja z ekranu kosztów jest już gotowa. W tym kroku zachowujemy tylko kontrakt trasy
          dla `SPA-40`, bez pełnej implementacji formularza tworzenia.
        </Text>
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Docelowy zakres</Text>
        <Text style={styles.noteText}>Kwota, waluta, VAT, kategoria, opis i załącznik.</Text>
        <Text style={styles.noteText}>
          Rekord będzie zapisywany do aktywnego okresu raportowego razem ze snapshotem miesiąca.
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton label="Wróć do listy kosztów" onPress={() => router.back()} />
        <SecondaryButton label="Zamknij makietę" onPress={() => router.back()} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    gap: spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.card,
    backgroundColor: colors.background.surfaceContainerLow,
  },
  title: {
    ...typography.screenTitle,
    color: colors.text.primary,
  },
  description: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  noteCard: {
    gap: spacing.sm,
    borderRadius: radius.card,
    backgroundColor: colors.background.surfaceContainerLow,
    padding: spacing.lg,
  },
  noteTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '700',
  },
  noteText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  actions: {
    gap: spacing.md,
  },
});

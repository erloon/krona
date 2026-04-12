import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { COST_VAT_RATES } from '@/features/calculator/domain/entities/cost';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { ChipSelector } from '@/shared/ui/primitives/ChipSelector';
import { PrimaryButton } from '@/shared/ui/primitives/PrimaryButton';
import { SecondaryButton } from '@/shared/ui/primitives/SecondaryButton';

import type { CostListFilters } from '../view-models/costListQuery';

type CostFiltersModalProps = {
  visible: boolean;
  draftFilters: CostListFilters;
  onDraftFiltersChange: (filters: CostListFilters) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
};

export function CostFiltersModal({
  visible,
  draftFilters,
  onDraftFiltersChange,
  onApply,
  onClear,
  onClose,
}: CostFiltersModalProps) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Filtry listy</Text>
            <Text style={styles.description}>
              Zawęź widok kosztów w obrębie wybranego okresu raportowego.
            </Text>
          </View>

          <ChipSelector
            label="Kategoria"
            onValueChange={(category) => onDraftFiltersChange({ ...draftFilters, category })}
            options={[
              { label: 'Wszystkie', value: 'ALL' },
              { label: 'Standard', value: 'STANDARD' },
              { label: 'Auto mieszane', value: 'CAR_MIXED' },
              { label: 'Auto firmowe', value: 'CAR_BUSINESS' },
            ]}
            value={draftFilters.category}
          />

          <ChipSelector
            label="Stawka VAT"
            onValueChange={(vatRate) => onDraftFiltersChange({ ...draftFilters, vatRate })}
            options={[
              { label: 'Wszystkie', value: 'ALL' },
              ...COST_VAT_RATES.map((vatRate) => ({
                label: vatRate === 'ZW' ? 'VAT ZW' : `VAT ${vatRate}%`,
                value: vatRate,
              })),
            ]}
            value={draftFilters.vatRate}
          />

          <View style={styles.actions}>
            <SecondaryButton label="Wyczyść" onPress={onClear} />
            <PrimaryButton label="Zastosuj" onPress={onApply} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(26, 28, 28, 0.18)',
  },
  sheet: {
    gap: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.background.surface,
    padding: spacing.xl,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    ...typography.screenTitle,
    color: colors.text.primary,
  },
  description: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  actions: {
    gap: spacing.md,
  },
});

import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { INCOME_CURRENCIES } from '@/features/calculator/domain/value-objects/IncomeCurrency';
import { INCOME_VAT_RATES } from '@/features/calculator/domain/value-objects/IncomeVatRate';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { ChipSelector } from '@/shared/ui/primitives/ChipSelector';
import { PrimaryButton } from '@/shared/ui/primitives/PrimaryButton';
import { SecondaryButton } from '@/shared/ui/primitives/SecondaryButton';

import type { IncomeListFilters } from '../view-models/incomeListQuery';

type IncomeFiltersModalProps = {
  visible: boolean;
  draftFilters: IncomeListFilters;
  onDraftFiltersChange: (filters: IncomeListFilters) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
};

type FilterChoice<T extends string> = T | 'ALL';

export function IncomeFiltersModal({
  visible,
  draftFilters,
  onDraftFiltersChange,
  onApply,
  onClear,
  onClose,
}: IncomeFiltersModalProps) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Filtry listy</Text>
            <Text style={styles.description}>
              Zawęź widok w obrębie wybranego okresu raportowego.
            </Text>
          </View>

          <ChipSelector
            label="Stawka VAT"
            onValueChange={(vatRate) => onDraftFiltersChange({ ...draftFilters, vatRate })}
            options={buildVatOptions()}
            value={draftFilters.vatRate}
          />

          <ChipSelector
            label="Waluta"
            onValueChange={(currency) => onDraftFiltersChange({ ...draftFilters, currency })}
            options={buildFilterOptions(INCOME_CURRENCIES)}
            value={draftFilters.currency}
          />

          <ChipSelector
            label="Typ rozliczenia"
            onValueChange={(billingType) => onDraftFiltersChange({ ...draftFilters, billingType })}
            options={[
              { label: 'Wszystkie', value: 'ALL' },
              { label: 'Miesięcznie', value: 'MONTHLY' },
              { label: 'Dziennie', value: 'DAILY' },
              { label: 'Godzinowo', value: 'HOURLY' },
            ]}
            value={draftFilters.billingType}
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

function buildFilterOptions<T extends string>(
  values: readonly T[]
): { label: string; value: FilterChoice<T> }[] {
  return [{ label: 'Wszystkie', value: 'ALL' }, ...values.map((value) => ({ label: value, value }))];
}

function buildVatOptions() {
  return [
    { label: 'Wszystkie', value: 'ALL' },
    ...INCOME_VAT_RATES.map((vatRate) => ({
      label: vatRate === 'NP' ? 'VAT NP' : `VAT ${vatRate}%`,
      value: vatRate,
    })),
  ] as { label: string; value: IncomeListFilters['vatRate'] }[];
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

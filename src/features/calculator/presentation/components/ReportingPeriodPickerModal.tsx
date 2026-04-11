import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  createMonthlyReportingPeriod,
  type MonthlyReportingPeriod,
} from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { ChipSelector } from '@/shared/ui/primitives/ChipSelector';
import { PrimaryButton } from '@/shared/ui/primitives/PrimaryButton';
import { SecondaryButton } from '@/shared/ui/primitives/SecondaryButton';
import { TextField } from '@/shared/ui/primitives/TextField';

type ReportingPeriodPickerModalProps = {
  visible: boolean;
  selectedPeriod: MonthlyReportingPeriod;
  draftYear: string;
  draftMonth: string;
  onDraftYearChange: (value: string) => void;
  onDraftMonthChange: (value: string) => void;
  onApply: () => void;
  onClose: () => void;
};

const monthOptions = Array.from({ length: 12 }, (_, index) => {
  const month = index + 1;
  const date = new Date(Date.UTC(2026, index, 1));

  return {
    label: new Intl.DateTimeFormat('pl-PL', { month: 'short', timeZone: 'UTC' }).format(date),
    value: String(month),
  };
});

export function ReportingPeriodPickerModal({
  visible,
  selectedPeriod,
  draftYear,
  draftMonth,
  onDraftYearChange,
  onDraftMonthChange,
  onApply,
  onClose,
}: ReportingPeriodPickerModalProps) {
  const helperText = resolveHelperText(draftYear, draftMonth, selectedPeriod);

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Wybierz okres</Text>
            <Text style={styles.description}>
              Zmiana miesiąca przełącza zapisany okres raportowy, razem ze snapshotem ustawień.
            </Text>
          </View>

          <TextField
            keyboardType="number-pad"
            label="Rok"
            maxLength={4}
            onChangeText={(value) => onDraftYearChange(value.replace(/\D/g, '').slice(0, 4))}
            placeholder="2026"
            value={draftYear}
          />

          <ChipSelector
            label="Miesiąc"
            onValueChange={onDraftMonthChange}
            options={monthOptions}
            value={draftMonth}
          />

          <Text style={styles.helperText}>{helperText}</Text>

          <View style={styles.actions}>
            <SecondaryButton label="Anuluj" onPress={onClose} />
            <PrimaryButton label="Przejdź do okresu" onPress={onApply} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function resolveHelperText(
  draftYear: string,
  draftMonth: string,
  selectedPeriod: MonthlyReportingPeriod
): string {
  if (!/^\d{4}$/.test(draftYear)) {
    return 'Podaj rok w formacie RRRR.';
  }

  const month = Number(draftMonth);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return 'Wybierz miesiąc od 1 do 12.';
  }

  const nextPeriod = createMonthlyReportingPeriod(Number(draftYear), month);

  if (nextPeriod.key === selectedPeriod.key) {
    return 'To jest aktualnie otwarty okres raportowy.';
  }

  return `Po zatwierdzeniu otworzy się okres ${nextPeriod.key}.`;
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
  helperText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  actions: {
    gap: spacing.md,
  },
});

import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  INCOME_CURRENCIES,
  INCOME_VAT_RATES,
  type Income,
  type IncomeCurrency,
  type IncomeVatRate,
} from '@/features/calculator/domain/entities/income';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { PrimaryButton } from '@/shared/ui/primitives/PrimaryButton';
import { SecondaryButton } from '@/shared/ui/primitives/SecondaryButton';
import { SelectField, type SelectOption } from '@/shared/ui/primitives/SelectField';
import { TextAreaField } from '@/shared/ui/primitives/TextAreaField';
import { TextField } from '@/shared/ui/primitives/TextField';

export type IncomeEditorValues = {
  label: string;
  description: string;
  netAmount: string;
  currency: IncomeCurrency;
  vatRate: IncomeVatRate;
};

type IncomeEditorModalProps = {
  visible: boolean;
  mode: 'create' | 'edit';
  initialValues: IncomeEditorValues;
  onClose: () => void;
  onSubmit: (values: IncomeEditorValues) => Promise<void> | void;
  isSubmitting?: boolean;
};

const currencyOptions: SelectOption<IncomeCurrency>[] = INCOME_CURRENCIES.map((currency) => ({
  label: currency,
  value: currency,
}));

const vatRateOptions: SelectOption<IncomeVatRate>[] = INCOME_VAT_RATES.map((vatRate) => ({
  label: vatRate === 'NP' ? 'NP' : `${vatRate}%`,
  value: vatRate,
  description: vatRate === 'NP' ? 'Nie podlega VAT' : undefined,
}));

export function IncomeEditorModal({
  visible,
  mode,
  initialValues,
  onClose,
  onSubmit,
  isSubmitting = false,
}: IncomeEditorModalProps) {
  const [values, setValues] = useState<IncomeEditorValues>(initialValues);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setValues(initialValues);
      setValidationMessage(null);
    }
  }, [initialValues, visible]);

  const title = useMemo(
    () => (mode === 'create' ? 'Dodaj przychód' : 'Edytuj przychód'),
    [mode]
  );

  async function handleSubmit() {
    const parsedAmount = Number(values.netAmount.replace(',', '.'));

    if (!values.label.trim()) {
      setValidationMessage('Nazwa przychodu jest wymagana.');
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setValidationMessage('Kwota netto musi być większa od zera.');
      return;
    }

    setValidationMessage(null);

    await onSubmit({
      ...values,
      label: values.label.trim(),
      description: values.description.trim(),
      netAmount: parsedAmount.toFixed(2),
    });
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        style={styles.overlay}
      >
        <Pressable onPress={onClose} style={styles.backdrop} />

        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>
              Rekord zapisuje się w aktywnym okresie raportowym i odświeża miesięczny snapshot.
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <TextField
              autoCapitalize="sentences"
              label="Nazwa"
              onChangeText={(label) => setValues((current) => ({ ...current, label }))}
              placeholder="Np. Kontrakt główny"
              value={values.label}
            />

            <TextField
              keyboardType="decimal-pad"
              label="Kwota netto"
              onChangeText={(netAmount) => setValues((current) => ({ ...current, netAmount }))}
              placeholder="0.00"
              suffix="PLN"
              value={values.netAmount}
            />

            <SelectField
              label="Waluta"
              onValueChange={(currency) => setValues((current) => ({ ...current, currency }))}
              options={currencyOptions}
              value={values.currency}
            />

            <SelectField
              label="Stawka VAT"
              onValueChange={(vatRate) => setValues((current) => ({ ...current, vatRate }))}
              options={vatRateOptions}
              value={values.vatRate}
            />

            <TextAreaField
              autoCapitalize="sentences"
              label="Opis"
              onChangeText={(description) =>
                setValues((current) => ({ ...current, description }))
              }
              placeholder="Np. Faktura 04/2026"
              value={values.description}
            />

            {validationMessage ? <Text style={styles.validation}>{validationMessage}</Text> : null}
          </ScrollView>

          <View style={styles.actions}>
            <SecondaryButton disabled={isSubmitting} label="ANULUJ" onPress={onClose} />
            <PrimaryButton
              disabled={isSubmitting}
              label={isSubmitting ? 'ZAPISYWANIE...' : 'ZAPISZ'}
              onPress={() => {
                void handleSubmit();
              }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function incomeToEditorValues(income: Income): IncomeEditorValues {
  return {
    label: income.label,
    description: income.description,
    netAmount: income.netAmount.toFixed(2),
    currency: income.currency,
    vatRate: income.vatRate,
  };
}

export function createEmptyIncomeEditorValues(): IncomeEditorValues {
  return {
    label: '',
    description: '',
    netAmount: '',
    currency: 'PLN',
    vatRate: '23',
  };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(12, 14, 14, 0.16)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: radius.featured,
    borderTopRightRadius: radius.featured,
    backgroundColor: colors.background.page,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  form: {
    gap: spacing.lg,
    paddingBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  validation: {
    ...typography.caption,
    color: '#b3261e',
  },
});

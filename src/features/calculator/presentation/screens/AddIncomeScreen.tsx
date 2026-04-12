import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  type IncomeCurrency,
  type IncomeVatRate,
} from '@/features/calculator/domain/entities/income';
import {
  validateIncomeInputBusinessRules,
} from '@/features/calculator/domain/services/validateIncomeBusinessRules';
import { useCalculatorData } from '@/features/calculator/presentation/hooks/useManagedCalculatorData';
import { colors, spacing, typography } from '@/shared/theme';
import { ScreenContainer } from '@/shared/ui/layout/ScreenContainer';
import { AppTopBar } from '@/shared/ui/primitives/AppTopBar';
import {
  ChipSelector,
  type ChipSelectorOption,
} from '@/shared/ui/primitives/ChipSelector';
import { IconButton } from '@/shared/ui/primitives/IconButton';
import { NumericAmountField } from '@/shared/ui/primitives/NumericAmountField';
import { PrimaryButton } from '@/shared/ui/primitives/PrimaryButton';
import { TextAreaField } from '@/shared/ui/primitives/TextAreaField';
import { TextField } from '@/shared/ui/primitives/TextField';
import { ValidationWarningsList } from '@/shared/ui/primitives/ValidationWarning';

import { AmountSummaryPanel } from '../components/AmountSummaryPanel';
import { SettlementTypeSelector } from '../components/SettlementTypeSelector';
import { WorkParametersSection } from '../components/WorkParametersSection';
import { formatCurrencyAmount } from '../view-models/calculatorViewModels';
import {
  applyIncomeFormCurrency,
  buildIncomeEditorInput,
  buildIncomeSummary,
  buildIncomeValidationInput,
  createDefaultIncomeFormState,
  isIncomeFormForeignCurrency,
  normalizeDecimalInput,
  normalizeIntegerInput,
  type IncomeFormState,
} from '../view-models/incomeFormState';

const currencyOptions: ChipSelectorOption<IncomeCurrency>[] = [
  { label: 'PLN', value: 'PLN' },
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'GBP', value: 'GBP' },
  { label: 'CHF', value: 'CHF' },
];

const vatOptions: ChipSelectorOption<IncomeVatRate>[] = [
  { label: 'NP', value: 'NP' },
  { label: '0%', value: '0' },
  { label: '5%', value: '5' },
  { label: '8%', value: '8' },
  { label: '23%', value: '23' },
];

export function AddIncomeScreen() {
  const { createIncome } = useCalculatorData();
  const [form, setForm] = React.useState<IncomeFormState>(() => createDefaultIncomeFormState());
  const [validationMessage, setValidationMessage] = React.useState<string | null>(null);
  const [validationWarnings, setValidationWarnings] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const summary = React.useMemo(() => buildIncomeSummary(form), [form]);
  const isForeignCurrency = React.useMemo(() => isIncomeFormForeignCurrency(form), [form]);

  function updateForm<Key extends keyof IncomeFormState>(key: Key, value: IncomeFormState[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
      label:
        key === 'clientName' && !current.label.trim()
          ? String(value)
          : key === 'label'
            ? String(value)
            : current.label,
    }));
  }

  async function handleSave() {
    const validationInput = buildIncomeValidationInput(form);
    const validationResult = validateIncomeInputBusinessRules(validationInput);

    if (!validationResult.isValid) {
      setValidationMessage(validationResult.errors[0]?.message ?? 'Nieprawidłowe dane.');
      setValidationWarnings([]);
      return;
    }

    setValidationMessage(null);
    setValidationWarnings(validationResult.warnings.map((w) => w.message));

    const input = buildIncomeEditorInput(form);

    setIsSubmitting(true);

    try {
      await createIncome(input);
      router.back();
    } catch (saveError) {
      Alert.alert(
        'Nie udało się zapisać przychodu',
        saveError instanceof Error ? saveError.message : 'Spróbuj ponownie.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <AppTopBar
        leadingContent={
          <IconButton
            accessibilityLabel="Wróć"
            icon="arrow-left"
            onPress={() => router.back()}
          />
        }
        title="Dodaj przychód"
      />

      <AmountSummaryPanel
        currency={form.currency}
        grossAmount={formatCurrencyAmount(summary.grossAmount)}
        netAmount={formatCurrencyAmount(summary.netAmount)}
        vatAmount={formatCurrencyAmount(summary.vatAmount)}
        vatLabel={summary.vatLabel}
      />

      <NumericAmountField
        label="KWOTA NETTO (EDYTUJ)"
        onChangeText={(value) => updateForm('baseAmount', normalizeDecimalInput(value))}
        placeholder="0,00"
        suffix={form.currency}
        value={form.baseAmount}
      />

      <ChipSelector
        label="WALUTA"
        onValueChange={(value) => setForm((current) => applyIncomeFormCurrency(current, value))}
        options={currencyOptions}
        value={form.currency}
      />

      {isForeignCurrency ? (
        <Text style={styles.fxHint}>
          Kurs waluty jest zapisany jako stan roboczy: {form.exchangeRateSource} ·{' '}
          {form.exchangeRateEffectiveDate}. Właściwy workflow FX zostanie dopięty w kolejnym kroku.
        </Text>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>TYP ROZLICZENIA</Text>
        <SettlementTypeSelector
          onValueChange={(value) => updateForm('billingType', value)}
          value={form.billingType}
        />
      </View>

      {form.billingType !== 'MONTHLY' ? (
        <WorkParametersSection
          daysPerMonth={form.workingDaysPerMonth}
          hoursPerDay={form.workingHoursPerDay}
          onDaysPerMonthChange={(value) =>
            updateForm('workingDaysPerMonth', normalizeIntegerInput(value))
          }
          onHoursPerDayChange={(value) =>
            updateForm('workingHoursPerDay', normalizeIntegerInput(value))
          }
          showHoursPerDay={form.billingType === 'HOURLY'}
        />
      ) : null}

      <ChipSelector
        label="STAWKA VAT"
        onValueChange={(value) => updateForm('vatRate', value)}
        options={vatOptions}
        value={form.vatRate}
      />

      <View style={styles.section}>
        <TextField
          autoCapitalize="words"
          label="KLIENT"
          onChangeText={(value) => updateForm('clientName', value)}
          placeholder="Np. Acme Corp"
          value={form.clientName}
        />
        <TextField
          autoCapitalize="characters"
          label="NUMER"
          onChangeText={(value) => updateForm('invoiceNumber', value)}
          placeholder="Np. FV/2026/04"
          value={form.invoiceNumber}
        />
        <TextAreaField
          autoCapitalize="sentences"
          label="OPIS"
          onChangeText={(value) => updateForm('description', value)}
          placeholder="Dodatkowe informacje..."
          value={form.description}
        />
      </View>

      {validationMessage ? <Text style={styles.validation}>{validationMessage}</Text> : null}

      {validationWarnings.length > 0 ? (
        <ValidationWarningsList warnings={validationWarnings} />
      ) : null}

      <PrimaryButton
        disabled={isSubmitting}
        label={isSubmitting ? 'ZAPISYWANIE...' : 'ZAPISZ PRZYCHÓD'}
        leadingAccessory={
          <MaterialCommunityIcons color={colors.text.inverse} name="check-circle-outline" size={20} />
        }
        onPress={() => {
          void handleSave();
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  section: {
    gap: spacing.md,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  fxHint: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  validation: {
    ...typography.caption,
    color: '#b3261e',
  },
});

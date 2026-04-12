import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import {
  type IncomeBillingType,
  type IncomeCurrency,
  type IncomeVatRate,
  type Income,
} from '@/features/calculator/domain/entities/income';
import type { IncomeEditorInput } from '@/features/calculator/application/use-cases/incomeCommands';
import {
  validateIncomeInputBusinessRules,
  type IncomeValidationInput,
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
import { EmptyState } from '@/shared/ui/primitives/EmptyState';
import { LoadingIndicator } from '@/shared/ui/primitives/LoadingIndicator';
import { ValidationWarningsList } from '@/shared/ui/primitives/ValidationWarning';

import { AmountSummaryPanel } from '../components/AmountSummaryPanel';
import { SettlementTypeSelector } from '../components/SettlementTypeSelector';
import { WorkParametersSection } from '../components/WorkParametersSection';
import { formatCurrencyAmount } from '../view-models/calculatorViewModels';

type EditIncomeFormState = {
  label: string;
  description: string;
  baseAmount: string;
  billingType: IncomeBillingType;
  currency: IncomeCurrency;
  vatRate: IncomeVatRate;
  clientName: string;
  invoiceNumber: string;
  workingDaysPerMonth: string;
  workingHoursPerDay: string;
};

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

export function EditIncomeScreen() {
  const { bundle, hasLoadedSelectedPeriod, updateIncome } = useCalculatorData();
  const { id: incomeId } = useLocalSearchParams<{ id?: string }>();
  
  const [form, setForm] = React.useState<EditIncomeFormState | null>(null);
  const [validationMessage, setValidationMessage] = React.useState<string | null>(null);
  const [validationWarnings, setValidationWarnings] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Find the income entity by ID - must be computed before any early returns
  const incomeEntity = bundle?.incomes.find(income => income.id === incomeId) || null;

  // Load income data when bundle and incomeId are available
  React.useEffect(() => {
    if (!hasLoadedSelectedPeriod || !bundle || !incomeId) return;
    
    const income = bundle.incomes.find(income => income.id === incomeId);
    if (!income) return;
    
    setForm(incomeToEditorValues(income));
  }, [bundle, hasLoadedSelectedPeriod, incomeId]);

  // Compute summary - must be called before any early returns (hook order rule)
  // Returns null when form is null, used after early return guards
  const summary = React.useMemo(() => form ? buildIncomeSummary(form) : null, [form]);

  // Don't render if still loading
  if (!hasLoadedSelectedPeriod) {
    return <LoadingIndicator label="Ładowanie przychodu..." />;
  }

  // Return empty state if incomeId is missing or income not found
  if (!incomeId || !incomeEntity) {
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
          title="Edytuj przychód"
        />
        <EmptyState 
          title="Nie znaleziono przychodu" 
          description="Wybrany przychód nie istnieje w bieżącym okresie." 
        />
        <PrimaryButton
          label="WRÓĆ DO LISTY"
          onPress={() => router.back()}
        />
      </ScreenContainer>
    );
  }

  if (!form) {
    return <LoadingIndicator label="Trwa ładowanie danych..." />;
  }

  // After early returns, form is guaranteed non-null, so summary is also non-null

  function updateForm<Key extends keyof EditIncomeFormState>(key: Key, value: EditIncomeFormState[Key]) {
    setForm((current) => {
      if (!current) return null;
      
      return {
        ...current,
        [key]: value,
        label:
          key === 'clientName' && !current.label.trim()
            ? String(value)
            : key === 'label'
              ? String(value)
              : current.label,
      };
    });
  }

  async function handleSave() {
    if (!form) return;

    const validationInput = buildValidationInput(form);
    const validationResult = validateIncomeInputBusinessRules(validationInput);

    if (!validationResult.isValid) {
      setValidationMessage(validationResult.errors[0]?.message ?? 'Nieprawidłowe dane.');
      setValidationWarnings([]);
      return;
    }

    setValidationMessage(null);
    setValidationWarnings(validationResult.warnings.map((w) => w.message));

    if (!incomeId) {
      Alert.alert('Brak identyfikatora', 'Nie można zaktualizować przychodu bez identyfikatora.');
      return;
    }

    const input = buildIncomeEditorInput(form);

    setIsSubmitting(true);

    try {
      await updateIncome(incomeId, input);
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
        title="Edytuj przychód"
      />

      <AmountSummaryPanel
        currency={form.currency}
        grossAmount={formatCurrencyAmount(summary!.grossAmount)}
        netAmount={formatCurrencyAmount(summary!.netAmount)}
        vatAmount={formatCurrencyAmount(summary!.vatAmount)}
        vatLabel={summary!.vatLabel}
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
        onValueChange={(value) => updateForm('currency', value)}
        options={currencyOptions}
        value={form.currency}
      />

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

// Inline copy of incomeToEditorValues function from IncomeEditorModal
function incomeToEditorValues(income: Income): EditIncomeFormState {
  return {
    label: income.label,
    description: income.description,
    baseAmount: income.baseAmount.toFixed(2),
    billingType: income.billingType,
    currency: income.currency,
    vatRate: income.vatRate,
    clientName: income.clientName,
    invoiceNumber: income.invoiceNumber,
    workingDaysPerMonth: String(income.workParameters.workingDaysPerMonth),
    workingHoursPerDay: String(income.workParameters.workingHoursPerDay),
  };
}

function buildIncomeSummary(form: EditIncomeFormState) {
  const baseAmount = parseDecimalInput(form.baseAmount);
  const daysPerMonth = parseIntegerInput(form.workingDaysPerMonth);
  const hoursPerDay = parseIntegerInput(form.workingHoursPerDay);

  let netAmount = baseAmount;

  if (form.billingType === 'DAILY') {
    netAmount = baseAmount * daysPerMonth;
  }

  if (form.billingType === 'HOURLY') {
    netAmount = baseAmount * daysPerMonth * hoursPerDay;
  }

  const vatMultiplier = form.vatRate === 'NP' ? 0 : Number(form.vatRate) / 100;
  const vatAmount = netAmount * vatMultiplier;

  return {
    netAmount,
    vatAmount,
    grossAmount: netAmount + vatAmount,
    vatLabel: form.vatRate === 'NP' ? 'VAT (NP)' : `VAT (${form.vatRate}%)`,
  };
}

function buildValidationInput(form: EditIncomeFormState): IncomeValidationInput {
  const baseAmount = parseDecimalInput(form.baseAmount);
  const workingDaysPerMonth = parseIntegerInput(form.workingDaysPerMonth);
  const workingHoursPerDay = parseIntegerInput(form.workingHoursPerDay);

  return {
    baseAmount,
    billingType: form.billingType,
    currency: form.currency,
    vatRate: form.vatRate,
    workingDaysPerMonth,
    workingHoursPerDay,
    exchangeRate: 1, // Default for PLN, will be set by domain if foreign currency
    exchangeRateEffectiveDate: new Date().toISOString().slice(0, 10),
    ipBoxQualifiedIncomePercent: null,
    lumpSumRate: null,
  };
}

function buildIncomeEditorInput(form: EditIncomeFormState): IncomeEditorInput {
  const baseAmount = parseDecimalInput(form.baseAmount);
  const workingDaysPerMonth = parseIntegerInput(form.workingDaysPerMonth);
  const workingHoursPerDay = parseIntegerInput(form.workingHoursPerDay);

  return {
    label: form.label.trim() || form.clientName.trim() || 'Nowe źródło przychodu',
    description: form.description,
    baseAmount,
    billingType: form.billingType,
    currency: form.currency,
    vatRate: form.vatRate,
    clientName: form.clientName,
    invoiceNumber: form.invoiceNumber,
    workParameters: {
      workingDaysPerMonth,
      workingHoursPerDay,
    },
  };
}

function normalizeDecimalInput(value: string) {
  return value.replace(/[^0-9.,]/g, '').replace(',', '.');
}

function normalizeIntegerInput(value: string) {
  return value.replace(/\D/g, '');
}

function parseDecimalInput(value: string) {
  return Number(value.replace(',', '.'));
}

function parseIntegerInput(value: string) {
  return Number(value);
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
  validation: {
    ...typography.caption,
    color: '#b3261e',
  },
});
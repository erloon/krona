import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

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
import { EmptyState } from '@/shared/ui/primitives/EmptyState';
import { LoadingIndicator } from '@/shared/ui/primitives/LoadingIndicator';
import { ValidationWarningsList } from '@/shared/ui/primitives/ValidationWarning';

import { AmountSummaryPanel } from '../components/AmountSummaryPanel';
import { SettlementTypeSelector } from '../components/SettlementTypeSelector';
import { WorkParametersSection } from '../components/WorkParametersSection';
import { formatCurrencyAmount } from '../view-models/calculatorViewModels';
import {
  convertIncomeFormAmountForCurrencyChange,
  buildIncomeEditorInput,
  buildIncomeSummary,
  buildIncomeValidationInput,
  incomeToFormState,
  isIncomeFormForeignCurrency,
  normalizeDecimalInput,
  normalizeIntegerInput,
  resolveIncomePlnAmount,
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

export function EditIncomeScreen() {
  const { bundle, getExchangeRate, hasLoadedSelectedPeriod, selectedPeriod, updateIncome } = useCalculatorData();
  const { id: incomeId } = useLocalSearchParams<{ id?: string }>();
  
  const [form, setForm] = React.useState<IncomeFormState | null>(null);
  const [validationMessage, setValidationMessage] = React.useState<string | null>(null);
  const [validationWarnings, setValidationWarnings] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isResolvingFx, setIsResolvingFx] = React.useState(false);
  const [fxMessage, setFxMessage] = React.useState<string | null>(null);
  const [fxErrorMessage, setFxErrorMessage] = React.useState<string | null>(null);

  // Find the income entity by ID - must be computed before any early returns
  const incomeEntity = bundle?.incomes.find(income => income.id === incomeId) || null;

  // Load income data when bundle and incomeId are available
  React.useEffect(() => {
    if (!hasLoadedSelectedPeriod || !bundle || !incomeId) return;
    
    const income = bundle.incomes.find(income => income.id === incomeId);
    if (!income) return;
    
    setForm(incomeToFormState(income));
  }, [bundle, hasLoadedSelectedPeriod, incomeId]);

  // Compute summary - must be called before any early returns (hook order rule)
  // Returns null when form is null, used after early return guards
  const summary = React.useMemo(() => form ? buildIncomeSummary(form) : null, [form]);
  const isForeignCurrency = React.useMemo(
    () => (form ? isIncomeFormForeignCurrency(form) : false),
    [form]
  );

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

  function updateForm<Key extends keyof IncomeFormState>(key: Key, value: IncomeFormState[Key]) {
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

  async function handleCurrencyChange(nextCurrency: IncomeCurrency) {
    if (!form) {
      return;
    }

    setIsResolvingFx(true);
    setFxErrorMessage(null);

    try {
      const resolvedRate = await getExchangeRate(nextCurrency, form.exchangeRateReferenceDate);
      const nextBaseAmount =
        nextCurrency === form.currency
          ? form.baseAmount
          : formatMoneyInput(convertIncomeFormAmountForCurrencyChange(form, resolvedRate.exchangeRate));

      setForm({
        ...form,
        currency: nextCurrency,
        baseAmount: nextBaseAmount,
        exchangeRate: formatRateInput(resolvedRate.exchangeRate),
        exchangeRateSource: resolvedRate.exchangeRateSource,
        exchangeRateReferenceDate: resolvedRate.exchangeRateReferenceDate,
        exchangeRateEffectiveDate: resolvedRate.exchangeRateEffectiveDate,
      });
      setFxMessage(
        `Przeliczono po kursie ${formatRateDisplay(resolvedRate.exchangeRate)} ${nextCurrency}/PLN z dnia ${resolvedRate.exchangeRateEffectiveDate}.`
      );
    } catch (error) {
      setFxErrorMessage(
        error instanceof Error ? error.message : 'Nie udało się pobrać kursu NBP dla wybranej waluty.'
      );
    } finally {
      setIsResolvingFx(false);
    }
  }

  async function handleReferenceDateChange(value: string) {
    updateForm('exchangeRateReferenceDate', value);
    setFxMessage(null);

    if (!form || !isValidReferenceDate(value, selectedPeriod) || form.currency === 'PLN') {
      return;
    }

    setIsResolvingFx(true);
    setFxErrorMessage(null);

    try {
      const resolvedRate = await getExchangeRate(form.currency, value);
      setForm((current) =>
        current
          ? {
              ...current,
              exchangeRate: formatRateInput(resolvedRate.exchangeRate),
              exchangeRateSource: resolvedRate.exchangeRateSource,
              exchangeRateReferenceDate: resolvedRate.exchangeRateReferenceDate,
              exchangeRateEffectiveDate: resolvedRate.exchangeRateEffectiveDate,
            }
          : current
      );
      setFxMessage(
        `Odświeżono kurs ${form.currency}/PLN do ${formatRateDisplay(resolvedRate.exchangeRate)} z tabeli NBP ${resolvedRate.exchangeRateEffectiveDate}.`
      );
    } catch (error) {
      setFxErrorMessage(
        error instanceof Error ? error.message : 'Nie udało się odświeżyć kursu dla wskazanej daty.'
      );
    } finally {
      setIsResolvingFx(false);
    }
  }

  async function handleSave() {
    if (!form) return;

    const validationInput = buildIncomeValidationInput(form);
    const validationResult = validateIncomeInputBusinessRules(validationInput);

    if (!isValidReferenceDate(form.exchangeRateReferenceDate, selectedPeriod)) {
      setValidationMessage('Data referencyjna kursu musi należeć do aktywnego miesiąca raportowego.');
      setValidationWarnings([]);
      return;
    }

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
        onValueChange={(value) => {
          void handleCurrencyChange(value);
        }}
        options={currencyOptions}
        value={form.currency}
      />

      {isForeignCurrency ? (
        <View style={styles.fxSection}>
          <TextField
            autoCapitalize="none"
            label="DATA REFERENCYJNA KURSU"
            onChangeText={(value) => {
              void handleReferenceDateChange(value);
            }}
            placeholder={`${selectedPeriod.key}-01`}
            value={form.exchangeRateReferenceDate}
          />
          <TextField
            keyboardType="decimal-pad"
            label="KURS PRZELICZENIA DO PLN"
            onChangeText={(value) => {
              updateForm('exchangeRate', normalizeDecimalInput(value));
              updateForm('exchangeRateSource', 'CUSTOM');
              setFxMessage('Używasz kursu własnego. Zapis zostanie przeliczony z tym kursem.');
            }}
            placeholder="Np. 4,1234"
            value={form.exchangeRate}
          />
          <Text style={styles.fxHint}>
            Źródło: {form.exchangeRateSource} · data referencyjna: {form.exchangeRateReferenceDate} ·
            kurs zastosowany: {form.exchangeRateEffectiveDate}
          </Text>
          {fxMessage ? <Text style={styles.fxInfo}>{fxMessage}</Text> : null}
          {fxErrorMessage ? <Text style={styles.validation}>{fxErrorMessage}</Text> : null}
          {isResolvingFx ? <Text style={styles.fxHint}>Pobieranie kursu NBP...</Text> : null}
          <Text style={styles.fxHint}>
            Do obliczeń: {formatCurrencyAmount(resolveIncomePlnAmount(form))} PLN
          </Text>
        </View>
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
        disabled={isSubmitting || isResolvingFx}
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
  fxSection: {
    gap: spacing.sm,
  },
  fxInfo: {
    ...typography.caption,
    color: colors.brand.primary,
  },
  validation: {
    ...typography.caption,
    color: '#b3261e',
  },
});

function isValidReferenceDate(value: string, period: { key: string }) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && value.startsWith(`${period.key}-`);
}

function formatMoneyInput(value: number) {
  return value.toFixed(2).replace('.', ',');
}

function formatRateInput(value: number) {
  return value.toFixed(4).replace(/0+$/, '').replace(/[,.]$/, '').replace('.', ',');
}

function formatRateDisplay(value: number) {
  return value.toLocaleString('pl-PL', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

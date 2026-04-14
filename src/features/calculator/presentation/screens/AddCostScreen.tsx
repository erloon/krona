import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  COST_CURRENCIES,
  COST_VAT_RATES,
  type CostCurrency,
  type CostVatRate,
} from '@/features/calculator/domain/entities/cost';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { ScreenContainer } from '@/shared/ui/layout/ScreenContainer';
import { AppTopBar } from '@/shared/ui/primitives/AppTopBar';
import { ChipSelector, type ChipSelectorOption } from '@/shared/ui/primitives/ChipSelector';
import { IconButton } from '@/shared/ui/primitives/IconButton';
import { LoadingIndicator } from '@/shared/ui/primitives/LoadingIndicator';
import { PrimaryButton } from '@/shared/ui/primitives/PrimaryButton';
import { SecondaryButton } from '@/shared/ui/primitives/SecondaryButton';
import { SurfaceCard } from '@/shared/ui/primitives/SurfaceCard';
import { TextAreaField } from '@/shared/ui/primitives/TextAreaField';
import { TextField } from '@/shared/ui/primitives/TextField';
import { ValidationWarningsList } from '@/shared/ui/primitives/ValidationWarning';

import { AttachmentDropzone } from '../components/AttachmentDropzone';
import { DeductionModeSelector } from '../components/DeductionModeSelector';
import { getSelectedPeriodLabel } from '../hooks/calculatorDataState';
import { useCalculatorData } from '../hooks/useManagedCalculatorData';
import { fetchVatSubjectByNip } from '@/features/calculator/infrastructure/services/VatWhiteListClient';

import {
  attachCostReference,
  buildCostEditorInput,
  buildCostPreview,
  buildCostValidationResult,
  convertCostFormAmountForCurrencyChange,
  createDefaultCostFormState,
  detachCostReference,
  normalizeDecimalInput,
  resolvePlnNetAmount,
  type CostFormState,
} from '../view-models/costFormState';

const currencyOptions: ChipSelectorOption<CostCurrency>[] = COST_CURRENCIES.map((currency) => ({
  label: currency,
  value: currency,
}));

const vatOptions: ChipSelectorOption<CostVatRate>[] = COST_VAT_RATES.map((vatRate) => ({
  label: vatRate === 'ZW' ? 'ZW' : `${vatRate}%`,
  value: vatRate,
}));

export function AddCostScreen() {
  const { bundle, createCost, getExchangeRate, hasLoadedSelectedPeriod, selectedPeriod } =
    useCalculatorData();
  const [form, setForm] = React.useState<CostFormState>(() =>
    createDefaultCostFormState(createPeriodStartDate(selectedPeriod))
  );
  const [validationMessage, setValidationMessage] = React.useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isResolvingFx, setIsResolvingFx] = React.useState(false);
  const [isAttachmentEditorVisible, setIsAttachmentEditorVisible] = React.useState(false);
  const [attachmentUriDraft, setAttachmentUriDraft] = React.useState('');
  const [attachmentNameDraft, setAttachmentNameDraft] = React.useState('');
  const [fxMessage, setFxMessage] = React.useState<string | null>(null);
  const [fxErrorMessage, setFxErrorMessage] = React.useState<string | null>(null);
  const [nipCheckStatus, setNipCheckStatus] = React.useState<
    'idle' | 'loading' | 'found' | 'found-exempt' | 'not-found' | 'error'
  >('idle');
  const [nipCheckMessage, setNipCheckMessage] = React.useState<string | null>(null);
  const preExemptVatRateRef = React.useRef<CostVatRate | null>(null);

  const settingsSnapshot = bundle?.settingsSnapshot ?? null;
  const preview = React.useMemo(
    () => (settingsSnapshot ? buildCostPreview(form, settingsSnapshot) : null),
    [form, settingsSnapshot]
  );
  const validationResult = React.useMemo(
    () => (settingsSnapshot ? buildCostValidationResult(form, settingsSnapshot) : null),
    [form, settingsSnapshot]
  );
  const periodLabel = React.useMemo(() => getSelectedPeriodLabel(selectedPeriod), [selectedPeriod]);

  if (!hasLoadedSelectedPeriod || !bundle || !settingsSnapshot || preview === null) {
    return <LoadingIndicator label="Ładowanie formularza kosztu..." />;
  }

  function updateForm<Key extends keyof CostFormState>(key: Key, value: CostFormState[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleCurrencyChange(nextCurrency: CostCurrency) {
    const currentForm = form;
    const nextReferenceDate =
      currentForm.exchangeRateReferenceDate || formatPeriodDate(selectedPeriod.year, selectedPeriod.month, 1);

    setIsResolvingFx(true);
    setFxErrorMessage(null);

    try {
      const resolvedRate = await getExchangeRate(nextCurrency, nextReferenceDate);
      const nextEnteredNetAmount =
        nextCurrency === currentForm.currency
          ? currentForm.enteredNetAmount
          : formatMoneyInput(
              convertCostFormAmountForCurrencyChange(currentForm, resolvedRate.exchangeRate)
            );

      setForm({
        ...currentForm,
        currency: nextCurrency,
        enteredNetAmount: nextEnteredNetAmount,
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

    if (!isValidReferenceDate(value, selectedPeriod) || form.currency === 'PLN') {
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

  async function handleNipChange(rawValue: string) {
    const digits = rawValue.replace(/\D/g, '').slice(0, 10);
    updateForm('nip', digits);

    if (digits.length === 0) {
      if (preExemptVatRateRef.current !== null) {
        setForm((current) => ({ ...current, supplierName: '', supplierAddress: '', vatRate: preExemptVatRateRef.current! }));
        preExemptVatRateRef.current = null;
      } else {
        setForm((current) => ({ ...current, supplierName: '', supplierAddress: '' }));
      }
      setNipCheckStatus('idle');
      setNipCheckMessage(null);
      return;
    }

    if (digits.length < 10) {
      setNipCheckStatus('idle');
      setNipCheckMessage(null);
      return;
    }

    setNipCheckStatus('loading');
    setNipCheckMessage(null);

    try {
      const today = new Date().toISOString().slice(0, 10);
      const result = await fetchVatSubjectByNip(digits, today);

      if (result.status === 'not-found') {
        setNipCheckStatus('not-found');
        setNipCheckMessage('Nie znaleziono podmiotu o podanym NIP w rejestrze VAT.');
        return;
      }

      if (result.status === 'invalid-nip') {
        setNipCheckStatus('found-exempt');
        setNipCheckMessage('Nieprawidłowy NIP lub brak podatnika w rejestrze — stawka zmieniona na ZW, brak prawa do odliczenia VAT.');
        if (preExemptVatRateRef.current === null) {
          preExemptVatRateRef.current = form.vatRate;
        }
        setForm((current) => ({ ...current, vatRate: 'ZW' as const }));
        return;
      }

      const { subject } = result;
      const isVatActive = subject.statusVat === 'Czynny';

      if (isVatActive) {
        setNipCheckStatus('found');
        setNipCheckMessage('Czynny podatnik VAT');
        const restoreRate = preExemptVatRateRef.current;
        preExemptVatRateRef.current = null;
        setForm((current) => ({
          ...current,
          supplierName: subject.name,
          supplierAddress: subject.residenceAddress || subject.workingAddress || '',
          ...(restoreRate !== null ? { vatRate: restoreRate } : {}),
        }));
      } else {
        setNipCheckStatus('found-exempt');
        setNipCheckMessage(
          `Status VAT: ${subject.statusVat} — dostawca nie jest czynnym podatnikiem VAT. Stawka zmieniona na ZW, brak prawa do odliczenia VAT od tego kosztu.`
        );
        if (preExemptVatRateRef.current === null) {
          preExemptVatRateRef.current = form.vatRate;
        }
        setForm((current) => ({
          ...current,
          supplierName: subject.name,
          supplierAddress: subject.residenceAddress || subject.workingAddress || '',
          vatRate: 'ZW' as const,
        }));
      }
    } catch (err) {
      setNipCheckStatus('error');
      setNipCheckMessage(
        err instanceof Error ? err.message : 'Błąd podczas sprawdzania NIP w rejestrze VAT.'
      );
    }
  }

  function handleOpenAttachmentEditor() {
    setAttachmentUriDraft(form.attachment?.uri ?? '');
    setAttachmentNameDraft(form.attachment?.fileName ?? '');
    setIsAttachmentEditorVisible(true);
  }

  function handleApplyAttachment() {
    if (!attachmentUriDraft.trim()) {
      setValidationMessage('Podaj lokalne URI załącznika albo usuń szkic.');
      return;
    }

    setForm((current) =>
      attachCostReference(current, {
        uri: attachmentUriDraft,
        fileName: attachmentNameDraft,
      })
    );
    setValidationMessage(null);
    setIsAttachmentEditorVisible(false);
  }

  async function handleSave() {
    if (!isValidReferenceDate(form.exchangeRateReferenceDate, selectedPeriod)) {
      setValidationMessage('Data referencyjna kursu musi należeć do aktywnego miesiąca raportowego.');
      return;
    }

    if (!validationResult?.isValid) {
      setValidationMessage(validationResult?.errors[0]?.message ?? 'Nieprawidłowe dane kosztu.');
      return;
    }

    setValidationMessage(null);
    setSaveErrorMessage(null);
    setIsSubmitting(true);

    try {
      await createCost(buildCostEditorInput(form));
      if (router.canGoBack()) { router.back(); } else { router.replace('/'); }
    } catch (saveError) {
      setSaveErrorMessage(
        saveError instanceof Error ? saveError.message : 'Nie udało się zapisać kosztu.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <AppTopBar
        leadingContent={
          <IconButton accessibilityLabel="Wróć do listy kosztów" icon="arrow-left" onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } }} />
        }
        title="Dodaj koszt"
      />

      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons color={colors.brand.primary} name="receipt-text-edit-outline" size={28} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.periodLabel}>Aktywny okres: {periodLabel}</Text>
            <Text style={styles.title}>Koszt zapisze się w bieżącym okresie raportowym</Text>
            <Text style={styles.description}>
              Formularz zachowuje miesiąc, przelicza wpływ na PIT/VAT i po zapisie odświeża listę kosztów.
            </Text>
          </View>
        </View>

        <SurfaceCard style={styles.previewCard}>
          <Text style={styles.previewLabel}>KWOTA NETTO</Text>
          <View style={styles.previewAmountRow}>
            <Text style={styles.previewAmount}>{form.enteredNetAmount || '0,00'}</Text>
            <Text style={styles.previewCurrency}>{form.currency}</Text>
          </View>
          <Text style={styles.previewMeta}>
            Do obliczeń: {preview.economicCostAmount.toFixed(2).replace('.', ',')} PLN kosztu gotówkowego
          </Text>
        </SurfaceCard>
      </View>

      <ChipSelector
        label="WALUTA"
        onValueChange={(value) => {
          void handleCurrencyChange(value);
        }}
        options={currencyOptions}
        value={form.currency}
      />

      <TextField
        keyboardType="decimal-pad"
        label="KWOTA NETTO"
        onChangeText={(value) => updateForm('enteredNetAmount', normalizeDecimalInput(value))}
        placeholder="0,00"
        suffix={form.currency}
        value={form.enteredNetAmount}
      />

      {form.currency !== 'PLN' ? (
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
          {fxErrorMessage ? <Text style={styles.errorText}>{fxErrorMessage}</Text> : null}
          {isResolvingFx ? <Text style={styles.fxHint}>Pobieranie kursu NBP...</Text> : null}
        </View>
      ) : null}

      <ChipSelector
        label="STAWKA VAT"
        onValueChange={(value) => updateForm('vatRate', value)}
        options={vatOptions}
        value={form.vatRate}
      />

      <DeductionModeSelector
        onValueChange={(value) => updateForm('category', value)}
        value={form.category}
      />

      <View style={styles.nipSection}>
        <TextField
          autoCapitalize="none"
          keyboardType="numeric"
          label="NIP DOSTAWCY (opcjonalnie)"
          onChangeText={(value) => {
            void handleNipChange(value);
          }}
          placeholder="Np. 5260250274"
          value={form.nip}
        />
        {nipCheckStatus === 'loading' ? (
          <Text style={styles.nipHint}>Sprawdzanie rejestru VAT...</Text>
        ) : nipCheckStatus === 'found' ? (
          <Text style={styles.nipSuccess}>{nipCheckMessage}</Text>
        ) : nipCheckStatus === 'found-exempt' ? (
          <Text style={styles.nipWarning}>{nipCheckMessage}</Text>
        ) : nipCheckStatus === 'not-found' ? (
          <Text style={styles.nipWarning}>{nipCheckMessage}</Text>
        ) : nipCheckStatus === 'error' ? (
          <Text style={styles.errorText}>{nipCheckMessage}</Text>
        ) : null}
      </View>

      {form.nip.length === 10 || form.supplierName.length > 0 || form.supplierAddress.length > 0 ? (
        <View style={styles.supplierSection}>
          <TextField
            autoCapitalize="words"
            label="NAZWA DOSTAWCY (opcjonalnie)"
            onChangeText={(value) => updateForm('supplierName', value)}
            placeholder="Np. Adobe Inc. Sp. z o.o."
            value={form.supplierName}
          />
          <TextField
            autoCapitalize="words"
            label="ADRES DOSTAWCY (opcjonalnie)"
            onChangeText={(value) => updateForm('supplierAddress', value)}
            placeholder="Np. ul. Polska 1, 00-001 Warszawa"
            value={form.supplierAddress}
          />
        </View>
      ) : null}

      <View style={styles.fields}>
        <TextField
          autoCapitalize="sentences"
          label="NAZWA KOSZTU"
          onChangeText={(value) => updateForm('label', value)}
          placeholder="Np. Abonament Adobe"
          value={form.label}
        />
        <TextAreaField
          autoCapitalize="sentences"
          label="NOTATKA"
          onChangeText={(value) => updateForm('description', value)}
          placeholder="Opcjonalne informacje o koszcie"
          value={form.description}
        />
      </View>

      {/* ZAŁĄCZNIK — tymczasowo ukryty, kod zachowany
      <AttachmentDropzone
        attachment={form.attachment}
        onAddPress={handleOpenAttachmentEditor}
        onRemovePress={() => setForm((current) => detachCostReference(current))}
      />

      {isAttachmentEditorVisible ? (
        <SurfaceCard style={styles.attachmentEditor}>
          <TextField
            autoCapitalize="none"
            label="URI ZAŁĄCZNIKA"
            onChangeText={setAttachmentUriDraft}
            placeholder="file:///storage/emulated/0/DCIM/receipt.jpg"
            value={attachmentUriDraft}
          />
          <TextField
            autoCapitalize="none"
            label="NAZWA PLIKU"
            onChangeText={setAttachmentNameDraft}
            placeholder="receipt.jpg"
            value={attachmentNameDraft}
          />
          <View style={styles.attachmentActions}>
            <PrimaryButton label="Zapisz załącznik" onPress={handleApplyAttachment} />
            <SecondaryButton label="Anuluj edycję załącznika" onPress={() => setIsAttachmentEditorVisible(false)} />
          </View>
        </SurfaceCard>
      ) : null}
      */}

      <SurfaceCard style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Podgląd skutku kosztu</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Kwota w PLN</Text>
          <Text style={styles.summaryValue}>
            {resolvePlnNetAmount(form).toFixed(2).replace('.', ',')} PLN
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>VAT teoretyczny</Text>
          <Text style={styles.summaryValue}>{preview.vatAmount.toFixed(2).replace('.', ',')} PLN</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>VAT odliczalny</Text>
          <Text style={styles.summaryValue}>{preview.deductibleVatAmount.toFixed(2).replace('.', ',')} PLN</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>VAT nieodliczalny</Text>
          <Text style={styles.summaryValue}>{preview.nonDeductibleVatAmount.toFixed(2).replace('.', ',')} PLN</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Podstawa PIT/Zdrowotna</Text>
          <Text style={styles.summaryValue}>{preview.deductibleCostAmount.toFixed(2).replace('.', ',')} PLN</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Efekt gotówkowy</Text>
          <Text style={styles.summaryValue}>{preview.economicCostAmount.toFixed(2).replace('.', ',')} PLN</Text>
        </View>
        <Text style={styles.summaryNote}>{preview.taxEffectLabel}</Text>
        <Text style={styles.summaryNote}>{preview.cashEffectLabel}</Text>
      </SurfaceCard>

      {validationMessage ? <Text style={styles.errorText}>{validationMessage}</Text> : null}
      {saveErrorMessage ? <Text style={styles.errorText}>{saveErrorMessage}</Text> : null}
      {validationResult ? (
        <ValidationWarningsList warnings={validationResult.warnings.map((warning) => warning.message)} />
      ) : null}

      <View style={styles.actions}>
        <PrimaryButton
          accessibilityHint="Waliduje formularz, zapisuje koszt w aktywnym miesiącu i wraca do listy."
          disabled={isSubmitting || isResolvingFx}
          label={isSubmitting ? 'ZAPISYWANIE...' : 'ZAPISZ KOSZT'}
          onPress={() => {
            void handleSave();
          }}
        />
        <SecondaryButton
          accessibilityHint="Anuluje tworzenie kosztu i wraca do listy w tym samym miesiącu."
          label="ANULUJ"
          onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } }}
        />
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
    gap: spacing.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  heroCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  iconWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.card,
    backgroundColor: colors.background.surfaceContainerLow,
  },
  periodLabel: {
    ...typography.caption,
    color: colors.brand.primary,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '700',
  },
  description: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  previewCard: {
    gap: spacing.sm,
  },
  previewLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  previewAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  previewAmount: {
    ...typography.metricValue,
    color: colors.text.primary,
  },
  previewCurrency: {
    ...typography.metricValueCompact,
    color: colors.brand.primary,
  },
  previewMeta: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  fxSection: {
    gap: spacing.sm,
  },
  fxHint: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  fxInfo: {
    ...typography.caption,
    color: colors.brand.primary,
  },
  fields: {
    gap: spacing.md,
  },
  nipSection: {
    gap: spacing.xs,
  },
  supplierSection: {
    gap: spacing.md,
  },
  nipHint: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  nipSuccess: {
    ...typography.caption,
    color: colors.brand.primary,
  },
  nipWarning: {
    ...typography.caption,
    color: '#E6820E',
  },
  attachmentEditor: {
    gap: spacing.md,
  },
  attachmentActions: {
    gap: spacing.sm,
  },
  summaryCard: {
    gap: spacing.sm,
  },
  summaryTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryKey: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },
  summaryValue: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
    textAlign: 'right',
  },
  summaryNote: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  errorText: {
    ...typography.caption,
    color: colors.brand.destructive,
  },
  actions: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
});

function createPeriodStartDate(period: { year: number; month: number }) {
  return new Date(Date.UTC(period.year, period.month - 1, 1));
}

function formatPeriodDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

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

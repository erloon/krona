import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import {
  COST_CURRENCIES,
  COST_VAT_RATES,
  type CostCurrency,
  type CostVatRate,
} from '@/features/calculator/domain/entities/cost';
import { useCalculatorData } from '@/features/calculator/presentation/hooks/useManagedCalculatorData';
import { colors, spacing, typography } from '@/shared/theme';
import { ScreenContainer } from '@/shared/ui/layout/ScreenContainer';
import { AppTopBar } from '@/shared/ui/primitives/AppTopBar';
import { ChipSelector, type ChipSelectorOption } from '@/shared/ui/primitives/ChipSelector';
import { EmptyState } from '@/shared/ui/primitives/EmptyState';
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
import { fetchVatSubjectByNip } from '@/features/calculator/infrastructure/services/VatWhiteListClient';

import {
  attachCostReference,
  buildCostEditorInput,
  buildCostPreview,
  buildCostValidationResult,
  convertCostFormAmountForCurrencyChange,
  costToFormState,
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

export function EditCostScreen() {
  const { bundle, getExchangeRate, hasLoadedSelectedPeriod, selectedPeriod, updateCost } =
    useCalculatorData();
  const { id: costId } = useLocalSearchParams<{ id?: string }>();
  const [form, setForm] = React.useState<CostFormState | null>(null);
  const [validationMessage, setValidationMessage] = React.useState<string | null>(null);
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

  const costEntity = bundle?.costs.find((cost) => cost.id === costId) ?? null;
  const settingsSnapshot = bundle?.settingsSnapshot ?? null;
  const preview = React.useMemo(
    () => (form && settingsSnapshot ? buildCostPreview(form, settingsSnapshot) : null),
    [form, settingsSnapshot]
  );
  const validationResult = React.useMemo(
    () => (form && settingsSnapshot ? buildCostValidationResult(form, settingsSnapshot) : null),
    [form, settingsSnapshot]
  );

  React.useEffect(() => {
    if (!hasLoadedSelectedPeriod || !bundle || !costId) {
      return;
    }

    const cost = bundle.costs.find((candidate) => candidate.id === costId);

    if (!cost) {
      return;
    }

    setForm(costToFormState(cost));
  }, [bundle, costId, hasLoadedSelectedPeriod]);

  if (!hasLoadedSelectedPeriod) {
    return <LoadingIndicator label="Ładowanie kosztu..." />;
  }

  if (!costId || !costEntity) {
    return (
      <ScreenContainer contentContainerStyle={styles.content}>
        <AppTopBar
          leadingContent={
            <IconButton accessibilityLabel="Wróć" icon="arrow-left" onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } }} />
          }
          title="Edytuj koszt"
        />
        <EmptyState
          description="Wybrany koszt nie istnieje w bieżącym okresie raportowym."
          title="Nie znaleziono kosztu"
        />
        <PrimaryButton label="Wróć do listy" onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } }} />
      </ScreenContainer>
    );
  }

  if (!form || !settingsSnapshot || preview === null) {
    return <LoadingIndicator label="Trwa ładowanie danych..." />;
  }

  const activeForm = form;
  const activeCostId = costId;

  function updateForm<Key extends keyof CostFormState>(key: Key, value: CostFormState[Key]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  async function handleCurrencyChange(nextCurrency: CostCurrency) {
    if (!form) {
      return;
    }

    setIsResolvingFx(true);
    setFxErrorMessage(null);

    try {
      const resolvedRate = await getExchangeRate(nextCurrency, form.exchangeRateReferenceDate);
      const nextEnteredNetAmount =
        nextCurrency === form.currency
          ? form.enteredNetAmount
          : formatMoneyInput(convertCostFormAmountForCurrencyChange(form, resolvedRate.exchangeRate));

      setForm({
        ...form,
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

  async function handleNipChange(rawValue: string) {
    const digits = rawValue.replace(/\D/g, '').slice(0, 10);
    updateForm('nip', digits);

    if (digits.length === 0) {
      const restoreRate = preExemptVatRateRef.current;
      preExemptVatRateRef.current = null;
      setForm((current) =>
        current
          ? { ...current, supplierName: '', supplierAddress: '', ...(restoreRate !== null ? { vatRate: restoreRate } : {}) }
          : current
      );
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
          preExemptVatRateRef.current = activeForm.vatRate;
        }
        setForm((current) => (current ? { ...current, vatRate: 'ZW' as const } : current));
        return;
      }

      const { subject } = result;
      const isVatActive = subject.statusVat === 'Czynny';

      if (isVatActive) {
        setNipCheckStatus('found');
        setNipCheckMessage('Czynny podatnik VAT');
        const restoreRate = preExemptVatRateRef.current;
        preExemptVatRateRef.current = null;
        setForm((current) =>
          current
            ? {
                ...current,
                supplierName: subject.name,
                supplierAddress: subject.residenceAddress || subject.workingAddress || '',
                ...(restoreRate !== null ? { vatRate: restoreRate } : {}),
              }
            : current
        );
      } else {
        setNipCheckStatus('found-exempt');
        setNipCheckMessage(
          `Status VAT: ${subject.statusVat} — dostawca nie jest czynnym podatnikiem VAT. Stawka zmieniona na ZW, brak prawa do odliczenia VAT od tego kosztu.`
        );
        if (preExemptVatRateRef.current === null) {
          preExemptVatRateRef.current = activeForm.vatRate;
        }
        setForm((current) =>
          current
            ? {
                ...current,
                supplierName: subject.name,
                supplierAddress: subject.residenceAddress || subject.workingAddress || '',
                vatRate: 'ZW' as const,
              }
            : current
        );
      }
    } catch (err) {
      setNipCheckStatus('error');
      setNipCheckMessage(
        err instanceof Error ? err.message : 'Błąd podczas sprawdzania NIP w rejestrze VAT.'
      );
    }
  }

  function handleOpenAttachmentEditor() {
    setAttachmentUriDraft(activeForm.attachment?.uri ?? '');
    setAttachmentNameDraft(activeForm.attachment?.fileName ?? '');
    setIsAttachmentEditorVisible(true);
  }

  function handleApplyAttachment() {
    if (!attachmentUriDraft.trim()) {
      setValidationMessage('Podaj lokalne URI załącznika albo usuń szkic.');
      return;
    }

    setForm((current) =>
      current
        ? attachCostReference(current, {
            uri: attachmentUriDraft,
            fileName: attachmentNameDraft,
          })
        : current
    );
    setValidationMessage(null);
    setIsAttachmentEditorVisible(false);
  }

  async function handleSave() {
    if (!isValidReferenceDate(activeForm.exchangeRateReferenceDate, selectedPeriod)) {
      setValidationMessage('Data referencyjna kursu musi należeć do aktywnego miesiąca raportowego.');
      return;
    }

    if (!validationResult?.isValid) {
      setValidationMessage(validationResult?.errors[0]?.message ?? 'Nieprawidłowe dane kosztu.');
      return;
    }

    setValidationMessage(null);
    setIsSubmitting(true);

    try {
      await updateCost(activeCostId, buildCostEditorInput(activeForm));
      if (router.canGoBack()) { router.back(); } else { router.replace('/'); }
    } catch (saveError) {
      Alert.alert(
        'Nie udało się zapisać kosztu',
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
          <IconButton accessibilityLabel="Wróć" icon="arrow-left" onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } }} />
        }
        title="Edytuj koszt"
      />

      <ChipSelector
        label="WALUTA"
        onValueChange={(value) => {
          void handleCurrencyChange(value);
        }}
        options={currencyOptions}
        value={activeForm.currency}
      />

      <TextField
        keyboardType="decimal-pad"
        label="KWOTA NETTO"
        onChangeText={(value) => updateForm('enteredNetAmount', normalizeDecimalInput(value))}
        placeholder="0,00"
        suffix={activeForm.currency}
        value={activeForm.enteredNetAmount}
      />

      {activeForm.currency !== 'PLN' ? (
        <View style={styles.fxSection}>
          <TextField
            autoCapitalize="none"
            label="DATA REFERENCYJNA KURSU"
            onChangeText={(value) => {
              void handleReferenceDateChange(value);
            }}
            placeholder={`${selectedPeriod.key}-01`}
            value={activeForm.exchangeRateReferenceDate}
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
            value={activeForm.exchangeRate}
          />
          <Text style={styles.infoText}>
            Źródło: {activeForm.exchangeRateSource} · data referencyjna: {activeForm.exchangeRateReferenceDate} ·
            kurs zastosowany: {activeForm.exchangeRateEffectiveDate}
          </Text>
          {fxMessage ? <Text style={styles.fxInfo}>{fxMessage}</Text> : null}
          {fxErrorMessage ? <Text style={styles.validation}>{fxErrorMessage}</Text> : null}
          {isResolvingFx ? <Text style={styles.infoText}>Pobieranie kursu NBP...</Text> : null}
        </View>
      ) : null}

      <ChipSelector
        label="STAWKA VAT"
        onValueChange={(value) => updateForm('vatRate', value)}
        options={vatOptions}
        value={activeForm.vatRate}
      />

      <DeductionModeSelector
        onValueChange={(value) => updateForm('category', value)}
        value={activeForm.category}
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
          value={activeForm.nip}
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
          <Text style={styles.validation}>{nipCheckMessage}</Text>
        ) : null}
      </View>

      {activeForm.nip.length === 10 ||
      activeForm.supplierName.length > 0 ||
      activeForm.supplierAddress.length > 0 ? (
        <View style={styles.supplierSection}>
          <TextField
            autoCapitalize="words"
            label="NAZWA DOSTAWCY (opcjonalnie)"
            onChangeText={(value) => updateForm('supplierName', value)}
            placeholder="Np. Adobe Inc. Sp. z o.o."
            value={activeForm.supplierName}
          />
          <TextField
            autoCapitalize="words"
            label="ADRES DOSTAWCY (opcjonalnie)"
            onChangeText={(value) => updateForm('supplierAddress', value)}
            placeholder="Np. ul. Polska 1, 00-001 Warszawa"
            value={activeForm.supplierAddress}
          />
        </View>
      ) : null}

      <View style={styles.section}>
        <TextField
          autoCapitalize="sentences"
          label="NAZWA KOSZTU"
          onChangeText={(value) => updateForm('label', value)}
          placeholder="Np. Abonament Adobe"
          value={activeForm.label}
        />
        <TextAreaField
          autoCapitalize="sentences"
          label="OPIS"
          onChangeText={(value) => updateForm('description', value)}
          placeholder="Dodatkowe informacje o koszcie"
          value={activeForm.description}
        />
      </View>

      {/* ZAŁĄCZNIK — tymczasowo ukryty, kod zachowany
      <AttachmentDropzone
        attachment={activeForm.attachment}
        onAddPress={handleOpenAttachmentEditor}
        onRemovePress={() => setForm((current) => (current ? detachCostReference(current) : current))}
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
            {resolvePlnNetAmount(activeForm).toFixed(2).replace('.', ',')} PLN
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

      {validationMessage ? <Text style={styles.validation}>{validationMessage}</Text> : null}
      {validationResult ? (
        <ValidationWarningsList warnings={validationResult.warnings.map((warning) => warning.message)} />
      ) : null}

      <PrimaryButton
        disabled={isSubmitting || isResolvingFx}
        label={isSubmitting ? 'ZAPISYWANIE...' : 'ZAPISZ KOSZT'}
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
  fxSection: {
    gap: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  fxInfo: {
    ...typography.caption,
    color: colors.brand.primary,
  },
  attachmentEditor: {
    gap: spacing.md,
  },
  attachmentActions: {
    gap: spacing.sm,
  },
  validation: {
    ...typography.caption,
    color: colors.brand.destructive,
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

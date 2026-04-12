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
import {
  applyCostFormCurrency,
  attachCostReference,
  buildCostEditorInput,
  buildCostPreview,
  buildCostValidationResult,
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
  const { bundle, createCost, hasLoadedSelectedPeriod, selectedPeriod } = useCalculatorData();
  const [form, setForm] = React.useState<CostFormState>(() => createDefaultCostFormState());
  const [validationMessage, setValidationMessage] = React.useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isAttachmentEditorVisible, setIsAttachmentEditorVisible] = React.useState(false);
  const [attachmentUriDraft, setAttachmentUriDraft] = React.useState('');
  const [attachmentNameDraft, setAttachmentNameDraft] = React.useState('');

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
    if (!validationResult?.isValid) {
      setValidationMessage(validationResult?.errors[0]?.message ?? 'Nieprawidłowe dane kosztu.');
      return;
    }

    setValidationMessage(null);
    setSaveErrorMessage(null);
    setIsSubmitting(true);

    try {
      await createCost(buildCostEditorInput(form));
      router.back();
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
          <IconButton accessibilityLabel="Wróć do listy kosztów" icon="arrow-left" onPress={() => router.back()} />
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
        onValueChange={(value) => setForm((current) => applyCostFormCurrency(current, value))}
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
            keyboardType="decimal-pad"
            label="KURS PRZELICZENIA DO PLN"
            onChangeText={(value) => updateForm('exchangeRate', normalizeDecimalInput(value))}
            placeholder="Np. 4,1234"
            value={form.exchangeRate}
          />
          <Text style={styles.fxHint}>
            Kurs i data zostaną zapisane do okresu: {form.exchangeRateSource} · {form.exchangeRateEffectiveDate}
          </Text>
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
          disabled={isSubmitting}
          label={isSubmitting ? 'ZAPISYWANIE...' : 'ZAPISZ KOSZT'}
          onPress={() => {
            void handleSave();
          }}
        />
        <SecondaryButton
          accessibilityHint="Anuluje tworzenie kosztu i wraca do listy w tym samym miesiącu."
          label="ANULUJ"
          onPress={() => router.back()}
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
  fields: {
    gap: spacing.md,
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

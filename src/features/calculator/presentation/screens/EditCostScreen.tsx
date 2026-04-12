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
import {
  applyCostFormCurrency,
  attachCostReference,
  buildCostEditorInput,
  buildCostPreview,
  buildCostValidationResult,
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
  const { bundle, hasLoadedSelectedPeriod, updateCost } = useCalculatorData();
  const { id: costId } = useLocalSearchParams<{ id?: string }>();
  const [form, setForm] = React.useState<CostFormState | null>(null);
  const [validationMessage, setValidationMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isAttachmentEditorVisible, setIsAttachmentEditorVisible] = React.useState(false);
  const [attachmentUriDraft, setAttachmentUriDraft] = React.useState('');
  const [attachmentNameDraft, setAttachmentNameDraft] = React.useState('');

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
            <IconButton accessibilityLabel="Wróć" icon="arrow-left" onPress={() => router.back()} />
          }
          title="Edytuj koszt"
        />
        <EmptyState
          description="Wybrany koszt nie istnieje w bieżącym okresie raportowym."
          title="Nie znaleziono kosztu"
        />
        <PrimaryButton label="Wróć do listy" onPress={() => router.back()} />
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
    if (!validationResult?.isValid) {
      setValidationMessage(validationResult?.errors[0]?.message ?? 'Nieprawidłowe dane kosztu.');
      return;
    }

    setValidationMessage(null);
    setIsSubmitting(true);

    try {
      await updateCost(activeCostId, buildCostEditorInput(activeForm));
      router.back();
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
          <IconButton accessibilityLabel="Wróć" icon="arrow-left" onPress={() => router.back()} />
        }
        title="Edytuj koszt"
      />

      <ChipSelector
        label="WALUTA"
        onValueChange={(value) =>
          setForm((current) => (current ? applyCostFormCurrency(current, value) : current))
        }
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
        <TextField
          keyboardType="decimal-pad"
          label="KURS PRZELICZENIA DO PLN"
          onChangeText={(value) => updateForm('exchangeRate', normalizeDecimalInput(value))}
          placeholder="Np. 4,1234"
          value={activeForm.exchangeRate}
        />
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

      <SurfaceCard style={styles.infoCard}>
        <Text style={styles.infoTitle}>Podgląd skutku kosztu</Text>
        <Text style={styles.infoText}>
          PLN do obliczeń: {resolvePlnNetAmount(activeForm).toFixed(2).replace('.', ',')} · VAT odliczalny: {preview.deductibleVatAmount.toFixed(2).replace('.', ',')} PLN
        </Text>
        <Text style={styles.infoText}>
          PIT/Zdrowotna: {preview.deductibleCostAmount.toFixed(2).replace('.', ',')} PLN · Gotówka: {preview.economicCostAmount.toFixed(2).replace('.', ',')} PLN
        </Text>
      </SurfaceCard>

      {validationMessage ? <Text style={styles.validation}>{validationMessage}</Text> : null}
      {validationResult ? (
        <ValidationWarningsList warnings={validationResult.warnings.map((warning) => warning.message)} />
      ) : null}

      <PrimaryButton
        disabled={isSubmitting}
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
  infoCard: {
    gap: spacing.xs,
  },
  infoTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '700',
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
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

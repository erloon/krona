import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import {
  COST_CATEGORIES,
  COST_VAT_RATES,
  type CostCategory,
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
import { NumericAmountField } from '@/shared/ui/primitives/NumericAmountField';
import { PrimaryButton } from '@/shared/ui/primitives/PrimaryButton';
import { TextAreaField } from '@/shared/ui/primitives/TextAreaField';
import { TextField } from '@/shared/ui/primitives/TextField';

type CostFormState = {
  label: string;
  description: string;
  netAmount: string;
  vatRate: CostVatRate;
  category: CostCategory;
};

const vatOptions: ChipSelectorOption<CostVatRate>[] = COST_VAT_RATES.map((vatRate) => ({
  label: vatRate === 'ZW' ? 'ZW' : `${vatRate}%`,
  value: vatRate,
}));

const categoryOptions: ChipSelectorOption<CostCategory>[] = COST_CATEGORIES.map((category) => ({
  label:
    category === 'STANDARD'
      ? 'Standard'
      : category === 'CAR_MIXED'
        ? 'Auto 50/75'
        : 'Auto 100%',
  value: category,
}));

export function EditCostScreen() {
  const { bundle, hasLoadedSelectedPeriod, updateCost } = useCalculatorData();
  const { id: costId } = useLocalSearchParams<{ id?: string }>();
  const [form, setForm] = React.useState<CostFormState | null>(null);
  const [validationMessage, setValidationMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const costEntity = bundle?.costs.find((cost) => cost.id === costId) ?? null;

  React.useEffect(() => {
    if (!hasLoadedSelectedPeriod || !bundle || !costId) {
      return;
    }

    const cost = bundle.costs.find((candidate) => candidate.id === costId);

    if (!cost) {
      return;
    }

    setForm({
      label: cost.label,
      description: cost.description,
      netAmount: cost.netAmount.toFixed(2),
      vatRate: cost.vatRate,
      category: cost.category,
    });
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

  if (!form) {
    return <LoadingIndicator label="Trwa ładowanie danych..." />;
  }

  const activeForm = form;
  const activeCostId = costId;

  function updateForm<Key extends keyof CostFormState>(key: Key, value: CostFormState[Key]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  async function handleSave() {
    const netAmount = Number(activeForm.netAmount.replace(',', '.'));

    if (!activeForm.label.trim()) {
      setValidationMessage('Nazwa kosztu jest wymagana.');
      return;
    }

    if (!Number.isFinite(netAmount) || netAmount < 0) {
      setValidationMessage('Kwota netto musi być liczbą większą lub równą zero.');
      return;
    }

    setValidationMessage(null);
    setIsSubmitting(true);

    try {
      await updateCost(activeCostId, {
        label: activeForm.label.trim(),
        description: activeForm.description.trim(),
        netAmount: Math.round((netAmount + Number.EPSILON) * 100) / 100,
        vatRate: activeForm.vatRate,
        category: activeForm.category,
      });
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

      <NumericAmountField
        label="KWOTA NETTO"
        onChangeText={(value) => updateForm('netAmount', normalizeDecimalInput(value))}
        placeholder="0,00"
        suffix="PLN"
        value={activeForm.netAmount}
      />

      <ChipSelector
        label="STAWKA VAT"
        onValueChange={(value) => updateForm('vatRate', value)}
        options={vatOptions}
        value={activeForm.vatRate}
      />

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>KATEGORIA I ODLICZENIE</Text>
        <ChipSelector
          label="Kategoria"
          onValueChange={(value) => updateForm('category', value)}
          options={categoryOptions}
          value={activeForm.category}
        />
      </View>

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

      <View style={styles.infoCard}>
        <MaterialCommunityIcons color={colors.brand.primary} name="paperclip" size={18} />
        <Text style={styles.infoText}>
          Obsługa załączników zostanie dopięta w kolejnym kroku. Ta edycja zapisuje już dane kosztu
          do aktywnego okresu raportowego.
        </Text>
      </View>

      {validationMessage ? <Text style={styles.validation}>{validationMessage}</Text> : null}

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

function normalizeDecimalInput(value: string) {
  return value.replace(/[^0-9,.\s]/g, '').replace(/\s/g, '').replace('.', ',');
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.background.surfaceContainerLow,
    padding: spacing.lg,
  },
  infoText: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.text.secondary,
  },
  validation: {
    ...typography.caption,
    color: colors.brand.destructive,
  },
});

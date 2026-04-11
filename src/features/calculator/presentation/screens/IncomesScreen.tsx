import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { createIncome, type Income } from '@/features/calculator/domain/entities/income';
import { useCalculatorData } from '@/features/calculator/presentation/hooks/useManagedCalculatorData';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { ScreenContainer } from '@/shared/ui/layout/ScreenContainer';
import { AppTopBar } from '@/shared/ui/primitives/AppTopBar';
import { EmptyState } from '@/shared/ui/primitives/EmptyState';
import { FloatingActionButton } from '@/shared/ui/primitives/FloatingActionButton';
import { IconButton } from '@/shared/ui/primitives/IconButton';
import { LoadingIndicator } from '@/shared/ui/primitives/LoadingIndicator';
import { SearchField } from '@/shared/ui/primitives/SearchField';

import {
  createEmptyIncomeEditorValues,
  IncomeEditorModal,
  incomeToEditorValues,
  type IncomeEditorValues,
} from '../components/IncomeEditorModal';
import { IncomeListItemCard } from '../components/IncomeListItemCard';
import { IncomeSummaryHeader } from '../components/IncomeSummaryHeader';
import { ReportingPeriodHeader } from '../components/ReportingPeriodHeader';
import {
  buildIncomeListItems,
  buildIncomeSummaryViewModel,
  formatCurrencyAmount,
} from '../view-models/calculatorViewModels';

export function IncomesScreen() {
  const {
    bundle,
    deleteIncome,
    error,
    goToNextPeriod,
    goToPreviousPeriod,
    isLoading,
    saveIncome,
  } = useCalculatorData();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [editorMode, setEditorMode] = React.useState<'create' | 'edit'>('create');
  const [editingIncomeId, setEditingIncomeId] = React.useState<string | null>(null);
  const [editorVisible, setEditorVisible] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const incomeListItems = bundle ? buildIncomeListItems(bundle) : [];
  const incomeListSummary = bundle ? buildIncomeSummaryViewModel(bundle) : null;
  const editingIncome = React.useMemo(
    () => bundle?.incomes.find((income) => income.id === editingIncomeId) ?? null,
    [bundle?.incomes, editingIncomeId]
  );
  const editorInitialValues = React.useMemo<IncomeEditorValues>(
    () =>
      editingIncome ? incomeToEditorValues(editingIncome) : createEmptyIncomeEditorValues(),
    [editingIncome]
  );
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('pl-PL');
  const filteredItems = normalizedQuery
    ? incomeListItems.filter((item) =>
        `${item.title} ${item.metadata}`.toLocaleLowerCase('pl-PL').includes(normalizedQuery)
      )
    : incomeListItems;

  function handleAddIncome() {
    setEditorMode('create');
    setEditingIncomeId(null);
    setEditorVisible(true);
  }

  function handleFilterPress() {
    // Placeholder for opening list filters.
  }

  function handleCalendarPress() {
    // Placeholder for opening month selection.
  }

  function handleEditIncome(id: string) {
    setEditorMode('edit');
    setEditingIncomeId(id);
    setEditorVisible(true);
  }

  async function handleDuplicateIncome(id: string) {
    if (!bundle) {
      return;
    }

    const sourceIncome = bundle.incomes.find((income) => income.id === id);

    if (!sourceIncome) {
      return;
    }

    const timestamp = new Date().toISOString();
    const duplicateIncome = createIncome({
      id: createIncomeId(),
      reportingPeriodId: bundle.reportingPeriod.id,
      label: `${sourceIncome.label} kopia`,
      description: sourceIncome.description,
      billingType: sourceIncome.billingType,
      baseAmount: sourceIncome.baseAmount,
      currency: sourceIncome.currency,
      vatRate: sourceIncome.vatRate,
      workParameters: sourceIncome.workParameters,
      exchangeRate: sourceIncome.exchangeRate,
      exchangeRateSource: sourceIncome.exchangeRateSource,
      exchangeRateEffectiveDate: sourceIncome.exchangeRateEffectiveDate,
      lumpSumRate: sourceIncome.lumpSumRate,
      ipBoxQualifiedIncomePercent: sourceIncome.ipBoxQualifiedIncomePercent,
      isActive: sourceIncome.isActive,
      clientName: sourceIncome.clientName,
      invoiceNumber: sourceIncome.invoiceNumber,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    try {
      await saveIncome(duplicateIncome);
    } catch (saveError) {
      Alert.alert(
        'Nie udało się zduplikować przychodu',
        saveError instanceof Error ? saveError.message : 'Spróbuj ponownie.'
      );
    }
  }

  function handleDeleteIncome(id: string) {
    Alert.alert('Usunąć przychód?', 'Ta operacja usuwa rekord tylko z bieżącego miesiąca.', [
      {
        style: 'cancel',
        text: 'Anuluj',
      },
      {
        style: 'destructive',
        text: 'Usuń',
        onPress: () => {
          void deleteIncome(id).catch((deleteError) => {
            Alert.alert(
              'Nie udało się usunąć przychodu',
              deleteError instanceof Error ? deleteError.message : 'Spróbuj ponownie.'
            );
          });
        },
      },
    ]);
  }

  function closeEditor() {
    if (isSubmitting) {
      return;
    }

    setEditorVisible(false);
    setEditingIncomeId(null);
  }

  async function handleSubmitIncome(values: IncomeEditorValues) {
    if (!bundle) {
      return;
    }

    setIsSubmitting(true);

    try {
      const currentIncome = editorMode === 'edit' ? editingIncome : null;
      const timestamp = new Date().toISOString();
      const nextIncome: Income = createIncome({
        id: currentIncome?.id ?? createIncomeId(),
        reportingPeriodId: bundle.reportingPeriod.id,
        label: values.label,
        description: values.description,
        billingType: values.billingType,
        baseAmount: Number(values.baseAmount),
        currency: values.currency,
        vatRate: values.vatRate,
        workParameters: currentIncome?.workParameters,
        exchangeRate: currentIncome?.exchangeRate,
        exchangeRateSource: currentIncome?.exchangeRateSource,
        exchangeRateEffectiveDate: currentIncome?.exchangeRateEffectiveDate,
        lumpSumRate: currentIncome?.lumpSumRate,
        ipBoxQualifiedIncomePercent: currentIncome?.ipBoxQualifiedIncomePercent,
        isActive: currentIncome?.isActive,
        clientName: currentIncome?.clientName,
        invoiceNumber: currentIncome?.invoiceNumber,
        createdAt: currentIncome?.createdAt ?? timestamp,
        updatedAt: timestamp,
      });

      await saveIncome(nextIncome);
      setEditorVisible(false);
      setEditingIncomeId(null);
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
    <View style={styles.screen}>
      <ScreenContainer contentContainerStyle={styles.content}>
        <AppTopBar
          leadingContent={<IconButton accessibilityLabel="Menu" icon="menu" />}
          title="KRONA"
          trailingContent={
            <View style={styles.avatar}>
              <Text style={styles.avatarLabel}>MK</Text>
            </View>
          }
        />

        {bundle ? (
          <>
            <ReportingPeriodHeader
              description="Przychody i snapshot miesięczny są zapisane pod wybranym okresem raportowym."
              onNextPress={goToNextPeriod}
              onPreviousPress={goToPreviousPeriod}
              periodLabel={incomeListSummary?.monthLabel ?? ''}
              title="Okres raportowy"
            />

            <IncomeSummaryHeader
              monthLabel={incomeListSummary?.monthLabel}
              pitAmount={formatCurrencyAmount(incomeListSummary?.pitAmount ?? 0)}
              title="Przychody"
              totalAmount={formatCurrencyAmount(incomeListSummary?.totalNetAmount ?? 0)}
              totalCurrency="PLN"
              totalLabel="Suma netto:"
              vatAmount={formatCurrencyAmount(incomeListSummary?.vatAmount ?? 0)}
            />
          </>
        ) : null}

        <SearchField
          onChangeText={setSearchQuery}
          placeholder="Szukaj klienta lub faktury..."
          value={searchQuery}
        />

        {isLoading ? (
          <LoadingIndicator label="Ładowanie okresu raportowego..." />
        ) : error ? (
          <View style={styles.emptyStateCard}>
            <EmptyState description={error} title="Nie udało się wczytać przychodów" />
          </View>
        ) : filteredItems.length ? (
          <View style={styles.listSection}>
            <View style={styles.monthHeader}>
              <Text style={styles.monthLabel}>{incomeListSummary?.monthLabel}</Text>
              <View style={styles.monthActions}>
                <IconButton
                  accessibilityLabel="Filtruj przychody"
                  icon="filter-variant"
                  onPress={handleFilterPress}
                />
                <IconButton
                  accessibilityLabel="Wybierz miesiąc"
                  icon="calendar-month-outline"
                  onPress={handleCalendarPress}
                />
              </View>
            </View>

            <View style={styles.cards}>
              {filteredItems.map((item) => (
                <IncomeListItemCard
                  amount={formatCurrencyAmount(item.amount)}
                  currency={item.currency}
                  key={item.id}
                  metadata={item.metadata}
                  onDelete={() => handleDeleteIncome(item.id)}
                  onDuplicate={() => handleDuplicateIncome(item.id)}
                  onEdit={() => handleEditIncome(item.id)}
                  title={item.title}
                  vatLabel={item.vatLabel}
                />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyStateCard}>
            <EmptyState
              description="Ten okres istnieje już w bazie, ale nie ma jeszcze zapisanych przychodów."
              title="Brak przychodów w wybranym miesiącu"
            />
          </View>
        )}
      </ScreenContainer>

      <FloatingActionButton
        accessibilityLabel="Dodaj przychód"
        onPress={handleAddIncome}
        style={styles.fab}
      />

      <IncomeEditorModal
        initialValues={editorInitialValues}
        isSubmitting={isSubmitting}
        mode={editorMode}
        onClose={closeEditor}
        onSubmit={handleSubmitIncome}
        visible={editorVisible}
      />
    </View>
  );
}

function createIncomeId() {
  if (typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `income-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  content: {
    gap: spacing.xxl,
    paddingBottom: 120,
  },
  avatar: {
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(26, 28, 28, 0.08)',
    backgroundColor: colors.background.surface,
  },
  avatarLabel: {
    ...typography.caption,
    color: colors.text.primary,
  },
  listSection: {
    gap: spacing.xl,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  monthLabel: {
    ...typography.sectionLabel,
    color: colors.text.secondary,
  },
  monthActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cards: {
    gap: spacing.md,
    borderRadius: radius.featured,
    backgroundColor: colors.background.surfaceContainerLow,
    padding: spacing.sm,
  },
  emptyStateCard: {
    borderRadius: radius.featured,
    backgroundColor: colors.background.surfaceContainerLow,
    paddingHorizontal: spacing.md,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 104,
  },
});

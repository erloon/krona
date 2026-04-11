import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { createMonthlyReportingPeriod } from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';
import { useCalculatorData } from '@/features/calculator/presentation/hooks/useManagedCalculatorData';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { ScreenContainer } from '@/shared/ui/layout/ScreenContainer';
import { AppTopBar } from '@/shared/ui/primitives/AppTopBar';
import { ConfirmationModal } from '@/shared/ui/primitives/ConfirmationModal';
import { EmptyState } from '@/shared/ui/primitives/EmptyState';
import { FloatingActionButton } from '@/shared/ui/primitives/FloatingActionButton';
import { IconButton } from '@/shared/ui/primitives/IconButton';
import { LoadingIndicator } from '@/shared/ui/primitives/LoadingIndicator';
import { SearchField } from '@/shared/ui/primitives/SearchField';

import type { IncomeEditorValues } from '../components/IncomeEditorModal';
import { IncomeFiltersModal } from '../components/IncomeFiltersModal';
import { IncomeListItemCard } from '../components/IncomeListItemCard';
import { IncomeSummaryHeader } from '../components/IncomeSummaryHeader';
import { ReportingPeriodHeader } from '../components/ReportingPeriodHeader';
import { ReportingPeriodPickerModal } from '../components/ReportingPeriodPickerModal';
import {
  getSelectedPeriodLabel,
  resolveIncomesScreenContentState,
} from '../hooks/calculatorDataState';
import {
  buildIncomeListItems,
  buildIncomeSummaryViewModel,
  formatCurrencyAmount,
} from '../view-models/calculatorViewModels';
import {
  defaultIncomeListFilters,
  hasActiveIncomeListFilters,
  queryIncomeListItems,
  type IncomeListFilters,
} from '../view-models/incomeListQuery';

export function IncomesScreen() {
  const {
    bundle,
    deleteIncome,
    duplicateIncome,
    error,
    goToNextPeriod,
    goToPreviousPeriod,
    hasLoadedSelectedPeriod,
    isLoading,
    selectPeriod,
    selectedPeriod,
  } = useCalculatorData();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filters, setFilters] = React.useState<IncomeListFilters>(defaultIncomeListFilters);
  const [draftFilters, setDraftFilters] = React.useState<IncomeListFilters>(defaultIncomeListFilters);
  const [isFilterModalVisible, setIsFilterModalVisible] = React.useState(false);
  const [isPeriodPickerVisible, setIsPeriodPickerVisible] = React.useState(false);
  const [draftYear, setDraftYear] = React.useState(String(selectedPeriod.year));
  const [draftMonth, setDraftMonth] = React.useState(String(selectedPeriod.month));
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] = React.useState(false);
  const [pendingDeleteIncomeId, setPendingDeleteIncomeId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  // const [editingIncomeId, setEditingIncomeId] = React.useState<string | null>(null);
  // const [editorVisible, setEditorVisible] = React.useState(false);

  const isLastIncome = bundle?.incomes.length === 1;
  const incomeListItems = hasLoadedSelectedPeriod && bundle ? buildIncomeListItems(bundle) : [];
  const incomeListSummary =
    hasLoadedSelectedPeriod && bundle ? buildIncomeSummaryViewModel(bundle) : null;
  const selectedPeriodLabel = React.useMemo(
    () => getSelectedPeriodLabel(selectedPeriod),
    [selectedPeriod]
  );
  const queryResult = React.useMemo(
    () => queryIncomeListItems(incomeListItems, searchQuery, filters),
    [filters, incomeListItems, searchQuery]
  );
  const contentState = resolveIncomesScreenContentState({
    isLoading,
    error,
    hasLoadedSelectedPeriod,
    hasAnyRecordsInPeriod: queryResult.hasAnyRecordsInPeriod,
    hasVisibleResults: queryResult.hasVisibleResults,
  });
  const hasActiveFilters = hasActiveIncomeListFilters(filters);
  const hasSearchQuery = searchQuery.trim().length > 0;
  const listStatusLabel = buildListStatusLabel(searchQuery, queryResult.appliedFilterCount);
  const shouldShowListSection =
    contentState === 'list' ||
    contentState === 'no-results' ||
    queryResult.hasAnyRecordsInPeriod ||
    hasActiveFilters ||
    hasSearchQuery;

  function handleAddIncome() {
    router.push('/add-income');
  }

  function handleFilterPress() {
    setDraftFilters(filters);
    setIsFilterModalVisible(true);
  }

  function handleCalendarPress() {
    setDraftYear(String(selectedPeriod.year));
    setDraftMonth(String(selectedPeriod.month));
    setIsPeriodPickerVisible(true);
  }

  function handleApplyFilters() {
    setFilters(draftFilters);
    setIsFilterModalVisible(false);
  }

  function handleClearFilters() {
    setDraftFilters(defaultIncomeListFilters);
    setFilters(defaultIncomeListFilters);
    setIsFilterModalVisible(false);
  }

  function handleApplyPeriod() {
    if (!/^\d{4}$/.test(draftYear)) {
      Alert.alert('Nieprawidłowy rok', 'Podaj rok w formacie RRRR.');
      return;
    }

    const month = Number(draftMonth);

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      Alert.alert('Nieprawidłowy miesiąc', 'Wybierz miesiąc od 1 do 12.');
      return;
    }

    selectPeriod(createMonthlyReportingPeriod(Number(draftYear), month));
    setIsPeriodPickerVisible(false);
  }

  function handleEditIncome(id: string) {
    router.push(`/edit-income?id=${id}` as const);
  }

  async function handleDuplicateIncome(id: string) {
    try {
      await duplicateIncome(id);
    } catch (saveError) {
      Alert.alert(
        'Nie udało się zduplikować przychodu',
        saveError instanceof Error ? saveError.message : 'Spróbuj ponownie.'
      );
    }
  }

  function handleDeleteIncome(id: string) {
    setPendingDeleteIncomeId(id);
    setDeleteConfirmationVisible(true);
  }

  async function confirmDelete() {
    if (!pendingDeleteIncomeId) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteIncome(pendingDeleteIncomeId);
      setDeleteConfirmationVisible(false);
      setPendingDeleteIncomeId(null);
    } catch (deleteError) {
      Alert.alert(
        'Nie udało się usunąć przychodu',
        deleteError instanceof Error ? deleteError.message : 'Spróbuj ponownie.'
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function cancelDelete() {
    setDeleteConfirmationVisible(false);
    setPendingDeleteIncomeId(null);
  }

  // function closeEditor() {
  //   if (isSubmitting) {
  //     return;
  //   }

  //   setEditorVisible(false);
  //   setEditingIncomeId(null);
  // }

  // async function handleSubmitIncome(values: IncomeEditorValues) {
  //   setIsSubmitting(true);

  //   try {
  //     const input = {
  //       label: values.label,
  //       description: values.description,
  //       billingType: values.billingType,
  //       baseAmount: Number(values.baseAmount),
  //       currency: values.currency,
  //       vatRate: values.vatRate,
  //       clientName: values.clientName,
  //       invoiceNumber: values.invoiceNumber,
  //       workParameters: {
  //         workingDaysPerMonth: Number(values.workingDaysPerMonth),
  //         workingHoursPerDay: Number(values.workingHoursPerDay),
  //       },
  //     } as const;

  //     if (editingIncome) {
  //       await updateIncome(editingIncome.id, input);
  //     }

  //     setEditorVisible(false);
  //     setEditingIncomeId(null);
  //   } catch (saveError) {
  //     Alert.alert(
  //       'Nie udało się zapisać przychodu',
  //       saveError instanceof Error ? saveError.message : 'Spróbuj ponownie.'
  //     );
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // }

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

        <ReportingPeriodHeader
          description="Przychody i snapshot miesięczny są zapisane pod wybranym okresem raportowym."
          onNextPress={goToNextPeriod}
          onPreviousPress={goToPreviousPeriod}
          periodLabel={selectedPeriodLabel}
          statusLabel={isLoading ? 'Ładowanie okresu' : undefined}
          title="Okres raportowy"
        />

        {incomeListSummary ? (
          <IncomeSummaryHeader
            monthLabel={incomeListSummary.monthLabel}
            pitAmount={formatCurrencyAmount(incomeListSummary.pitAmount)}
            title="Przychody"
            totalAmount={formatCurrencyAmount(incomeListSummary.totalNetAmount)}
            totalCurrency="PLN"
            totalLabel="Suma netto:"
            vatAmount={formatCurrencyAmount(incomeListSummary.vatAmount)}
          />
        ) : null}

        <SearchField
          onChangeText={setSearchQuery}
          placeholder="Szukaj klienta lub faktury..."
          value={searchQuery}
        />

        {contentState === 'loading' ? (
          <LoadingIndicator label="Ładowanie okresu raportowego..." />
        ) : contentState === 'error' ? (
          <View style={styles.emptyStateCard}>
            <EmptyState
              description={error ?? 'Nie udało się wczytać danych dla wybranego okresu.'}
              title="Nie udało się wczytać przychodów"
            />
          </View>
        ) : shouldShowListSection ? (
          <View style={styles.listSection}>
            <View style={styles.monthHeader}>
              <View style={styles.monthHeaderCopy}>
                <Text style={styles.monthLabel}>
                  {incomeListSummary?.monthLabel ?? selectedPeriodLabel}
                </Text>
                {listStatusLabel ? <Text style={styles.listStatusLabel}>{listStatusLabel}</Text> : null}
              </View>
              <View style={styles.monthActions}>
                <IconButton
                  accessibilityLabel="Filtruj przychody"
                  color={hasActiveFilters ? colors.brand.primary : colors.text.secondary}
                  filled={hasActiveFilters}
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

            {contentState === 'no-results' ? (
              <View style={styles.emptyStateCard}>
                <EmptyState
                  description={buildNoResultsDescription(searchQuery, hasActiveFilters)}
                  title="Brak wyników dla bieżącego widoku"
                />
              </View>
            ) : contentState === 'empty' ? (
              <View style={styles.emptyStateCard}>
                <EmptyState
                  description="Ten okres istnieje już w bazie, ale nie ma jeszcze zapisanych przychodów."
                  title="Brak przychodów w wybranym miesiącu"
                />
              </View>
            ) : (
              <View style={styles.cards}>
                {queryResult.items.map((item) => (
                  <IncomeListItemCard
                    amount={formatCurrencyAmount(item.amount)}
                    currency={item.currency}
                    deleteDisabled={isLoading || isDeleting}
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
            )}
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

      <ConfirmationModal
        cancelLabel="Anuluj"
        confirmLabel="Usuń"
        destructive
        loading={isDeleting}
        message="Rekord zostanie usunięty z bieżącego miesiąca."
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        title="Usunąć przychód?"
        visible={deleteConfirmationVisible}
        warningMessage={isLastIncome ? 'Po usunięciu okres raportowy będzie pusty.' : undefined}
      />

      <IncomeFiltersModal
        draftFilters={draftFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        onClose={() => setIsFilterModalVisible(false)}
        onDraftFiltersChange={setDraftFilters}
        visible={isFilterModalVisible}
      />

      <ReportingPeriodPickerModal
        draftMonth={draftMonth}
        draftYear={draftYear}
        onApply={handleApplyPeriod}
        onClose={() => setIsPeriodPickerVisible(false)}
        onDraftMonthChange={setDraftMonth}
        onDraftYearChange={setDraftYear}
        selectedPeriod={selectedPeriod}
        visible={isPeriodPickerVisible}
      />

      {/* <IncomeEditorModal
        initialValues={editorInitialValues}
        isSubmitting={isSubmitting}
        mode="edit"
        onClose={closeEditor}
        onSubmit={handleSubmitIncome}
        visible={editorVisible}
      /> */}
    </View>
  );
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  monthHeaderCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  monthLabel: {
    ...typography.sectionLabel,
    color: colors.text.secondary,
  },
  listStatusLabel: {
    ...typography.caption,
    color: colors.text.subtle,
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

const incomeToEditorValuesPlaceholder: IncomeEditorValues = {
  label: '',
  description: '',
  baseAmount: '',
  billingType: 'MONTHLY',
  currency: 'PLN',
  vatRate: '23',
  clientName: '',
  invoiceNumber: '',
  workingDaysPerMonth: '21',
  workingHoursPerDay: '8',
};

function buildListStatusLabel(searchQuery: string, appliedFilterCount: number) {
  const bits: string[] = [];

  if (searchQuery.trim()) {
    bits.push(`Szukasz: "${searchQuery.trim()}"`);
  }

  if (appliedFilterCount > 0) {
    bits.push(appliedFilterCount === 1 ? '1 aktywny filtr' : `${appliedFilterCount} aktywne filtry`);
  }

  return bits.join(' · ');
}

function buildNoResultsDescription(searchQuery: string, hasActiveFilters: boolean) {
  if (searchQuery.trim() && hasActiveFilters) {
    return 'Zmień frazę wyszukiwania albo wyczyść filtry, aby zobaczyć zapisane przychody.';
  }

  if (searchQuery.trim()) {
    return 'Brak przychodów pasujących do tej frazy. Spróbuj innej nazwy klienta lub numeru faktury.';
  }

  if (hasActiveFilters) {
    return 'Żaden zapisany przychód nie pasuje do aktywnych filtrów. Wyczyść filtry lub wybierz inne wartości.';
  }

  return 'Brak przychodów do wyświetlenia.';
}

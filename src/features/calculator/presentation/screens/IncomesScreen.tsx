import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { createMonthlyReportingPeriod } from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';
import { useCalculatorData } from '@/features/calculator/presentation/hooks/useManagedCalculatorData';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { ScreenContainer } from '@/shared/ui/layout/ScreenContainer';
import { AppHeaderAvatar } from '@/shared/ui/primitives/AppHeaderAvatar';
import { AppHeaderBrand } from '@/shared/ui/primitives/AppHeaderBrand';
import { AppTopBar } from '@/shared/ui/primitives/AppTopBar';
import { ConfirmationModal } from '@/shared/ui/primitives/ConfirmationModal';
import { EmptyState } from '@/shared/ui/primitives/EmptyState';
import { FloatingActionButton } from '@/shared/ui/primitives/FloatingActionButton';
import { IconButton } from '@/shared/ui/primitives/IconButton';
import { LoadingIndicator } from '@/shared/ui/primitives/LoadingIndicator';
import { SearchField } from '@/shared/ui/primitives/SearchField';

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
    hasAnyRecordsEver,
    hasLoadedSelectedPeriod,
    isLoading,
    reloadSelectedPeriod,
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
  const [pendingDuplicateIncomeId, setPendingDuplicateIncomeId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const isLastIncome = bundle?.incomes.length === 1;
  const incomeListItems = React.useMemo(
    () => (hasLoadedSelectedPeriod && bundle ? buildIncomeListItems(bundle) : []),
    [bundle, hasLoadedSelectedPeriod]
  );
  const incomeListSummary = React.useMemo(
    () => (hasLoadedSelectedPeriod && bundle ? buildIncomeSummaryViewModel(bundle) : null),
    [bundle, hasLoadedSelectedPeriod]
  );
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
    hasAnyRecordsEver,
  });
  const hasActiveFilters = hasActiveIncomeListFilters(filters);
  const hasSearchQuery = searchQuery.trim().length > 0;
  const listStatusLabel = buildListStatusLabel(searchQuery, queryResult.appliedFilterCount);
  const isMutatingIncome = isDeleting || pendingDuplicateIncomeId !== null;
  const shouldShowListSection =
    contentState === 'list' ||
    contentState === 'no-results' ||
    contentState === 'first-use' ||
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
    setPendingDuplicateIncomeId(id);

    try {
      await duplicateIncome(id);
    } catch (saveError) {
      Alert.alert(
        'Nie udało się zduplikować przychodu',
        saveError instanceof Error ? saveError.message : 'Spróbuj ponownie.'
      );
    } finally {
      setPendingDuplicateIncomeId(null);
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

  return (
    <View style={styles.screen}>
      <ScreenContainer contentContainerStyle={styles.content}>
        <AppTopBar
          leadingContent={<AppHeaderBrand />}
          title="KRONA"
          trailingContent={<AppHeaderAvatar />}
        />

        <View style={styles.headerSection}>
          <ReportingPeriodHeader
            onNextPress={goToNextPeriod}
            onPreviousPress={goToPreviousPeriod}
            onCalendarPress={handleCalendarPress}
            navigationDisabled={isLoading || isMutatingIncome}
            periodLabel={selectedPeriodLabel}
          />

          {incomeListSummary ? (
            <IncomeSummaryHeader
              pitAmount={formatCurrencyAmount(incomeListSummary.pitAmount)}
              title="Przychody"
              totalAmount={formatCurrencyAmount(incomeListSummary.totalNetAmount)}
              totalCurrency="PLN"
              totalLabel="Suma netto:"
              vatAmount={formatCurrencyAmount(incomeListSummary.vatAmount)}
            />
          ) : null}
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
            <View style={styles.searchFieldWrap}>
              <SearchField
                editable={!isMutatingIncome}
                onChangeText={setSearchQuery}
                placeholder="Szukaj klienta lub faktury..."
                value={searchQuery}
              />
            </View>
            <IconButton
              accessibilityHint="Otwiera filtry listy przychodów."
              accessibilityLabel={
                hasActiveFilters ? 'Filtruj przychody, aktywne filtry' : 'Filtruj przychody'
              }
              color={hasActiveFilters ? colors.brand.primary : colors.text.secondary}
              disabled={isMutatingIncome}
              filled={hasActiveFilters}
              icon="filter-variant"
              onPress={handleFilterPress}
            />
          </View>
          {listStatusLabel ? <Text style={styles.listStatusLabel}>{listStatusLabel}</Text> : null}
        </View>

        {contentState === 'loading' ? (
          <LoadingIndicator label="Ładowanie okresu raportowego..." />
        ) : contentState === 'error' ? (
          <View style={styles.emptyStateCard}>
            <EmptyState
              actionLabel="Spróbuj ponownie"
              description={error ?? 'Nie udało się wczytać danych dla wybranego okresu.'}
              onAction={reloadSelectedPeriod}
              title="Nie udało się wczytać przychodów"
              variant="error"
            />
          </View>
        ) : shouldShowListSection ? (
          <View style={styles.listSection}>
            {contentState === 'no-results' ? (
              <View style={styles.emptyStateCard}>
                <EmptyState
                  description={buildNoResultsDescription(searchQuery, hasActiveFilters)}
                  title="Brak wyników dla bieżącego widoku"
                />
              </View>
            ) : contentState === 'first-use' ? (
              <View style={styles.emptyStateCard}>
                <EmptyState
                  actionLabel="Dodaj pierwszy przychód"
                  description="Zacznij śledzić swoje przychody B2B. Dodaj fakturę lub wynagrodzenie, aby zobaczyć podsumowanie miesięczne."
                  onAction={handleAddIncome}
                  title="Witaj w Kronie"
                  variant="first-use"
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
                    actionDisabled={isMutatingIncome}
                    clientName={item.clientName}
                    currency={item.currency}
                    deleteDisabled={isLoading || isDeleting}
                    duplicateLoading={pendingDuplicateIncomeId === item.id}
                    fxLabel={item.fxLabel}
                    invoiceNumber={item.invoiceNumber}
                    key={item.id}
                    onDelete={() => handleDeleteIncome(item.id)}
                    onDuplicate={() => handleDuplicateIncome(item.id)}
                    onEdit={() => handleEditIncome(item.id)}
                    vatLabel={item.vatLabel}
                    warnings={item.warnings}
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
        accessibilityHint="Otwiera formularz dodawania nowego przychodu."
        accessibilityLabel="Dodaj przychód"
        disabled={isMutatingIncome}
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
  headerSection: {
    gap: spacing.md,
  },
  searchSection: {
    gap: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchFieldWrap: {
    flex: 1,
  },
  listSection: {
    gap: spacing.lg,
  },
  listStatusLabel: {
    ...typography.caption,
    color: colors.text.subtle,
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

function buildListStatusLabel(searchQuery: string, appliedFilterCount: number) {
  const bits: string[] = [];

  if (searchQuery.trim()) {
    bits.push(`Szukasz: "${searchQuery.trim()}"`);
  }

  if (appliedFilterCount > 0) {
    bits.push(formatAppliedFiltersLabel(appliedFilterCount));
  }

  return bits.join(' · ');
}

function formatAppliedFiltersLabel(appliedFilterCount: number) {
  if (appliedFilterCount === 1) {
    return '1 aktywny filtr';
  }

  const remainderTen = appliedFilterCount % 10;
  const remainderHundred = appliedFilterCount % 100;
  const usesFewForm =
    remainderTen >= 2 &&
    remainderTen <= 4 &&
    (remainderHundred < 12 || remainderHundred > 14);

  return usesFewForm
    ? `${appliedFilterCount} aktywne filtry`
    : `${appliedFilterCount} aktywnych filtrów`;
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

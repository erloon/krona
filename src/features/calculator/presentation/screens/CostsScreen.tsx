import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { createMonthlyReportingPeriod } from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';
import { useCalculatorData } from '@/features/calculator/presentation/hooks/useManagedCalculatorData';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { ScreenContainer } from '@/shared/ui/layout/ScreenContainer';
import { AppHeaderBrand } from '@/shared/ui/primitives/AppHeaderBrand';
import { AppTopBar } from '@/shared/ui/primitives/AppTopBar';
import { AppHeaderUser } from '@/shared/ui/primitives/AppHeaderUser';
import { ConfirmationModal } from '@/shared/ui/primitives/ConfirmationModal';
import { EmptyState } from '@/shared/ui/primitives/EmptyState';
import { FloatingActionButton } from '@/shared/ui/primitives/FloatingActionButton';
import { IconButton } from '@/shared/ui/primitives/IconButton';
import { LoadingIndicator } from '@/shared/ui/primitives/LoadingIndicator';
import { SearchField } from '@/shared/ui/primitives/SearchField';

import { CostFiltersModal } from '../components/CostFiltersModal';
import { CostListItemCard } from '../components/CostListItemCard';
import { CostSummaryHeader } from '../components/CostSummaryHeader';
import { ReportingPeriodHeader } from '../components/ReportingPeriodHeader';
import { ReportingPeriodPickerModal } from '../components/ReportingPeriodPickerModal';
import {
  getSelectedPeriodLabel,
  resolveCostsScreenContentState,
} from '../hooks/calculatorDataState';
import {
  buildCostListItems,
  buildCostSummaryViewModel,
  formatCurrencyAmount,
} from '../view-models/calculatorViewModels';
import {
  defaultCostListFilters,
  hasActiveCostListFilters,
  queryCostListItems,
  type CostListFilters,
} from '../view-models/costListQuery';

export function CostsScreen() {
  const {
    bundle,
    deleteCost,
    duplicateCost,
    error,
    goToNextPeriod,
    goToPreviousPeriod,
    hasAnyCostsEver,
    hasLoadedSelectedPeriod,
    isLoading,
    reloadSelectedPeriod,
    selectPeriod,
    selectedPeriod,
  } = useCalculatorData();
  const [filters, setFilters] = React.useState<CostListFilters>(defaultCostListFilters);
  const [draftFilters, setDraftFilters] = React.useState<CostListFilters>(defaultCostListFilters);
  const [isFilterModalVisible, setIsFilterModalVisible] = React.useState(false);
  const [isPeriodPickerVisible, setIsPeriodPickerVisible] = React.useState(false);
  const [draftYear, setDraftYear] = React.useState(String(selectedPeriod.year));
  const [draftMonth, setDraftMonth] = React.useState(String(selectedPeriod.month));
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] = React.useState(false);
  const [pendingDeleteCostId, setPendingDeleteCostId] = React.useState<string | null>(null);
  const [pendingDuplicateCostId, setPendingDuplicateCostId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const isLastCost = bundle?.costs.length === 1;
  const costItems = React.useMemo(
    () => (hasLoadedSelectedPeriod && bundle ? buildCostListItems(bundle) : []),
    [bundle, hasLoadedSelectedPeriod]
  );
  const costSummary = React.useMemo(
    () => (hasLoadedSelectedPeriod && bundle ? buildCostSummaryViewModel(bundle) : null),
    [bundle, hasLoadedSelectedPeriod]
  );
  const selectedPeriodLabel = React.useMemo(
    () => getSelectedPeriodLabel(selectedPeriod),
    [selectedPeriod]
  );
  const queryResult = React.useMemo(
    () => queryCostListItems(costItems, filters),
    [costItems, filters]
  );
  const contentState = resolveCostsScreenContentState({
    isLoading,
    error,
    hasLoadedSelectedPeriod,
    hasAnyRecordsInPeriod: queryResult.hasAnyRecordsInPeriod,
    hasVisibleResults: queryResult.hasVisibleResults,
    hasAnyCostsEver,
  });
  const hasActiveFilters = hasActiveCostListFilters(filters);
  const listStatusLabel = hasActiveFilters
    ? formatAppliedFiltersLabel(queryResult.appliedFilterCount)
    : null;
  const isMutatingCost = isDeleting || pendingDuplicateCostId !== null;
  const shouldShowListSection =
    contentState === 'list' ||
    contentState === 'no-results' ||
    contentState === 'first-use' ||
    queryResult.hasAnyRecordsInPeriod ||
    hasActiveFilters;

  function handleAddCost() {
    router.push('/add-cost');
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
    setDraftFilters(defaultCostListFilters);
    setFilters(defaultCostListFilters);
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

  function handleEditCost(id: string) {
    router.push(`/edit-cost?id=${id}` as const);
  }

  async function handleDuplicateCost(id: string) {
    setPendingDuplicateCostId(id);

    try {
      await duplicateCost(id);
    } catch (saveError) {
      Alert.alert(
        'Nie udało się zduplikować kosztu',
        saveError instanceof Error ? saveError.message : 'Spróbuj ponownie.'
      );
    } finally {
      setPendingDuplicateCostId(null);
    }
  }

  function handleDeleteCost(id: string) {
    setPendingDeleteCostId(id);
    setDeleteConfirmationVisible(true);
  }

  async function confirmDelete() {
    if (!pendingDeleteCostId) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteCost(pendingDeleteCostId);
      setDeleteConfirmationVisible(false);
      setPendingDeleteCostId(null);
    } catch (deleteError) {
      Alert.alert(
        'Nie udało się usunąć kosztu',
        deleteError instanceof Error ? deleteError.message : 'Spróbuj ponownie.'
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function cancelDelete() {
    setDeleteConfirmationVisible(false);
    setPendingDeleteCostId(null);
  }

  return (
    <View style={styles.screen}>
      <ScreenContainer contentContainerStyle={styles.content}>
        <AppTopBar
          leadingContent={<AppHeaderBrand />}
          title="KRONA"
          trailingContent={<AppHeaderUser />}
        />

        <View style={styles.headerSection}>
          <ReportingPeriodHeader
            navigationDisabled={isLoading || isMutatingCost}
            onCalendarPress={handleCalendarPress}
            onNextPress={goToNextPeriod}
            onPreviousPress={goToPreviousPeriod}
            periodLabel={selectedPeriodLabel}
          />

          {costSummary ? (
            <CostSummaryHeader
              pitAmount={formatCurrencyAmount(costSummary.pitReductionAmount)}
              title="Koszty"
              totalAmount={formatCurrencyAmount(costSummary.totalAmount)}
              vatAmount={formatCurrencyAmount(costSummary.vatOffsetAmount)}
            />
          ) : null}
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
            <View style={styles.searchFieldWrap}>
              <SearchField
                accessibilityHint="Pole informacyjne dla listy kosztów. Filtrowanie odbywa się przez przycisk obok."
                accessibilityLabel="Informacja o filtrowaniu kosztów"
                editable={false}
                placeholder="Filtruj listę według kategorii i VAT..."
                value=""
              />
            </View>
            <IconButton
              accessibilityHint="Otwiera filtry listy kosztów."
              accessibilityLabel={
                hasActiveFilters ? 'Filtruj koszty, aktywne filtry' : 'Filtruj koszty'
              }
              color={hasActiveFilters ? colors.brand.primary : colors.text.secondary}
              disabled={isMutatingCost}
              filled={hasActiveFilters}
              icon="filter-variant"
              onPress={handleFilterPress}
            />
          </View>
          {listStatusLabel ? <Text style={styles.listStatusLabel}>{listStatusLabel}</Text> : null}
        </View>

        {contentState === 'loading' ? (
          <LoadingIndicator label="Ładowanie kosztów dla okresu..." />
        ) : contentState === 'error' ? (
          <View style={styles.emptyStateCard}>
            <EmptyState
              actionLabel="Spróbuj ponownie"
              description={error ?? 'Nie udało się wczytać kosztów dla wybranego okresu.'}
              onAction={reloadSelectedPeriod}
              title="Nie udało się wczytać kosztów"
              variant="error"
            />
          </View>
        ) : shouldShowListSection ? (
          <View style={styles.listSection}>
            <View style={styles.listHeading}>
              <Text style={styles.listTitle}>Lista wydatków</Text>
              <Text style={styles.listSubtitle}>
                Wybrany miesiąc wskazuje zapisany okres raportowy z własnym snapshotem ustawień.
              </Text>
            </View>

            {contentState === 'no-results' ? (
              <View style={styles.emptyStateCard}>
                <EmptyState
                  description="Żaden zapisany koszt nie pasuje do aktywnych filtrów. Wyczyść filtry lub wybierz inne wartości."
                  title="Brak wyników dla bieżącego widoku"
                />
              </View>
            ) : contentState === 'first-use' ? (
              <View style={styles.emptyStateCard}>
                <EmptyState
                  actionLabel="Dodaj pierwszy koszt"
                  description="Dodaj pierwszy koszt w Kronie. Sam formularz dodawania zostanie dopięty w kolejnym kroku, ale nawigacja jest już gotowa."
                  onAction={handleAddCost}
                  title="Brak zapisanych kosztów"
                  variant="first-use"
                />
              </View>
            ) : contentState === 'empty' ? (
              <View style={styles.emptyStateCard}>
                <EmptyState
                  description="Wybrany okres raportowy nie ma jeszcze zapisanych kosztów."
                  title="Brak kosztów w tym miesiącu"
                />
              </View>
            ) : (
              <View style={styles.cards}>
                {queryResult.items.map((item) => (
                  <CostListItemCard
                    actionDisabled={isMutatingCost}
                    amount={formatCurrencyAmount(item.amount)}
                    categoryLabel={item.categoryLabel}
                    deductionLabel={item.deductionLabel}
                    deleteDisabled={isLoading || isDeleting}
                    duplicateLoading={pendingDuplicateCostId === item.id}
                    fxLabel={item.fxLabel}
                    key={item.id}
                    netAmount={formatCurrencyAmount(item.netAmount)}
                    onDelete={() => handleDeleteCost(item.id)}
                    onDuplicate={() => handleDuplicateCost(item.id)}
                    onEdit={() => handleEditCost(item.id)}
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
              description="Wybrany okres raportowy nie ma jeszcze zapisanych kosztów."
              title="Brak kosztów w tym miesiącu"
            />
          </View>
        )}

        <View style={styles.footerNote}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>Raport kosztów wygenerowany automatycznie</Text>
        </View>
      </ScreenContainer>

      <FloatingActionButton
        accessibilityHint="Otwiera przygotowaną nawigację do dodawania nowego kosztu."
        accessibilityLabel="Dodaj koszt"
        disabled={isMutatingCost}
        onPress={handleAddCost}
        style={styles.fab}
      />

      <ConfirmationModal
        cancelLabel="Anuluj"
        confirmLabel="Usuń"
        destructive
        loading={isDeleting}
        message="Koszt zostanie trwale usunięty z bieżącego miesiąca."
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        title="Usunąć koszt?"
        visible={deleteConfirmationVisible}
        warningMessage={isLastCost ? 'Po usunięciu okres raportowy będzie pusty.' : undefined}
      />

      <CostFiltersModal
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
  listHeading: {
    gap: spacing.xs,
  },
  listTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '700',
  },
  listSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
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
  footerNote: {
    gap: spacing.xs,
    opacity: 0.5,
  },
  footerLine: {
    height: 1,
    width: '75%',
    backgroundColor: 'rgba(113, 119, 132, 0.35)',
  },
  footerText: {
    ...typography.caption,
    color: colors.text.secondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 104,
  },
});

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

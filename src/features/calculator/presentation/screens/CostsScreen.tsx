import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useCalculatorData } from '@/features/calculator/presentation/hooks/useManagedCalculatorData';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { ScreenContainer } from '@/shared/ui/layout/ScreenContainer';
import { AppTopBar } from '@/shared/ui/primitives/AppTopBar';
import { EmptyState } from '@/shared/ui/primitives/EmptyState';
import { FloatingActionButton } from '@/shared/ui/primitives/FloatingActionButton';
import { IconButton } from '@/shared/ui/primitives/IconButton';
import { LoadingIndicator } from '@/shared/ui/primitives/LoadingIndicator';

import { CostListItemCard } from '../components/CostListItemCard';
import { IncomeSummaryHeader } from '../components/IncomeSummaryHeader';
import { ReportingPeriodHeader } from '../components/ReportingPeriodHeader';
import {
  buildCostListItems,
  buildCostSummaryViewModel,
  formatCurrencyAmount,
} from '../view-models/calculatorViewModels';

export function CostsScreen() {
  const { bundle, error, goToNextPeriod, goToPreviousPeriod, isLoading } = useCalculatorData();
  const costSummary = bundle ? buildCostSummaryViewModel(bundle) : null;
  const costItems = bundle ? buildCostListItems(bundle) : [];

  function handleAddCost() {
    // Placeholder for navigation to the cost creation flow.
  }

  return (
    <View style={styles.screen}>
      <ScreenContainer contentContainerStyle={styles.content}>
        <AppTopBar
          leadingContent={<IconButton accessibilityLabel="Menu" icon="menu" />}
          title="KRONA"
          trailingContent={null}
        />

        {bundle ? (
          <>
            <ReportingPeriodHeader
              description="Koszty są przypisane do tego samego miesiąca raportowego co przychody i snapshot obciążeń."
              onNextPress={goToNextPeriod}
              onPreviousPress={goToPreviousPeriod}
              periodLabel={costSummary?.monthLabel ?? ''}
              title="Okres kosztowy"
            />

            <IncomeSummaryHeader
              monthLabel={costSummary?.monthLabel}
              pitAmount={formatCurrencyAmount(costSummary?.deductibleAmount ?? 0)}
              title="Koszty"
              totalAmount={formatCurrencyAmount(costSummary?.totalAmount ?? 0)}
              totalCurrency="PLN"
              totalLabel="Koszt gotówkowy:"
              vatAmount={formatCurrencyAmount(costSummary?.vatOffsetAmount ?? 0)}
            />
          </>
        ) : null}

        {isLoading ? (
          <LoadingIndicator label="Ładowanie kosztów dla okresu..." />
        ) : error ? (
          <View style={styles.emptyStateCard}>
            <EmptyState description={error} title="Nie udało się wczytać kosztów" />
          </View>
        ) : costItems.length ? (
          <View style={styles.cards}>
            {costItems.map((item) => (
              <CostListItemCard
                amount={formatCurrencyAmount(item.amount)}
                categoryLabel={item.categoryLabel}
                key={item.id}
                metadata={item.metadata}
                title={item.title}
                vatLabel={item.vatLabel}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyStateCard}>
            <EmptyState
              description="Wybrany okres raportowy nie ma jeszcze zapisanych kosztów."
              title="Brak kosztów w tym miesiącu"
            />
          </View>
        )}
      </ScreenContainer>

      <FloatingActionButton accessibilityLabel="Dodaj koszt" onPress={handleAddCost} style={styles.fab} />
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
  helper: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
});

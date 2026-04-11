import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/theme';
import { ScreenContainer } from '@/shared/ui/layout/ScreenContainer';
import { AppTopBar } from '@/shared/ui/primitives/AppTopBar';
import { EmptyState } from '@/shared/ui/primitives/EmptyState';
import { FloatingActionButton } from '@/shared/ui/primitives/FloatingActionButton';
import { IconButton } from '@/shared/ui/primitives/IconButton';
import { SearchField } from '@/shared/ui/primitives/SearchField';

import { IncomeListItemCard } from '../components/IncomeListItemCard';
import { IncomeSummaryHeader } from '../components/IncomeSummaryHeader';
import {
  formatCurrencyAmount,
  incomeListItems,
  incomeListSummary,
  type IncomeListItemViewModel,
} from '../view-models/incomeList';

export function IncomesScreen() {
  const [searchQuery, setSearchQuery] = React.useState('');

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('pl-PL');
  const filteredItems = normalizedQuery
    ? incomeListItems.filter((item) =>
        `${item.title} ${item.metadata}`.toLocaleLowerCase('pl-PL').includes(normalizedQuery)
      )
    : incomeListItems;

  const groupedItems = filteredItems.reduce<Record<string, IncomeListItemViewModel[]>>(
    (groups, item) => {
      const currentItems = groups[item.monthKey] ?? [];
      currentItems.push(item);
      groups[item.monthKey] = currentItems;
      return groups;
    },
    {}
  );

  function handleAddIncome() {
    // Placeholder for navigation to the income creation flow.
  }

  function handleFilterPress() {
    // Placeholder for opening list filters.
  }

  function handleCalendarPress() {
    // Placeholder for opening month selection.
  }

  function handleEditIncome(_id: string) {
    // Placeholder for navigation to the income edit flow.
  }

  function handleDuplicateIncome(_id: string) {
    // Placeholder for income duplication logic.
  }

  function handleDeleteIncome(_id: string) {
    // Placeholder for delete confirmation.
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

        <IncomeSummaryHeader
          pitAmount={formatCurrencyAmount(incomeListSummary.pitAmount)}
          title="Przychody"
          totalAmount={formatCurrencyAmount(incomeListSummary.totalNetAmount)}
          totalCurrency="PLN"
          totalLabel="Suma netto:"
          vatAmount={formatCurrencyAmount(incomeListSummary.vatAmount)}
        />

        <SearchField
          onChangeText={setSearchQuery}
          placeholder="Szukaj klienta lub faktury..."
          value={searchQuery}
        />

        {filteredItems.length ? (
          <View style={styles.listSection}>
            {Object.entries(groupedItems).map(([monthKey, items]) => (
              <View key={monthKey} style={styles.monthGroup}>
                <View style={styles.monthHeader}>
                  <Text style={styles.monthLabel}>{monthKey}</Text>
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
                  {items.map((item) => (
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
            ))}
          </View>
        ) : (
          <View style={styles.emptyStateCard}>
            <EmptyState
              description="Spróbuj zmienić zapytanie albo dodaj nowy przychód, aby rozpocząć listę."
              title="Brak wyników dla tego wyszukiwania"
            />
          </View>
        )}
      </ScreenContainer>

      <FloatingActionButton
        accessibilityLabel="Dodaj przychód"
        onPress={handleAddIncome}
        style={styles.fab}
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
  monthGroup: {
    gap: spacing.md,
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

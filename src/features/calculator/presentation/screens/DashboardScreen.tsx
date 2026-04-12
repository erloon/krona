import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { createMonthlyReportingPeriod } from '@/features/calculator/domain/value-objects/MonthlyReportingPeriod';
import { useCalculatorData } from '@/features/calculator/presentation/hooks/useManagedCalculatorData';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { ScreenContainer } from '@/shared/ui/layout/ScreenContainer';
import { AppTopBar } from '@/shared/ui/primitives/AppTopBar';
import { EmptyState } from '@/shared/ui/primitives/EmptyState';
import { IconButton } from '@/shared/ui/primitives/IconButton';
import { LoadingIndicator } from '@/shared/ui/primitives/LoadingIndicator';
import { SurfaceCard } from '@/shared/ui/primitives/SurfaceCard';

import { ReportingPeriodHeader } from '../components/ReportingPeriodHeader';
import { ReportingPeriodPickerModal } from '../components/ReportingPeriodPickerModal';
import { getSelectedPeriodLabel } from '../hooks/calculatorDataState';
import {
  buildDashboardViewModel,
  formatCurrencyAmount,
} from '../view-models/calculatorViewModels';

export function DashboardScreen() {
  const {
    bundle,
    error,
    goToNextPeriod,
    goToPreviousPeriod,
    hasLoadedSelectedPeriod,
    isLoading,
    selectPeriod,
    selectedPeriod,
  } = useCalculatorData();
  const [isPeriodPickerVisible, setIsPeriodPickerVisible] = React.useState(false);
  const [draftYear, setDraftYear] = React.useState(String(selectedPeriod.year));
  const [draftMonth, setDraftMonth] = React.useState(String(selectedPeriod.month));
  const dashboard = hasLoadedSelectedPeriod && bundle ? buildDashboardViewModel(bundle) : null;
  const selectedPeriodLabel = React.useMemo(
    () => getSelectedPeriodLabel(selectedPeriod),
    [selectedPeriod]
  );

  function handleCalendarPress() {
    setDraftYear(String(selectedPeriod.year));
    setDraftMonth(String(selectedPeriod.month));
    setIsPeriodPickerVisible(true);
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

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <AppTopBar
        leadingContent={<IconButton accessibilityLabel="Menu" icon="menu" />}
        title="KRONA"
        trailingContent={null}
      />

      <ReportingPeriodHeader
        navigationDisabled={isLoading}
        onCalendarPress={handleCalendarPress}
        onNextPress={goToNextPeriod}
        onPreviousPress={goToPreviousPeriod}
        periodLabel={selectedPeriodLabel}
      />

      {isLoading ? (
        <LoadingIndicator label="Ładowanie dashboardu..." />
      ) : error ? (
        <View style={styles.emptyStateCard}>
          <EmptyState description={error} title="Nie udało się wczytać dashboardu" />
        </View>
      ) : dashboard ? (
        <>
          <SurfaceCard style={styles.heroCard}>
            <Text style={styles.heroLabel}>Netto na rękę</Text>
            <View style={styles.heroValueRow}>
              <Text style={styles.heroValue}>{formatCurrencyAmount(dashboard.netToHandAmount)}</Text>
              <Text style={styles.heroCurrency}>PLN</Text>
            </View>
          </SurfaceCard>

          <View style={styles.metricGrid}>
            <MetricCard label="Przychód" value={formatCurrencyAmount(dashboard.revenueAmount)} />
            <MetricCard label="Koszty" value={formatCurrencyAmount(dashboard.costAmount)} />
            <MetricCard label="PIT" value={formatCurrencyAmount(dashboard.pitAmount)} />
            <MetricCard label="VAT do zapłaty" value={formatCurrencyAmount(dashboard.vatPayableAmount)} />
            <MetricCard label="ZUS" value={formatCurrencyAmount(dashboard.zusAmount)} />
            <MetricCard
              label="Zdrowotna"
              value={formatCurrencyAmount(dashboard.healthContributionAmount)}
            />
          </View>
        </>
      ) : (
        <View style={styles.emptyStateCard}>
          <EmptyState
            description="Wybrany okres raportowy nie ma jeszcze zapisanych danych do podsumowania."
            title="Brak danych dla dashboardu"
          />
        </View>
      )}

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
    </ScreenContainer>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
};

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <SurfaceCard style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricCurrency}>PLN</Text>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
  },
  emptyStateCard: {
    borderRadius: radius.featured,
    backgroundColor: colors.background.surfaceContainerLow,
    paddingHorizontal: spacing.md,
  },
  heroCard: {
    gap: spacing.md,
  },
  heroLabel: {
    ...typography.sectionLabel,
    color: colors.text.secondary,
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  heroValue: {
    ...typography.display,
    color: colors.brand.primary,
    fontSize: 54,
    lineHeight: 56,
  },
  heroCurrency: {
    ...typography.metricValueCompact,
    color: colors.brand.primary,
  },
  metricGrid: {
    gap: spacing.md,
  },
  metricCard: {
    gap: spacing.xs,
  },
  metricLabel: {
    ...typography.sectionLabel,
    color: colors.text.secondary,
  },
  metricValue: {
    ...typography.metricValueCompact,
    color: colors.text.primary,
  },
  metricCurrency: {
    ...typography.caption,
    color: colors.text.subtle,
  },
});

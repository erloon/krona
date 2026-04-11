import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useCalculatorData } from '@/features/calculator/presentation/hooks/useManagedCalculatorData';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { ScreenContainer } from '@/shared/ui/layout/ScreenContainer';
import { AppTopBar } from '@/shared/ui/primitives/AppTopBar';
import { EmptyState } from '@/shared/ui/primitives/EmptyState';
import { IconButton } from '@/shared/ui/primitives/IconButton';
import { LoadingIndicator } from '@/shared/ui/primitives/LoadingIndicator';
import { SurfaceCard } from '@/shared/ui/primitives/SurfaceCard';

import { ReportingPeriodHeader } from '../components/ReportingPeriodHeader';
import {
  buildDashboardViewModel,
  formatCurrencyAmount,
} from '../view-models/calculatorViewModels';

export function DashboardScreen() {
  const { bundle, error, goToNextPeriod, goToPreviousPeriod, isLoading } = useCalculatorData();
  const dashboard = bundle ? buildDashboardViewModel(bundle) : null;

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <AppTopBar
        leadingContent={<IconButton accessibilityLabel="Menu" icon="menu" />}
        title="KRONA"
        trailingContent={null}
      />

      {bundle ? (
        <ReportingPeriodHeader
          description="Dashboard czyta zapisany snapshot obciążeń i rekordy powiązane z wybranym miesiącem."
          onNextPress={goToNextPeriod}
          onPreviousPress={goToPreviousPeriod}
          periodLabel={dashboard?.monthLabel ?? ''}
          statusLabel={dashboard?.statusLabel}
          title="Okres dashboardu"
        />
      ) : null}

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
            <Text style={styles.heroPeriod}>{dashboard.monthLabel}</Text>
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
      ) : null}
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
  heroPeriod: {
    ...typography.bodySmall,
    color: colors.text.secondary,
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

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
import { EmptyState } from '@/shared/ui/primitives/EmptyState';
import { InfoBanner } from '@/shared/ui/primitives/InfoBanner';
import { LoadingIndicator } from '@/shared/ui/primitives/LoadingIndicator';
import { MetricCard } from '@/shared/ui/primitives/MetricCard';
import { PrimaryButton } from '@/shared/ui/primitives/PrimaryButton';
import { ProgressBar } from '@/shared/ui/primitives/ProgressBar';
import { SecondaryButton } from '@/shared/ui/primitives/SecondaryButton';
import { SummaryHero } from '@/shared/ui/primitives/SummaryHero';
import { SurfaceCard } from '@/shared/ui/primitives/SurfaceCard';

import { FinancialBreakdownCard } from '../components/FinancialBreakdownCard';
import { FinancialBreakdownRow } from '../components/FinancialBreakdownRow';
import { ReportingPeriodHeader } from '../components/ReportingPeriodHeader';
import { ReportingPeriodPickerModal } from '../components/ReportingPeriodPickerModal';
import {
  getSelectedPeriodLabel,
  resolveDashboardScreenContentState,
} from '../hooks/calculatorDataState';
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
    hasAnyRecordsEver,
    hasLoadedSelectedPeriod,
    isLoading,
    reloadSelectedPeriod,
    selectPeriod,
    selectedPeriod,
  } = useCalculatorData();
  const [isBreakdownExpanded, setIsBreakdownExpanded] = React.useState(false);
  const [isCostSavingsExpanded, setIsCostSavingsExpanded] = React.useState(false);
  const [isPeriodPickerVisible, setIsPeriodPickerVisible] = React.useState(false);
  const [draftYear, setDraftYear] = React.useState(String(selectedPeriod.year));
  const [draftMonth, setDraftMonth] = React.useState(String(selectedPeriod.month));
  const dashboard = hasLoadedSelectedPeriod && bundle ? buildDashboardViewModel(bundle) : null;
  const ipBoxEstimate = dashboard?.ipBoxEstimate ?? null;
  const selectedPeriodLabel = React.useMemo(
    () => getSelectedPeriodLabel(selectedPeriod),
    [selectedPeriod]
  );
  const contentState = resolveDashboardScreenContentState({
    isLoading,
    error,
    hasLoadedSelectedPeriod,
    hasAnyRecordsEver,
    hasMeaningfulSnapshot: Boolean(bundle && bundle.incomes.length > 0),
  });

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

  function handleAddIncome() {
    if (!dashboard) {
      router.push('/add-income');
      return;
    }

    router.push(dashboard.actions.primaryRoute);
  }

  function handleAddCost() {
    if (!dashboard) {
      router.push('/add-cost');
      return;
    }

    router.push(dashboard.actions.secondaryRoute);
  }

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <AppTopBar
        leadingContent={<AppHeaderBrand />}
        title="KRONA"
        trailingContent={<AppHeaderUser />}
      />

      <View style={styles.headerSection}>
        <ReportingPeriodHeader
          navigationDisabled={isLoading}
          onCalendarPress={handleCalendarPress}
          onNextPress={goToNextPeriod}
          onPreviousPress={goToPreviousPeriod}
          periodLabel={selectedPeriodLabel}
        />

        {dashboard ? (
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>{dashboard.welcomeTitle}</Text>
            <Text style={styles.welcomeDescription}>{dashboard.welcomeDescription}</Text>
          </View>
        ) : null}
      </View>

      {contentState === 'loading' ? (
        <LoadingIndicator label="Ładowanie dashboardu..." />
      ) : contentState === 'error' ? (
        <View style={styles.emptyStateCard}>
          <EmptyState
            actionLabel="Spróbuj ponownie"
            description={error ?? 'Nie udało się wczytać danych dla wybranego okresu.'}
            onAction={reloadSelectedPeriod}
            title="Nie udało się wczytać dashboardu"
            variant="error"
          />
        </View>
      ) : contentState === 'first-use' ? (
        <View style={styles.emptyStateCard}>
          <EmptyState
            actionLabel="Dodaj pierwszy przychód"
            description="Dodaj pierwszy przychód, aby zobaczyć miesięczny wynik, obciążenia i szczegółowe podsumowanie."
            onAction={handleAddIncome}
            title="Witaj w Kronie"
            variant="first-use"
          />
        </View>
      ) : contentState === 'empty-period' ? (
        <View style={styles.emptyStateCard}>
          <EmptyState
            actionLabel="Dodaj przychód"
            description="Wybrany okres raportowy nie ma jeszcze zapisanych danych, które pozwalają zbudować dashboard."
            onAction={handleAddIncome}
            title="Brak danych dla tego miesiąca"
          />
        </View>
      ) : dashboard ? (
        <>
          <SummaryHero
            amount={formatCurrencyAmount(dashboard.hero.amount)}
            currency={dashboard.hero.currency}
            eyebrow={dashboard.hero.eyebrow}
            statusLabel={dashboard.statusLabel}
          />

          <View style={styles.metricGrid}>
            <View style={styles.metricGridColumn}>
              <MetricCard
                accessibilityHint="Przechodzi do listy przychodów dla bieżącego okresu."
                accessibilityLabel={`Przychody ${formatCurrencyAmount(dashboard.revenueCard.amount)} PLN`}
                amount={formatCurrencyAmount(dashboard.revenueCard.amount)}
                currency={dashboard.revenueCard.currency}
                label={dashboard.revenueCard.label}
                onPress={() => router.push(dashboard.revenueCard.route)}
              />
            </View>
            <View style={styles.metricGridColumn}>
              <MetricCard
                accessibilityHint="Przechodzi do listy kosztów dla bieżącego okresu."
                accessibilityLabel={`Koszty ${formatCurrencyAmount(dashboard.costCard.amount)} PLN`}
                amount={formatCurrencyAmount(dashboard.costCard.amount)}
                currency={dashboard.costCard.currency}
                label={dashboard.costCard.label}
                onPress={() => router.push(dashboard.costCard.route)}
              />
            </View>
          </View>

          <SurfaceCard
            accessible
            accessibilityLabel={`Obciążenia przedsiębiorcy ${dashboard.burden.percentageLabel}`}
            accessibilityHint="Pokazuje udział PIT, ZUS i składki zdrowotnej w przychodzie bieżącego okresu."
            style={styles.burdenCard}
          >
            <View style={styles.burdenHeader}>
              <Text style={styles.burdenTitle}>{dashboard.burden.title}</Text>
              <View style={styles.burdenMeta}>
                <Text style={styles.burdenAmount}>{dashboard.burden.detailLabel} PLN</Text>
                <Text style={styles.burdenPercentage}>{dashboard.burden.percentageLabel}</Text>
              </View>
            </View>
            <ProgressBar progress={dashboard.burden.ratio} />
          </SurfaceCard>

          <MetricCard
            accessibilityHint="Pokazuje wyłącznie informacyjną kwotę rozliczenia VAT za bieżący okres."
            accessibilityLabel={`${dashboard.vatInfo.label} ${formatCurrencyAmount(dashboard.vatInfo.amount)} PLN`}
            amount={formatCurrencyAmount(dashboard.vatInfo.amount)}
            currency={dashboard.vatInfo.currency}
            label={dashboard.vatInfo.label}
          />

          <InfoBanner
            message={`${dashboard.thresholdContext.title}: ${dashboard.thresholdContext.detail}`}
          />

          <View style={styles.actionsGrid}>
            <View style={styles.actionColumn}>
              <PrimaryButton
                accessibilityHint="Otwiera formularz dodawania nowego przychodu."
                accessibilityLabel={dashboard.actions.primaryLabel}
                fullWidth={false}
                label={dashboard.actions.primaryLabel}
                onPress={handleAddIncome}
                style={styles.actionButton}
              />
            </View>
            <View style={styles.actionColumn}>
              <SecondaryButton
                accessibilityHint="Otwiera formularz dodawania nowego kosztu."
                accessibilityLabel={dashboard.actions.secondaryLabel}
                fullWidth={false}
                label={dashboard.actions.secondaryLabel}
                onPress={handleAddCost}
                style={styles.actionButton}
              />
            </View>
          </View>

          <FinancialBreakdownCard
            accessibilityHint="Rozwija lub zwija listę podatków i składek dla bieżącego okresu."
            accessibilityLabel={
              isBreakdownExpanded
                ? 'Zwiń podatki i składki'
                : 'Rozwiń podatki i składki'
            }
            expanded={isBreakdownExpanded}
            onToggle={() => setIsBreakdownExpanded((current) => !current)}
            rows={dashboard.breakdown.rows.map((row) => ({
              key: row.key,
              label: row.label,
              amount: formatCurrencyAmount(row.amount),
            }))}
            summaryAmount={formatCurrencyAmount(dashboard.breakdown.summaryAmount)}
            summaryLabel={dashboard.breakdown.summaryLabel}
            title={dashboard.breakdown.title}
          />

          <FinancialBreakdownCard
            accessibilityHint="Rozwija lub zwija listę oszczędności podatkowych wynikających z kosztów."
            accessibilityLabel={
              isCostSavingsExpanded
                ? 'Zwiń korzyści z kosztów'
                : 'Rozwiń korzyści z kosztów'
            }
            expanded={isCostSavingsExpanded}
            onToggle={() => setIsCostSavingsExpanded((current) => !current)}
            rows={dashboard.costSavings.rows.map((row) => ({
              key: row.key,
              label: row.label,
              amount: formatCurrencyAmount(row.amount),
            }))}
            summaryAmount={formatCurrencyAmount(dashboard.costSavings.summaryAmount)}
            summaryLabel={dashboard.costSavings.summaryLabel}
            title={dashboard.costSavings.title}
          />

          {ipBoxEstimate ? (
            <SurfaceCard style={styles.ipBoxCard}>
              <View style={styles.ipBoxHeader}>
                <Text style={styles.ipBoxTitle}>{ipBoxEstimate.title}</Text>
                <Text style={styles.ipBoxCaption}>{ipBoxEstimate.caption}</Text>
              </View>

              <View style={styles.ipBoxRows}>
                {ipBoxEstimate.rows.map((row, index) => (
                  <View
                    key={row.key}
                    style={index < ipBoxEstimate.rows.length - 1 ? styles.ipBoxRow : null}
                  >
                    <FinancialBreakdownRow
                      amount={row.value}
                      currency={row.unit === '%' ? '' : row.unit}
                      label={row.label}
                    />
                  </View>
                ))}
              </View>

              {ipBoxEstimate.warning ? (
                <InfoBanner message={ipBoxEstimate.warning} />
              ) : null}
            </SurfaceCard>
          ) : null}
        </>
      ) : null}

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

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
    paddingBottom: 120,
  },
  headerSection: {
    gap: spacing.lg,
  },
  welcomeSection: {
    gap: spacing.xs,
  },
  welcomeTitle: {
    ...typography.screenTitle,
    color: colors.text.primary,
  },
  welcomeDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricGridColumn: {
    flex: 1,
    minWidth: 220,
  },
  burdenCard: {
    gap: spacing.md,
  },
  burdenHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  burdenTitle: {
    ...typography.sectionLabel,
    color: colors.text.secondary,
  },
  burdenMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  burdenAmount: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '700',
  },
  burdenPercentage: {
    ...typography.caption,
    color: colors.brand.primary,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionColumn: {
    flex: 1,
    minWidth: 220,
  },
  actionButton: {
    width: '100%',
  },
  emptyStateCard: {
    borderRadius: radius.featured,
    backgroundColor: colors.background.surfaceContainerLow,
    paddingHorizontal: spacing.md,
  },
  ipBoxCard: {
    gap: spacing.lg,
  },
  ipBoxHeader: {
    gap: spacing.xs,
  },
  ipBoxTitle: {
    ...typography.sectionLabel,
    color: colors.text.primary,
  },
  ipBoxCaption: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  ipBoxRows: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  ipBoxRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
});

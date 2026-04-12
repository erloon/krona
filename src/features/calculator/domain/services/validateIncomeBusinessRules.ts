import type {
  Income,
  IncomeBillingType,
  IncomeCurrency,
  IncomeVatRate,
} from '@/features/calculator/domain/entities/income';

/**
 * Validation warning codes for income business rules.
 * Warnings are non-blocking but should be shown to the user.
 */
export const INCOME_WARNING_CODES = {
  UNREALISTIC_WORKING_DAYS: 'UNREALISTIC_WORKING_DAYS',
  UNREALISTIC_HOURS_PER_DAY: 'UNREALISTIC_HOURS_PER_DAY',
  HIGH_MONTHLY_REVENUE: 'HIGH_MONTHLY_REVENUE',
  NP_WITH_FOREIGN_CURRENCY: 'NP_WITH_FOREIGN_CURRENCY',
  FOREIGN_CURRENCY_CUSTOM_RATE: 'FOREIGN_CURRENCY_CUSTOM_RATE',
  MISSING_EXCHANGE_RATE_EFFECTIVE_DATE: 'MISSING_EXCHANGE_RATE_EFFECTIVE_DATE',
  MONTHLY_WITH_LOW_WORKLOAD: 'MONTHLY_WITH_LOW_WORKLOAD',
} as const;

export type IncomeWarningCode = (typeof INCOME_WARNING_CODES)[keyof typeof INCOME_WARNING_CODES];

/**
 * Validation error codes for income business rules.
 * Errors block form submission and entity creation.
 */
export const INCOME_ERROR_CODES = {
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  INVALID_WORKING_DAYS: 'INVALID_WORKING_DAYS',
  INVALID_HOURS_PER_DAY: 'INVALID_HOURS_PER_DAY',
  MISSING_WORKING_DAYS: 'MISSING_WORKING_DAYS',
  MISSING_HOURS_PER_DAY: 'MISSING_HOURS_PER_DAY',
  INVALID_EXCHANGE_RATE: 'INVALID_EXCHANGE_RATE',
  INVALID_EXCHANGE_RATE_DATE: 'INVALID_EXCHANGE_RATE_DATE',
  INVALID_IP_BOX_PERCENT: 'INVALID_IP_BOX_PERCENT',
  INVALID_LUMP_SUM_RATE: 'INVALID_LUMP_SUM_RATE',
} as const;

export type IncomeErrorCode = (typeof INCOME_ERROR_CODES)[keyof typeof INCOME_ERROR_CODES];

export type IncomeValidationWarning = Readonly<{
  code: IncomeWarningCode;
  message: string;
  field?: string;
}>;

export type IncomeValidationError = Readonly<{
  code: IncomeErrorCode;
  message: string;
  field: string;
}>;

export type IncomeValidationResult = Readonly<{
  isValid: boolean;
  errors: readonly IncomeValidationError[];
  warnings: readonly IncomeValidationWarning[];
}>;

/**
 * Input type for validating income before entity creation.
 * Matches the form state structure from AddIncomeScreen/EditIncomeScreen.
 */
export type IncomeValidationInput = Readonly<{
  baseAmount: number;
  billingType: IncomeBillingType;
  currency: IncomeCurrency;
  vatRate: IncomeVatRate;
  workingDaysPerMonth: number;
  workingHoursPerDay: number;
  exchangeRate: number;
  exchangeRateEffectiveDate: string;
  ipBoxQualifiedIncomePercent: string | null;
  lumpSumRate: string | null;
}>;

// Validation constants from functional specifications
const MAX_WORKING_DAYS_PER_MONTH = 31;
const MAX_HOURS_PER_DAY = 24;
const WARNING_WORKING_DAYS_THRESHOLD = 26; // Above this is unusual
const WARNING_HOURS_PER_DAY_THRESHOLD = 12; // Above this is unusual
const WARNING_HIGH_REVENUE_THRESHOLD_PLN = 100_000;

/**
 * Validates income input against business rules before entity creation.
 * Returns a structured result with errors (blocking) and warnings (non-blocking).
 *
 * @param input - The income input to validate
 * @returns IncomeValidationResult with errors and warnings
 */
export function validateIncomeInputBusinessRules(input: IncomeValidationInput): IncomeValidationResult {
  const errors: IncomeValidationError[] = [];
  const warnings: IncomeValidationWarning[] = [];

  // Amount validation (from time-based-rate-conversion.md)
  validateAmount(input.baseAmount, errors, warnings);

  // Work parameters validation based on billing type
  validateWorkParameters(
    input.billingType,
    input.workingDaysPerMonth,
    input.workingHoursPerDay,
    errors,
    warnings
  );

  // Currency and exchange rate validation
  validateCurrencyAndExchangeRate(
    input.currency,
    input.exchangeRate,
    input.exchangeRateEffectiveDate,
    errors,
    warnings
  );

  // VAT handling warnings
  validateVatHandling(input.vatRate, input.currency, warnings);

  // Optional fields validation
  validateOptionalFields(input.ipBoxQualifiedIncomePercent, input.lumpSumRate, errors);

  // Cross-field warnings
  validateCrossFieldWarnings(input, warnings);

  return {
    isValid: errors.length === 0,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
  };
}

/**
 * Validates an existing Income entity for display in the list.
 * Only returns warnings (entity is already valid by construction).
 */
export function validateIncomeEntityBusinessRules(income: Income): IncomeValidationResult {
  const warnings: IncomeValidationWarning[] = [];

  // Work parameters warnings
  if (income.workParameters.workingDaysPerMonth > WARNING_WORKING_DAYS_THRESHOLD) {
    warnings.push({
      code: INCOME_WARNING_CODES.UNREALISTIC_WORKING_DAYS,
      message: `Liczba dni (${income.workParameters.workingDaysPerMonth}) jest wyższa niż typowe 21–26 dni roboczych.`,
      field: 'workingDaysPerMonth',
    });
  }

  if (income.workParameters.workingHoursPerDay > WARNING_HOURS_PER_DAY_THRESHOLD) {
    warnings.push({
      code: INCOME_WARNING_CODES.UNREALISTIC_HOURS_PER_DAY,
      message: `Liczba godzin (${income.workParameters.workingHoursPerDay}) jest wyższa niż typowe 8 godzin.`,
      field: 'workingHoursPerDay',
    });
  }

  // High revenue warning
  const monthlyNetAmount = calculateMonthlyNetPreview(income);
  if (monthlyNetAmount > WARNING_HIGH_REVENUE_THRESHOLD_PLN) {
    warnings.push({
      code: INCOME_WARNING_CODES.HIGH_MONTHLY_REVENUE,
      message: `Miesięczny przychód (${formatMoneyPLN(monthlyNetAmount)}) jest wysoki. Sprawdź progi PIT i składki zdrowotnej.`,
    });
  }

  // VAT + foreign currency warning
  if (income.vatRate === 'NP' && income.currency !== 'PLN') {
    warnings.push({
      code: INCOME_WARNING_CODES.NP_WITH_FOREIGN_CURRENCY,
      message: 'Stawka NP z walutą inną niż PLN sugeruje usługę zagraniczną (reverse charge).',
    });
  }

  // Custom exchange rate warning
  if (income.currency !== 'PLN' && income.exchangeRateSource === 'CUSTOM') {
    warnings.push({
      code: INCOME_WARNING_CODES.FOREIGN_CURRENCY_CUSTOM_RATE,
      message: 'Używasz własnego kursu wymiany. Obliczenia mogą różnić się od oficjalnych rozliczeń.',
    });
  }

  return {
    isValid: true,
    errors: [],
    warnings: Object.freeze(warnings),
  };
}

// --- Internal validation functions ---

function validateAmount(
  baseAmount: number,
  errors: IncomeValidationError[],
  warnings: IncomeValidationWarning[]
): void {
  // Required: amount must be positive (from docs: "Base Rate Value cannot be negative")
  if (!Number.isFinite(baseAmount) || baseAmount <= 0) {
    errors.push({
      code: INCOME_ERROR_CODES.INVALID_AMOUNT,
      message: 'Kwota netto musi być większa od zera.',
      field: 'baseAmount',
    });
    return; // Don't add warnings if invalid
  }

  // Soft warning for very large amounts
  if (baseAmount > WARNING_HIGH_REVENUE_THRESHOLD_PLN) {
    warnings.push({
      code: INCOME_WARNING_CODES.HIGH_MONTHLY_REVENUE,
      message: `Kwota ${formatMoneyPLN(baseAmount)} jest wysoka. Sprawdź progi PIT i składki zdrowotnej.`,
      field: 'baseAmount',
    });
  }
}

function validateWorkParameters(
  billingType: IncomeBillingType,
  workingDaysPerMonth: number,
  workingHoursPerDay: number,
  errors: IncomeValidationError[],
  warnings: IncomeValidationWarning[]
): void {
  // Daily mode: days/month required (from time-based-rate-conversion.md)
  if (billingType === 'DAILY' || billingType === 'HOURLY') {
    if (!Number.isFinite(workingDaysPerMonth) || workingDaysPerMonth <= 0) {
      errors.push({
        code: INCOME_ERROR_CODES.MISSING_WORKING_DAYS,
        message: 'Podaj liczbę dni roboczych w miesiącu.',
        field: 'workingDaysPerMonth',
      });
    } else if (workingDaysPerMonth > MAX_WORKING_DAYS_PER_MONTH) {
      errors.push({
        code: INCOME_ERROR_CODES.INVALID_WORKING_DAYS,
        message: `Liczba dni nie może przekraczać ${MAX_WORKING_DAYS_PER_MONTH}.`,
        field: 'workingDaysPerMonth',
      });
    } else if (workingDaysPerMonth > WARNING_WORKING_DAYS_THRESHOLD) {
      warnings.push({
        code: INCOME_WARNING_CODES.UNREALISTIC_WORKING_DAYS,
        message: `Liczba dni (${workingDaysPerMonth}) jest wyższa niż typowe 21–26 dni roboczych.`,
        field: 'workingDaysPerMonth',
      });
    }
  }

  // Hourly mode: hours/day required (from time-based-rate-conversion.md)
  if (billingType === 'HOURLY') {
    if (!Number.isFinite(workingHoursPerDay) || workingHoursPerDay <= 0) {
      errors.push({
        code: INCOME_ERROR_CODES.MISSING_HOURS_PER_DAY,
        message: 'Podaj liczbę godzin pracy na dzień.',
        field: 'workingHoursPerDay',
      });
    } else if (workingHoursPerDay > MAX_HOURS_PER_DAY) {
      errors.push({
        code: INCOME_ERROR_CODES.INVALID_HOURS_PER_DAY,
        message: `Liczba godzin nie może przekraczać ${MAX_HOURS_PER_DAY}.`,
        field: 'workingHoursPerDay',
      });
    } else if (workingHoursPerDay > WARNING_HOURS_PER_DAY_THRESHOLD) {
      warnings.push({
        code: INCOME_WARNING_CODES.UNREALISTIC_HOURS_PER_DAY,
        message: `Liczba godzin (${workingHoursPerDay}) jest wyższa niż typowe 8 godzin.`,
        field: 'workingHoursPerDay',
      });
    }
  }
}

function validateCurrencyAndExchangeRate(
  currency: IncomeCurrency,
  exchangeRate: number,
  exchangeRateEffectiveDate: string,
  errors: IncomeValidationError[],
  warnings: IncomeValidationWarning[]
): void {
  // Non-PLN currency requires valid exchange rate (from currency-conversion-module.md)
  if (currency !== 'PLN') {
    if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
      errors.push({
        code: INCOME_ERROR_CODES.INVALID_EXCHANGE_RATE,
        message: 'Kurs wymiany musi być większy od zera.',
        field: 'exchangeRate',
      });
    }

    // Date format validation (YYYY-MM-DD)
    if (!exchangeRateEffectiveDate || !/^\d{4}-\d{2}-\d{2}$/.test(exchangeRateEffectiveDate)) {
      errors.push({
        code: INCOME_ERROR_CODES.INVALID_EXCHANGE_RATE_DATE,
        message: 'Data kursu musi być w formacie RRRR-MM-DD.',
        field: 'exchangeRateEffectiveDate',
      });
    }
  }
}

function validateVatHandling(
  vatRate: IncomeVatRate,
  currency: IncomeCurrency,
  warnings: IncomeValidationWarning[]
): void {
  // NP (not taxable) with foreign currency suggests cross-border/reverse charge
  // (from currency-conversion-module.md: "No implicit VAT assumptions based on currency alone")
  if (vatRate === 'NP' && currency !== 'PLN') {
    warnings.push({
      code: INCOME_WARNING_CODES.NP_WITH_FOREIGN_CURRENCY,
      message: 'Stawka NP z walutą inną niż PLN sugeruje usługę zagraniczną (reverse charge).',
    });
  }
}

function validateOptionalFields(
  ipBoxQualifiedIncomePercent: string | null,
  lumpSumRate: string | null,
  errors: IncomeValidationError[]
): void {
  // IP Box percentage validation (from project-description.md: 5% preferential rate)
  if (ipBoxQualifiedIncomePercent !== null && ipBoxQualifiedIncomePercent.trim() !== '') {
    const percent = Number(ipBoxQualifiedIncomePercent.replace(',', '.'));
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      errors.push({
        code: INCOME_ERROR_CODES.INVALID_IP_BOX_PERCENT,
        message: 'Procent kwalifikowanego przychodu IP Box musi być między 0 i 100.',
        field: 'ipBoxQualifiedIncomePercent',
      });
    }
  }

  // Lump sum rate validation (from project-description.md: 2%–17%)
  if (lumpSumRate !== null && lumpSumRate.trim() !== '') {
    const ratePattern = /^(\d{1,2})([.,]\d{1,2})?$/;
    if (!ratePattern.test(lumpSumRate.trim())) {
      errors.push({
        code: INCOME_ERROR_CODES.INVALID_LUMP_SUM_RATE,
        message: 'Stawka ryczałtu musi być liczbą (np. 12 lub 12.5).',
        field: 'lumpSumRate',
      });
    }
  }
}

function validateCrossFieldWarnings(
  input: IncomeValidationInput,
  warnings: IncomeValidationWarning[]
): void {
  // Monthly mode with very low workload might indicate user misunderstanding
  if (input.billingType === 'MONTHLY') {
    // If monthly amount seems unusually high relative to typical workload
    if (input.baseAmount > 50_000 && input.workingDaysPerMonth < 10) {
      warnings.push({
        code: INCOME_WARNING_CODES.MONTHLY_WITH_LOW_WORKLOAD,
        message: 'Stawka miesięczna z małą liczbą dni może wskazywać na nieprawidłowe dane.',
      });
    }
  }
}

// --- Helper functions ---

function calculateMonthlyNetPreview(income: Income): number {
  switch (income.billingType) {
    case 'DAILY':
      return income.baseAmount * income.workParameters.workingDaysPerMonth * income.exchangeRate;
    case 'HOURLY':
      return (
        income.baseAmount *
        income.workParameters.workingDaysPerMonth *
        income.workParameters.workingHoursPerDay *
        income.exchangeRate
      );
    default:
      return income.baseAmount * income.exchangeRate;
  }
}

function formatMoneyPLN(amount: number): string {
  return `${amount.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PLN`;
}

/**
 * Helper to check if validation result has any blocking errors.
 */
export function hasValidationErrors(result: IncomeValidationResult): boolean {
  return result.errors.length > 0;
}

/**
 * Helper to check if validation result has any warnings.
 */
export function hasValidationWarnings(result: IncomeValidationResult): boolean {
  return result.warnings.length > 0;
}

/**
 * Helper to get first error message for display.
 */
export function getFirstErrorMessage(result: IncomeValidationResult): string | null {
  return result.errors.length > 0 ? result.errors[0].message : null;
}

/**
 * Helper to format all warnings as bullet list for display.
 */
export function formatWarningsAsList(result: IncomeValidationResult): string[] {
  return result.warnings.map((w) => w.message);
}

import type {
  AppCurrency,
  AppLanguage,
  LumpSumRate,
  TaxationForm,
  ZusStatus,
} from '@/features/settings/domain/entities/app-settings';
import type { SelectOption } from '@/shared/ui/primitives/SelectField';

export const taxationFormOptions: {
  title: string;
  description: string;
  value: TaxationForm;
}[] = [
  {
    title: 'Skala podatkowa',
    description: '12% / 32% (zasady ogólne)',
    value: 'SCALE',
  },
  {
    title: 'Podatek liniowy',
    description: 'Stała stawka 19%',
    value: 'FLAT_19',
  },
  {
    title: 'Ryczałt',
    description: 'Ewidencjonowany (2% - 17%)',
    value: 'LUMP_SUM',
  },
];

export const lumpSumRateOptions: SelectOption<LumpSumRate>[] = [
  { value: '12', label: '12% - usługi IT' },
  { value: '8_5', label: '8.5% - usługi projektowe' },
  { value: '17', label: '17% - wolne zawody' },
  { value: '5_5', label: '5.5% - działalność wytwórcza' },
  { value: '15', label: '15% - pośrednictwo' },
  { value: '14', label: '14% - opieka zdrowotna' },
  { value: '3', label: '3% - handel' },
  { value: '2', label: '2% - sprzedaż produktów rolnych' },
];

export const zusStatusOptions: {
  title: string;
  description: string;
  value: ZusStatus;
}[] = [
  {
    title: 'Ulga na start',
    description: 'Pierwsze 6 miesięcy bez społecznego ZUS',
    value: 'STARTUP',
  },
  {
    title: 'Składka preferencyjna',
    description: 'Zmniejszona podstawa przez 24 miesiące',
    value: 'PREFERENTIAL',
  },
  {
    title: 'Brak ulgi (standard)',
    description: 'Pełna podstawa ZUS',
    value: 'STANDARD',
  },
  {
    title: 'Umowa o pracę',
    description: 'Brak społecznego ZUS przy spełnieniu progu etatu',
    value: 'UOP',
  },
];

export const languageOptions: SelectOption<AppLanguage>[] = [
  { value: 'pl-PL', label: 'Polski (PL)' },
  { value: 'en-US', label: 'English (US)' },
];

export const currencyOptions: SelectOption<AppCurrency>[] = [
  { value: 'PLN', label: 'PLN' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
  { value: 'GBP', label: 'GBP' },
  { value: 'CHF', label: 'CHF' },
];

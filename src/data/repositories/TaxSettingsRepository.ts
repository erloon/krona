import type { TaxSettings } from '../../domain/models';

export type TaxSettingsRepository = {
  get(): Promise<TaxSettings | null>;
  save(settings: TaxSettings): Promise<void>;
};

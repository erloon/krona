import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 3;

export async function initializeDatabase(database: SQLiteDatabase) {
  await database.execAsync('PRAGMA journal_mode = WAL;');

  const result = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const userVersion = result?.user_version ?? 0;

  if (userVersion >= DATABASE_VERSION) {
    return;
  }

  await database.withTransactionAsync(async () => {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY NOT NULL,
        version INTEGER NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS reporting_periods (
        id TEXT PRIMARY KEY NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    await database.execAsync(`
      CREATE UNIQUE INDEX IF NOT EXISTS reporting_periods_year_month_idx
      ON reporting_periods(year, month);
    `);

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS reporting_period_settings_snapshots (
        reporting_period_id TEXT PRIMARY KEY NOT NULL,
        version INTEGER NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (reporting_period_id) REFERENCES reporting_periods(id) ON DELETE CASCADE
      );
    `);

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS monthly_calculation_snapshots (
        reporting_period_id TEXT PRIMARY KEY NOT NULL,
        version INTEGER NOT NULL,
        payload TEXT NOT NULL,
        calculated_at TEXT NOT NULL,
        FOREIGN KEY (reporting_period_id) REFERENCES reporting_periods(id) ON DELETE CASCADE
      );
    `);

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS incomes (
        id TEXT PRIMARY KEY NOT NULL,
        reporting_period_id TEXT NOT NULL,
        label TEXT NOT NULL,
        description TEXT NOT NULL,
        net_amount REAL NOT NULL,
        currency TEXT NOT NULL,
        vat_rate TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (reporting_period_id) REFERENCES reporting_periods(id) ON DELETE CASCADE
      );
    `);

    await database.execAsync(`
      CREATE INDEX IF NOT EXISTS incomes_reporting_period_idx
      ON incomes(reporting_period_id);
    `);

    await database.execAsync(`
      ALTER TABLE incomes ADD COLUMN billing_type TEXT NOT NULL DEFAULT 'MONTHLY';
    `).catch(() => undefined);

    await database.execAsync(`
      ALTER TABLE incomes ADD COLUMN base_amount REAL NOT NULL DEFAULT 0;
    `).catch(() => undefined);

    await database.execAsync(`
      ALTER TABLE incomes ADD COLUMN working_days_per_month INTEGER NOT NULL DEFAULT 21;
    `).catch(() => undefined);

    await database.execAsync(`
      ALTER TABLE incomes ADD COLUMN working_hours_per_day INTEGER NOT NULL DEFAULT 8;
    `).catch(() => undefined);

    await database.execAsync(`
      ALTER TABLE incomes ADD COLUMN exchange_rate REAL NOT NULL DEFAULT 1;
    `).catch(() => undefined);

    await database.execAsync(`
      ALTER TABLE incomes ADD COLUMN exchange_rate_source TEXT NOT NULL DEFAULT 'STATIC';
    `).catch(() => undefined);

    await database.execAsync(`
      ALTER TABLE incomes ADD COLUMN exchange_rate_effective_date TEXT NOT NULL DEFAULT '1970-01-01';
    `).catch(() => undefined);

    await database.execAsync(`
      ALTER TABLE incomes ADD COLUMN lump_sum_rate TEXT;
    `).catch(() => undefined);

    await database.execAsync(`
      ALTER TABLE incomes ADD COLUMN ip_box_qualified_income_percent TEXT;
    `).catch(() => undefined);

    await database.execAsync(`
      ALTER TABLE incomes ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
    `).catch(() => undefined);

    await database.execAsync(`
      ALTER TABLE incomes ADD COLUMN client_name TEXT NOT NULL DEFAULT '';
    `).catch(() => undefined);

    await database.execAsync(`
      ALTER TABLE incomes ADD COLUMN invoice_number TEXT NOT NULL DEFAULT '';
    `).catch(() => undefined);

    await database.execAsync(`
      UPDATE incomes
      SET
        base_amount = CASE
          WHEN base_amount = 0 THEN net_amount
          ELSE base_amount
        END,
        exchange_rate = CASE
          WHEN exchange_rate <= 0 THEN 1
          ELSE exchange_rate
        END,
        exchange_rate_source = CASE
          WHEN exchange_rate_source = 'STATIC' AND currency <> 'PLN' THEN 'NBP_TABLE_A'
          ELSE exchange_rate_source
        END,
        exchange_rate_effective_date = CASE
          WHEN exchange_rate_effective_date = '1970-01-01' THEN substr(created_at, 1, 10)
          ELSE exchange_rate_effective_date
        END,
        is_active = CASE
          WHEN is_active IS NULL THEN 1
          ELSE is_active
        END;
    `);

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS costs (
        id TEXT PRIMARY KEY NOT NULL,
        reporting_period_id TEXT NOT NULL,
        label TEXT NOT NULL,
        description TEXT NOT NULL,
        net_amount REAL NOT NULL,
        vat_rate TEXT NOT NULL,
        category TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (reporting_period_id) REFERENCES reporting_periods(id) ON DELETE CASCADE
      );
    `);

    await database.execAsync(`
      CREATE INDEX IF NOT EXISTS costs_reporting_period_idx
      ON costs(reporting_period_id);
    `);

    await database.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
  });
}

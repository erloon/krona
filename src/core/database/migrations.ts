import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 2;

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

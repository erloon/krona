import type { Config } from 'drizzle-kit';

export default {
  schema: './src/data/schema/index.ts',
  out: './src/data/migrations',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;

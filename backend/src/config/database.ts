import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { env } from './env';
import type { Database } from '../types/database';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: env.IS_PRODUCTION ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
});

export async function testConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('✅ Database connection established');
  } finally {
    client.release();
  }
}

export default db;

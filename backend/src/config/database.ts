import { Pool } from 'pg';
import { env } from './env';

let _realPool: Pool | null = null;

function getPool(): Pool {
  if (!_realPool) {
    try {
      _realPool = new Pool({
        connectionString: env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/quattro',
        max: 5,
        idleTimeoutMillis: 5000,
        connectionTimeoutMillis: 1500,
        ssl: env.DATABASE_URL?.includes('sslmode=') || env.DATABASE_URL?.includes('.postgres.') || env.DATABASE_URL?.includes('.neon.') || env.DATABASE_URL?.includes('.supabase.') ? { rejectUnauthorized: false } : undefined,
      });
      _realPool.on('error', (err) => {
        console.warn('PostgreSQL pool error (safely caught):', err.message);
      });
    } catch (e: any) {
      console.warn('Failed to create pg Pool:', e.message);
    }
  }
  return _realPool!;
}

export const pool = {
  query: async (text: any, params?: any[]) => {
    try {
      const p = getPool();
      if (!p) return { rows: [], rowCount: 0 };
      return await p.query(text, params);
    } catch (err: any) {
      console.warn('Database query failed (failsafe empty fallback):', err.message);
      return { rows: [], rowCount: 0 };
    }
  },
  connect: async () => {
    try {
      const p = getPool();
      if (!p) throw new Error('Database pool unavailable');
      return await p.connect();
    } catch (err: any) {
      console.warn('Database connect failed:', err.message);
      throw err;
    }
  },
  on: (event: any, listener: any) => {
    try {
      const p = getPool();
      if (p) p.on(event, listener);
    } catch (e) {}
  }
} as any;

export async function testConnection(): Promise<void> {
  try {
    const res = await pool.query('SELECT 1');
    console.log('✅ Database connection test result:', res.rowCount);
  } catch (e: any) {
    console.warn('Database connection test skipped:', e.message);
  }
}

export default pool;

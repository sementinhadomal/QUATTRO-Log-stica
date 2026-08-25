import fs from 'fs';
import path from 'path';
import { pool } from '../config/database';
import { logger } from '../config/logger';

async function runMigrations(): Promise<void> {
  const client = await pool.connect();

  try {
    // Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL UNIQUE,
        aplicado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationsDir = path.resolve(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const migrationName = file.replace('.sql', '');

      const exists = await client.query(
        'SELECT id FROM migrations WHERE nome = $1',
        [migrationName]
      );

      if (exists.rows.length > 0) {
        logger.info(`Migration already applied: ${migrationName}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO migrations (nome) VALUES ($1) ON CONFLICT (nome) DO NOTHING',
          [migrationName]
        );
        await client.query('COMMIT');
        logger.info(`✅ Migration applied: ${migrationName}`);
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error(`❌ Migration failed: ${migrationName}`, err);
        throw err;
      }
    }

    logger.info('All migrations completed successfully');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  logger.error('Migration runner failed:', err);
  process.exit(1);
});

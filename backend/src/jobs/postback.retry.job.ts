import cron from 'node-cron';
import { pool } from '../config/database';
import { logger } from '../config/logger';
import { sendPostbackRequest } from '../modules/postbacks/postback.service';

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    const attemptsRes = await pool.query(`
      SELECT p.*, c.url_destino, c.secret_key
      FROM postback_attempts p
      JOIN postback_configs c ON c.id = p.config_id
      WHERE p.sucesso = FALSE 
      AND p.proxima_tentativa <= NOW() 
      AND p.tentativa < 5
    `);

    for (const attempt of attemptsRes.rows) {
      const config = {
        id: attempt.config_id,
        url_destino: attempt.url_destino,
        secret_key: attempt.secret_key
      };
      const payload = typeof attempt.payload === 'string' ? JSON.parse(attempt.payload) : attempt.payload;
      
      await sendPostbackRequest(config, payload, attempt.id, attempt.tentativa + 1);
    }
  } catch (error: any) {
    logger.error('Postback retry job error:', error);
  }
});

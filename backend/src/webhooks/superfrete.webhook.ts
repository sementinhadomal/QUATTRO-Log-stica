import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { pool } from '../config/database';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { triggerPostback } from '../modules/postbacks/postback.service';

export const superfreteWebhookRouter = Router();

superfreteWebhookRouter.post('/', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-superfrete-signature'] as string;
    const bodyBuf = req.body; // Needs express.raw()

    if (env.SUPERFRETE_WEBHOOK_SECRET && signature) {
      const expected = crypto
        .createHmac('sha256', env.SUPERFRETE_WEBHOOK_SECRET)
        .update(bodyBuf)
        .digest('hex');
        
      if (signature !== expected) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const payload = JSON.parse(bodyBuf.toString('utf8'));
    const { tracking_code, status, event_date, description } = payload;
    
    // Hash deduplication to prevent duplicate events
    const eventHash = crypto.createHash('md5').update(`${tracking_code}${status}${event_date}`).digest('hex');
    
    const checkRes = await pool.query('SELECT id FROM tracking_events WHERE hash = $1', [eventHash]);
    if (checkRes.rowCount && checkRes.rowCount > 0) {
      return res.json({ message: 'Already processed' });
    }

    const orderRes = await pool.query('SELECT id FROM orders WHERE rastreio_codigo = $1', [tracking_code]);
    if (orderRes.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found for tracking code' });
    }
    const orderId = orderRes.rows[0].id;

    // Map status
    let newStatus = null;
    switch (status) {
      case 'posted':
      case 'collected':
      case 'in_transit':
        newStatus = 'em_transito';
        break;
      case 'out_for_delivery':
        newStatus = 'saiu_para_entrega';
        break;
      case 'delivery_failed':
        newStatus = 'entrega_falhou';
        break;
      case 'available_for_pickup':
        newStatus = 'aguardando_retirada';
        break;
      case 'delivered':
        newStatus = 'entregue_aguardando_pagamento';
        break;
      case 'returning':
        newStatus = 'devolvido';
        break;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      await client.query(
        `INSERT INTO tracking_events (pedido_id, codigo_rastreio, status, descricao, data_evento, hash)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, tracking_code, status, description, new Date(event_date), eventHash]
      );

      if (newStatus) {
        await client.query(`UPDATE orders SET status = $1 WHERE id = $2`, [newStatus, orderId]);
        
        await client.query(
          `INSERT INTO order_history (pedido_id, status, observacao, sistema)
           VALUES ($1, $2, $3, true)`,
          [orderId, newStatus, `Atualização SuperFrete: ${description}`]
        );
      }
      
      await client.query('COMMIT');
    } catch (dbErr) {
      await client.query('ROLLBACK');
      throw dbErr;
    } finally {
      client.release();
    }

    if (newStatus) {
      await triggerPostback('rastreio', orderId);
    }

    res.json({ received: true });
  } catch (error: any) {
    logger.error('SuperFrete webhook error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});

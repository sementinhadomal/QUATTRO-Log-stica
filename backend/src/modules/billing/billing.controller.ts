import { Request, Response } from 'express';
import crypto from 'crypto';
import { pool } from '../../config/database';
import { logger } from '../../config/logger';
import { triggerPostback } from '../postbacks/postback.service';

export async function getPayments(req: Request, res: Response) {
  const { orderId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM payment_receipts WHERE pedido_id = $1', [orderId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pagamentos.' });
  }
}

export async function addReceipt(req: Request, res: Response) {
  const { orderId } = req.params;
  const file = req.file;

  if (!file) return res.status(400).json({ error: 'Comprovante obrigatório.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const fileInsert = await client.query(
      `INSERT INTO files (nome_original, nome_arquivo, caminho, tipo_mime, tamanho)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [file.originalname, file.filename, file.path, file.mimetype, file.size]
    );

    const fileId = fileInsert.rows[0].id;

    await client.query(
      `INSERT INTO payment_receipts (pedido_id, arquivo_id, validado, criado_por)
       VALUES ($1, $2, false, $3)`,
      [orderId, fileId, (req.session as any).userId]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Comprovante adicionado.' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Erro ao salvar comprovante.' });
  } finally {
    client.release();
  }
}

export async function handlePaytWebhook(req: Request, res: Response) {
  try {
    // Expected to be mounted with express.raw() or express.json({ verify: ... }) in app.ts
    // For simplicity, verify using stringified body if not raw
    const signature = req.headers['x-payt-signature'] as string;
    const bodyStr = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
    
    // Implement validation if payt secret is configured
    /*
    const expected = crypto.createHmac('sha256', env.PAYT_SECRET).update(bodyStr).digest('hex');
    if (signature !== expected) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    */

    const payload = JSON.parse(bodyStr);
    
    if (payload.event === 'payment_approved') {
      const orderId = payload.order_id;
      if (orderId) {
        await pool.query(
          `UPDATE orders SET status_pagamento = 'pago', data_pagamento = NOW() WHERE id = $1`,
          [orderId]
        );
        await triggerPostback('pagamento_aprovado', orderId);
      }
    } else if (payload.event === 'payment_declined') {
      const orderId = payload.order_id;
      if (orderId) {
        await pool.query(
          `UPDATE orders SET status = 'inadimplente', atualizado_em = NOW() WHERE id = $1`,
          [orderId]
        );
        await triggerPostback('inadimplente', orderId);
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    logger.error('Payt webhook error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
}

import crypto from 'crypto';
import axios from 'axios';
import { pool } from '../../config/database';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

export type PostbackEvent =
  | 'pedido_criado'
  | 'aguardando_confirmacao'
  | 'agendado'
  | 'rastreio'
  | 'em_transito'
  | 'saiu_para_entrega'
  | 'entrega_falhou'
  | 'aguardando_retirada'
  | 'entregue'
  | 'aguardando_pagamento'
  | 'pagamento_aprovado'
  | 'inadimplente'
  | 'em_acordo'
  | 'frustrado'
  | 'devolvido'
  | 'cancelado';

export async function triggerPostback(event: PostbackEvent, orderId: string): Promise<void> {
  try {
    const configsRes = await pool.query(
      `SELECT * FROM postback_configs WHERE ativo = true AND eventos_ativados ? $1`,
      [event]
    );

    if (configsRes.rowCount === 0) return;

    const orderRes = await pool.query(`
      SELECT o.*, c.nome as cliente_nome, c.email as cliente_email, c.telefone as cliente_telefone 
      FROM orders o
      JOIN clients c ON c.id = o.cliente_id
      WHERE o.id = $1
    `, [orderId]);

    if (orderRes.rowCount === 0) return;
    const order = orderRes.rows[0];

    const payload = {
      event,
      order_id: order.id,
      codigo_pedido: order.codigo_pedido,
      status: order.status,
      valor_total: order.valor_total,
      cliente: {
        nome: order.cliente_nome,
        email: order.cliente_email,
        telefone: order.cliente_telefone,
      },
      timestamp: new Date().toISOString()
    };

    for (const config of configsRes.rows) {
      await sendPostbackRequest(config, payload);
    }
  } catch (error: any) {
    logger.error('Error triggering postback', { error: error.message, event, orderId });
  }
}

async function sendPostbackRequest(config: any, payload: any, attemptRecordId?: string, tentativa = 1) {
  const secret = config.secret_key || env.POSTBACK_SIGNING_SECRET || 'default_secret';
  const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

  let responseStatus = null;
  let responseBody = null;
  let sucesso = false;

  try {
    const res = await axios.post(config.url_destino, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-QUATTRO-Signature': `sha256=${signature}`
      },
      timeout: 10000
    });
    responseStatus = res.status;
    responseBody = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    sucesso = responseStatus >= 200 && responseStatus < 300;
  } catch (error: any) {
    if (error.response) {
      responseStatus = error.response.status;
      responseBody = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
    } else {
      responseBody = error.message;
    }
  }

  // Calculate next retry if failed
  let proximaTentativa = null;
  if (!sucesso && tentativa < 5) {
    const backoffs = [1, 5, 15, 60, 240]; // minutes
    const backoffMinutes = backoffs[tentativa - 1];
    proximaTentativa = new Date(Date.now() + backoffMinutes * 60000);
  }

  if (attemptRecordId) {
    await pool.query(
      `UPDATE postback_attempts 
       SET tentativa = $1, sucesso = $2, response_status = $3, response_body = $4, proxima_tentativa = $5, atualizado_em = NOW()
       WHERE id = $6`,
      [tentativa, sucesso, responseStatus, responseBody, proximaTentativa, attemptRecordId]
    );
  } else {
    await pool.query(
      `INSERT INTO postback_attempts (config_id, payload, tentativa, sucesso, response_status, response_body, proxima_tentativa)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [config.id, JSON.stringify(payload), tentativa, sucesso, responseStatus, responseBody, proximaTentativa]
    );
  }
}

export { sendPostbackRequest }; // For retry job

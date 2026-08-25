import cron from 'node-cron';
import axios from 'axios';
import { pool } from '../config/database';
import { logger } from '../config/logger';
import { triggerPostback } from '../modules/postbacks/postback.service';

// Cron job running every 2 hours
cron.schedule('0 */2 * * *', async () => {
  logger.info('🔄 Rodando sincronização automática de rastreamento (Fullativo API)...');
  
  let client;
  try {
    client = await pool.connect();
    
    const ordersRes = await client.query(`
      SELECT id, rastreio_codigo, status 
      FROM orders 
      WHERE status IN ('em_transito', 'saiu_para_entrega', 'entrega_falhou', 'agendado', 'aguardando_retirada') 
      AND rastreio_codigo IS NOT NULL
      AND deletado_em IS NULL
    `);

    if (ordersRes.rows.length === 0) {
      logger.info('ℹ️ Nenhum pedido em trânsito com código de rastreio para sincronizar.');
      return;
    }

    for (const order of ordersRes.rows) {
      try {
        const url = `https://base2.sistemafullativo.online:80/api/rastreio?codigo=${encodeURIComponent(order.rastreio_codigo)}`;
        const response = await axios.get(url, { timeout: 8000, validateStatus: () => true });

        if (response.status === 200 && response.data) {
          const trackingData = response.data;
          const statusText = JSON.stringify(trackingData).toLowerCase();

          let newStatus: string | null = null;

          if (statusText.includes('entregue') || statusText.includes('delivered')) {
            newStatus = 'entregue_aguardando_pagamento';
          } else if (statusText.includes('saiu para entrega') || statusText.includes('out for delivery')) {
            newStatus = 'saiu_para_entrega';
          } else if (statusText.includes('aguardando retirada') || statusText.includes('pickup')) {
            newStatus = 'aguardando_retirada';
          } else if (statusText.includes('devolvido') || statusText.includes('retornando')) {
            newStatus = 'devolvido';
          } else if (statusText.includes('falha') || statusText.includes('failed')) {
            newStatus = 'entrega_falhou';
          } else if (statusText.includes('em transito') || statusText.includes('in transit') || statusText.includes('postado')) {
            newStatus = 'em_transito';
          }

          if (newStatus && newStatus !== order.status) {
            await client.query(
              `UPDATE orders SET status = $1, atualizado_em = NOW() WHERE id = $2`,
              [newStatus, order.id]
            );

            // Log event in history
            await client.query(
              `INSERT INTO order_history (id, order_id, status_anterior, status_novo, descricao)
               VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
              [order.id, order.status, newStatus, `Atualização automática via API de rastreio: ${newStatus}`]
            );

            // Trigger postback if event changed
            triggerPostback(newStatus as any, order.id).catch(() => {});
            logger.info(`✅ Pedido ${order.id} teve o status atualizado para: ${newStatus}`);
          }
        }
      } catch (orderErr: any) {
        logger.warn(`Erro ao consultar rastreio do pedido ${order.id}:`, orderErr.message);
      }
    }

    logger.info(`🎉 Job de rastreamento concluído. ${ordersRes.rows.length} pedidos verificados.`);
  } catch (error: any) {
    logger.error('Erro no job de sincronização de rastreamento:', error.message);
  } finally {
    if (client) client.release();
  }
});

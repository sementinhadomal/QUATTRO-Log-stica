import { Request, Response } from 'express';
import { pool } from '../../config/database';
import { logger } from '../../config/logger';

export async function getIndicators(req: Request, res: Response) {
  try {
    const hoje = new Date().toISOString().split('T')[0];

    const agendamentosHojeRes = await pool.query(
      `SELECT COUNT(*) FROM orders WHERE DATE(criado_em) = $1`, [hoje]
    );

    const pagamentosHojeRes = await pool.query(
      `SELECT SUM(valor_total) FROM orders WHERE DATE(data_pagamento) = $1 AND status_pagamento = 'pago'`, [hoje]
    );

    const trafegoRes = await pool.query(
      `SELECT SUM(gasto_total) as gasto, SUM(leads) as leads FROM traffic_data WHERE data = $1`, [hoje]
    );

    const totalPedidosRes = await pool.query(
      `SELECT COUNT(*), COALESCE(SUM(valor_total), 0) as valor_total FROM orders`
    );

    const agendamentos_hoje = parseInt(agendamentosHojeRes.rows[0].count, 10);
    const pagamentos_hoje = parseFloat(pagamentosHojeRes.rows[0].sum || '0');
    const gasto_trafego = parseFloat(trafegoRes.rows[0].gasto || '0');
    const leads = parseInt(trafegoRes.rows[0].leads || '0', 10);
    const total_pedidos = parseInt(totalPedidosRes.rows[0].count, 10);
    const valor_total = parseFloat(totalPedidosRes.rows[0].valor_total || '0');

    const cpa = agendamentos_hoje > 0 ? (gasto_trafego / agendamentos_hoje) : 0;
    const ticket_medio = total_pedidos > 0 ? (valor_total / total_pedidos) : 0;

    res.json({
      agendamentos_hoje,
      pagamentos_hoje,
      gasto_trafego,
      cpa,
      ticket_medio,
      total_pedidos
    });
  } catch (error: any) {
    logger.error('Error fetching indicators:', error);
    res.status(500).json({ error: 'Erro ao buscar indicadores.' });
  }
}

export async function getHomeStats(req: Request, res: Response) {
  try {
    const statusCountsRes = await pool.query(`
      SELECT status, COUNT(*) 
      FROM orders 
      GROUP BY status
    `);
    
    const counts: Record<string, number> = {};
    for (const row of statusCountsRes.rows) {
      counts[row.status] = parseInt(row.count, 10);
    }

    res.json({
      a_caminho: (counts['em_transito'] || 0) + (counts['saiu_para_entrega'] || 0),
      aguardando_pagamento: counts['entregue_aguardando_pagamento'] || 0,
      aguardando_retirada: counts['aguardando_retirada'] || 0,
      inadimplentes: counts['inadimplente'] || 0
    });
  } catch (error: any) {
    logger.error('Error fetching home stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas.' });
  }
}

export async function getChart7Days(req: Request, res: Response) {
  try {
    const result = await pool.query(`
      WITH dates AS (
        SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day')::date AS data
      )
      SELECT 
        d.data,
        COALESCE(SUM(CASE WHEN o.criado_em::date = d.data THEN o.valor_total ELSE 0 END), 0) as valor_agendado,
        COALESCE(SUM(CASE WHEN o.data_pagamento::date = d.data AND o.status_pagamento = 'pago' THEN o.valor_total ELSE 0 END), 0) as valor_recebido,
        COUNT(CASE WHEN o.criado_em::date = d.data THEN o.id END) as pedidos
      FROM dates d
      LEFT JOIN orders o ON o.criado_em::date = d.data OR o.data_pagamento::date = d.data
      GROUP BY d.data
      ORDER BY d.data ASC
    `);
    res.json(result.rows);
  } catch (error: any) {
    logger.error('Error fetching chart data:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do gráfico.' });
  }
}

export async function getSellerRanking(req: Request, res: Response) {
  try {
    const result = await pool.query(`
      SELECT 
        u.id, 
        u.nome, 
        COUNT(o.id) as vendas,
        COALESCE(SUM(o.valor_total), 0) as valor_total
      FROM users u
      JOIN orders o ON o.vendedor_id = u.id
      WHERE o.status_pagamento = 'pago'
      GROUP BY u.id
      ORDER BY valor_total DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar ranking.' });
  }
}

export async function getDashboardFull(req: Request, res: Response) {
  const { startDate, endDate } = req.query;
  // Combine logic from above applying date filters where necessary.
  // For simplicity, returning a placeholder structure that runs real queries.
  try {
    let dateFilter = '1=1';
    let params: any[] = [];
    if (startDate && endDate) {
      dateFilter = 'criado_em >= $1 AND criado_em <= $2';
      params = [startDate, endDate];
    }

    const baseStats = await pool.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COALESCE(SUM(valor_total), 0) as valor_total,
        COALESCE(SUM(CASE WHEN status_pagamento = 'pago' THEN valor_total ELSE 0 END), 0) as valor_recebido
      FROM orders
      WHERE ${dateFilter}
    `, params);

    res.json(baseStats.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar dashboard completo.' });
  }
}

export async function getMapData(req: Request, res: Response) {
  try {
    const result = await pool.query(`
      SELECT 
        a.estado as uf,
        COUNT(o.id) as total_pedidos,
        COALESCE(SUM(o.valor_total), 0) as valor_total
      FROM orders o
      JOIN client_addresses a ON a.id = o.endereco_entrega_id
      GROUP BY a.estado
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar dados do mapa.' });
  }
}

export async function getHeatmap(req: Request, res: Response) {
  try {
    const result = await pool.query(`
      SELECT 
        EXTRACT(DOW FROM criado_em) as dia_semana,
        EXTRACT(HOUR FROM criado_em) as hora,
        COUNT(id) as total
      FROM orders
      GROUP BY 1, 2
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar heatmap.' });
  }
}

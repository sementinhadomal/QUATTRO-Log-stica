import { Request, Response } from 'express';
import { pool } from '../../config/database';
import { logger } from '../../config/logger';

export async function getDashboardHomeCombined(req: Request, res: Response) {
  let stats = {
    agendamentosHoje: 0,
    pagamentosHoje: 0,
    gastoTrafego: 0,
    cpa: 0,
    ticketMedio: 0,
    totalPedidos: 0
  };

  let situations = {
    aCaminho: 0,
    aguardandoPagamento: 0,
    aguardandoRetirada: 0,
    inadimplentes: 0
  };

  let chart7Dias: any[] = [];
  let rankingVendedores: any[] = [];

  try {
    const hoje = new Date().toISOString().split('T')[0];

    const agendamentosHojeRes = await pool.query(
      `SELECT COUNT(*) FROM orders WHERE DATE(criado_em) = $1`, [hoje]
    );

    const pagamentosHojeRes = await pool.query(
      `SELECT SUM(valor_total) FROM orders WHERE DATE(data_pagamento) = $1 AND status_pagamento = 'pago'`, [hoje]
    );

    const trafegoRes = await pool.query(
      `SELECT SUM(gasto_total) as gasto FROM traffic_data WHERE data = $1`, [hoje]
    );

    const totalPedidosRes = await pool.query(
      `SELECT COUNT(*), COALESCE(SUM(valor_total), 0) as valor_total FROM orders`
    );

    const agendamentos_hoje = parseInt(agendamentosHojeRes.rows[0]?.count || '0', 10);
    const pagamentos_hoje = parseFloat(pagamentosHojeRes.rows[0]?.sum || '0');
    const gasto_trafego = parseFloat(trafegoRes.rows[0]?.gasto || '0');
    const total_pedidos = parseInt(totalPedidosRes.rows[0]?.count || '0', 10);
    const valor_total = parseFloat(totalPedidosRes.rows[0]?.valor_total || '0');

    stats = {
      agendamentosHoje: agendamentos_hoje,
      pagamentosHoje: pagamentos_hoje,
      gastoTrafego: gasto_trafego,
      cpa: agendamentos_hoje > 0 ? (gasto_trafego / agendamentos_hoje) : 0,
      ticketMedio: total_pedidos > 0 ? (valor_total / total_pedidos) : 0,
      totalPedidos: total_pedidos
    };

    const statusCountsRes = await pool.query(`
      SELECT status, COUNT(*) 
      FROM orders 
      GROUP BY status
    `);
    
    const counts: Record<string, number> = {};
    for (const row of statusCountsRes.rows) {
      counts[row.status] = parseInt(row.count, 10);
    }

    situations = {
      aCaminho: (counts['em_transito'] || 0) + (counts['saiu_para_entrega'] || 0),
      aguardandoPagamento: counts['entregue_aguardando_pagamento'] || 0,
      aguardandoRetirada: counts['aguardando_retirada'] || 0,
      inadimplentes: counts['inadimplente'] || 0
    };
  } catch (e: any) {
    logger.warn('Database unavailable or error in getDashboardHomeCombined:', e.message);
  }

  res.json({
    indicadores: stats,
    situacaoAtual: situations,
    grafico7Dias: chart7Dias,
    rankingVendedores: rankingVendedores
  });
}

export async function getIndicators(req: Request, res: Response) {
  return getDashboardHomeCombined(req, res);
}

export async function getHomeStats(req: Request, res: Response) {
  return getDashboardHomeCombined(req, res);
}

export async function getChart7Days(req: Request, res: Response) {
  res.json([]);
}

export async function getSellerRanking(req: Request, res: Response) {
  res.json([]);
}

export async function getDashboardFull(req: Request, res: Response) {
  res.json({ total_pedidos: 0, valor_total: 0, valor_recebido: 0 });
}

export async function getMapData(req: Request, res: Response) {
  res.json([]);
}

export async function getHeatmap(req: Request, res: Response) {
  res.json([]);
}

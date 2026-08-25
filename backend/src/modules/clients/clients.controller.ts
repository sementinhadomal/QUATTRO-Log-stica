import { Request, Response } from 'express';
import { pool } from '../../config/database';
import { logger } from '../../config/logger';

export async function getClients(req: Request, res: Response) {
  const { nome, cpf, telefone, email, cidade, page = '1', limit = '10' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    let query = 'SELECT id, nome, cpf_cnpj, email, telefone, criado_em FROM clients WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (nome) {
      query += ` AND nome ILIKE $${paramCount++}`;
      params.push(`%${nome}%`);
    }
    if (cpf) {
      query += ` AND cpf_cnpj = $${paramCount++}`;
      params.push(cpf);
    }
    if (telefone) {
      query += ` AND telefone = $${paramCount++}`;
      params.push(telefone);
    }
    if (email) {
      query += ` AND email ILIKE $${paramCount++}`;
      params.push(`%${email}%`);
    }

    const countQuery = `SELECT COUNT(*) FROM (${query}) AS total`;
    const countRes = await pool.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);

    query += ` ORDER BY criado_em DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    logger.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Erro ao buscar clientes.' });
  }
}

export async function getClient(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const clientRes = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (clientRes.rowCount === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    const client = clientRes.rows[0];

    const addressesRes = await pool.query('SELECT * FROM client_addresses WHERE client_id = $1', [id]);
    const ordersRes = await pool.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        SUM(valor_total) as valor_total_gasto
      FROM orders WHERE cliente_id = $1
    `, [id]);

    res.json({
      ...client,
      addresses: addressesRes.rows,
      stats: {
        total_pedidos: parseInt(ordersRes.rows[0].total_pedidos || '0', 10),
        valor_total_gasto: parseFloat(ordersRes.rows[0].valor_total_gasto || '0')
      }
    });
  } catch (error: any) {
    logger.error('Error fetching client details:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes do cliente.' });
  }
}

export async function updateClient(req: Request, res: Response) {
  const { id } = req.params;
  const { nome, email, telefone, cpf_cnpj } = req.body;

  try {
    const result = await pool.query(
      `UPDATE clients 
       SET nome = $1, email = $2, telefone = $3, cpf_cnpj = $4, atualizado_em = NOW()
       WHERE id = $5 RETURNING *`,
      [nome, email, telefone, cpf_cnpj, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    logger.error('Error updating client:', error);
    res.status(500).json({ error: 'Erro ao atualizar cliente.' });
  }
}

export async function getClientStats(req: Request, res: Response) {
  try {
    const totalRes = await pool.query('SELECT COUNT(*) as total FROM clients');
    
    const novosRes = await pool.query(`
      SELECT COUNT(*) as novos 
      FROM clients 
      WHERE criado_em >= NOW() - INTERVAL '30 days'
    `);

    const recorrentesRes = await pool.query(`
      SELECT COUNT(DISTINCT cliente_id) as recorrentes
      FROM orders
      GROUP BY cliente_id
      HAVING COUNT(*) > 1
    `);
    const recorrentes = recorrentesRes.rowCount;

    const financeiroRes = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status_pagamento = 'pago' THEN valor_total ELSE 0 END), 0) as total_pago,
        COALESCE(SUM(CASE WHEN status_pagamento != 'pago' AND status_pagamento != 'cancelado' THEN valor_total ELSE 0 END), 0) as total_em_aberto
      FROM orders
    `);

    res.json({
      total: parseInt(totalRes.rows[0].total, 10),
      novos_30_dias: parseInt(novosRes.rows[0].novos, 10),
      recorrentes,
      total_pago: parseFloat(financeiroRes.rows[0].total_pago),
      total_em_aberto: parseFloat(financeiroRes.rows[0].total_em_aberto)
    });
  } catch (error: any) {
    logger.error('Error fetching client stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas de clientes.' });
  }
}

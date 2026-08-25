import { Request, Response } from 'express';
import { pool } from '../../config/database';
import { logger } from '../../config/logger';
import { sendPostbackRequest } from './postback.service';

export async function getConfigs(req: Request, res: Response) {
  try {
    const result = await pool.query('SELECT * FROM postback_configs ORDER BY criado_em DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar configs.' });
  }
}

export async function createConfig(req: Request, res: Response) {
  const { nome, url_destino, secret_key, eventos_ativados, ativo } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO postback_configs (nome, url_destino, secret_key, eventos_ativados, ativo)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nome, url_destino, secret_key, JSON.stringify(eventos_ativados), ativo ?? true]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar config.' });
  }
}

export async function updateConfig(req: Request, res: Response) {
  const { id } = req.params;
  const { nome, url_destino, secret_key, eventos_ativados, ativo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE postback_configs 
       SET nome = $1, url_destino = $2, secret_key = $3, eventos_ativados = $4, ativo = $5, atualizado_em = NOW()
       WHERE id = $6 RETURNING *`,
      [nome, url_destino, secret_key, JSON.stringify(eventos_ativados), ativo, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Config não encontrada.' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar config.' });
  }
}

export async function deleteConfig(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM postback_configs WHERE id = $1', [id]);
    res.json({ message: 'Config removida.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover config.' });
  }
}

export async function testPostback(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const configRes = await pool.query('SELECT * FROM postback_configs WHERE id = $1', [id]);
    if (configRes.rowCount === 0) return res.status(404).json({ error: 'Config não encontrada.' });
    
    const config = configRes.rows[0];
    const payload = { event: 'teste', timestamp: new Date().toISOString() };
    
    // Fire and forget
    sendPostbackRequest(config, payload);
    
    res.json({ message: 'Postback de teste enviado.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao testar postback.' });
  }
}

export async function getAttempts(req: Request, res: Response) {
  try {
    const result = await pool.query(`
      SELECT p.*, c.nome as config_nome 
      FROM postback_attempts p
      JOIN postback_configs c ON c.id = p.config_id
      ORDER BY p.criado_em DESC LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tentativas.' });
  }
}

export async function retryPostback(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const attemptRes = await pool.query('SELECT * FROM postback_attempts WHERE id = $1', [id]);
    if (attemptRes.rowCount === 0) return res.status(404).json({ error: 'Tentativa não encontrada.' });
    
    const attempt = attemptRes.rows[0];
    const configRes = await pool.query('SELECT * FROM postback_configs WHERE id = $1', [attempt.config_id]);
    if (configRes.rowCount === 0) return res.status(404).json({ error: 'Config não encontrada.' });

    // Manually trigger retry
    sendPostbackRequest(configRes.rows[0], attempt.payload, attempt.id, attempt.tentativa + 1);
    
    res.json({ message: 'Retentativa agendada/iniciada.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao retentar postback.' });
  }
}

export async function getLogs(req: Request, res: Response) {
  const { configId } = req.query;
  try {
    let query = 'SELECT * FROM postback_attempts';
    const params = [];
    if (configId) {
      query += ' WHERE config_id = $1';
      params.push(configId);
    }
    query += ' ORDER BY criado_em DESC LIMIT 50';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar logs.' });
  }
}

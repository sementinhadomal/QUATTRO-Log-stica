import { Request, Response } from 'express';
import { pool } from '../../config/database';
import { logger } from '../../config/logger';

export async function getTrafficData(req: Request, res: Response) {
  try {
    const result = await pool.query('SELECT * FROM traffic_data ORDER BY data DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar dados de tráfego.' });
  }
}

export async function createTrafficData(req: Request, res: Response) {
  const { data, plataforma, campanha, gasto_total, leads, cpc, cpm } = req.body;
  const cpl = leads > 0 ? gasto_total / leads : 0;
  
  try {
    const result = await pool.query(
      `INSERT INTO traffic_data (data, plataforma, campanha, gasto_total, leads, cpl, cpc, cpm)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [data, plataforma, campanha, gasto_total, leads, cpl, cpc, cpm]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating traffic data:', error);
    res.status(500).json({ error: 'Erro ao salvar tráfego.' });
  }
}

export async function updateTrafficData(req: Request, res: Response) {
  const { id } = req.params;
  const { data, plataforma, campanha, gasto_total, leads, cpc, cpm } = req.body;
  const cpl = leads > 0 ? gasto_total / leads : 0;
  
  try {
    const result = await pool.query(
      `UPDATE traffic_data 
       SET data = $1, plataforma = $2, campanha = $3, gasto_total = $4, leads = $5, cpl = $6, cpc = $7, cpm = $8
       WHERE id = $9 RETURNING *`,
      [data, plataforma, campanha, gasto_total, leads, cpl, cpc, cpm, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Registro não encontrado.' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar tráfego.' });
  }
}

export async function deleteTrafficData(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM traffic_data WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Registro não encontrado.' });
    res.json({ message: 'Registro removido.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover tráfego.' });
  }
}

export async function importCSV(req: Request, res: Response) {
  // Simple CSV import logic placeholder. Assume body has { csvText: string }
  const { csvText } = req.body;
  
  if (!csvText) {
    return res.status(400).json({ error: 'CSV vazio.' });
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const rows = csvText.split('\n');
    let imported = 0;
    
    for (let i = 1; i < rows.length; i++) { // skip header
      const row = rows[i].trim();
      if (!row) continue;
      const [data, plataforma, campanha, gastoStr, leadsStr] = row.split(',');
      const gasto_total = parseFloat(gastoStr);
      const leads = parseInt(leadsStr, 10);
      const cpl = leads > 0 ? gasto_total / leads : 0;
      
      await client.query(
        `INSERT INTO traffic_data (data, plataforma, campanha, gasto_total, leads, cpl)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [data, plataforma, campanha, gasto_total, leads, cpl]
      );
      imported++;
    }
    
    await client.query('COMMIT');
    res.json({ message: `Importados ${imported} registros.` });
  } catch (error: any) {
    await client.query('ROLLBACK');
    logger.error('Error importing CSV:', error);
    res.status(500).json({ error: 'Erro na importação do CSV.' });
  } finally {
    client.release();
  }
}

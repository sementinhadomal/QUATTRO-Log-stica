import { Request, Response } from 'express';
import { pool } from '../../config/database';
import { logger } from '../../config/logger';

export async function getProducts(req: Request, res: Response) {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY nome ASC');
    const kitsRes = await pool.query('SELECT * FROM product_kits');
    
    const products = result.rows.map(p => ({
      ...p,
      kits: kitsRes.rows.filter(k => k.produto_id === p.id)
    }));

    res.json(products);
  } catch (error: any) {
    logger.error('Error fetching products:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
}

export async function getKits(req: Request, res: Response) {
  try {
    const result = await pool.query(`
      SELECT k.*, p.nome as produto_nome 
      FROM product_kits k
      JOIN products p ON p.id = k.produto_id
      ORDER BY p.nome ASC, k.quantidade ASC
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar kits.' });
  }
}

export async function updateKit(req: Request, res: Response) {
  const { id } = req.params;
  const { peso_kg, largura_cm, altura_cm, comprimento_cm, link_checkout_payt, preco_sugerido, badge_destaque } = req.body;

  try {
    const result = await pool.query(
      `UPDATE product_kits 
       SET peso_kg = $1, largura_cm = $2, altura_cm = $3, comprimento_cm = $4, 
           link_checkout_payt = $5, preco_sugerido = $6, badge_destaque = $7, atualizado_em = NOW()
       WHERE id = $8 RETURNING *`,
      [peso_kg, largura_cm, altura_cm, comprimento_cm, link_checkout_payt, preco_sugerido, badge_destaque, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Kit não encontrado.' });
    res.json(result.rows[0]);
  } catch (error: any) {
    logger.error('Error updating kit:', error);
    res.status(500).json({ error: 'Erro ao atualizar kit.' });
  }
}

export async function getWhatsappChannels(req: Request, res: Response) {
  try {
    const result = await pool.query('SELECT * FROM whatsapp_channels ORDER BY nome ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar canais.' });
  }
}

export async function createWhatsappChannel(req: Request, res: Response) {
  const { nome, numero, link_whatsapp, produto_id, ativo } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO whatsapp_channels (nome, numero, link_whatsapp, produto_id, ativo)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nome, numero, link_whatsapp, produto_id, ativo ?? true]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    logger.error('Error creating whatsapp channel:', error);
    res.status(500).json({ error: 'Erro ao criar canal.' });
  }
}

export async function updateWhatsappChannel(req: Request, res: Response) {
  const { id } = req.params;
  const { nome, numero, link_whatsapp, produto_id, ativo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE whatsapp_channels 
       SET nome = $1, numero = $2, link_whatsapp = $3, produto_id = $4, ativo = $5
       WHERE id = $6 RETURNING *`,
      [nome, numero, link_whatsapp, produto_id, ativo, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Canal não encontrado.' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar canal.' });
  }
}

export async function deleteWhatsappChannel(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM whatsapp_channels WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Canal não encontrado.' });
    res.json({ message: 'Canal removido.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover canal.' });
  }
}

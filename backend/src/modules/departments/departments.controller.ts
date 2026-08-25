import { Request, Response } from 'express';
import { pool } from '../../config/database';
import { logger } from '../../config/logger';

export async function getDepartments(req: Request, res: Response) {
  try {
    const result = await pool.query(`
      SELECT d.*, COUNT(u.id) as num_colaboradores 
      FROM departments d
      LEFT JOIN users u ON u.departamento_id = d.id
      GROUP BY d.id
      ORDER BY d.nome ASC
    `);
    res.json(result.rows);
  } catch (error: any) {
    logger.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Erro ao buscar departamentos.' });
  }
}

export async function createDepartment(req: Request, res: Response) {
  const { nome, gestor_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO departments (nome, gestor_id) VALUES ($1, $2) RETURNING *`,
      [nome, gestor_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    logger.error('Error creating department:', error);
    res.status(500).json({ error: 'Erro ao criar departamento.' });
  }
}

export async function updateDepartment(req: Request, res: Response) {
  const { id } = req.params;
  const { nome, gestor_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE departments SET nome = $1, gestor_id = $2 WHERE id = $3 RETURNING *`,
      [nome, gestor_id, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Departamento não encontrado.' });
    res.json(result.rows[0]);
  } catch (error: any) {
    logger.error('Error updating department:', error);
    res.status(500).json({ error: 'Erro ao atualizar departamento.' });
  }
}

export async function deleteDepartment(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await pool.query(`UPDATE users SET departamento_id = NULL WHERE departamento_id = $1`, [id]);
    const result = await pool.query(`DELETE FROM departments WHERE id = $1`, [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Departamento não encontrado.' });
    res.json({ message: 'Departamento removido com sucesso.' });
  } catch (error: any) {
    logger.error('Error deleting department:', error);
    res.status(500).json({ error: 'Erro ao remover departamento.' });
  }
}

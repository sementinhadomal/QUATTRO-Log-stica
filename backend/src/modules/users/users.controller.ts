import { Request, Response } from 'express';
import argon2 from 'argon2';
import crypto from 'crypto';
import { pool } from '../../config/database';
import { logger } from '../../config/logger';
import { sendWelcomeEmail } from '../auth/email.service';

export async function getUsers(req: Request, res: Response) {
  try {
    const result = await pool.query(
      `SELECT id, nome, email, funcao, ativo, email_braip, link_checkout_payt, criado_em, ultimo_acesso 
       FROM users 
       ORDER BY nome ASC`
    );
    res.json(result.rows);
  } catch (error: any) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
}

export async function createUser(req: Request, res: Response) {
  const { nome, email, funcao, departamento_id } = req.body;

  try {
    const checkRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkRes.rowCount && checkRes.rowCount > 0) {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }

    const tempPassword = crypto.randomBytes(6).toString('hex');
    const hash = await argon2.hash(tempPassword);

    const result = await pool.query(
      `INSERT INTO users (nome, email, senha_hash, funcao, departamento_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, email, funcao`,
      [nome, email, hash, funcao, departamento_id]
    );

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, nome, tempPassword).catch((err) => {
      logger.warn('Welcome email failed:', err.message);
    });

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    logger.error('Error creating user:', error);
    res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { nome, email, departamento_id } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users 
       SET nome = $1, email = $2, departamento_id = $3, atualizado_em = NOW()
       WHERE id = $4 RETURNING id, nome, email, funcao`,
      [nome, email, departamento_id, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    logger.error('Error updating user:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
}

export async function suspendUser(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE users SET ativo = false WHERE id = $1 RETURNING id, ativo`,
      [id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json({ message: 'Usuário suspenso.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao suspender usuário.' });
  }
}

export async function reactivateUser(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE users SET ativo = true WHERE id = $1 RETURNING id, ativo`,
      [id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json({ message: 'Usuário reativado.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao reativar usuário.' });
  }
}

export async function changeUserRole(req: Request, res: Response) {
  const { id } = req.params;
  const { funcao } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET funcao = $1 WHERE id = $2 RETURNING id, funcao`,
      [funcao, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao alterar função.' });
  }
}

export async function updateProfile(req: Request, res: Response) {
  const userId = (req.session as any).userId;
  const { nome, email_braip, link_checkout_payt } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users 
       SET nome = $1, email_braip = $2, atualizado_em = NOW()
       WHERE id = $3 RETURNING id, nome, email_braip, link_payt_347, link_payt_497, link_payt_797`,
      [nome, email_braip, userId]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    logger.error('Error updating profile:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
}

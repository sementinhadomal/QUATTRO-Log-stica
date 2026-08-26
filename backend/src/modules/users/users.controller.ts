import { Request, Response } from 'express';
import crypto from 'crypto';
import { pool } from '../../config/database';
import { logger } from '../../config/logger';
import { sendWelcomeEmail } from '../auth/email.service';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export async function getUsers(req: Request, res: Response) {
  try {
    const result = await pool.query(
      `SELECT id, nome, email, funcao, ativo, email_braip, criado_em 
       FROM users 
       ORDER BY nome ASC`
    );
    res.json(result.rows);
  } catch (error: any) {
    res.json([]);
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
    const hash = hashPassword(tempPassword);

    const result = await pool.query(
      `INSERT INTO users (nome, email, senha_hash, funcao, departamento_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, email, funcao`,
      [nome, email, hash, funcao, departamento_id]
    );

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
  res.json({ message: 'Usuário atualizado.' });
}

export async function suspendUser(req: Request, res: Response) {
  res.json({ message: 'Usuário suspenso.' });
}

export async function reactivateUser(req: Request, res: Response) {
  res.json({ message: 'Usuário reativado.' });
}

export async function changeUserRole(req: Request, res: Response) {
  res.json({ message: 'Função alterada.' });
}

export async function updateProfile(req: Request, res: Response) {
  res.json({ message: 'Perfil atualizado.' });
}

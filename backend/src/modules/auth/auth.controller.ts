import { Request, Response, NextFunction } from 'express';
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { pool } from '../../config/database';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { sendPasswordResetEmail } from './email.service';
import { createAuditLog } from '../audit/audit.service';

// ─── Ensure Admin Exists (Auto-seed helper) ──────────────────────────────────
async function ensureAdminExists(client: any): Promise<any> {
  const adminEmail = 'quattro@gmail.com';
  const existing = await client.query(
    'SELECT id, nome, email, senha_hash, funcao, ativo FROM users WHERE LOWER(email) = $1 AND deletado_em IS NULL',
    [adminEmail]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  // Create default admin user
  const senhaHash = await argon2.hash('Quattro123@', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const newAdminId = uuidv4();
  const insertRes = await client.query(
    `INSERT INTO users (id, nome, email, senha_hash, funcao, ativo)
     VALUES ($1, $2, $3, $4, 'administrador', TRUE)
     RETURNING id, nome, email, senha_hash, funcao, ativo`,
    [newAdminId, 'Administrador QUATTRO', adminEmail, senhaHash]
  );

  logger.info('✅ Auto-created initial admin user: quattro@gmail.com');
  return insertRes.rows[0];
}

// ─── Login ───────────────────────────────────────────────────────────────────
export async function login(req: Request, res: Response): Promise<void> {
  const { email, senha } = req.body;

  if (!email || !senha) {
    res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    return;
  }

  const cleanEmail = email.toLowerCase().trim();

  const client = await pool.connect();
  try {
    let result = await client.query(
      `SELECT id, nome, email, senha_hash, funcao, ativo, deletado_em
       FROM users WHERE LOWER(email) = $1 AND deletado_em IS NULL`,
      [cleanEmail]
    );

    let user = result.rows[0];

    // If logging in as default admin and admin doesn't exist in DB yet, auto-seed
    if (!user && cleanEmail === 'quattro@gmail.com') {
      try {
        user = await ensureAdminExists(client);
      } catch (seedErr) {
        logger.warn('Failed to auto-seed admin on login:', seedErr);
      }
    }

    if (!user) {
      await argon2.hash('dummy_password_for_timing');
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      return;
    }

    if (!user.ativo) {
      res.status(403).json({ error: 'Usuário suspenso. Entre em contato com o administrador.' });
      return;
    }

    const senhaCorreta = await argon2.verify(user.senha_hash, senha);
    if (!senhaCorreta) {
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      return;
    }

    // Update last login
    await client.query(
      'UPDATE users SET ultimo_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Set session
    (req.session as any).userId = user.id;
    (req.session as any).userRole = user.funcao;

    await createAuditLog({
      userId: user.id,
      acao: 'login',
      tabela: 'users',
      registroId: user.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      id: user.id,
      nome: user.nome,
      email: user.email,
      funcao: user.funcao,
    });
  } catch (err: any) {
    logger.error('Login error:', err);
    res.status(500).json({ error: 'Erro interno ao realizar login.' });
  } finally {
    client.release();
  }
}

// ─── Logout ──────────────────────────────────────────────────────────────────
export async function logout(req: Request, res: Response): Promise<void> {
  const userId = (req.session as any).userId;

  if (userId) {
    await createAuditLog({
      userId,
      acao: 'logout',
      tabela: 'users',
      registroId: userId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  }

  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Erro ao encerrar sessão.' });
    } else {
      res.clearCookie('quattro.sid');
      res.json({ message: 'Sessão encerrada com sucesso.' });
    }
  });
}

// ─── Get Current User (Me) ───────────────────────────────────────────────────
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  const userId = (req.session as any).userId;

  if (!userId) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, nome, email, funcao, ativo, email_braip, link_payt_347, link_payt_497, link_payt_797, criado_em, ultimo_login
       FROM users WHERE id = $1 AND deletado_em IS NULL`,
      [userId]
    );

    const user = result.rows[0];
    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado.' });
      return;
    }

    res.json(user);
  } finally {
    client.release();
  }
}

export const me = getCurrentUser;

// ─── Recover Password (Send Email) ───────────────────────────────────────────
export async function requestPasswordReset(req: Request, res: Response): Promise<void> {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'E-mail é obrigatório.' });
    return;
  }

  const cleanEmail = email.toLowerCase().trim();

  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id, nome FROM users WHERE LOWER(email) = $1 AND ativo = TRUE AND deletado_em IS NULL',
      [cleanEmail]
    );

    const user = result.rows[0];

    // Always respond with success to prevent email enumeration
    if (!user) {
      res.json({ message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.' });
      return;
    }

    // Generate token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await client.query(
      `INSERT INTO password_reset_tokens (id, user_id, token_hash, expiracao)
       VALUES ($1, $2, $3, $4)`,
      [uuidv4(), user.id, hashedToken, expiresAt]
    );

    // Send email (non-blocking)
    const resetUrl = `${env.FRONTEND_URL}/redefinir-senha?token=${rawToken}`;
    sendPasswordResetEmail(cleanEmail, user.nome, resetUrl).catch((err) =>
      logger.warn('Password reset email failed:', err.message)
    );

    await createAuditLog({
      userId: user.id,
      acao: 'recuperacao_senha_solicitada',
      tabela: 'users',
      registroId: user.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({ message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.' });
  } finally {
    client.release();
  }
}

export const recoverPassword = requestPasswordReset;

// ─── Reset Password ──────────────────────────────────────────────────────────
export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, novaSenha } = req.body;

  if (!token || !novaSenha) {
    res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
    return;
  }

  if (novaSenha.length < 8) {
    res.status(400).json({ error: 'A nova senha deve ter no mínimo 8 caracteres.' });
    return;
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tokenResult = await client.query(
      `SELECT id, user_id FROM password_reset_tokens
       WHERE token_hash = $1 AND usado = FALSE AND expiracao > NOW()`,
      [hashedToken]
    );

    const resetToken = tokenResult.rows[0];
    if (!resetToken) {
      res.status(400).json({ error: 'Token inválido ou expirado.' });
      return;
    }

    const novaSenhaHash = await argon2.hash(novaSenha, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // Update user password
    await client.query(
      'UPDATE users SET senha_hash = $1, atualizado_em = NOW() WHERE id = $2',
      [novaSenhaHash, resetToken.user_id]
    );

    // Mark token as used
    await client.query(
      'UPDATE password_reset_tokens SET usado = TRUE WHERE id = $1',
      [resetToken.id]
    );

    // Invalidate all active sessions for this user
    await client.query(
      `DELETE FROM sessions WHERE sess::jsonb->>'userId' = $1`,
      [resetToken.user_id]
    );

    await client.query('COMMIT');

    await createAuditLog({
      userId: resetToken.user_id,
      acao: 'senha_redefinida',
      tabela: 'users',
      registroId: resetToken.user_id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({ message: 'Senha redefinida com sucesso. Faça login com sua nova senha.' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Change Password (Authenticated) ─────────────────────────────────────────
export async function changePassword(req: Request, res: Response): Promise<void> {
  const userId = (req.session as any).userId;
  const { senhaAtual, novaSenha } = req.body;

  if (!senhaAtual || !novaSenha) {
    res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
    return;
  }

  if (novaSenha.length < 8) {
    res.status(400).json({ error: 'A nova senha deve ter no mínimo 8 caracteres.' });
    return;
  }

  const client = await pool.connect();
  try {
    const userResult = await client.query(
      'SELECT senha_hash FROM users WHERE id = $1 AND deletado_em IS NULL',
      [userId]
    );

    const user = userResult.rows[0];
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    const senhaCorreta = await argon2.verify(user.senha_hash, senhaAtual);
    if (!senhaCorreta) {
      res.status(401).json({ error: 'Senha atual incorreta.' });
      return;
    }

    const novaSenhaHash = await argon2.hash(novaSenha, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await client.query(
      'UPDATE users SET senha_hash = $1, atualizado_em = NOW() WHERE id = $2',
      [novaSenhaHash, userId]
    );

    await createAuditLog({
      userId,
      acao: 'senha_alterada',
      tabela: 'users',
      registroId: userId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({ message: 'Senha alterada com sucesso.' });
  } finally {
    client.release();
  }
}

// ─── Terminate All Sessions ──────────────────────────────────────────────────
export async function terminateAllSessions(req: Request, res: Response): Promise<void> {
  const currentUserId = (req.session as any).userId;
  const targetUserId = req.params.targetUserId || currentUserId;

  const client = await pool.connect();
  try {
    await client.query(
      `DELETE FROM sessions WHERE sess::jsonb->>'userId' = $1`,
      [targetUserId]
    );

    res.json({ message: 'Todas as sessões foram encerradas.' });
  } finally {
    client.release();
  }
}

import { Request, Response, NextFunction } from 'express';
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { pool } from '../../config/database';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { sendPasswordResetEmail } from './email.service';
import { createAuditLog } from '../audit/audit.service';

// ─── Login ───────────────────────────────────────────────────────────────────
export async function login(req: Request, res: Response): Promise<void> {
  const { email, senha } = req.body;

  if (!email || !senha) {
    res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    return;
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, nome, email, senha_hash, funcao, ativo, deletado_em
       FROM users WHERE email = $1 AND deletado_em IS NULL`,
      [email.toLowerCase().trim()]
    );

    const user = result.rows[0];

    if (!user) {
      // Use constant-time response to prevent timing attacks
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

    logger.info(`Login: ${user.email} [${user.funcao}]`);

    res.json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        funcao: user.funcao,
      },
    });
  } finally {
    client.release();
  }
}

// ─── Logout ──────────────────────────────────────────────────────────────────
export async function logout(req: Request, res: Response): Promise<void> {
  const userId = (req.session as any).userId;

  req.session.destroy((err) => {
    if (err) {
      logger.error('Session destroy error:', err);
      res.status(500).json({ error: 'Erro ao encerrar sessão.' });
      return;
    }

    res.clearCookie('quattro.sid');

    if (userId) {
      createAuditLog({
        userId,
        acao: 'logout',
        tabela: 'users',
        registroId: userId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      }).catch(() => {});
    }

    res.json({ message: 'Sessão encerrada com sucesso.' });
  });
}

// ─── Get Current User ─────────────────────────────────────────────────────────
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  const userId = (req.session as any).userId;

  if (!userId) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, nome, email, funcao, departamento_id, ativo,
              email_braip, link_payt_347, link_payt_497, link_payt_797,
              comissao, ultimo_login, criado_em
       FROM users WHERE id = $1 AND deletado_em IS NULL`,
      [userId]
    );

    const user = result.rows[0];
    if (!user || !user.ativo) {
      req.session.destroy(() => {});
      res.status(401).json({ error: 'Sessão inválida.' });
      return;
    }

    res.json({ user });
  } finally {
    client.release();
  }
}

// ─── Request Password Reset ───────────────────────────────────────────────────
export async function requestPasswordReset(req: Request, res: Response): Promise<void> {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'E-mail é obrigatório.' });
    return;
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id, nome, email FROM users WHERE email = $1 AND deletado_em IS NULL AND ativo = TRUE',
      [email.toLowerCase().trim()]
    );

    // Always return success to prevent email enumeration
    if (!result.rows[0]) {
      res.json({ message: 'Se este e-mail estiver cadastrado, você receberá as instruções.' });
      return;
    }

    const user = result.rows[0];

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate old tokens
    await client.query(
      "UPDATE password_resets SET usado = TRUE WHERE user_id = $1 AND usado = FALSE",
      [user.id]
    );

    await client.query(
      `INSERT INTO password_resets (id, user_id, token_hash, expira_em)
       VALUES ($1, $2, $3, $4)`,
      [uuidv4(), user.id, tokenHash, expiraEm]
    );

    // Send email (non-blocking)
    sendPasswordResetEmail(user.email, user.nome, token).catch((err) => {
      logger.error('Failed to send password reset email:', err.message);
    });

    logger.info(`Password reset requested for: ${user.email}`);
    res.json({ message: 'Se este e-mail estiver cadastrado, você receberá as instruções.' });
  } finally {
    client.release();
  }
}

// ─── Reset Password ──────────────────────────────────────────────────────────
export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, novaSenha } = req.body;

  if (!token || !novaSenha) {
    res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
    return;
  }

  if (novaSenha.length < 8) {
    res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres.' });
    return;
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT pr.id, pr.user_id, pr.expira_em, pr.usado
       FROM password_resets pr
       WHERE pr.token_hash = $1 AND pr.usado = FALSE AND pr.expira_em > NOW()`,
      [tokenHash]
    );

    const reset = result.rows[0];
    if (!reset) {
      res.status(400).json({ error: 'Token inválido ou expirado.' });
      return;
    }

    const novaSenhaHash = await argon2.hash(novaSenha, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await client.query('BEGIN');

    await client.query(
      'UPDATE users SET senha_hash = $1, atualizado_em = NOW() WHERE id = $2',
      [novaSenhaHash, reset.user_id]
    );

    await client.query(
      'UPDATE password_resets SET usado = TRUE WHERE id = $1',
      [reset.id]
    );

    // Invalidate all sessions for this user (force re-login)
    await client.query(
      `DELETE FROM sessions WHERE sess::jsonb->>'userId' = $1`,
      [reset.user_id]
    );

    await client.query('COMMIT');

    await createAuditLog({
      userId: reset.user_id,
      acao: 'senha_redefinida',
      tabela: 'users',
      registroId: reset.user_id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    logger.info(`Password reset completed for user: ${reset.user_id}`);
    res.json({ message: 'Senha redefinida com sucesso.' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Change Password ─────────────────────────────────────────────────────────
export async function changePassword(req: Request, res: Response): Promise<void> {
  const userId = (req.session as any).userId;
  const { senhaAtual, novaSenha } = req.body;

  if (!senhaAtual || !novaSenha) {
    res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
    return;
  }

  if (novaSenha.length < 8) {
    res.status(400).json({ error: 'A nova senha deve ter pelo menos 8 caracteres.' });
    return;
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT senha_hash FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];
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

    // Invalidate all other sessions
    await client.query(
      `DELETE FROM sessions WHERE sid != $1 AND sess::jsonb->>'userId' = $2`,
      [req.sessionID, userId]
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

// ─── Terminate All Sessions ───────────────────────────────────────────────────
export async function terminateAllSessions(req: Request, res: Response): Promise<void> {
  const userId = (req.session as any).userId;
  const { targetUserId } = req.params;
  const sessionRole = (req.session as any).userRole;

  const idToTerminate = targetUserId || userId;

  // Only admin can terminate other users' sessions
  if (targetUserId && targetUserId !== userId && sessionRole !== 'administrador') {
    res.status(403).json({ error: 'Sem permissão para encerrar sessões de outros usuários.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query(
      `DELETE FROM sessions WHERE sess::jsonb->>'userId' = $1`,
      [idToTerminate]
    );

    if (idToTerminate === userId) {
      req.session.destroy(() => {});
      res.clearCookie('quattro.sid');
    }

    await createAuditLog({
      userId,
      acao: 'sessoes_encerradas',
      tabela: 'users',
      registroId: idToTerminate,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({ message: 'Todas as sessões foram encerradas.' });
  } finally {
    client.release();
  }
}

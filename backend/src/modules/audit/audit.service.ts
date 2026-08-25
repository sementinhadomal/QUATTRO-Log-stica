import { pool } from '../../config/database';
import { logger } from '../../config/logger';

interface AuditLogParams {
  userId?: string | null;
  acao: string;
  tabela?: string | null;
  registroId?: string | null;
  dadosAnteriores?: Record<string, any> | null;
  dadosNovos?: Record<string, any> | null;
  ip?: string | null;
  userAgent?: string | null;
}

export async function createAuditLog({
  userId = null,
  acao,
  tabela = null,
  registroId = null,
  dadosAnteriores = null,
  dadosNovos = null,
  ip = null,
  userAgent = null,
}: AuditLogParams): Promise<void> {
  try {
    const query = `
      INSERT INTO audit_logs (
        usuario_id, acao, tabela, registro_id, dados_anteriores, dados_novos, ip, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await pool.query(query, [
      userId,
      acao,
      tabela,
      registroId,
      dadosAnteriores ? JSON.stringify(dadosAnteriores) : null,
      dadosNovos ? JSON.stringify(dadosNovos) : null,
      ip,
      userAgent,
    ]);
  } catch (error: any) {
    logger.error('Failed to create audit log', {
      error: error.message,
      userId,
      acao,
      tabela,
      registroId,
    });
  }
}

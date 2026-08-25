import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../../config/database';
import { logger } from '../../config/logger';
import { createAuditLog } from '../audit/audit.service';
import { triggerPostback, PostbackEvent } from '../postbacks/postback.service';
import { OrderStatus } from '../../types/database';

// ─── Generate unique order code ───────────────────────────────────────────────
async function generateOrderCode(): Promise<string> {
  const client = await pool.connect();
  try {
    let code: string;
    let exists = true;
    let attempts = 0;
    
    do {
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      code = `Q${timestamp}${random}`.substring(0, 12);
      
      const result = await client.query(
        'SELECT id FROM orders WHERE codigo = $1',
        [code]
      );
      exists = result.rows.length > 0;
      attempts++;
    } while (exists && attempts < 10);
    
    return code!;
  } finally {
    client.release();
  }
}

// ─── Create Order ─────────────────────────────────────────────────────────────
export async function createOrder(req: Request, res: Response): Promise<void> {
  const userId = (req.session as any).userId;
  const {
    kitId,
    // Client data
    nome, cpf, telefone, email, semEmail,
    // Address
    cep, uf, cidade, rua, numero, bairro, complemento,
    // Order extras
    canalId,
    observacoes,
    vendedorId,
  } = req.body;

  if (!kitId || !nome || !cpf || !telefone || !cep || !uf || !cidade || !rua || !numero || !bairro) {
    res.status(400).json({ error: 'Dados obrigatórios faltando.' });
    return;
  }

  const cpfNormalized = cpf.replace(/\D/g, '');

  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    // Get kit info
    const kitResult = await dbClient.query(
      'SELECT id, produto_id, preco, nome FROM kits WHERE id = $1 AND ativo = TRUE',
      [kitId]
    );
    const kit = kitResult.rows[0];
    if (!kit) {
      res.status(400).json({ error: 'Kit não encontrado ou inativo.' });
      return;
    }

    // Find or create client (CPF is unique ID)
    let clientId: string;
    const existingClient = await dbClient.query(
      'SELECT id FROM clients WHERE cpf = $1 AND deletado_em IS NULL',
      [cpfNormalized]
    );

    if (existingClient.rows[0]) {
      clientId = existingClient.rows[0].id;
      // Update client info
      await dbClient.query(
        `UPDATE clients SET nome = $1, telefone = $2, email = COALESCE($3, email),
                sem_email = $4, atualizado_em = NOW()
         WHERE id = $5`,
        [nome, telefone, email || null, semEmail || false, clientId]
      );
    } else {
      clientId = uuidv4();
      await dbClient.query(
        `INSERT INTO clients (id, cpf, nome, telefone, email, sem_email)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [clientId, cpfNormalized, nome, telefone, email || null, semEmail || false]
      );
    }

    // Create address
    const addressId = uuidv4();
    await dbClient.query(
      `INSERT INTO addresses (id, client_id, cep, uf, cidade, rua, numero, bairro, complemento, principal)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)`,
      [addressId, clientId, cep.replace(/\D/g, ''), uf, cidade, rua, numero, bairro, complemento || null]
    );

    // Determine vendor
    const finalVendedorId = vendedorId || userId;

    // Generate order code
    const codigo = await generateOrderCode();
    const orderId = uuidv4();

    // Create order
    await dbClient.query(
      `INSERT INTO orders (id, codigo, client_id, address_id, kit_id, produto_id, valor,
        status, vendedor_id, canal_id, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'aguardando_confirmacao', $8, $9, $10)`,
      [orderId, codigo, clientId, addressId, kit.id, kit.produto_id, kit.preco,
       finalVendedorId, canalId || null, observacoes || null]
    );

    // Update client totals
    await dbClient.query(
      `UPDATE clients SET
        total_pedidos = total_pedidos + 1,
        total_em_aberto = total_em_aberto + $2,
        ultima_compra = NOW(),
        atualizado_em = NOW()
       WHERE id = $1`,
      [clientId, kit.preco]
    );

    // Create history entry
    await dbClient.query(
      `INSERT INTO order_history (id, order_id, user_id, status_anterior, status_novo, descricao)
       VALUES ($1, $2, $3, NULL, 'aguardando_confirmacao', 'Pedido criado')`,
      [uuidv4(), orderId, userId]
    );

    await dbClient.query('COMMIT');

    await createAuditLog({
      userId,
      acao: 'pedido_criado',
      tabela: 'orders',
      registroId: orderId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      dadosNovos: { codigo, kitId, valor: kit.preco },
    });

    // Trigger postback asynchronously
    triggerPostback('pedido_criado', orderId).catch((err) =>
      logger.warn('Postback trigger failed:', err.message)
    );

    res.status(201).json({
      id: orderId,
      codigo,
      status: 'aguardando_confirmacao',
      valor: kit.preco,
      clientId,
    });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    throw err;
  } finally {
    dbClient.release();
  }
}

// ─── Get Orders (Kanban) ─────────────────────────────────────────────────────
export async function getOrders(req: Request, res: Response): Promise<void> {
  const userId = (req.session as any).userId;
  const userRole = (req.session as any).userRole;
  
  const {
    status, vendedorId, cobradorId, kitId, estado, etiqueta,
    codigo, nome, cpf, telefone, dataInicio, dataFim, page, limit,
    kanban,
  } = req.query;

  const client = await pool.connect();
  try {
    let query = `
      SELECT o.id, o.codigo, o.valor, o.status, o.criado_em, o.atualizado_em,
             o.rastreio_codigo, o.rastreio_transportadora, o.pago_em,
             c.nome as cliente_nome, c.cpf as cliente_cpf, c.telefone as cliente_telefone,
             k.nome as kit_nome, k.quantidade as kit_quantidade,
             p.nome as produto_nome,
             v.nome as vendedor_nome, v.id as vendedor_id,
             cb.nome as cobrador_nome,
             a.cidade, a.uf,
             COALESCE(json_agg(DISTINCT jsonb_build_object('tag', ot.tag, 'cor', ot.cor)) 
               FILTER (WHERE ot.id IS NOT NULL), '[]') as etiquetas
      FROM orders o
      JOIN clients c ON c.id = o.client_id
      JOIN kits k ON k.id = o.kit_id
      JOIN products p ON p.id = o.produto_id
      LEFT JOIN users v ON v.id = o.vendedor_id
      LEFT JOIN users cb ON cb.id = o.cobrador_id
      LEFT JOIN addresses a ON a.id = o.address_id
      LEFT JOIN order_tags ot ON ot.order_id = o.id
      WHERE o.deletado_em IS NULL
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    // Vendedor only sees own orders
    if (userRole === 'vendedor') {
      query += ` AND o.vendedor_id = $${paramIndex++}`;
      params.push(userId);
    }

    // Cobrador only sees delivered orders
    if (userRole === 'cobrador') {
      query += ` AND o.status IN ('entregue_aguardando_pagamento', 'inadimplente', 'em_acordo', 'pago')`;
    }

    if (status) {
      if (Array.isArray(status)) {
        query += ` AND o.status = ANY($${paramIndex++}::order_status[])`;
        params.push(status);
      } else {
        query += ` AND o.status = $${paramIndex++}`;
        params.push(status);
      }
    }

    if (vendedorId) {
      query += ` AND o.vendedor_id = $${paramIndex++}`;
      params.push(vendedorId);
    }

    if (cobradorId) {
      query += ` AND o.cobrador_id = $${paramIndex++}`;
      params.push(cobradorId);
    }

    if (kitId) {
      query += ` AND o.kit_id = $${paramIndex++}`;
      params.push(kitId);
    }

    if (estado) {
      query += ` AND a.uf = $${paramIndex++}`;
      params.push(estado);
    }

    if (codigo) {
      query += ` AND o.codigo ILIKE $${paramIndex++}`;
      params.push(`%${codigo}%`);
    }

    if (nome) {
      query += ` AND c.nome ILIKE $${paramIndex++}`;
      params.push(`%${nome}%`);
    }

    if (cpf) {
      query += ` AND c.cpf = $${paramIndex++}`;
      params.push((cpf as string).replace(/\D/g, ''));
    }

    if (telefone) {
      query += ` AND c.telefone LIKE $${paramIndex++}`;
      params.push(`%${(telefone as string).replace(/\D/g, '')}%`);
    }

    if (dataInicio) {
      query += ` AND o.criado_em >= $${paramIndex++}`;
      params.push(dataInicio);
    }

    if (dataFim) {
      query += ` AND o.criado_em <= $${paramIndex++}`;
      params.push(dataFim);
    }

    query += ` GROUP BY o.id, c.nome, c.cpf, c.telefone, k.nome, k.quantidade, p.nome,
               v.nome, v.id, cb.nome, a.cidade, a.uf`;
    query += ` ORDER BY o.criado_em DESC`;

    if (!kanban) {
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 50;
      query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limitNum, (pageNum - 1) * limitNum);
    }

    const result = await client.query(query, params);
    
    if (kanban === 'true') {
      // Group by status for Kanban view
      const kanbanData: Record<string, any[]> = {};
      const statusSums: Record<string, number> = {};
      
      for (const row of result.rows) {
        if (!kanbanData[row.status]) {
          kanbanData[row.status] = [];
          statusSums[row.status] = 0;
        }
        kanbanData[row.status].push(row);
        statusSums[row.status] += parseFloat(row.valor) || 0;
      }
      
      res.json({ kanban: kanbanData, sums: statusSums });
    } else {
      res.json({ pedidos: result.rows, total: result.rowCount });
    }
  } finally {
    client.release();
  }
}

// ─── Get Single Order ─────────────────────────────────────────────────────────
export async function getOrder(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = (req.session as any).userId;
  const userRole = (req.session as any).userRole;

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT o.*, 
              c.nome as cliente_nome, c.cpf as cliente_cpf, c.telefone as cliente_telefone,
              c.email as cliente_email, c.sem_email, c.total_pedidos, c.total_pago, c.total_em_aberto,
              k.nome as kit_nome, k.quantidade as kit_quantidade, k.preco as kit_preco,
              k.peso_kg, k.altura_cm, k.largura_cm, k.comprimento_cm,
              p.nome as produto_nome,
              v.nome as vendedor_nome,
              cb.nome as cobrador_nome,
              a.cep, a.uf, a.cidade, a.rua, a.numero, a.bairro, a.complemento
       FROM orders o
       JOIN clients c ON c.id = o.client_id
       JOIN kits k ON k.id = o.kit_id
       JOIN products p ON p.id = o.produto_id
       LEFT JOIN users v ON v.id = o.vendedor_id
       LEFT JOIN users cb ON cb.id = o.cobrador_id
       LEFT JOIN addresses a ON a.id = o.address_id
       WHERE o.id = $1 AND o.deletado_em IS NULL`,
      [id]
    );

    const order = result.rows[0];
    if (!order) {
      res.status(404).json({ error: 'Pedido não encontrado.' });
      return;
    }

    // Vendedor can only see own orders
    if (userRole === 'vendedor' && order.vendedor_id !== userId) {
      res.status(403).json({ error: 'Sem permissão para ver este pedido.' });
      return;
    }

    // Get tags
    const tagsResult = await client.query(
      'SELECT id, tag, cor FROM order_tags WHERE order_id = $1',
      [id]
    );

    // Get evidences
    const evidencesResult = await client.query(
      `SELECT e.id, e.tipo, e.descricao, e.criado_em,
              f.nome_original, f.mime_type, f.tamanho_bytes, f.id as file_id
       FROM evidences e
       JOIN files f ON f.id = e.file_id
       WHERE e.order_id = $1
       ORDER BY e.criado_em DESC`,
      [id]
    );

    // Get history
    const historyResult = await client.query(
      `SELECT h.id, h.status_anterior, h.status_novo, h.descricao, h.metadata, h.criado_em,
              u.nome as usuario_nome
       FROM order_history h
       LEFT JOIN users u ON u.id = h.user_id
       WHERE h.order_id = $1
       ORDER BY h.criado_em DESC`,
      [id]
    );

    // Get notes
    const notesResult = await client.query(
      `SELECT n.id, n.texto, n.criado_em, n.atualizado_em, u.nome as usuario_nome
       FROM order_notes n
       JOIN users u ON u.id = n.user_id
       WHERE n.order_id = $1
       ORDER BY n.criado_em DESC`,
      [id]
    );

    // Get payments
    const paymentsResult = await client.query(
      `SELECT p.*, 
              json_agg(pr.id) FILTER (WHERE pr.id IS NOT NULL) as comprovantes
       FROM payments p
       LEFT JOIN payment_receipts pr ON pr.payment_id = p.id
       WHERE p.order_id = $1
       GROUP BY p.id`,
      [id]
    );

    res.json({
      pedido: {
        ...order,
        etiquetas: tagsResult.rows,
        evidencias: evidencesResult.rows,
        historico: historyResult.rows,
        observacoes_lista: notesResult.rows,
        pagamentos: paymentsResult.rows,
      },
    });
  } finally {
    client.release();
  }
}

// ─── Update Order Status ──────────────────────────────────────────────────────
export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = (req.session as any).userId;
  const userRole = (req.session as any).userRole;
  const { status, motivo } = req.body;

  const validStatuses: OrderStatus[] = [
    'aguardando_confirmacao', 'agendado', 'em_transito', 'saiu_para_entrega',
    'entrega_falhou', 'aguardando_retirada', 'entregue', 'entregue_aguardando_pagamento',
    'inadimplente', 'em_acordo', 'pago', 'frustrado', 'devolvido', 'cancelado',
  ];

  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Status inválido.' });
    return;
  }

  if (status === 'frustrado' && !motivo) {
    res.status(400).json({ error: 'Motivo é obrigatório ao marcar como Frustrado.' });
    return;
  }

  const client = await pool.connect();
  try {
    const orderResult = await client.query(
      'SELECT id, status, vendedor_id, valor FROM orders WHERE id = $1 AND deletado_em IS NULL',
      [id]
    );

    const order = orderResult.rows[0];
    if (!order) {
      res.status(404).json({ error: 'Pedido não encontrado.' });
      return;
    }

    // Permission checks
    if (userRole === 'vendedor' && order.vendedor_id !== userId) {
      res.status(403).json({ error: 'Sem permissão para alterar este pedido.' });
      return;
    }

    if (userRole === 'logistica' && !['agendado', 'em_transito', 'saiu_para_entrega', 'entrega_falhou', 'aguardando_retirada', 'entregue', 'entregue_aguardando_pagamento'].includes(status)) {
      res.status(403).json({ error: 'Logística não pode definir este status.' });
      return;
    }

    await client.query('BEGIN');

    const updates: Record<string, any> = {
      status,
      atualizado_em: new Date(),
    };

    if (status === 'frustrado' && motivo) {
      updates.motivo_frustracao = motivo;
    }

    if (status === 'pago') {
      updates.pago_em = new Date();
    }

    if (status === 'entrega_falhou') {
      updates.tentativas_entrega = order.tentativas_entrega + 1;
    }

    await client.query(
      `UPDATE orders SET status = $1, atualizado_em = NOW(), 
        motivo_frustracao = COALESCE($2, motivo_frustracao),
        pago_em = CASE WHEN $1 = 'pago' THEN NOW() ELSE pago_em END
       WHERE id = $3`,
      [status, motivo || null, id]
    );

    // Record history
    await client.query(
      `INSERT INTO order_history (id, order_id, user_id, status_anterior, status_novo, descricao)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        uuidv4(), id, userId, order.status, status,
        `Status alterado para: ${status}${motivo ? ` — Motivo: ${motivo}` : ''}`,
      ]
    );

    // If paid, update client totals
    if (status === 'pago') {
      await client.query(
        `UPDATE clients SET
          total_pago = total_pago + $2,
          total_em_aberto = GREATEST(0, total_em_aberto - $2),
          atualizado_em = NOW()
         WHERE id = (SELECT client_id FROM orders WHERE id = $1)`,
        [id, order.valor]
      );
    }

    await client.query('COMMIT');

    // Map status to postback event
    const postbackEventMap: Record<string, PostbackEvent> = {
      aguardando_confirmacao: 'aguardando_confirmacao',
      agendado: 'agendado',
      em_transito: 'em_transito',
      saiu_para_entrega: 'saiu_para_entrega',
      entrega_falhou: 'entrega_falhou',
      aguardando_retirada: 'aguardando_retirada',
      entregue: 'entregue',
      entregue_aguardando_pagamento: 'aguardando_pagamento',
      pago: 'pagamento_aprovado',
      inadimplente: 'inadimplente',
      em_acordo: 'em_acordo',
      frustrado: 'frustrado',
      devolvido: 'devolvido',
      cancelado: 'cancelado',
    };

    const pbEvent = postbackEventMap[status as string];
    if (pbEvent) {
      triggerPostback(pbEvent, id).catch((err) =>
        logger.warn('Postback trigger failed:', err.message)
      );
    }

    await createAuditLog({
      userId,
      acao: 'status_alterado',
      tabela: 'orders',
      registroId: id,
      dadosAnteriores: { status: order.status },
      dadosNovos: { status },
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({ id, status, message: 'Status atualizado com sucesso.' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Update Order ─────────────────────────────────────────────────────────────
export async function updateOrder(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = (req.session as any).userId;
  const userRole = (req.session as any).userRole;
  const { vendedorId, cobradorId, canalId, observacoes, paytLink } = req.body;

  const client = await pool.connect();
  try {
    const orderResult = await client.query(
      'SELECT id, vendedor_id, status FROM orders WHERE id = $1 AND deletado_em IS NULL',
      [id]
    );

    if (!orderResult.rows[0]) {
      res.status(404).json({ error: 'Pedido não encontrado.' });
      return;
    }

    const order = orderResult.rows[0];
    if (userRole === 'vendedor' && order.vendedor_id !== userId) {
      res.status(403).json({ error: 'Sem permissão para editar este pedido.' });
      return;
    }

    await client.query(
      `UPDATE orders SET
        vendedor_id = COALESCE($1, vendedor_id),
        cobrador_id = COALESCE($2, cobrador_id),
        canal_id = COALESCE($3, canal_id),
        observacoes = COALESCE($4, observacoes),
        payt_link = COALESCE($5, payt_link),
        atualizado_em = NOW()
       WHERE id = $6`,
      [vendedorId, cobradorId, canalId, observacoes, paytLink, id]
    );

    res.json({ message: 'Pedido atualizado.' });
  } finally {
    client.release();
  }
}

// ─── Add Note ─────────────────────────────────────────────────────────────────
export async function addNote(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = (req.session as any).userId;
  const { texto } = req.body;

  if (!texto?.trim()) {
    res.status(400).json({ error: 'Texto da observação é obrigatório.' });
    return;
  }

  const client = await pool.connect();
  try {
    const noteId = uuidv4();
    await client.query(
      `INSERT INTO order_notes (id, order_id, user_id, texto)
       VALUES ($1, $2, $3, $4)`,
      [noteId, id, userId, texto.trim()]
    );

    await client.query(
      `INSERT INTO order_history (id, order_id, user_id, descricao)
       VALUES ($1, $2, $3, $4)`,
      [uuidv4(), id, userId, `Observação adicionada: ${texto.trim().substring(0, 100)}`]
    );

    res.status(201).json({ id: noteId, texto, message: 'Observação adicionada.' });
  } finally {
    client.release();
  }
}

// ─── Add Tag ──────────────────────────────────────────────────────────────────
export async function addTag(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { tag, cor } = req.body;

  if (!tag?.trim()) {
    res.status(400).json({ error: 'Tag é obrigatória.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO order_tags (id, order_id, tag, cor)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (order_id, tag) DO UPDATE SET cor = $4`,
      [uuidv4(), id, tag.trim(), cor || null]
    );

    res.json({ message: 'Etiqueta adicionada.' });
  } finally {
    client.release();
  }
}

// ─── Remove Tag ───────────────────────────────────────────────────────────────
export async function removeTag(req: Request, res: Response): Promise<void> {
  const { id, tag } = req.params;

  const client = await pool.connect();
  try {
    await client.query(
      'DELETE FROM order_tags WHERE order_id = $1 AND tag = $2',
      [id, tag]
    );
    res.json({ message: 'Etiqueta removida.' });
  } finally {
    client.release();
  }
}

// ─── Get Frustrated Orders ────────────────────────────────────────────────────
export async function getFrustratedOrders(req: Request, res: Response): Promise<void> {
  const { motivo, vendedorId, kitId, dataInicio, dataFim, q } = req.query;

  const client = await pool.connect();
  try {
    let query = `
      SELECT o.id, o.codigo, o.valor, o.motivo_frustracao, o.tentativas_entrega,
             o.criado_em, o.atualizado_em,
             c.nome as cliente_nome, c.cpf as cliente_cpf,
             k.nome as kit_nome,
             p.nome as produto_nome,
             v.nome as vendedor_nome
      FROM orders o
      JOIN clients c ON c.id = o.client_id
      JOIN kits k ON k.id = o.kit_id
      JOIN products p ON p.id = o.produto_id
      LEFT JOIN users v ON v.id = o.vendedor_id
      WHERE o.status = 'frustrado' AND o.deletado_em IS NULL
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (motivo) {
      query += ` AND o.motivo_frustracao ILIKE $${paramIndex++}`;
      params.push(`%${motivo}%`);
    }

    if (vendedorId) {
      query += ` AND o.vendedor_id = $${paramIndex++}`;
      params.push(vendedorId);
    }

    if (kitId) {
      query += ` AND o.kit_id = $${paramIndex++}`;
      params.push(kitId);
    }

    if (dataInicio) {
      query += ` AND o.criado_em >= $${paramIndex++}`;
      params.push(dataInicio);
    }

    if (dataFim) {
      query += ` AND o.criado_em <= $${paramIndex++}`;
      params.push(dataFim);
    }

    if (q) {
      query += ` AND (c.nome ILIKE $${paramIndex} OR o.codigo ILIKE $${paramIndex})`;
      params.push(`%${q}%`);
      paramIndex++;
    }

    query += ' ORDER BY o.atualizado_em DESC';

    const result = await client.query(query, params);
    res.json({ frustrados: result.rows });
  } finally {
    client.release();
  }
}

// ─── Reactivate Frustrated Order ─────────────────────────────────────────────
export async function reactivateOrder(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = (req.session as any).userId;

  const client = await pool.connect();
  try {
    const orderResult = await client.query(
      "SELECT id, status FROM orders WHERE id = $1 AND status = 'frustrado' AND deletado_em IS NULL",
      [id]
    );

    if (!orderResult.rows[0]) {
      res.status(404).json({ error: 'Pedido frustrado não encontrado.' });
      return;
    }

    await client.query(
      `UPDATE orders SET status = 'aguardando_confirmacao', motivo_frustracao = NULL,
        atualizado_em = NOW() WHERE id = $1`,
      [id]
    );

    await client.query(
      `INSERT INTO order_history (id, order_id, user_id, status_anterior, status_novo, descricao)
       VALUES ($1, $2, $3, 'frustrado', 'aguardando_confirmacao', 'Pedido reativado')`,
      [uuidv4(), id, userId]
    );

    res.json({ message: 'Pedido reativado com sucesso.' });
  } finally {
    client.release();
  }
}

// ─── Check Recurring Client ───────────────────────────────────────────────────
export async function checkRecurringClient(req: Request, res: Response): Promise<void> {
  const { cpf } = req.query;

  if (!cpf) {
    res.status(400).json({ error: 'CPF é obrigatório.' });
    return;
  }

  const cpfNormalized = (cpf as string).replace(/\D/g, '');

  const client = await pool.connect();
  try {
    const clientResult = await client.query(
      `SELECT c.id, c.nome, c.cpf, c.telefone, c.total_pedidos, c.total_pago, c.total_em_aberto, c.ultima_compra
       FROM clients c
       WHERE c.cpf = $1 AND c.deletado_em IS NULL`,
      [cpfNormalized]
    );

    if (!clientResult.rows[0]) {
      res.json({ recorrente: false });
      return;
    }

    const existingClient = clientResult.rows[0];

    // Get recent orders
    const ordersResult = await client.query(
      `SELECT o.id, o.codigo, o.status, o.valor, o.criado_em, k.nome as kit_nome
       FROM orders o
       JOIN kits k ON k.id = o.kit_id
       WHERE o.client_id = $1 AND o.deletado_em IS NULL
       ORDER BY o.criado_em DESC
       LIMIT 5`,
      [existingClient.id]
    );

    res.json({
      recorrente: true,
      cliente: {
        ...existingClient,
        cpf: `***.***.${existingClient.cpf.slice(6, 9)}-${existingClient.cpf.slice(9)}`, // mask CPF
        telefone: existingClient.telefone.replace(/(\d{2})\d{5}(\d{4})/, '($1) *****-$2'), // mask phone
      },
      pedidos_anteriores: ordersResult.rows,
      badge: existingClient.total_pedidos > 1
        ? `${existingClient.total_pedidos}X`
        : null,
    });
  } finally {
    client.release();
  }
}

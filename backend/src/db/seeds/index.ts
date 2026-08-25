import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../../config/database';
import { logger } from '../../config/logger';

async function seed(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ─── Produto QUATTRO 4-em-1 ───────────────────────────────────────────────
    const produtoId = uuidv4();
    const existingProduct = await client.query(
      "SELECT id FROM products WHERE nome = 'QUATTRO 4-em-1'"
    );

    let finalProdutoId = existingProduct.rows[0]?.id;

    if (!finalProdutoId) {
      const productResult = await client.query(
        `INSERT INTO products (id, nome, descricao, ativo)
         VALUES ($1, $2, $3, TRUE)
         RETURNING id`,
        [produtoId, 'QUATTRO 4-em-1', 'Spray multifuncional 4 em 1 — qualidade premium']
      );
      finalProdutoId = productResult.rows[0].id;
      logger.info('✅ Produto QUATTRO 4-em-1 criado');
    } else {
      logger.info('ℹ️  Produto QUATTRO 4-em-1 já existe');
    }

    // ─── Kits ────────────────────────────────────────────────────────────────
    const kits = [
      {
        id: uuidv4(),
        nome: 'Kit com 2 sprays',
        quantidade: 2,
        preco: 347.00,
        descricao: '2 unidades do QUATTRO 4-em-1. Previsão de entrega: 2 a 5 dias úteis.',
        peso_kg: 0.6,
        altura_cm: 8,
        largura_cm: 12,
        comprimento_cm: 18,
        badge: null,
        ordem: 1,
        link_payt: null,
      },
      {
        id: uuidv4(),
        nome: 'Kit com 3 sprays — Mais escolhido',
        quantidade: 3,
        preco: 497.00,
        descricao: '3 unidades do QUATTRO 4-em-1. Previsão de entrega: 2 a 5 dias úteis.',
        peso_kg: 0.85,
        altura_cm: 8,
        largura_cm: 14,
        comprimento_cm: 22,
        badge: 'MAIS ESCOLHIDO',
        ordem: 2,
        link_payt: null,
      },
      {
        id: uuidv4(),
        nome: 'Kit com 6 sprays — Melhor oferta',
        quantidade: 6,
        preco: 797.00,
        descricao: '6 unidades do QUATTRO 4-em-1. Previsão de entrega: 2 a 5 dias úteis.',
        peso_kg: 1.6,
        altura_cm: 10,
        largura_cm: 18,
        comprimento_cm: 28,
        badge: 'MELHOR OFERTA',
        ordem: 3,
        link_payt: null,
      },
    ];

    for (const kit of kits) {
      const existing = await client.query(
        'SELECT id FROM kits WHERE nome = $1 AND produto_id = $2',
        [kit.nome, finalProdutoId]
      );

      if (!existing.rows[0]) {
        await client.query(
          `INSERT INTO kits (id, produto_id, nome, quantidade, preco, descricao,
            peso_kg, altura_cm, largura_cm, comprimento_cm, badge, ordem, ativo, link_payt)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE, $13)`,
          [
            kit.id, finalProdutoId, kit.nome, kit.quantidade, kit.preco, kit.descricao,
            kit.peso_kg, kit.altura_cm, kit.largura_cm, kit.comprimento_cm,
            kit.badge, kit.ordem, kit.link_payt,
          ]
        );
        logger.info(`✅ Kit criado: ${kit.nome} — R$ ${kit.preco}`);
      } else {
        logger.info(`ℹ️  Kit já existe: ${kit.nome}`);
      }
    }

    // ─── Administrador Inicial ───────────────────────────────────────────────
    const adminEmail = 'QUATTRO@gmail.com';
    const existingAdmin = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (!existingAdmin.rows[0]) {
      // Hash com Argon2id — nunca salvar a senha em texto
      const senhaHash = await argon2.hash('Quattro123@', {
        type: argon2.argon2id,
        memoryCost: 65536,   // 64 MB
        timeCost: 3,
        parallelism: 4,
      });

      await client.query(
        `INSERT INTO users (id, nome, email, senha_hash, funcao, ativo)
         VALUES ($1, $2, $3, $4, 'administrador', TRUE)`,
        [uuidv4(), 'Administrador QUATTRO', adminEmail, senhaHash]
      );
      logger.info(`✅ Administrador criado: ${adminEmail}`);
    } else {
      logger.info(`ℹ️  Administrador já existe: ${adminEmail}`);
    }

    // ─── Canal WhatsApp padrão ───────────────────────────────────────────────
    const existingChannel = await client.query(
      "SELECT id FROM whatsapp_channels WHERE nome = 'Principal'"
    );

    if (!existingChannel.rows[0]) {
      await client.query(
        `INSERT INTO whatsapp_channels (id, nome, numero, ativo)
         VALUES ($1, $2, $3, TRUE)`,
        [uuidv4(), 'Principal', '(00) 00000-0000']
      );
      logger.info('✅ Canal WhatsApp padrão criado');
    }

    await client.query('COMMIT');
    logger.info('🎉 Seed concluído com sucesso!');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('❌ Seed falhou:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  logger.error('Seed runner failed:', err);
  process.exit(1);
});

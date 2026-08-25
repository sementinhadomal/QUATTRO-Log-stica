import axios from 'axios';
import { Request, Response } from 'express';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { pool } from '../../config/database';

const superfretApi = axios.create({
  baseURL: env.SUPERFRETE_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests (never expose to client)
superfretApi.interceptors.request.use((config) => {
  if (env.SUPERFRETE_API_TOKEN) {
    config.headers['Authorization'] = `Bearer ${env.SUPERFRETE_API_TOKEN}`;
  }
  return config;
});

superfretApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // NEVER log the token
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    logger.error(`SuperFrete API error: ${status} — ${message}`);
    return Promise.reject(error);
  }
);

// ─── Get cotação ─────────────────────────────────────────────────────────────
async function getCotacao(req: Request, res: Response): Promise<void> {
  if (!env.SUPERFRETE_API_TOKEN) {
    res.status(503).json({ error: 'Integração SuperFrete aguardando credenciais.' });
    return;
  }

  try {
    const { orderId, kitId } = req.body;

    // Get order details including kit dimensions
    const client = await pool.connect();
    try {
      const orderResult = await client.query(
        `SELECT o.*, k.peso_kg, k.altura_cm, k.largura_cm, k.comprimento_cm, k.nome as kit_nome,
                k.preco, c.nome as cliente_nome, c.cpf,
                a.cep, a.rua, a.numero, a.complemento, a.bairro, a.cidade, a.uf
         FROM orders o
         JOIN kits k ON k.id = o.kit_id
         JOIN clients c ON c.id = o.client_id
         LEFT JOIN addresses a ON a.id = o.address_id
         WHERE o.id = $1`,
        [orderId]
      );

      if (!orderResult.rows[0]) {
        res.status(404).json({ error: 'Pedido não encontrado.' });
        return;
      }

      const order = orderResult.rows[0];

      if (!order.cep) {
        res.status(400).json({ error: 'Endereço do cliente não cadastrado.' });
        return;
      }

      // SuperFrete quote request
      const payload = {
        from: {
          postal_code: env.SUPERFRETE_FROM_ID || '01310100',
        },
        to: {
          postal_code: order.cep.replace(/\D/g, ''),
          name: order.cliente_nome,
          document: order.cpf.replace(/\D/g, ''),
          address: order.rua,
          number: order.numero,
          district: order.bairro,
          city: order.cidade,
          state_abbr: order.uf,
          complement: order.complemento || '',
        },
        package: {
          weight: parseFloat(order.peso_kg),
          width: parseFloat(order.largura_cm),
          height: parseFloat(order.altura_cm),
          length: parseFloat(order.comprimento_cm),
        },
        options: {
          receipt: false,
          own_hand: false,
          reverse: false,
          non_commercial: false,
        },
        services: '1,2,3,4,17',
      };

      const response = await superfretApi.post('/calculator', payload);
      res.json({ cotacoes: response.data });
    } finally {
      client.release();
    }
  } catch (err: any) {
    if (err.response?.status === 401) {
      res.status(503).json({ error: 'Token SuperFrete inválido. Verifique as credenciais.' });
    } else {
      res.status(500).json({ error: 'Erro ao consultar SuperFrete.' });
    }
  }
}

// ─── Criar envio ─────────────────────────────────────────────────────────────
async function criarEnvio(req: Request, res: Response): Promise<void> {
  if (!env.SUPERFRETE_API_TOKEN) {
    res.status(503).json({ error: 'Integração SuperFrete aguardando credenciais.' });
    return;
  }

  const { orderId, serviceId } = req.body;

  const dbClient = await pool.connect();
  try {
    // Check idempotency — don't create duplicate shipments
    const existingShipment = await dbClient.query(
      'SELECT id, superfrete_id FROM shipments WHERE order_id = $1 AND superfrete_id IS NOT NULL',
      [orderId]
    );

    if (existingShipment.rows[0]) {
      res.json({
        message: 'Envio já criado anteriormente.',
        shipmentId: existingShipment.rows[0].id,
        superfreteId: existingShipment.rows[0].superfrete_id,
      });
      return;
    }

    const orderResult = await dbClient.query(
      `SELECT o.*, k.peso_kg, k.altura_cm, k.largura_cm, k.comprimento_cm, k.nome as kit_nome,
              k.preco, c.nome as cliente_nome, c.cpf, c.email, c.telefone,
              a.cep, a.rua, a.numero, a.complemento, a.bairro, a.cidade, a.uf
       FROM orders o
       JOIN kits k ON k.id = o.kit_id
       JOIN clients c ON c.id = o.client_id
       LEFT JOIN addresses a ON a.id = o.address_id
       WHERE o.id = $1 AND o.deletado_em IS NULL`,
      [orderId]
    );

    const order = orderResult.rows[0];
    if (!order) {
      res.status(404).json({ error: 'Pedido não encontrado.' });
      return;
    }

    if (!order.cep) {
      res.status(400).json({ error: 'Endereço do cliente não cadastrado.' });
      return;
    }

    const payload = {
      service: serviceId || 1,
      agency: null,
      from: {
        name: 'QUATTRO Logística',
        postal_code: env.SUPERFRETE_FROM_ID || '01310100',
        email: env.EMAIL_USER || '',
        phone: '',
      },
      to: {
        name: order.cliente_nome,
        document: order.cpf.replace(/\D/g, ''),
        email: order.email || '',
        phone: (order.telefone || '').replace(/\D/g, ''),
        postal_code: order.cep.replace(/\D/g, ''),
        address: order.rua,
        number: order.numero,
        district: order.bairro,
        city: order.cidade,
        state_abbr: order.uf,
        complement: order.complemento || '',
      },
      products: [
        {
          name: order.kit_nome,
          quantity: 1,
          unitary_value: parseFloat(order.valor),
        },
      ],
      volumes: [
        {
          weight: parseFloat(order.peso_kg),
          width: parseFloat(order.largura_cm),
          height: parseFloat(order.altura_cm),
          length: parseFloat(order.comprimento_cm),
        },
      ],
      options: {
        invoice_key: null,
        insurance_value: parseFloat(order.valor),
        receipt: false,
        own_hand: false,
        reverse: false,
        non_commercial: false,
      },
    };

    const sfResponse = await superfretApi.post('/cart', payload);
    const sfData = sfResponse.data;

    // Save shipment to database
    await dbClient.query('BEGIN');

    const shipmentResult = await dbClient.query(
      `INSERT INTO shipments (id, order_id, superfrete_id, transportadora, servico, valor_frete, prazo_dias, status)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'criado')
       RETURNING id`,
      [
        orderId,
        sfData.id?.toString() || null,
        sfData.carrier?.name || null,
        sfData.service?.name || null,
        sfData.price || null,
        sfData.deadline || null,
      ]
    );

    const shipmentId = shipmentResult.rows[0].id;

    // Update order with tracking info
    await dbClient.query(
      `UPDATE orders SET 
        status = 'agendado',
        superfrete_id = $2,
        rastreio_codigo = $3,
        rastreio_transportadora = $4,
        rastreio_url = $5,
        atualizado_em = NOW()
       WHERE id = $1`,
      [
        orderId,
        sfData.id?.toString() || null,
        sfData.tracking || sfData.code || null,
        sfData.carrier?.name || null,
        sfData.tracking_url || null,
      ]
    );

    await dbClient.query('COMMIT');

    // Try to purchase/generate label (non-blocking)
    try {
      await superfretApi.post('/checkout', {
        orders: [sfData.id],
      });

      // Get label URL
      const labelResponse = await superfretApi.get(`/orders/${sfData.id}`);
      if (labelResponse.data?.label?.url) {
        await dbClient.query(
          'UPDATE shipments SET etiqueta_url = $1 WHERE id = $2',
          [labelResponse.data.label.url, shipmentId]
        );
      }
    } catch (labelErr: any) {
      logger.warn('Could not generate label automatically:', labelErr.message);
    }

    res.json({
      success: true,
      shipmentId,
      superfreteId: sfData.id,
      trackingCode: sfData.tracking || sfData.code,
      carrier: sfData.carrier?.name,
      price: sfData.price,
    });
  } catch (err: any) {
    await dbClient.query('ROLLBACK').catch(() => {});

    if (err.response?.status === 401) {
      res.status(503).json({ error: 'Token SuperFrete inválido.' });
    } else if (err.response?.status === 422) {
      res.status(422).json({ error: err.response.data?.message || 'Dados inválidos para SuperFrete.' });
    } else {
      res.status(500).json({ error: 'Erro ao criar envio na SuperFrete.' });
    }
  } finally {
    dbClient.release();
  }
}

// ─── Get etiqueta ─────────────────────────────────────────────────────────────
async function getEtiqueta(req: Request, res: Response): Promise<void> {
  if (!env.SUPERFRETE_API_TOKEN) {
    res.status(503).json({ error: 'Integração SuperFrete aguardando credenciais.' });
    return;
  }

  const { id } = req.params;

  try {
    const response = await superfretApi.get(`/orders/${id}`);
    const label = response.data?.label;

    if (!label?.url) {
      res.status(404).json({ error: 'Etiqueta ainda não disponível.' });
      return;
    }

    res.json({ url: label.url, format: label.format || 'pdf' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao buscar etiqueta.' });
  }
}

// ─── Get rastreio ─────────────────────────────────────────────────────────────
async function getRastreio(req: Request, res: Response): Promise<void> {
  if (!env.SUPERFRETE_API_TOKEN) {
    res.status(503).json({ error: 'Integração SuperFrete aguardando credenciais.' });
    return;
  }

  const { id } = req.params;

  try {
    const response = await superfretApi.get(`/tracking/${id}`);
    res.json({ tracking: response.data });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao consultar rastreamento.' });
  }
}

export const superfrete = {
  getCotacao,
  criarEnvio,
  getEtiqueta,
  getRastreio,
  api: superfretApi,
};

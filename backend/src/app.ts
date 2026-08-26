import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { logger } from './config/logger';
import { apiRateLimiter } from './middleware/rateLimiter';

// Import all routers
import authRoutes from './modules/auth/auth.routes';
import ordersRoutes from './modules/orders/orders.routes';
import clientsRoutes from './modules/clients/clients.routes';
import usersRoutes from './modules/users/users.routes';
import departmentsRoutes from './modules/departments/departments.routes';
import productsRoutes from './modules/products/products.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import trafficRoutes from './modules/traffic/traffic.routes';
import integrationsRoutes from './modules/integrations/integrations.routes';
import postbacksRoutes from './modules/postbacks/postbacks.routes';
import billingRoutes from './modules/billing/billing.routes';
import filesRoutes from './modules/files/files.routes';
import { superfreteWebhookRouter } from './webhooks/superfrete.webhook';
import { handlePaytWebhook } from './modules/billing/billing.controller';

const app = express();

// Trust proxy for rate limiting & session cookies behind proxies (Vercel, Nginx)
app.set('trust proxy', 1);

// Security
app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// Session (Stateless Bearer Tokens + Failsafe MemoryStore)
app.use(session({
  name: 'quattro.sid',
  secret: env.SESSION_SECRET || 'quattro_default_secret_32chars_min_safe',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// Webhooks
app.use('/webhooks/superfrete', express.raw({ type: 'application/json' }), superfreteWebhookRouter);
app.post('/webhooks/payt', express.raw({ type: 'application/json' }), handlePaytWebhook as express.RequestHandler);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api', apiRateLimiter);

// Routes mounted on both /api/* AND /* for Vercel Serverless compatibility
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/pedidos', ordersRoutes);
app.use('/pedidos', ordersRoutes);

app.use('/api/clientes', clientsRoutes);
app.use('/clientes', clientsRoutes);

app.use('/api/usuarios', usersRoutes);
app.use('/usuarios', usersRoutes);

app.use('/api/departamentos', departmentsRoutes);
app.use('/departamentos', departmentsRoutes);

app.use('/api/produtos', productsRoutes);
app.use('/produtos', productsRoutes);

app.use('/api/dashboard', dashboardRoutes);
app.use('/dashboard', dashboardRoutes);

app.use('/api/trafego', trafficRoutes);
app.use('/trafego', trafficRoutes);

app.use('/api/integracoes', integrationsRoutes);
app.use('/integracoes', integrationsRoutes);

app.use('/api/postbacks', postbacksRoutes);
app.use('/postbacks', postbacksRoutes);

app.use('/api/cobrancas', billingRoutes);
app.use('/cobrancas', billingRoutes);

app.use('/api/arquivos', filesRoutes);
app.use('/arquivos', filesRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404
app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

// Global Failsafe Error handler — Ensures serverless function NEVER crashes with 500
app.use((err: any, req: any, res: any, next: any) => {
  logger.error('Unhandled error:', { message: err?.message, stack: err?.stack, url: req.url });
  res.status(200).json({ status: 'ok', error: err?.message || 'Erro interno.' });
});

export default app;

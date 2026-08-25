import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import helmet from 'helmet';
import cors from 'cors';
import { pool, testConnection } from './config/database';
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

// Start cron jobs
import './jobs/tracking.job';
import './jobs/postback.retry.job';

const PgSession = connectPgSimple(session);
const app = express();

// Trust proxy for rate limiting behind Nginx
app.set('trust proxy', 1);

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      scriptSrc: ["'self'"],
    },
  },
}));

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

// Session
app.use(session({
  store: new PgSession({ pool, tableName: 'sessions', createTableIfMissing: false }),
  name: 'quattro.sid',
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: env.IS_PRODUCTION,
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  },
}));

// Webhooks (raw body needed for signature validation)
app.use('/webhooks/superfrete', express.raw({ type: 'application/json' }), superfreteWebhookRouter);
app.post('/webhooks/payt', express.raw({ type: 'application/json' }), handlePaytWebhook as express.RequestHandler);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api', apiRateLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pedidos', ordersRoutes);
app.use('/api/clientes', clientsRoutes);
app.use('/api/usuarios', usersRoutes);
app.use('/api/departamentos', departmentsRoutes);
app.use('/api/produtos', productsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/trafego', trafficRoutes);
app.use('/api/integracoes', integrationsRoutes);
app.use('/api/postbacks', postbacksRoutes);
app.use('/api/cobrancas', billingRoutes);
app.use('/api/arquivos', filesRoutes);

// Health check
app.get('/health', (req, res) => { res.json({ status: 'ok', timestamp: new Date().toISOString() }); });

// 404
app.use((req, res) => { res.status(404).json({ error: 'Rota não encontrada.' }); });

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  logger.error('Unhandled error:', { message: err.message, stack: err.stack, url: req.url });
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

async function start() {
  await testConnection();
  app.listen(env.PORT, () => {
    logger.info(`🚀 QUATTRO Logística Backend running on port ${env.PORT}`);
    logger.info(`📱 Frontend URL: ${env.FRONTEND_URL}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    logger.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;

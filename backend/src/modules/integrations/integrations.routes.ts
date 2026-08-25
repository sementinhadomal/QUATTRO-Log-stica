import { Router } from 'express';
import { queryCPF, queryCEP } from './integrations.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { superfrete } from './superfrete.service';
import { getIntegrationsStatus, testIntegration } from './integrations.status';

const router = Router();

// All integration routes require authentication
router.use(requireAuth);

// CPF lookup (backend proxy - token never exposed to client)
router.post('/cpf', queryCPF);

// CEP lookup (backend proxy)
router.get('/cep', queryCEP);

// Integration status dashboard
router.get('/status', getIntegrationsStatus);
router.post('/testar/:nome', testIntegration);

// SuperFrete endpoints
router.post('/superfrete/cotacao', superfrete.getCotacao);
router.post('/superfrete/criar-envio', superfrete.criarEnvio);
router.get('/superfrete/etiqueta/:id', superfrete.getEtiqueta);
router.get('/superfrete/rastreio/:id', superfrete.getRastreio);

export default router;

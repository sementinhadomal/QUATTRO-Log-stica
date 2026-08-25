import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import * as postbacksController from './postbacks.controller';

const router = Router();

router.use(requireAuth);

router.get('/configs', postbacksController.getConfigs);
router.post('/configs', postbacksController.createConfig);
router.put('/configs/:id', postbacksController.updateConfig);
router.delete('/configs/:id', postbacksController.deleteConfig);
router.post('/configs/:id/test', postbacksController.testPostback);

router.get('/attempts', postbacksController.getAttempts);
router.post('/attempts/:id/retry', postbacksController.retryPostback);
router.get('/logs', postbacksController.getLogs);

export default router;

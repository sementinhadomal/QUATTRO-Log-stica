import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import * as clientsController from './clients.controller';

const router = Router();

router.use(requireAuth);

router.get('/', clientsController.getClients);
router.get('/stats', clientsController.getClientStats);
router.get('/:id', clientsController.getClient);
router.put('/:id', clientsController.updateClient);

export default router;

import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import * as trafficController from './traffic.controller';

const router = Router();

router.use(requireAuth);

router.get('/', trafficController.getTrafficData);
router.post('/', trafficController.createTrafficData);
router.put('/:id', trafficController.updateTrafficData);
router.delete('/:id', trafficController.deleteTrafficData);
router.post('/importar-csv', trafficController.importCSV);

export default router;

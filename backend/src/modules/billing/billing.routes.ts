import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { uploadMiddleware } from '../files/upload.middleware';
import * as billingController from './billing.controller';

const router = Router();

router.use(requireAuth);

router.get('/:orderId/pagamentos', billingController.getPayments);
router.post('/:orderId/comprovante', uploadMiddleware, billingController.addReceipt);

export default router;

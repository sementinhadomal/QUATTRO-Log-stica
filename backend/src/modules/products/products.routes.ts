import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import * as productsController from './products.controller';

const router = Router();

router.use(requireAuth);

router.get('/', productsController.getProducts);
router.get('/kits', productsController.getKits);
router.put('/kits/:id', productsController.updateKit);

router.get('/canais-whatsapp', productsController.getWhatsappChannels);
router.post('/canais-whatsapp', productsController.createWhatsappChannel);
router.put('/canais-whatsapp/:id', productsController.updateWhatsappChannel);
router.delete('/canais-whatsapp/:id', productsController.deleteWhatsappChannel);

export default router;

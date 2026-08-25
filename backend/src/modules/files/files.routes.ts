import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { uploadMiddleware } from './upload.middleware';
import * as filesController from './files.controller';

const router = Router();

router.get('/download', filesController.serveFile);

router.use(requireAuth);

router.post('/evidencias/:orderId', uploadMiddleware, filesController.uploadEvidence);
router.post('/termos/:orderId', uploadMiddleware, filesController.uploadTerm);
router.get('/url/:fileId', filesController.getFileUrl);
router.delete('/evidencias/:id', filesController.deleteFile);

export default router;

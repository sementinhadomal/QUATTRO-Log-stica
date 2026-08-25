import { Router } from 'express';
import {
  createOrder, getOrders, getOrder, updateOrderStatus, updateOrder,
  addNote, addTag, removeTag, getFrustratedOrders, reactivateOrder,
  checkRecurringClient,
} from './orders.controller';
import { requireAuth, requireRole, canCreateOrders, canManageShipping } from '../../middleware/requireAuth';
import { uploadMiddleware } from '../files/upload.middleware';

const router = Router();

router.use(requireAuth);

// Orders CRUD
router.post('/', canCreateOrders, createOrder);
router.get('/', getOrders);
router.get('/frustrados', getFrustratedOrders);
router.get('/verificar-recorrente', checkRecurringClient);
router.get('/:id', getOrder);
router.put('/:id', updateOrder);
router.patch('/:id/status', updateOrderStatus);

// Notes & Tags
router.post('/:id/notas', addNote);
router.post('/:id/etiquetas', addTag);
router.delete('/:id/etiquetas/:tag', removeTag);

// Frustrated
router.post('/:id/reativar', requireRole('administrador', 'gestor'), reactivateOrder);

export default router;

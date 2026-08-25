import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import * as departmentsController from './departments.controller';

const router = Router();

router.use(requireAuth);

router.get('/', departmentsController.getDepartments);
router.post('/', departmentsController.createDepartment);
router.put('/:id', departmentsController.updateDepartment);
router.delete('/:id', departmentsController.deleteDepartment);

export default router;

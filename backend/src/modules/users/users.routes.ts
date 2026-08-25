import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import * as usersController from './users.controller';

const router = Router();

router.use(requireAuth);

router.get('/', usersController.getUsers);
router.post('/', usersController.createUser);
router.put('/profile', usersController.updateProfile); // Specific to logged in user
router.put('/:id', usersController.updateUser);
router.patch('/:id/suspend', usersController.suspendUser);
router.patch('/:id/reactivate', usersController.reactivateUser);
router.patch('/:id/role', usersController.changeUserRole);

export default router;

import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';

const router = Router();

router.get(
  '/',
  authenticate,
  roleMiddleware(['admin']),
  dashboardController.getAdminDashboard.bind(dashboardController)
);

export default router;


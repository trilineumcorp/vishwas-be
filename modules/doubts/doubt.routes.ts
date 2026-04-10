import { Router } from 'express';
import { doubtController } from './doubt.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';

const router = Router();

router.get('/', authenticate, roleMiddleware(['student']), doubtController.getMyDoubts.bind(doubtController));
router.post('/', authenticate, roleMiddleware(['student']), doubtController.createDoubt.bind(doubtController));

export default router;


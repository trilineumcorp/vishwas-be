import { Router } from 'express';
import { examResultController } from './exam-result.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', examResultController.getAllResults.bind(examResultController));
router.get('/student/:studentId', examResultController.getResultsByStudent.bind(examResultController));
router.get('/:id', examResultController.getResultById.bind(examResultController));
router.post('/', examResultController.createResult.bind(examResultController));

export default router;


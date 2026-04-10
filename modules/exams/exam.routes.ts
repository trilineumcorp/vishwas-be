import { Router } from 'express';
import { examController } from './exam.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';
import multer from 'multer';

const router = Router();

/**
 * Legacy exam upload route (disk storage disabled).
 * For serverless / Vercel deployments, use `exam.routes.s3.ts`.
 * This file remains as a non-persistent fallback implementation.
 */
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});

// Public routes
router.get('/', examController.getAllExams.bind(examController));
router.get('/:id', examController.getExamById.bind(examController));

// Admin only routes
router.post('/', authenticate, roleMiddleware(['admin']), examController.createExam.bind(examController));
router.put('/:id', authenticate, roleMiddleware(['admin']), examController.updateExam.bind(examController));
router.delete('/:id', authenticate, roleMiddleware(['admin']), examController.deleteExam.bind(examController));

// Admin document upload + parsing (PDF/DOCX)
router.post(
  '/upload',
  authenticate,
  roleMiddleware(['admin']),
  upload.single('file'),
  examController.uploadExamDocument.bind(examController)
);

export default router;


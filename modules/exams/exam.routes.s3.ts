import { Router } from 'express';
import { uploadExamDocument } from '../../middlewares/upload.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';
import { ExamControllerS3 } from './exam.controller.s3';

const router = Router();
const examController = new ExamControllerS3();

/**
 * Exam Routes with S3 File Upload
 * All routes use memory storage (multer memoryStorage) and upload directly to S3
 */

/**
 * POST /api/exams/upload-document
 * Upload exam document (PDF, DOCX) directly to S3 and parse content
 */
router.post(
  '/upload-document',
  authenticate,
  roleMiddleware(['admin']),
  uploadExamDocument,
  async (req, res) => {
    try {
      const file = (req as any).file as any;

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No file provided',
        });
        return;
      }

      await examController.uploadDocumentAndParseQuestions(req as any, res);
    } catch (error: any) {
      console.error('Exam document upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload exam document',
      });
    }
  }
);

/**
 * GET /api/exams
 * Get all active exams
 */
router.get('/', authenticate, async (req, res) => {
  try {
    await examController.getAllExams(req as any, res);
  } catch (error: any) {
    console.error('Get exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exams',
    });
  }
});

/**
 * GET /api/exams/:id
 * Get specific exam by ID
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    await examController.getExamById(req as any, res);
  } catch (error: any) {
    console.error('Get exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam',
    });
  }
});

/**
 * POST /api/exams
 * Create a new exam
 */
router.post(
  '/',
  authenticate,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      await examController.createExam(req as any, res);
    } catch (error: any) {
      console.error('Create exam error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create exam',
      });
    }
  }
);

/**
 * PUT /api/exams/:id
 * Update exam
 */
router.put(
  '/:id',
  authenticate,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      await examController.updateExam(req as any, res);
    } catch (error: any) {
      console.error('Update exam error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update exam',
      });
    }
  }
);

/**
 * DELETE /api/exams/:id
 * Delete exam and associated S3 files
 */
router.delete(
  '/:id',
  authenticate,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      await examController.deleteExam(req as any, res);
    } catch (error: any) {
      console.error('Delete exam error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete exam',
      });
    }
  }
);

export default router;

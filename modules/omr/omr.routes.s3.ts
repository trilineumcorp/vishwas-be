import { Router } from 'express';
import { uploadOMRFile } from '../../middlewares/upload.middleware';
import { OMRControllerS3 } from './omr.controller.s3';
import { authenticate } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';

const router = Router();
const omrController = new OMRControllerS3();

/**
 * OMR Routes with S3 File Upload
 * All routes use memory storage (multer memoryStorage) and upload directly to S3
 */

/**
 * POST /api/omr/upload
 * Upload OMR image directly to S3
 * Requires authentication and appropriate role
 */
router.post(
  '/upload',
  authenticate,
  roleMiddleware(['student', 'admin']),
  uploadOMRFile,
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

      // Call controller method to handle S3 upload
      await omrController.uploadAndProcess(req as any, res);
    } catch (error: any) {
      console.error('OMR upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload OMR file',
      });
    }
  }
);

/**
 * GET /api/omr/:id
 * Get OMR upload record by ID
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    await omrController.getOMRById(req as any, res);
  } catch (error: any) {
    console.error('Get OMR error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch OMR record',
    });
  }
});

/**
 * GET /api/omr
 * Get all OMR uploads for authenticated user
 */
router.get('/', authenticate, async (req, res) => {
  try {
    await omrController.getUserOMRs(req as any, res);
  } catch (error: any) {
    console.error('Get user OMRs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch OMR records',
    });
  }
});

/**
 * DELETE /api/omr/:id
 * Delete OMR record and file from S3
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await omrController.deleteOMR(req as any, res);
  } catch (error: any) {
    console.error('Delete OMR error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete OMR record',
    });
  }
});

export default router;

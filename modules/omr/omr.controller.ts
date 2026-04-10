import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { OMRUpload } from './upload.model';
import { logger } from '../../utils/logger';

class OMRController {
  async uploadAndQueueProcessing(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      const { examId } = req.body;
      const file = (req as any).file;

      if (!adminId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!file) {
        res.status(400).json({ success: false, message: 'File is required' });
        return;
      }

      const upload = await OMRUpload.create({
        adminId,
        examId: examId || undefined,
        originalFilename: file.originalname,
        storagePath: file.path,
        mimeType: file.mimetype,
        parsed: false,
      });

      // TODO: enqueue background OMR processing job (BullMQ / worker)
      logger.info('OMR upload saved', { uploadId: upload._id.toString() });

      res.status(201).json({
        success: true,
        data: upload,
        message: 'OMR file uploaded. Processing will run in background.',
      });
    } catch (error: any) {
      logger.error('OMR upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload OMR file',
      });
    }
  }

  async listUploads(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { examId } = req.query;
      const filter: any = {};

      if (examId) {
        filter.examId = examId;
      }

      const uploads = await OMRUpload.find(filter)
        .sort({ createdAt: -1 })
        .limit(100);

      res.status(200).json({
        success: true,
        data: uploads,
      });
    } catch (error: any) {
      logger.error('List OMR uploads error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch OMR uploads',
      });
    }
  }
}

export const omrController = new OMRController();


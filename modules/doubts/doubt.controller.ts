import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { Student } from '../student/student.model';
import { Doubt } from './doubt.model';
import { logger } from '../../utils/logger';

export class DoubtController {
  async getMyDoubts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user?.id;
      const doubts = await Doubt.find({ studentId })
        .sort({ createdAt: -1 })
        .lean();

      res.status(200).json({
        success: true,
        data: doubts,
      });
    } catch (error: any) {
      logger.error('Get doubts error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch doubts',
      });
    }
  }

  async createDoubt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user?.id;
      const { title, description, subject } = req.body as {
        title?: string;
        description?: string;
        subject?: string;
      };

      if (!title || !description) {
        res.status(400).json({
          success: false,
          message: 'title and description are required',
        });
        return;
      }

      const student = await Student.findById(studentId).lean();
      const doubt = await Doubt.create({
        studentId,
        studentName: (student as any)?.name,
        title,
        description,
        subject,
        status: 'pending',
      });

      res.status(201).json({
        success: true,
        data: doubt,
      });
    } catch (error: any) {
      logger.error('Create doubt error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create doubt',
      });
    }
  }
}

export const doubtController = new DoubtController();


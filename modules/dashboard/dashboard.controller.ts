import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { Student } from '../student/student.model';
import { Exam } from '../exams/exam.model';
import { Video } from '../videos/video.model';
import { FlipBook } from '../flipbooks/flipbook.model';
import { ExamResult } from '../exam-results/exam-result.model';
import { logger } from '../../utils/logger';

export class DashboardController {
  async getAdminDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const [
        totalStudents,
        activeStudents,
        totalExams,
        activeExams,
        totalVideos,
        totalFlipbooks,
        totalExamResults,
        avgScoreAgg,
      ] = await Promise.all([
        Student.countDocuments({}),
        Student.countDocuments({ isActive: true }),
        Exam.countDocuments({}),
        Exam.countDocuments({ isActive: true }),
        Video.countDocuments({}),
        FlipBook.countDocuments({}),
        ExamResult.countDocuments({}),
        ExamResult.aggregate([{ $group: { _id: null, avg: { $avg: '$percentage' } } }]),
      ]);

      const avgScore =
        Array.isArray(avgScoreAgg) && avgScoreAgg[0] && typeof avgScoreAgg[0].avg === 'number'
          ? Math.round(avgScoreAgg[0].avg * 10) / 10
          : 0;

      res.status(200).json({
        success: true,
        data: {
          totalStudents,
          activeStudents,
          totalExams,
          activeExams,
          totalVideos,
          totalFlipbooks,
          totalExamResults,
          avgScore,
        },
      });
    } catch (error: any) {
      logger.error('Admin dashboard error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch admin dashboard',
      });
    }
  }
}

export const dashboardController = new DashboardController();


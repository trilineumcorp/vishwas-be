import { Request, Response } from 'express';
import { ExamResult } from './exam-result.model';
import { Exam } from '../exams/exam.model';
import { logger } from '../../utils/logger';
import { AuthRequest } from '../../middlewares/auth.middleware';

export class ExamResultController {
  async getAllResults(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;

      let query: any = {};
      
      // Students can only see their own results
      if (role === 'student') {
        query.studentId = userId;
      }

      const results = await ExamResult.find(query)
        .sort({ completedAt: -1 })
        .select('-__v')
        .populate('studentId', 'name email studentId');

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      logger.error('Get exam results error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exam results',
      });
    }
  }

  async getResultById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const role = req.user?.role;

      const result = await ExamResult.findById(id).populate('studentId', 'name email studentId');

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Exam result not found',
        });
        return;
      }

      // Students can only access their own results
      if (role === 'student' && result.studentId.toString() !== userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Get exam result error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exam result',
      });
    }
  }

  async createResult(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { examId, examTitle, score, totalMarks, answers } = req.body;
      const userId = req.user?.id;

      // Enrich answers with isCorrect using the canonical exam paper
      const exam = await Exam.findById(examId);
      if (!exam) {
        res.status(404).json({ success: false, message: 'Exam not found' });
        return;
      }

      const answersWithCorrect = Array.isArray(answers)
        ? answers.map((a: any) => {
            const qId = String(a.questionId ?? '');
            const selectedAnswer = Number(a.selectedAnswer);

            // Frontend uses ids like `q1`, `q2`, ...; map back to index
            let idx = -1;
            const qMatch = qId.match(/^q(\d+)$/i);
            if (qMatch) {
              idx = parseInt(qMatch[1], 10) - 1;
            }

            const question = idx >= 0 ? exam.questions[idx] : undefined;
            const correctAnswer = question?.correctAnswer;

            return {
              questionId: qId,
              selectedAnswer,
              isCorrect: typeof correctAnswer === 'number' ? selectedAnswer === correctAnswer : false,
            };
          })
        : [];

      // Recompute score/totalMarks/percentage using exam paper (authoritative)
      const computedTotalMarks =
        typeof exam.totalMarks === 'number'
          ? exam.totalMarks
          : exam.questions.reduce((sum, q) => sum + (q.marks ?? 1), 0);

      const computedScore = answersWithCorrect.reduce((sum: number, a: any) => {
        if (!a?.isCorrect) return sum;
        const qId = String(a.questionId ?? '');
        const qMatch = qId.match(/^q(\d+)$/i);
        if (!qMatch) return sum;
        const idx = parseInt(qMatch[1], 10) - 1;
        const q = exam.questions[idx];
        return sum + (q?.marks ?? 1);
      }, 0);

      const computedPercentage =
        computedTotalMarks > 0 ? (computedScore / computedTotalMarks) * 100 : 0;

      const result = await ExamResult.create({
        examId,
        examTitle,
        studentId: userId,
        score: computedScore,
        totalMarks: computedTotalMarks,
        percentage: Math.round(computedPercentage * 100) / 100, // Round to 2 decimal places
        answers: answersWithCorrect,
        completedAt: new Date(),
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Create exam result error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create exam result',
      });
    }
  }

  async getResultsByStudent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const role = req.user?.role;
      const userId = req.user?.id;

      // Students can only see their own results
      if (role === 'student' && studentId !== userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      const results = await ExamResult.find({ studentId })
        .sort({ completedAt: -1 })
        .select('-__v');

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      logger.error('Get student results error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student results',
      });
    }
  }
}

export const examResultController = new ExamResultController();


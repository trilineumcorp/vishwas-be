import { Request, Response } from 'express';
import { Exam } from './exam.model';
import { logger } from '../../utils/logger';
import { AuthRequest } from '../../middlewares/auth.middleware';
import fs from 'fs';

export class ExamController {
  async getAllExams(req: Request, res: Response): Promise<void> {
    try {
      const { standard, subject, examType } = req.query;
      const filter: any = { isActive: true };

      if (standard) {
        const s = parseInt(standard as string, 10);
        filter.$or = [{ standard: s }, { standard: { $exists: false } }, { standard: null }];
      }
      if (subject) {
        filter.subject = subject;
      }
      if (examType) {
        filter.examType = examType;
      }

      const exams = await Exam.find(filter)
        .sort({ createdAt: -1 })
        .select('-__v');

      res.status(200).json({
        success: true,
        data: exams,
      });
    } catch (error: any) {
      logger.error('Get exams error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exams',
      });
    }
  }

  async getExamById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const exam = await Exam.findById(id).select('-__v');

      if (!exam) {
        res.status(404).json({
          success: false,
          message: 'Exam not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: exam,
      });
    } catch (error: any) {
      logger.error('Get exam by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exam',
      });
    }
  }

  async createExam(req: AuthRequest, res: Response): Promise<void> {
    try {
      const examData = req.body;
      const questions = examData.questions || [];

      // Validate questions
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Exam must have at least one question',
        });
        return;
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question) {
          res.status(400).json({
            success: false,
            message: `Question ${i + 1} is invalid`,
          });
          return;
        }
        if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
          res.status(400).json({
            success: false,
            message: `Question ${i + 1} is invalid`,
          });
          return;
        }
        if (q.correctAnswer === undefined || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
          res.status(400).json({
            success: false,
            message: `Question ${i + 1} has invalid correct answer index`,
          });
          return;
        }
      }

      const exam = new Exam({
        ...examData,
        questions,
        createdBy: req.user?.id,
      });

      await exam.save();

      res.status(201).json({
        success: true,
        data: exam,
        message: 'Exam created successfully',
      });
    } catch (error: any) {
      logger.error('Create exam error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create exam',
      });
    }
  }

  async updateExam(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const questions = updateData.questions;

      // Validate questions if provided
      if (questions) {
        if (!Array.isArray(questions) || questions.length === 0) {
          res.status(400).json({
            success: false,
            message: 'Exam must have at least one question',
          });
          return;
        }

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          if (!q.question) {
            res.status(400).json({
              success: false,
              message: `Question ${i + 1} is invalid`,
            });
            return;
          }
          if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
            res.status(400).json({
              success: false,
              message: `Question ${i + 1} is invalid`,
            });
            return;
          }
          if (q.correctAnswer === undefined || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
            res.status(400).json({
              success: false,
              message: `Question ${i + 1} has invalid correct answer index`,
            });
            return;
          }
        }
      }

      const exam = await Exam.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!exam) {
        res.status(404).json({
          success: false,
          message: 'Exam not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: exam,
        message: 'Exam updated successfully',
      });
    } catch (error: any) {
      logger.error('Update exam error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update exam',
      });
    }
  }

  async deleteExam(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const exam = await Exam.findByIdAndDelete(id);

      if (!exam) {
        res.status(404).json({
          success: false,
          message: 'Exam not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Exam deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete exam error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete exam',
      });
    }
  }

  async uploadExamDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Multer file typing isn't available globally; cast safely.
      const file = (req as any).file as any | undefined;
      const { standard, subject, examType, title } = req.body;

      if (!file) {
        res.status(400).json({ success: false, message: 'File is required' });
        return;
      }

      const buffer = fs.readFileSync(file.path);
      let text = '';

      const originalName = String(file.originalname || '').toLowerCase();
      const mimeType = String(file.mimetype || '').toLowerCase();

      if (mimeType === 'application/pdf' || originalName.endsWith('.pdf')) {
        // Lazy require to avoid issues during build if dependencies missing
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pdfParse = require('pdf-parse');
        const result = await pdfParse(buffer);
        text = result.text || '';
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        originalName.endsWith('.docx')
      ) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        text = result.value || '';
      } else {
        // Fallback: try treating as plain text
        text = buffer.toString('utf-8');
      }

      if (!text.trim()) {
        res.status(400).json({
          success: false,
          message: 'Could not extract text from document',
        });
        return;
      }

      const questions = this.parseQuestionsFromText(text);

      res.status(200).json({
        success: true,
        data: {
          title: title || file.originalname.replace(/\.(pdf|docx)$/i, ''),
          duration: 60,
          standard: standard ? parseInt(standard, 10) : undefined,
          subject: subject || undefined,
          examType: examType || undefined,
          passingMarks: 0,
          questions,
        },
      });
    } catch (error: any) {
      logger.error('Upload exam document error:', error);
      const message = String(error?.message || '');
      if (message.includes("Cannot find module 'pdf-parse'")) {
        res.status(500).json({
          success: false,
          message: 'PDF parser dependency is missing on server. Install `pdf-parse` and restart backend.',
        });
        return;
      }
      if (message.includes("Cannot find module 'mammoth'")) {
        res.status(500).json({
          success: false,
          message: 'DOCX parser dependency is missing on server. Install `mammoth` and restart backend.',
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: message || 'Failed to parse exam document',
      });
    }
  }

  /**
   * Very simple parser for MCQ-style documents.
   * Looks for patterns like:
   * 1. Question text...
   * A) Option
   * B) Option
   * C) Option
   * D) Option
   * Answer: B
   */
  private parseQuestionsFromText(rawText: string) {
    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => !!l);

    const questions: any[] = [];
    let current: any = null;

    const questionRegex = /^(\d+)[\.\)]\s*(.+)$/;
    const optionRegex = /^[A-Da-d][\)\.\:\-]\s*(.+)$/;
    const answerRegex = /^ans(?:wer)?[:\.\-\s]+([A-Da-d0-3])/i;

    for (const line of lines) {
      const qMatch = line.match(questionRegex);
      if (qMatch) {
        if (current) {
          questions.push(current);
        }
        current = {
          question: qMatch[2],
          options: [],
          correctAnswer: 0,
          marks: 1,
        };
        continue;
      }

      if (!current) continue;

      const oMatch = line.match(optionRegex);
      if (oMatch) {
        current.options.push(oMatch[1]);
        continue;
      }

      const aMatch = line.match(answerRegex);
      if (aMatch) {
        const ans = aMatch[1].toUpperCase();
        if (/[A-D]/.test(ans)) {
          current.correctAnswer = ans.charCodeAt(0) - 'A'.charCodeAt(0);
        } else {
          const idx = parseInt(ans, 10);
          if (!isNaN(idx)) {
            current.correctAnswer = idx;
          }
        }
      }
    }

    if (current) {
      questions.push(current);
    }

    // Ensure every question has at least 2 options
    return questions.filter((q) => Array.isArray(q.options) && q.options.length >= 2);
  }
}

const STRICT_PATTERN: Record<
  string,
  { duration: number; totalQuestions: number; maxAttempts: number; sectionCount: number }
> = {
  JEE: { duration: 180, totalQuestions: 90, maxAttempts: 75, sectionCount: 6 },
  NEET: { duration: 200, totalQuestions: 200, maxAttempts: 180, sectionCount: 6 },
};

export const examController = new ExamController();
import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { uploadExamDocument, deleteFileFromS3 } from '../../utils/s3-upload';
import { logger } from '../../utils/logger';

/**
 * Exam Controller with S3 Integration
 * Handles exam document uploads to AWS S3 and exam management
 */

interface ParsedQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  marks: number;
}

interface ParsedDocument {
  format: string; // 'pdf' or 'docx'
  pageCount?: number;
  wordCount: number;
  processingTime: number;
}

export class ExamControllerS3 {
  /**
   * Upload exam document to S3 and parse questions
   * Supports PDF and DOCX formats
   */
  async uploadDocumentAndParseQuestions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const file = (req as any).file as any;
      const { standard, subject, examType, title } = req.body;

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No file provided',
        });
        return;
      }

      if (!file.buffer) {
        res.status(400).json({
          success: false,
          message: 'File buffer is empty',
        });
        return;
      }

      logger.info(`Exam document upload initiated: ${file.originalname} (${file.size} bytes)`);

      try {
        // Upload document to S3
        const uploadResult = await uploadExamDocument(file.buffer, file.originalname, {
          userId: req.user?.id,
          standard,
          subject,
          examType,
          timestamp: new Date().toISOString(),
        });

        logger.info(`Exam document uploaded to S3: ${uploadResult.key}`);

        // Parse document content
        // In production, you would:
        // 1. Download file from S3 (or use buffer if available in same request)
        // 2. Parse PDF or DOCX
        // 3. Extract and parse questions
        
        const parseResult = await this.parseDocumentContent(file.buffer, file.originalname);
        const { questions, documentInfo } = parseResult;

        res.status(200).json({
          success: true,
          data: {
            s3Key: uploadResult.key,
            s3Url: uploadResult.url,
            fileName: file.originalname,
            fileSize: uploadResult.fileSize,
            title: title || file.originalname.replace(/\.(pdf|docx)$/i, ''),
            duration: 60, // Default duration
            standard: standard ? parseInt(standard, 10) : undefined,
            subject: subject || undefined,
            examType: examType || undefined,
            passingMarks: 0,
            questions,
            documentInfo,
          },
          message: `Document uploaded successfully. Found ${questions.length} questions.`,
        });
      } catch (s3Error: any) {
        logger.error('S3 upload failed for exam document:', s3Error);
        res.status(500).json({
          success: false,
          message: s3Error.message || 'Failed to upload exam document to S3',
        });
      }
    } catch (error: any) {
      logger.error('Exam document upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to process exam document upload',
      });
    }
  }

  /**
   * Get all exams
   */
  async getAllExams(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { standard, subject, examType } = req.query;

      // TODO: Fetch exams from database with filters
      // const filter: any = { isActive: true };
      // if (standard) {
      //   const s = parseInt(standard as string, 10);
      //   filter.$or = [{ standard: s }, { standard: { $exists: false } }, { standard: null }];
      // }
      // if (subject) filter.subject = subject;
      // if (examType) filter.examType = examType;
      // const exams = await ExamModel.find(filter).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        message: 'Get all exams endpoint. Database integration required.',
      });
    } catch (error: any) {
      logger.error('Get exams error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exams',
      });
    }
  }

  /**
   * Get exam by ID
   */
  async getExamById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // TODO: Fetch exam from database
      // const exam = await ExamModel.findById(id);
      // if (!exam) {
      //   res.status(404).json({ success: false, message: 'Exam not found' });
      //   return;
      // }

      res.status(200).json({
        success: true,
        message: 'Get exam by ID endpoint. Database integration required.',
      });
    } catch (error: any) {
      logger.error('Get exam error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exam',
      });
    }
  }

  /**
   * Create new exam
   */
  async createExam(req: AuthRequest, res: Response): Promise<void> {
    try {
      const examData = req.body;

      // TODO: Validate and create exam in database
      // const exam = new ExamModel({ ...examData, createdBy: req.user?.id });
      // await exam.save();

      res.status(201).json({
        success: true,
        message: 'Create exam endpoint. Database integration required.',
      });
    } catch (error: any) {
      logger.error('Create exam error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create exam',
      });
    }
  }

  /**
   * Update exam
   */
  async updateExam(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // TODO: Update exam in database
      // const exam = await ExamModel.findByIdAndUpdate(id, updateData, { new: true });

      res.status(200).json({
        success: true,
        message: 'Update exam endpoint. Database integration required.',
      });
    } catch (error: any) {
      logger.error('Update exam error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update exam',
      });
    }
  }

  /**
   * Delete exam and associated S3 files
   */
  async deleteExam(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // TODO: Delete exam and associated S3 files
      // const exam = await ExamModel.findById(id);
      // if (exam?.s3Key) {
      //   try {
      //     await deleteFileFromS3(exam.s3Key);
      //   } catch (error) {
      //     logger.error('S3 delete error:', error);
      //   }
      // }
      // await ExamModel.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Delete exam endpoint. Database integration required.',
      });
    } catch (error: any) {
      logger.error('Delete exam error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete exam',
      });
    }
  }

  /**
   * Parse document content from buffer
   * Extracts text and parses questions from PDF or DOCX
   * This is a simplified implementation
   */
  private async parseDocumentContent(
    buffer: Buffer,
    fileName: string
  ): Promise<{ questions: ParsedQuestion[]; documentInfo: ParsedDocument }> {
    const startTime = Date.now();
    const originalName = String(fileName || '').toLowerCase();

    let text = '';
    let pageCount = undefined;

    if (originalName.endsWith('.pdf')) {
      // PDF parsing
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pdfParse = require('pdf-parse');
        const result = await pdfParse(buffer);
        text = result.text || '';
        pageCount = result.numpages;
      } catch (error: any) {
        logger.warn('PDF parsing failed, treating as text:', error.message);
        text = buffer.toString('utf-8');
      }
    } else if (originalName.endsWith('.docx')) {
      // DOCX parsing
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        text = result.value || '';
      } catch (error: any) {
        logger.warn('DOCX parsing failed, treating as text:', error.message);
        text = buffer.toString('utf-8');
      }
    } else {
      // Fallback: treat as plain text
      text = buffer.toString('utf-8');
    }

    if (!text.trim()) {
      throw new Error('Could not extract text from document');
    }

    // Parse questions from text
    const questions = this.parseQuestionsFromText(text);

    const wordCount = text.split(/\s+/).length;
    const processingTime = Date.now() - startTime;

    return {
      questions,
      documentInfo: {
        format: originalName.endsWith('.pdf') ? 'pdf' : originalName.endsWith('.docx') ? 'docx' : 'text',
        pageCount,
        wordCount,
        processingTime,
      },
    };
  }

  /**
   * Parse MCQ-format questions from text
   * Looks for patterns like:
   * 1. Question text...
   * A) Option
   * B) Option
   * C) Option
   * D) Option
   * Answer: B
   */
  private parseQuestionsFromText(rawText: string): ParsedQuestion[] {
    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => !!l);

    const questions: ParsedQuestion[] = [];
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

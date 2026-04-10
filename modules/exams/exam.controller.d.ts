import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
export declare class ExamController {
    getAllExams(req: Request, res: Response): Promise<void>;
    getExamById(req: Request, res: Response): Promise<void>;
    createExam(req: AuthRequest, res: Response): Promise<void>;
    updateExam(req: AuthRequest, res: Response): Promise<void>;
    deleteExam(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Upload an exam document (PDF/DOCX), parse questions, and return
     * a structured exam payload for the admin to review before saving.
     * This does NOT create the exam in the database.
     */
    uploadExamDocument(req: AuthRequest, res: Response): Promise<void>;
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
    private parseQuestionsFromText;
}
export declare const examController: ExamController;
//# sourceMappingURL=exam.controller.d.ts.map
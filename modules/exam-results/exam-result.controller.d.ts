import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
export declare class ExamResultController {
    getAllResults(req: AuthRequest, res: Response): Promise<void>;
    getResultById(req: AuthRequest, res: Response): Promise<void>;
    createResult(req: AuthRequest, res: Response): Promise<void>;
    getResultsByStudent(req: AuthRequest, res: Response): Promise<void>;
}
export declare const examResultController: ExamResultController;
//# sourceMappingURL=exam-result.controller.d.ts.map
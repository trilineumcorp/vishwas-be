import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
export declare class FlipBookController {
    getAllFlipBooks(req: Request, res: Response): Promise<void>;
    getFlipBookById(req: Request, res: Response): Promise<void>;
    createFlipBook(req: AuthRequest, res: Response): Promise<void>;
    updateFlipBook(req: AuthRequest, res: Response): Promise<void>;
    deleteFlipBook(req: AuthRequest, res: Response): Promise<void>;
}
export declare const flipBookController: FlipBookController;
//# sourceMappingURL=flipbook.controller.d.ts.map
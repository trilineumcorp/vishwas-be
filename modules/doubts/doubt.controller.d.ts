import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
export declare class DoubtController {
    getMyDoubts(req: AuthRequest, res: Response): Promise<void>;
    createDoubt(req: AuthRequest, res: Response): Promise<void>;
}
export declare const doubtController: DoubtController;
//# sourceMappingURL=doubt.controller.d.ts.map
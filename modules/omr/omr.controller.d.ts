import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
declare class OMRController {
    uploadAndQueueProcessing(req: AuthRequest, res: Response): Promise<void>;
    listUploads(req: AuthRequest, res: Response): Promise<void>;
}
export declare const omrController: OMRController;
export {};
//# sourceMappingURL=omr.controller.d.ts.map
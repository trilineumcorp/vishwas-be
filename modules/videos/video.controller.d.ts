import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
export declare class VideoController {
    getAllVideos(req: Request, res: Response): Promise<void>;
    getVideoById(req: Request, res: Response): Promise<void>;
    createVideo(req: AuthRequest, res: Response): Promise<void>;
    updateVideo(req: AuthRequest, res: Response): Promise<void>;
    deleteVideo(req: AuthRequest, res: Response): Promise<void>;
}
export declare const videoController: VideoController;
//# sourceMappingURL=video.controller.d.ts.map
import { Router } from 'express';
import { videoController } from './video.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';

const router = Router();

// Public routes
router.get('/', videoController.getAllVideos.bind(videoController));
router.get('/:id', videoController.getVideoById.bind(videoController));

// Admin only routes
router.post('/', authenticate, roleMiddleware(['admin']), videoController.createVideo.bind(videoController));
router.put('/:id', authenticate, roleMiddleware(['admin']), videoController.updateVideo.bind(videoController));
router.delete('/:id', authenticate, roleMiddleware(['admin']), videoController.deleteVideo.bind(videoController));

export default router;


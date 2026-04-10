import { Router } from 'express';
import { flipBookController } from './flipbook.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';

const router = Router();

// Public routes
router.get('/', flipBookController.getAllFlipBooks.bind(flipBookController));
router.get('/:id', flipBookController.getFlipBookById.bind(flipBookController));

// Admin only routes
router.post('/', authenticate, roleMiddleware(['admin']), flipBookController.createFlipBook.bind(flipBookController));
router.put('/:id', authenticate, roleMiddleware(['admin']), flipBookController.updateFlipBook.bind(flipBookController));
router.delete('/:id', authenticate, roleMiddleware(['admin']), flipBookController.deleteFlipBook.bind(flipBookController));

export default router;


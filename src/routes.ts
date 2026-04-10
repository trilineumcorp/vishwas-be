import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import videoRoutes from '../modules/videos/video.routes';
import flipbookRoutes from '../modules/flipbooks/flipbook.routes';
import examRoutes from '../modules/exams/exam.routes.s3';
import examResultRoutes from '../modules/exam-results/exam-result.routes';
import omrRoutes from '../modules/omr/omr.routes.s3';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import doubtRoutes from '../modules/doubts/doubt.routes';
import studentExamsRoutes from '../modules/student-exams/student-exams.routes';

const router = Router();

// Register routes
router.use('/auth', authRoutes);
router.use('/videos', videoRoutes);
router.use('/flipbooks', flipbookRoutes);
router.use('/exams', examRoutes);
router.use('/exam-results', examResultRoutes);
router.use('/omr', omrRoutes);
router.use('/admin/dashboard', dashboardRoutes);
router.use('/doubts', doubtRoutes);
router.use('/student/exams', studentExamsRoutes);

export default router;


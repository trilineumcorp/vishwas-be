import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';
import { studentExamsController } from './student-exams.controller';

const router = Router();

/** Leaderboards (must be before /:id) */
router.get(
  '/leaderboard/:examId/me',
  authenticate,
  roleMiddleware(['student']),
  studentExamsController.getMyLeaderboard.bind(studentExamsController)
);

router.get(
  '/leaderboard/:examId',
  authenticate,
  roleMiddleware(['student']),
  studentExamsController.getLeaderboard.bind(studentExamsController)
);

/** Time-bound attempts */
router.post(
  '/attempts/start',
  authenticate,
  roleMiddleware(['student']),
  studentExamsController.startAttempt.bind(studentExamsController)
);

router.get(
  '/attempts/:attemptId',
  authenticate,
  roleMiddleware(['student']),
  studentExamsController.getAttempt.bind(studentExamsController)
);

router.patch(
  '/attempts/:attemptId',
  authenticate,
  roleMiddleware(['student']),
  studentExamsController.saveAttemptProgress.bind(studentExamsController)
);

router.post(
  '/attempts/:attemptId/submit',
  authenticate,
  roleMiddleware(['student']),
  studentExamsController.submitAttempt.bind(studentExamsController)
);

/** Legacy / direct submit (no separate attempt session) */
router.post(
  '/submit',
  authenticate,
  roleMiddleware(['student']),
  studentExamsController.submitStudentExam.bind(studentExamsController)
);

/** Get exam list with attempt lifecycle metadata */
router.get(
  '/',
  authenticate,
  roleMiddleware(['student']),
  studentExamsController.getStudentExams.bind(studentExamsController)
);

/** Get exam paper for student */
router.get(
  '/:id',
  authenticate,
  roleMiddleware(['student']),
  studentExamsController.getStudentExam.bind(studentExamsController)
);

export default router;

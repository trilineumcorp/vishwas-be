import { Router } from 'express';
import { authController } from './auth.controller';
import { registerSchema, loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema, changePasswordSchema } from './auth.schema';
import { validateRequest } from '../../middlewares/validation.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';

const router = Router();

router.post('/register', validateRequest(registerSchema), authController.register.bind(authController));
router.post('/login', validateRequest(loginSchema), authController.login.bind(authController));
router.post('/refresh-token', validateRequest(refreshTokenSchema), authController.refreshToken.bind(authController));
router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword.bind(authController));
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword.bind(authController));
router.get('/me', authenticate, authController.getCurrentUser.bind(authController));
router.put('/me', authenticate, validateRequest(updateProfileSchema), authController.updateProfile.bind(authController));
router.put('/change-password', authenticate, validateRequest(changePasswordSchema), authController.changePassword.bind(authController));
router.get('/users', authenticate, roleMiddleware(['admin']), authController.getAllUsers.bind(authController));
router.put('/users/:studentId', authenticate, roleMiddleware(['admin']), authController.updateStudentByAdmin.bind(authController));

export default router;


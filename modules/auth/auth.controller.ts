import { Request, Response } from 'express';
import { authService } from './auth.service';
import { logger } from '../../utils/logger';
import { verifyRefreshToken, generateTokens } from '../../utils/jwt';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role, rollNumber, class: studentClass } = req.body;

      const result = await authService.register(
        name,
        email,
        password,
        role || 'student',
        { rollNumber, class: studentClass }
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Registration error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Login error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const payload = verifyRefreshToken(refreshToken);
      if (!payload) {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
        });
        return;
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(payload);

      res.status(200).json({
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error: any) {
      logger.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        message: 'Token refresh failed',
      });
    }
  }

  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const role = (req as any).user.role;

      const user = await authService.getCurrentUser(userId, role);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      logger.error('Get current user error:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'User not found',
      });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      const result = await authService.forgotPassword(email);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      logger.error('Forgot password error:', error);
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      logger.info('Reset password request received', {
        hasToken: !!token,
        tokenLength: token?.length,
        hasPassword: !!password,
        passwordLength: password?.length,
      });

      if (!token) {
        logger.warn('Reset password attempted without token');
        res.status(400).json({
          success: false,
          message: 'Reset token is required',
        });
        return;
      }

      if (!password) {
        logger.warn('Reset password attempted without password');
        res.status(400).json({
          success: false,
          message: 'Password is required',
        });
        return;
      }

      const result = await authService.resetPassword(token, password);

      logger.info('Password reset successful');

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      logger.error('Reset password error:', {
        message: error.message,
        stack: error.stack,
        body: req.body,
      });
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reset password. The link may have expired.',
      });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const role = (req as any).user.role;
      const updateData = req.body;

      logger.info('Update profile request received', {
        userId,
        role,
        updateData: Object.keys(updateData),
      });

      const updatedUser = await authService.updateProfile(userId, role, updateData);

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully',
      });
    } catch (error: any) {
      logger.error('Update profile error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update profile',
      });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const role = (req as any).user.role;
      const { currentPassword, newPassword } = req.body;

      logger.info('Change password request received', {
        userId,
        role,
      });

      const result = await authService.changePassword(userId, role, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      logger.error('Change password error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to change password',
      });
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await authService.getAllUsers();

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error: any) {
      logger.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch users',
      });
    }
  }

  async updateStudentByAdmin(req: Request, res: Response): Promise<void> {
    try {
      const studentIdParam = req.params.studentId;
      const studentId = Array.isArray(studentIdParam) ? studentIdParam[0] : studentIdParam;
      if (!studentId) {
        res.status(400).json({
          success: false,
          message: 'studentId is required',
        });
        return;
      }
      const updateData = req.body;

      logger.info('Update student by admin request received', {
        studentId,
        updateData: Object.keys(updateData),
      });

      const updatedStudent = await authService.updateStudentByAdmin(studentId, updateData);

      res.status(200).json({
        success: true,
        data: updatedStudent,
        message: 'Student updated successfully',
      });
    } catch (error: any) {
      logger.error('Update student by admin error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update student',
      });
    }
  }
}

export const authController = new AuthController();


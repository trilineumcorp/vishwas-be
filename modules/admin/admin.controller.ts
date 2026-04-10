import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import {
  registerAdminSchema,
  loginAdminSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from './admin.schema';
import { logger } from '../../utils/logger';

export class AdminController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = registerAdminSchema.parse(req);
      const result = await adminService.register(validated.body);
      res.status(201).json({
        success: true,
        message: 'Admin registered successfully',
        data: result,
      });
    } catch (error: any) {
      logger.error('Admin registration error:', error);
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = loginAdminSchema.parse(req);
      const result = await adminService.login(validated.body);
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error: any) {
      logger.error('Admin login error:', error);
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = refreshTokenSchema.parse(req);
      const tokens = await adminService.refreshToken(validated.body);
      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokens,
      });
    } catch (error: any) {
      logger.error('Token refresh error:', error);
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = changePasswordSchema.parse(req);
      const adminId = (req as any).user.id;
      const result = await adminService.changePassword(adminId, validated.body);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      logger.error('Change password error:', error);
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user.id;
      const admin = await adminService.getProfile(adminId);
      res.status(200).json({
        success: true,
        data: admin,
      });
    } catch (error: any) {
      logger.error('Get profile error:', error);
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user.id;
      const admin = await adminService.updateProfile(adminId, req.body);
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: admin,
      });
    } catch (error: any) {
      logger.error('Update profile error:', error);
      next(error);
    }
  }
}

export const adminController = new AdminController();


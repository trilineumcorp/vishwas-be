"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = exports.AdminController = void 0;
const express_1 = require("express");
const admin_service_1 = require("./admin.service");
const admin_schema_1 = require("./admin.schema");
const logger_1 = require("../../utils/logger");
class AdminController {
    async register(req, res, next) {
        try {
            const validated = admin_schema_1.registerAdminSchema.parse(req);
            const result = await admin_service_1.adminService.register(validated.body);
            res.status(201).json({
                success: true,
                message: 'Admin registered successfully',
                data: result,
            });
        }
        catch (error) {
            logger_1.logger.error('Admin registration error:', error);
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const validated = admin_schema_1.loginAdminSchema.parse(req);
            const result = await admin_service_1.adminService.login(validated.body);
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: result,
            });
        }
        catch (error) {
            logger_1.logger.error('Admin login error:', error);
            next(error);
        }
    }
    async refreshToken(req, res, next) {
        try {
            const validated = admin_schema_1.refreshTokenSchema.parse(req);
            const tokens = await admin_service_1.adminService.refreshToken(validated.body);
            res.status(200).json({
                success: true,
                message: 'Token refreshed successfully',
                data: tokens,
            });
        }
        catch (error) {
            logger_1.logger.error('Token refresh error:', error);
            next(error);
        }
    }
    async changePassword(req, res, next) {
        try {
            const validated = admin_schema_1.changePasswordSchema.parse(req);
            const adminId = req.user.id;
            const result = await admin_service_1.adminService.changePassword(adminId, validated.body);
            res.status(200).json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            logger_1.logger.error('Change password error:', error);
            next(error);
        }
    }
    async getProfile(req, res, next) {
        try {
            const adminId = req.user.id;
            const admin = await admin_service_1.adminService.getProfile(adminId);
            res.status(200).json({
                success: true,
                data: admin,
            });
        }
        catch (error) {
            logger_1.logger.error('Get profile error:', error);
            next(error);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const adminId = req.user.id;
            const admin = await admin_service_1.adminService.updateProfile(adminId, req.body);
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: admin,
            });
        }
        catch (error) {
            logger_1.logger.error('Update profile error:', error);
            next(error);
        }
    }
}
exports.AdminController = AdminController;
exports.adminController = new AdminController();
//# sourceMappingURL=admin.controller.js.map
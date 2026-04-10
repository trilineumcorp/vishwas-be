"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const express_1 = require("express");
const auth_service_1 = require("./auth.service");
const logger_1 = require("../../utils/logger");
const jwt_1 = require("../../utils/jwt");
class AuthController {
    async register(req, res) {
        try {
            const { name, email, password, role, rollNumber, class: studentClass } = req.body;
            const result = await auth_service_1.authService.register(name, email, password, role || 'student', { rollNumber, class: studentClass });
            res.status(201).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger_1.logger.error('Registration error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Registration failed',
            });
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await auth_service_1.authService.login(email, password);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger_1.logger.error('Login error:', error);
            res.status(401).json({
                success: false,
                message: error.message || 'Login failed',
            });
        }
    }
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
            if (!payload) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid refresh token',
                });
                return;
            }
            const { accessToken, refreshToken: newRefreshToken } = (0, jwt_1.generateTokens)(payload);
            res.status(200).json({
                success: true,
                data: {
                    accessToken,
                    refreshToken: newRefreshToken,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Refresh token error:', error);
            res.status(401).json({
                success: false,
                message: 'Token refresh failed',
            });
        }
    }
    async getCurrentUser(req, res) {
        try {
            const userId = req.user.id;
            const role = req.user.role;
            const user = await auth_service_1.authService.getCurrentUser(userId, role);
            res.status(200).json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            logger_1.logger.error('Get current user error:', error);
            res.status(404).json({
                success: false,
                message: error.message || 'User not found',
            });
        }
    }
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const result = await auth_service_1.authService.forgotPassword(email);
            res.status(200).json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            logger_1.logger.error('Forgot password error:', error);
            res.status(200).json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.',
            });
        }
    }
    async resetPassword(req, res) {
        try {
            const { token, password } = req.body;
            logger_1.logger.info('Reset password request received', {
                hasToken: !!token,
                tokenLength: token?.length,
                hasPassword: !!password,
                passwordLength: password?.length,
            });
            if (!token) {
                logger_1.logger.warn('Reset password attempted without token');
                res.status(400).json({
                    success: false,
                    message: 'Reset token is required',
                });
                return;
            }
            if (!password) {
                logger_1.logger.warn('Reset password attempted without password');
                res.status(400).json({
                    success: false,
                    message: 'Password is required',
                });
                return;
            }
            const result = await auth_service_1.authService.resetPassword(token, password);
            logger_1.logger.info('Password reset successful');
            res.status(200).json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            logger_1.logger.error('Reset password error:', {
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
    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const role = req.user.role;
            const updateData = req.body;
            logger_1.logger.info('Update profile request received', {
                userId,
                role,
                updateData: Object.keys(updateData),
            });
            const updatedUser = await auth_service_1.authService.updateProfile(userId, role, updateData);
            res.status(200).json({
                success: true,
                data: updatedUser,
                message: 'Profile updated successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Update profile error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update profile',
            });
        }
    }
    async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const role = req.user.role;
            const { currentPassword, newPassword } = req.body;
            logger_1.logger.info('Change password request received', {
                userId,
                role,
            });
            const result = await auth_service_1.authService.changePassword(userId, role, currentPassword, newPassword);
            res.status(200).json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            logger_1.logger.error('Change password error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to change password',
            });
        }
    }
    async getAllUsers(req, res) {
        try {
            const users = await auth_service_1.authService.getAllUsers();
            res.status(200).json({
                success: true,
                data: users,
            });
        }
        catch (error) {
            logger_1.logger.error('Get all users error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch users',
            });
        }
    }
    async updateStudentByAdmin(req, res) {
        try {
            const { studentId } = req.params;
            const updateData = req.body;
            logger_1.logger.info('Update student by admin request received', {
                studentId,
                updateData: Object.keys(updateData),
            });
            const updatedStudent = await auth_service_1.authService.updateStudentByAdmin(studentId, updateData);
            res.status(200).json({
                success: true,
                data: updatedStudent,
                message: 'Student updated successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Update student by admin error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update student',
            });
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map
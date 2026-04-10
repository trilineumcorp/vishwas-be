"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = exports.AdminService = void 0;
const admin_model_1 = require("./admin.model");
const jwt_1 = require("../../utils/jwt");
const password_1 = require("../../utils/password");
const logger_1 = require("../../utils/logger");
const admin_schema_1 = require("./admin.schema");
class AdminService {
    async register(data) {
        // Check if admin already exists
        const existingAdmin = await admin_model_1.Admin.findOne({ email: data.email });
        if (existingAdmin) {
            throw new Error('Admin with this email already exists');
        }
        // Create new admin
        const admin = new admin_model_1.Admin({
            name: data.name,
            email: data.email,
            password: data.password,
        });
        await admin.save();
        // Generate tokens
        const payload = {
            id: admin._id.toString(),
            email: admin.email,
            role: 'admin',
        };
        const tokens = (0, jwt_1.generateTokens)(payload);
        // Update last login
        admin.lastLogin = new Date();
        await admin.save();
        return {
            admin: admin.toJSON(),
            ...tokens,
        };
    }
    async login(data) {
        // Find admin with password
        const admin = await admin_model_1.Admin.findOne({ email: data.email }).select('+password');
        if (!admin) {
            throw new Error('Invalid email or password');
        }
        // Check if admin is active
        if (!admin.isActive) {
            throw new Error('Account is deactivated');
        }
        // Verify password
        const isPasswordValid = await admin.comparePassword(data.password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }
        // Generate tokens
        const payload = {
            id: admin._id.toString(),
            email: admin.email,
            role: 'admin',
        };
        const tokens = (0, jwt_1.generateTokens)(payload);
        // Update last login
        admin.lastLogin = new Date();
        await admin.save();
        return {
            admin: admin.toJSON(),
            ...tokens,
        };
    }
    async refreshToken(data) {
        const payload = (0, jwt_1.verifyRefreshToken)(data.refreshToken);
        if (!payload || payload.role !== 'admin') {
            throw new Error('Invalid refresh token');
        }
        // Verify admin still exists and is active
        const admin = await admin_model_1.Admin.findById(payload.id);
        if (!admin || !admin.isActive) {
            throw new Error('Admin not found or inactive');
        }
        // Generate new tokens
        const newPayload = {
            id: admin._id.toString(),
            email: admin.email,
            role: 'admin',
        };
        return (0, jwt_1.generateTokens)(newPayload);
    }
    async changePassword(adminId, data) {
        const admin = await admin_model_1.Admin.findById(adminId).select('+password');
        if (!admin) {
            throw new Error('Admin not found');
        }
        // Verify current password
        const isPasswordValid = await admin.comparePassword(data.currentPassword);
        if (!isPasswordValid) {
            throw new Error('Current password is incorrect');
        }
        // Update password
        admin.password = data.newPassword;
        await admin.save();
        return { message: 'Password changed successfully' };
    }
    async getProfile(adminId) {
        const admin = await admin_model_1.Admin.findById(adminId);
        if (!admin) {
            throw new Error('Admin not found');
        }
        return admin.toJSON();
    }
    async updateProfile(adminId, data) {
        const admin = await admin_model_1.Admin.findById(adminId);
        if (!admin) {
            throw new Error('Admin not found');
        }
        // Check if email is being changed and if it's already taken
        if (data.email && data.email !== admin.email) {
            const existingAdmin = await admin_model_1.Admin.findOne({ email: data.email });
            if (existingAdmin) {
                throw new Error('Email already in use');
            }
        }
        // Update fields
        if (data.name)
            admin.name = data.name;
        if (data.email)
            admin.email = data.email;
        await admin.save();
        return admin.toJSON();
    }
}
exports.AdminService = AdminService;
exports.adminService = new AdminService();
//# sourceMappingURL=admin.service.js.map
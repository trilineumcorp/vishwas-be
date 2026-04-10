"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const student_model_1 = require("../student/student.model");
const admin_model_1 = require("../admin/admin.model");
const password_1 = require("../../utils/password");
const jwt_1 = require("../../utils/jwt");
const logger_1 = require("../../utils/logger");
const email_1 = require("../../utils/email");
const mongoose_1 = __importDefault(require("mongoose"));
const crypto_1 = __importDefault(require("crypto"));
class AuthService {
    checkMongoConnection() {
        const readyState = mongoose_1.default.connection.readyState;
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        if (readyState !== 1) {
            const state = states[readyState] || 'unknown';
            logger_1.logger.error(`MongoDB connection state: ${state} (${readyState})`);
            throw new Error(`Database connection not available (state: ${state}). Please ensure MongoDB is running and connected.`);
        }
    }
    async register(name, email, password, role, additionalData) {
        this.checkMongoConnection();
        try {
            // Check if user already exists
            const existingStudent = await student_model_1.Student.findOne({ email });
            const existingAdmin = await admin_model_1.Admin.findOne({ email });
            if (existingStudent || existingAdmin) {
                throw new Error('User with this email already exists');
            }
            let user;
            if (role === 'student') {
                // Generate student ID if not provided
                const studentCount = await student_model_1.Student.countDocuments();
                const studentId = additionalData?.rollNumber || `STU${String(studentCount + 1).padStart(3, '0')}`;
                logger_1.logger.info(`Creating student: ${email}, studentId: ${studentId}`);
                user = await student_model_1.Student.create({
                    name,
                    email,
                    password,
                    studentId,
                    role: 'student',
                    isActive: true,
                    class: additionalData?.class,
                });
                logger_1.logger.info(`Student created successfully: ${user._id}`);
            }
            else {
                logger_1.logger.info(`Creating admin: ${email}`);
                user = await admin_model_1.Admin.create({
                    name,
                    email,
                    password,
                    role: 'admin',
                    isActive: true,
                });
                logger_1.logger.info(`Admin created successfully: ${user._id}`);
            }
            const tokenPayload = {
                id: user._id.toString(),
                email: user.email,
                role: role,
            };
            const { accessToken, refreshToken } = (0, jwt_1.generateTokens)(tokenPayload);
            return {
                user: this.formatUser(user, role),
                accessToken,
                refreshToken,
            };
        }
        catch (error) {
            logger_1.logger.error('Registration error details:', {
                error: error.message,
                stack: error.stack,
                email,
                role
            });
            // Re-throw with more context
            if (error.code === 11000) {
                // MongoDB duplicate key error
                throw new Error('User with this email already exists');
            }
            throw error;
        }
    }
    async login(email, password) {
        this.checkMongoConnection();
        try {
            // Try to find user in Student collection
            let user = await student_model_1.Student.findOne({ email }).select('+password');
            let role = 'student';
            // If not found, try Admin collection
            if (!user) {
                user = await admin_model_1.Admin.findOne({ email }).select('+password');
                role = 'admin';
            }
            if (!user) {
                logger_1.logger.warn(`Login attempt with non-existent email: ${email}`);
                throw new Error('Invalid email or password');
            }
            // Check if user is active
            if (!user.isActive) {
                logger_1.logger.warn(`Login attempt with deactivated account: ${email}`);
                throw new Error('Account is deactivated');
            }
            // Compare password
            const isPasswordValid = await (0, password_1.comparePassword)(password, user.password);
            if (!isPasswordValid) {
                logger_1.logger.warn(`Login attempt with invalid password for: ${email}`);
                throw new Error('Invalid email or password');
            }
            // Update last login
            user.lastLogin = new Date();
            await user.save();
            logger_1.logger.info(`User logged in successfully: ${email}, role: ${role}`);
            const tokenPayload = {
                id: user._id.toString(),
                email: user.email,
                role: role,
            };
            const { accessToken, refreshToken } = (0, jwt_1.generateTokens)(tokenPayload);
            return {
                user: this.formatUser(user, role),
                accessToken,
                refreshToken,
            };
        }
        catch (error) {
            logger_1.logger.error('Login error details:', {
                error: error.message,
                stack: error.stack,
                email
            });
            throw error;
        }
    }
    async getCurrentUser(userId, role) {
        this.checkMongoConnection();
        let user;
        if (role === 'student') {
            user = await student_model_1.Student.findById(userId);
        }
        else {
            user = await admin_model_1.Admin.findById(userId);
        }
        if (!user) {
            throw new Error('User not found');
        }
        return this.formatUser(user, role);
    }
    async forgotPassword(email) {
        this.checkMongoConnection();
        try {
            // Try to find user in Student collection
            let user = await student_model_1.Student.findOne({ email });
            let role = 'student';
            // If not found, try Admin collection
            if (!user) {
                user = await admin_model_1.Admin.findOne({ email });
                role = 'admin';
            }
            // Always return success message for security (don't reveal if email exists)
            if (!user) {
                logger_1.logger.info(`Password reset requested for non-existent email: ${email}`);
                return {
                    message: 'If an account with that email exists, a password reset link has been sent.',
                };
            }
            // Check if user is active
            if (!user.isActive) {
                logger_1.logger.warn(`Password reset requested for deactivated account: ${email}`);
                return {
                    message: 'If an account with that email exists, a password reset link has been sent.',
                };
            }
            // Generate reset token
            const resetToken = crypto_1.default.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
            // Save reset token to user
            user.passwordResetToken = resetToken;
            user.passwordResetExpires = resetTokenExpiry;
            await user.save();
            // Send password reset email
            const emailSent = await (0, email_1.sendPasswordResetEmail)(email, resetToken, user.name);
            if (emailSent) {
                logger_1.logger.info(`Password reset email sent successfully to: ${email}`);
            }
            else {
                logger_1.logger.warn(`Failed to send password reset email to: ${email}`);
                // Still return success message for security
            }
            return {
                message: 'If an account with that email exists, a password reset link has been sent.',
            };
        }
        catch (error) {
            logger_1.logger.error('Forgot password error:', error);
            // Still return success message for security
            return {
                message: 'If an account with that email exists, a password reset link has been sent.',
            };
        }
    }
    async resetPassword(token, newPassword) {
        this.checkMongoConnection();
        try {
            logger_1.logger.info('Attempting password reset', {
                tokenLength: token?.length,
                tokenPrefix: token?.substring(0, 8),
                hasPassword: !!newPassword,
                passwordLength: newPassword?.length,
            });
            // Try to find user with this reset token in Student collection
            let user = await student_model_1.Student.findOne({
                passwordResetToken: token,
                passwordResetExpires: { $gt: new Date() }, // Token not expired
            });
            let role = 'student';
            logger_1.logger.info('Student lookup result', { found: !!user });
            // If not found, try Admin collection
            if (!user) {
                user = await admin_model_1.Admin.findOne({
                    passwordResetToken: token,
                    passwordResetExpires: { $gt: new Date() },
                });
                role = 'admin';
                logger_1.logger.info('Admin lookup result', { found: !!user });
            }
            if (!user) {
                // Check if token exists but is expired
                const expiredStudent = await student_model_1.Student.findOne({ passwordResetToken: token });
                const expiredAdmin = await admin_model_1.Admin.findOne({ passwordResetToken: token });
                if (expiredStudent || expiredAdmin) {
                    logger_1.logger.warn('Password reset attempted with expired token');
                    throw new Error('Reset token has expired. Please request a new password reset link.');
                }
                else {
                    logger_1.logger.warn('Password reset attempted with invalid token');
                    throw new Error('Invalid reset token. Please request a new password reset link.');
                }
            }
            logger_1.logger.info('User found for password reset', { email: user.email, role });
            // Update password (will be hashed by pre-save hook)
            // Use markModified to ensure the pre-save hook runs
            user.password = newPassword;
            user.markModified('password');
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();
            logger_1.logger.info(`Password reset successful for user: ${user.email}`);
            return {
                message: 'Password has been reset successfully.',
            };
        }
        catch (error) {
            logger_1.logger.error('Reset password error:', {
                message: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }
    async updateProfile(userId, role, updateData) {
        this.checkMongoConnection();
        try {
            let user;
            if (role === 'admin') {
                user = await admin_model_1.Admin.findById(userId);
            }
            else {
                user = await student_model_1.Student.findById(userId);
            }
            if (!user) {
                throw new Error('User not found');
            }
            // Update only provided fields
            if (updateData.name !== undefined) {
                user.name = updateData.name;
            }
            if (updateData.phoneNumber !== undefined) {
                user.phoneNumber = updateData.phoneNumber;
            }
            if (updateData.profilePicture !== undefined) {
                user.profilePicture = updateData.profilePicture || undefined;
            }
            if (updateData.class !== undefined && role === 'student') {
                user.class = updateData.class;
            }
            await user.save();
            logger_1.logger.info(`Profile updated for user: ${user.email} (${role})`);
            return this.formatUser(user, role);
        }
        catch (error) {
            logger_1.logger.error('Update profile error:', error);
            throw error;
        }
    }
    async updateStudentByAdmin(studentId, updateData) {
        this.checkMongoConnection();
        try {
            const student = await student_model_1.Student.findById(studentId);
            if (!student) {
                throw new Error('Student not found');
            }
            // Check if email is being changed and if it's already taken
            if (updateData.email && updateData.email !== student.email) {
                const existingStudent = await student_model_1.Student.findOne({ email: updateData.email });
                if (existingStudent) {
                    throw new Error('Email already in use');
                }
                student.email = updateData.email;
            }
            // Check if rollNumber (studentId) is being changed and if it's already taken
            if (updateData.rollNumber && updateData.rollNumber !== student.studentId) {
                const existingStudent = await student_model_1.Student.findOne({ studentId: updateData.rollNumber });
                if (existingStudent) {
                    throw new Error('Roll number already in use');
                }
                student.studentId = updateData.rollNumber;
            }
            // Update other fields
            if (updateData.name !== undefined) {
                student.name = updateData.name;
            }
            if (updateData.class !== undefined) {
                student.class = updateData.class;
            }
            if (updateData.phoneNumber !== undefined) {
                student.phoneNumber = updateData.phoneNumber;
            }
            await student.save();
            logger_1.logger.info(`Student updated by admin: ${student.email}`);
            return this.formatUser(student, 'student');
        }
        catch (error) {
            logger_1.logger.error('Update student by admin error:', error);
            throw error;
        }
    }
    async changePassword(userId, role, currentPassword, newPassword) {
        this.checkMongoConnection();
        try {
            let user;
            if (role === 'admin') {
                user = await admin_model_1.Admin.findById(userId).select('+password');
            }
            else {
                user = await student_model_1.Student.findById(userId).select('+password');
            }
            if (!user) {
                throw new Error('User not found');
            }
            // Verify current password
            const isPasswordValid = await user.comparePassword(currentPassword);
            if (!isPasswordValid) {
                throw new Error('Current password is incorrect');
            }
            // Update password
            user.password = newPassword;
            await user.save();
            logger_1.logger.info(`Password changed for user: ${user.email} (${role})`);
            return {
                message: 'Password changed successfully',
            };
        }
        catch (error) {
            logger_1.logger.error('Change password error:', error);
            throw error;
        }
    }
    async getAllUsers() {
        this.checkMongoConnection();
        try {
            const [students, admins] = await Promise.all([
                student_model_1.Student.find({}).select('-password -__v').lean(),
                admin_model_1.Admin.find({}).select('-password -__v').lean(),
            ]);
            const formattedUsers = [
                ...students.map((user) => this.formatUser(user, 'student')),
                ...admins.map((user) => this.formatUser(user, 'admin')),
            ];
            return formattedUsers;
        }
        catch (error) {
            logger_1.logger.error('Get all users error:', error);
            throw new Error('Failed to fetch users');
        }
    }
    formatUser(user, role) {
        const formatted = {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: role,
            createdAt: user.createdAt,
            avatarUrl: user.profilePicture || null,
            phoneNumber: user.phoneNumber || null,
        };
        if (role === 'student') {
            formatted.rollNumber = user.studentId;
            formatted.class = user.class || null;
        }
        else {
            formatted.permissions = ['all'];
        }
        return formatted;
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map
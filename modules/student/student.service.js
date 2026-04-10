"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentService = exports.StudentService = void 0;
const student_model_1 = require("./student.model");
const jwt_1 = require("../../utils/jwt");
const logger_1 = require("../../utils/logger");
const student_schema_1 = require("./student.schema");
class StudentService {
    async register(data) {
        // Check if student already exists
        const existingStudent = await student_model_1.Student.findOne({
            $or: [{ email: data.email }, { studentId: data.studentId }],
        });
        if (existingStudent) {
            if (existingStudent.email === data.email) {
                throw new Error('Student with this email already exists');
            }
            throw new Error('Student with this ID already exists');
        }
        // Create new student
        const student = new student_model_1.Student({
            name: data.name,
            email: data.email,
            password: data.password,
            studentId: data.studentId,
            phoneNumber: data.phoneNumber,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        });
        await student.save();
        // Generate tokens
        const payload = {
            id: student._id.toString(),
            email: student.email,
            role: 'student',
        };
        const tokens = (0, jwt_1.generateTokens)(payload);
        // Update last login
        student.lastLogin = new Date();
        await student.save();
        return {
            student: student.toJSON(),
            ...tokens,
        };
    }
    async login(data) {
        // Find student with password
        const student = await student_model_1.Student.findOne({ email: data.email }).select('+password');
        if (!student) {
            throw new Error('Invalid email or password');
        }
        // Check if student is active
        if (!student.isActive) {
            throw new Error('Account is deactivated');
        }
        // Verify password
        const isPasswordValid = await student.comparePassword(data.password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }
        // Generate tokens
        const payload = {
            id: student._id.toString(),
            email: student.email,
            role: 'student',
        };
        const tokens = (0, jwt_1.generateTokens)(payload);
        // Update last login
        student.lastLogin = new Date();
        await student.save();
        return {
            student: student.toJSON(),
            ...tokens,
        };
    }
    async refreshToken(data) {
        const payload = (0, jwt_1.verifyRefreshToken)(data.refreshToken);
        if (!payload || payload.role !== 'student') {
            throw new Error('Invalid refresh token');
        }
        // Verify student still exists and is active
        const student = await student_model_1.Student.findById(payload.id);
        if (!student || !student.isActive) {
            throw new Error('Student not found or inactive');
        }
        // Generate new tokens
        const newPayload = {
            id: student._id.toString(),
            email: student.email,
            role: 'student',
        };
        return (0, jwt_1.generateTokens)(newPayload);
    }
    async changePassword(studentId, data) {
        const student = await student_model_1.Student.findById(studentId).select('+password');
        if (!student) {
            throw new Error('Student not found');
        }
        // Verify current password
        const isPasswordValid = await student.comparePassword(data.currentPassword);
        if (!isPasswordValid) {
            throw new Error('Current password is incorrect');
        }
        // Update password
        student.password = data.newPassword;
        await student.save();
        return { message: 'Password changed successfully' };
    }
    async getProfile(studentId) {
        const student = await student_model_1.Student.findById(studentId);
        if (!student) {
            throw new Error('Student not found');
        }
        return student.toJSON();
    }
    async updateProfile(studentId, data) {
        const student = await student_model_1.Student.findById(studentId);
        if (!student) {
            throw new Error('Student not found');
        }
        // Check if email is being changed and if it's already taken
        if (data.email && data.email !== student.email) {
            const existingStudent = await student_model_1.Student.findOne({ email: data.email });
            if (existingStudent) {
                throw new Error('Email already in use');
            }
        }
        // Update fields
        if (data.name)
            student.name = data.name;
        if (data.email)
            student.email = data.email;
        if (data.phoneNumber !== undefined)
            student.phoneNumber = data.phoneNumber;
        if (data.dateOfBirth)
            student.dateOfBirth = new Date(data.dateOfBirth);
        if (data.profilePicture !== undefined)
            student.profilePicture = data.profilePicture;
        await student.save();
        return student.toJSON();
    }
}
exports.StudentService = StudentService;
exports.studentService = new StudentService();
//# sourceMappingURL=student.service.js.map
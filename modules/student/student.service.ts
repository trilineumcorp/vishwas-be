import { Student, IStudent } from './student.model';
import { generateTokens, verifyRefreshToken, TokenPayload } from '../../utils/jwt';
import { logger } from '../../utils/logger';
import {
  RegisterStudentInput,
  LoginStudentInput,
  RefreshTokenInput,
  ChangePasswordInput,
} from './student.schema';

export class StudentService {
  async register(data: RegisterStudentInput) {
    // Check if student already exists
    const existingStudent = await Student.findOne({
      $or: [{ email: data.email }, { studentId: data.studentId }],
    });
    if (existingStudent) {
      if (existingStudent.email === data.email) {
        throw new Error('Student with this email already exists');
      }
      throw new Error('Student with this ID already exists');
    }

    // Create new student
    const student = new Student({
      name: data.name,
      email: data.email,
      password: data.password,
      studentId: data.studentId,
      phoneNumber: data.phoneNumber,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    });

    await student.save();

    // Generate tokens
    const payload: TokenPayload = {
      id: student._id.toString(),
      email: student.email,
      role: 'student',
    };

    const tokens = generateTokens(payload);

    // Update last login
    student.lastLogin = new Date();
    await student.save();

    return {
      student: student.toJSON(),
      ...tokens,
    };
  }

  async login(data: LoginStudentInput) {
    // Find student with password
    const student = await Student.findOne({ email: data.email }).select('+password');
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
    const payload: TokenPayload = {
      id: student._id.toString(),
      email: student.email,
      role: 'student',
    };

    const tokens = generateTokens(payload);

    // Update last login
    student.lastLogin = new Date();
    await student.save();

    return {
      student: student.toJSON(),
      ...tokens,
    };
  }

  async refreshToken(data: RefreshTokenInput) {
    const payload = verifyRefreshToken(data.refreshToken);
    if (!payload || payload.role !== 'student') {
      throw new Error('Invalid refresh token');
    }

    // Verify student still exists and is active
    const student = await Student.findById(payload.id);
    if (!student || !student.isActive) {
      throw new Error('Student not found or inactive');
    }

    // Generate new tokens
    const newPayload: TokenPayload = {
      id: student._id.toString(),
      email: student.email,
      role: 'student',
    };

    return generateTokens(newPayload);
  }

  async changePassword(studentId: string, data: ChangePasswordInput) {
    const student = await Student.findById(studentId).select('+password');
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

  async getProfile(studentId: string) {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    return student.toJSON();
  }

  async updateProfile(
    studentId: string,
    data: Partial<{
      name: string;
      email: string;
      phoneNumber: string;
      dateOfBirth: string;
      profilePicture: string;
    }>
  ) {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    // Check if email is being changed and if it's already taken
    if (data.email && data.email !== student.email) {
      const existingStudent = await Student.findOne({ email: data.email });
      if (existingStudent) {
        throw new Error('Email already in use');
      }
    }

    // Update fields
    if (data.name) student.name = data.name;
    if (data.email) student.email = data.email;
    if (data.phoneNumber !== undefined) student.phoneNumber = data.phoneNumber;
    if (data.dateOfBirth) student.dateOfBirth = new Date(data.dateOfBirth);
    if (data.profilePicture !== undefined) student.profilePicture = data.profilePicture;

    await student.save();

    return student.toJSON();
  }
}

export const studentService = new StudentService();


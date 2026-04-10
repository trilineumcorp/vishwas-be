import { Student } from '../student/student.model';
import { Admin } from '../admin/admin.model';
import { comparePassword } from '../../utils/password';
import { generateTokens, TokenPayload } from '../../utils/jwt';
import { logger } from '../../utils/logger';
import { sendPasswordResetEmail } from '../../utils/email';
import mongoose from 'mongoose';
import crypto from 'crypto';

export interface AuthResponse {
  user: any;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private checkMongoConnection(): void {
    const readyState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    if (readyState !== 1) {
      const state = states[readyState as keyof typeof states] || 'unknown';
      logger.error(`MongoDB connection state: ${state} (${readyState})`);
      throw new Error(`Database connection not available (state: ${state}). Please ensure MongoDB is running and connected.`);
    }
  }

  async register(
    name: string,
    email: string,
    password: string,
    role: 'admin' | 'student',
    additionalData?: { rollNumber?: string; class?: string }
  ): Promise<AuthResponse> {
    this.checkMongoConnection();
    
    try {
      // Check if user already exists
      const existingStudent = await Student.findOne({ email });
      const existingAdmin = await Admin.findOne({ email });

      if (existingStudent || existingAdmin) {
        throw new Error('User with this email already exists');
      }

      let user;
      if (role === 'student') {
        // Generate student ID if not provided
        const studentCount = await Student.countDocuments();
        const studentId = additionalData?.rollNumber || `STU${String(studentCount + 1).padStart(3, '0')}`;

        logger.info(`Creating student: ${email}, studentId: ${studentId}`);
        
        user = await Student.create({
          name,
          email,
          password,
          studentId,
          role: 'student',
          isActive: true,
          class: additionalData?.class,
        });
        
        logger.info(`Student created successfully: ${user._id}`);
      } else {
        logger.info(`Creating admin: ${email}`);
        
        user = await Admin.create({
          name,
          email,
          password,
          role: 'admin',
          isActive: true,
        });
        
        logger.info(`Admin created successfully: ${user._id}`);
      }

      const tokenPayload: TokenPayload = {
        id: user._id.toString(),
        email: user.email,
        role: role,
      };

      const { accessToken, refreshToken } = generateTokens(tokenPayload);

      return {
        user: this.formatUser(user, role),
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      logger.error('Registration error details:', {
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

  async login(email: string, password: string): Promise<AuthResponse> {
    this.checkMongoConnection();
    
    try {
      // Try to find user in Student collection
      let user = await Student.findOne({ email }).select('+password');
      let role: 'admin' | 'student' = 'student';

      // If not found, try Admin collection
      if (!user) {
        user = await Admin.findOne({ email }).select('+password');
        role = 'admin';
      }

      if (!user) {
        logger.warn(`Login attempt with non-existent email: ${email}`);
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        logger.warn(`Login attempt with deactivated account: ${email}`);
        throw new Error('Account is deactivated');
      }

      // Compare password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        logger.warn(`Login attempt with invalid password for: ${email}`);
        throw new Error('Invalid email or password');
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();
      
      logger.info(`User logged in successfully: ${email}, role: ${role}`);

      const tokenPayload: TokenPayload = {
        id: user._id.toString(),
        email: user.email,
        role: role,
      };

      const { accessToken, refreshToken } = generateTokens(tokenPayload);

      return {
        user: this.formatUser(user, role),
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      logger.error('Login error details:', {
        error: error.message,
        stack: error.stack,
        email
      });
      throw error;
    }
  }

  async getCurrentUser(userId: string, role: 'admin' | 'student'): Promise<any> {
    this.checkMongoConnection();
    
    let user;
    if (role === 'student') {
      user = await Student.findById(userId);
    } else {
      user = await Admin.findById(userId);
    }

    if (!user) {
      throw new Error('User not found');
    }

    return this.formatUser(user, role);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    this.checkMongoConnection();
    
    try {
      // Try to find user in Student collection
      let user = await Student.findOne({ email });
      let role: 'admin' | 'student' = 'student';

      // If not found, try Admin collection
      if (!user) {
        user = await Admin.findOne({ email });
        role = 'admin';
      }

      // Always return success message for security (don't reveal if email exists)
      if (!user) {
        logger.info(`Password reset requested for non-existent email: ${email}`);
        return {
          message: 'If an account with that email exists, a password reset link has been sent.',
        };
      }

      // Check if user is active
      if (!user.isActive) {
        logger.warn(`Password reset requested for deactivated account: ${email}`);
        return {
          message: 'If an account with that email exists, a password reset link has been sent.',
        };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Save reset token to user
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = resetTokenExpiry;
      await user.save();

      // Send password reset email
      const emailSent = await sendPasswordResetEmail(
        email,
        resetToken,
        user.name
      );

      if (emailSent) {
        logger.info(`Password reset email sent successfully to: ${email}`);
      } else {
        logger.warn(`Failed to send password reset email to: ${email}`);
        // Still return success message for security
      }
      
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    } catch (error: any) {
      logger.error('Forgot password error:', error);
      // Still return success message for security
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    this.checkMongoConnection();
    
    try {
      logger.info('Attempting password reset', {
        tokenLength: token?.length,
        tokenPrefix: token?.substring(0, 8),
        hasPassword: !!newPassword,
        passwordLength: newPassword?.length,
      });

      // Try to find user with this reset token in Student collection
      let user = await Student.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() }, // Token not expired
      });

      let role: 'admin' | 'student' = 'student';

      logger.info('Student lookup result', { found: !!user });

      // If not found, try Admin collection
      if (!user) {
        user = await Admin.findOne({
          passwordResetToken: token,
          passwordResetExpires: { $gt: new Date() },
        });
        role = 'admin';
        logger.info('Admin lookup result', { found: !!user });
      }

      if (!user) {
        // Check if token exists but is expired
        const expiredStudent = await Student.findOne({ passwordResetToken: token });
        const expiredAdmin = await Admin.findOne({ passwordResetToken: token });
        
        if (expiredStudent || expiredAdmin) {
          logger.warn('Password reset attempted with expired token');
          throw new Error('Reset token has expired. Please request a new password reset link.');
        } else {
          logger.warn('Password reset attempted with invalid token');
          throw new Error('Invalid reset token. Please request a new password reset link.');
        }
      }

      logger.info('User found for password reset', { email: user.email, role });

      // Update password (will be hashed by pre-save hook)
      // Use markModified to ensure the pre-save hook runs
      user.password = newPassword;
      user.markModified('password');
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      logger.info(`Password reset successful for user: ${user.email}`);
      
      return {
        message: 'Password has been reset successfully.',
      };
    } catch (error: any) {
      logger.error('Reset password error:', {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async updateProfile(
    userId: string,
    role: 'admin' | 'student',
    updateData: {
      name?: string;
      phoneNumber?: string;
      profilePicture?: string;
      class?: string;
    }
  ): Promise<any> {
    this.checkMongoConnection();

    try {
      let user;
      if (role === 'admin') {
        user = await Admin.findById(userId);
      } else {
        user = await Student.findById(userId);
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
        (user as any).class = updateData.class;
      }

      await user.save();

      logger.info(`Profile updated for user: ${user.email} (${role})`);

      return this.formatUser(user, role);
    } catch (error: any) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  async updateStudentByAdmin(
    studentId: string,
    updateData: {
      name?: string;
      email?: string;
      rollNumber?: string;
      class?: string;
      phoneNumber?: string;
    }
  ): Promise<any> {
    this.checkMongoConnection();

    try {
      const student = await Student.findById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      // Check if email is being changed and if it's already taken
      if (updateData.email && updateData.email !== student.email) {
        const existingStudent = await Student.findOne({ email: updateData.email });
        if (existingStudent) {
          throw new Error('Email already in use');
        }
        student.email = updateData.email;
      }

      // Check if rollNumber (studentId) is being changed and if it's already taken
      if (updateData.rollNumber && updateData.rollNumber !== student.studentId) {
        const existingStudent = await Student.findOne({ studentId: updateData.rollNumber });
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
        (student as any).class = updateData.class;
      }
      if (updateData.phoneNumber !== undefined) {
        student.phoneNumber = updateData.phoneNumber;
      }

      await student.save();

      logger.info(`Student updated by admin: ${student.email}`);

      return this.formatUser(student, 'student');
    } catch (error: any) {
      logger.error('Update student by admin error:', error);
      throw error;
    }
  }

  async changePassword(
    userId: string,
    role: 'admin' | 'student',
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    this.checkMongoConnection();

    try {
      let user;
      if (role === 'admin') {
        user = await Admin.findById(userId).select('+password');
      } else {
        user = await Student.findById(userId).select('+password');
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

      logger.info(`Password changed for user: ${user.email} (${role})`);

      return {
        message: 'Password changed successfully',
      };
    } catch (error: any) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<any[]> {
    this.checkMongoConnection();
    
    try {
      const [students, admins] = await Promise.all([
        Student.find({}).select('-password -__v').lean(),
        Admin.find({}).select('-password -__v').lean(),
      ]);

      const formattedUsers = [
        ...students.map((user: any) => this.formatUser(user, 'student')),
        ...admins.map((user: any) => this.formatUser(user, 'admin')),
      ];

      return formattedUsers;
    } catch (error: any) {
      logger.error('Get all users error:', error);
      throw new Error('Failed to fetch users');
    }
  }

  private formatUser(user: any, role: 'admin' | 'student'): any {
    const formatted: any = {
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
      formatted.class = (user as any).class || null;
    } else {
      formatted.permissions = ['all'];
    }

    return formatted;
  }
}

export const authService = new AuthService();


import { Admin, IAdmin } from './admin.model';
import { generateTokens, verifyRefreshToken, TokenPayload } from '../../utils/jwt';
import { comparePassword } from '../../utils/password';
import { logger } from '../../utils/logger';
import {
  RegisterAdminInput,
  LoginAdminInput,
  RefreshTokenInput,
  ChangePasswordInput,
} from './admin.schema';

export class AdminService {
  async register(data: RegisterAdminInput) {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: data.email });
    if (existingAdmin) {
      throw new Error('Admin with this email already exists');
    }

    // Create new admin
    const admin = new Admin({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    await admin.save();

    // Generate tokens
    const payload: TokenPayload = {
      id: admin._id.toString(),
      email: admin.email,
      role: 'admin',
    };

    const tokens = generateTokens(payload);

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    return {
      admin: admin.toJSON(),
      ...tokens,
    };
  }

  async login(data: LoginAdminInput) {
    // Find admin with password
    const admin = await Admin.findOne({ email: data.email }).select('+password');
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
    const payload: TokenPayload = {
      id: admin._id.toString(),
      email: admin.email,
      role: 'admin',
    };

    const tokens = generateTokens(payload);

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    return {
      admin: admin.toJSON(),
      ...tokens,
    };
  }

  async refreshToken(data: RefreshTokenInput) {
    const payload = verifyRefreshToken(data.refreshToken);
    if (!payload || payload.role !== 'admin') {
      throw new Error('Invalid refresh token');
    }

    // Verify admin still exists and is active
    const admin = await Admin.findById(payload.id);
    if (!admin || !admin.isActive) {
      throw new Error('Admin not found or inactive');
    }

    // Generate new tokens
    const newPayload: TokenPayload = {
      id: admin._id.toString(),
      email: admin.email,
      role: 'admin',
    };

    return generateTokens(newPayload);
  }

  async changePassword(adminId: string, data: ChangePasswordInput) {
    const admin = await Admin.findById(adminId).select('+password');
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

  async getProfile(adminId: string) {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    return admin.toJSON();
  }

  async updateProfile(adminId: string, data: Partial<{ name: string; email: string }>) {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Check if email is being changed and if it's already taken
    if (data.email && data.email !== admin.email) {
      const existingAdmin = await Admin.findOne({ email: data.email });
      if (existingAdmin) {
        throw new Error('Email already in use');
      }
    }

    // Update fields
    if (data.name) admin.name = data.name;
    if (data.email) admin.email = data.email;

    await admin.save();

    return admin.toJSON();
  }
}

export const adminService = new AdminService();


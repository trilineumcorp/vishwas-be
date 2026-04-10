import { IAdmin } from './admin.model';
import { RegisterAdminInput, LoginAdminInput, RefreshTokenInput, ChangePasswordInput } from './admin.schema';
export declare class AdminService {
    register(data: RegisterAdminInput): Promise<{
        accessToken: string;
        refreshToken: string;
        admin: import("mongoose").FlattenMaps<IAdmin & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        }>;
    }>;
    login(data: LoginAdminInput): Promise<{
        accessToken: string;
        refreshToken: string;
        admin: import("mongoose").FlattenMaps<IAdmin & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        }>;
    }>;
    refreshToken(data: RefreshTokenInput): Promise<import("../../utils/jwt").TokenPair>;
    changePassword(adminId: string, data: ChangePasswordInput): Promise<{
        message: string;
    }>;
    getProfile(adminId: string): Promise<import("mongoose").FlattenMaps<IAdmin & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>>;
    updateProfile(adminId: string, data: Partial<{
        name: string;
        email: string;
    }>): Promise<import("mongoose").FlattenMaps<IAdmin & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>>;
}
export declare const adminService: AdminService;
//# sourceMappingURL=admin.service.d.ts.map
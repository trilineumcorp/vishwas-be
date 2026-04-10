export interface AuthResponse {
    user: any;
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    private checkMongoConnection;
    register(name: string, email: string, password: string, role: 'admin' | 'student', additionalData?: {
        rollNumber?: string;
        class?: string;
    }): Promise<AuthResponse>;
    login(email: string, password: string): Promise<AuthResponse>;
    getCurrentUser(userId: string, role: 'admin' | 'student'): Promise<any>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    updateProfile(userId: string, role: 'admin' | 'student', updateData: {
        name?: string;
        phoneNumber?: string;
        profilePicture?: string;
        class?: string;
    }): Promise<any>;
    updateStudentByAdmin(studentId: string, updateData: {
        name?: string;
        email?: string;
        rollNumber?: string;
        class?: string;
        phoneNumber?: string;
    }): Promise<any>;
    changePassword(userId: string, role: 'admin' | 'student', currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    getAllUsers(): Promise<any[]>;
    private formatUser;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map
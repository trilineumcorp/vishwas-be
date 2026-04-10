import { IStudent } from './student.model';
import { RegisterStudentInput, LoginStudentInput, RefreshTokenInput, ChangePasswordInput } from './student.schema';
export declare class StudentService {
    register(data: RegisterStudentInput): Promise<{
        accessToken: string;
        refreshToken: string;
        student: import("mongoose").FlattenMaps<IStudent & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        }>;
    }>;
    login(data: LoginStudentInput): Promise<{
        accessToken: string;
        refreshToken: string;
        student: import("mongoose").FlattenMaps<IStudent & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        }>;
    }>;
    refreshToken(data: RefreshTokenInput): Promise<import("../../utils/jwt").TokenPair>;
    changePassword(studentId: string, data: ChangePasswordInput): Promise<{
        message: string;
    }>;
    getProfile(studentId: string): Promise<import("mongoose").FlattenMaps<IStudent & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>>;
    updateProfile(studentId: string, data: Partial<{
        name: string;
        email: string;
        phoneNumber: string;
        dateOfBirth: string;
        profilePicture: string;
    }>): Promise<import("mongoose").FlattenMaps<IStudent & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>>;
}
export declare const studentService: StudentService;
//# sourceMappingURL=student.service.d.ts.map
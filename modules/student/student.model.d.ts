import mongoose, { Document } from 'mongoose';
export interface IStudent extends Document {
    name: string;
    email: string;
    password: string;
    studentId: string;
    role: 'student';
    isActive: boolean;
    profilePicture?: string;
    phoneNumber?: string;
    dateOfBirth?: Date;
    class?: string;
    lastLogin?: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(password: string): Promise<boolean>;
}
export declare const Student: mongoose.Model<IStudent, {}, {}, {}, mongoose.Document<unknown, {}, IStudent, {}, {}> & IStudent & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=student.model.d.ts.map
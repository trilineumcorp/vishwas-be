import mongoose, { Document } from 'mongoose';
export type DoubtStatus = 'pending' | 'in-progress' | 'resolved';
export interface IDoubt extends Document {
    studentId: mongoose.Types.ObjectId;
    studentName?: string;
    title: string;
    description: string;
    subject?: string;
    status: DoubtStatus;
    response?: string;
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Doubt: mongoose.Model<IDoubt, {}, {}, {}, mongoose.Document<unknown, {}, IDoubt, {}, {}> & IDoubt & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=doubt.model.d.ts.map
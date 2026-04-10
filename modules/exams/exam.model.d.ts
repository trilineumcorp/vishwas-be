import mongoose, { Document } from 'mongoose';
export interface IExamQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
    marks: number;
}
export interface IExam extends Document {
    title: string;
    description?: string;
    duration: number;
    questions: IExamQuestion[];
    totalMarks: number;
    passingMarks?: number;
    standard?: number;
    subject?: string;
    examType?: string;
    isActive: boolean;
    createdBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Exam: mongoose.Model<IExam, {}, {}, {}, mongoose.Document<unknown, {}, IExam, {}, {}> & IExam & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=exam.model.d.ts.map
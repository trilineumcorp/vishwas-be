import mongoose, { Document } from 'mongoose';
export interface IExamResult extends Document {
    examId: string;
    examTitle: string;
    studentId: mongoose.Types.ObjectId;
    score: number;
    totalMarks: number;
    percentage: number;
    answers: {
        questionId: string;
        selectedAnswer: number;
        isCorrect: boolean;
    }[];
    completedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ExamResult: mongoose.Model<IExamResult, {}, {}, {}, mongoose.Document<unknown, {}, IExamResult, {}, {}> & IExamResult & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=exam-result.model.d.ts.map
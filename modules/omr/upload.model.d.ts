import mongoose, { Document } from 'mongoose';
export interface IOMRUpload extends Document {
    adminId: mongoose.Types.ObjectId;
    examId?: mongoose.Types.ObjectId;
    originalFilename: string;
    storagePath: string;
    mimeType: string;
    parsed: boolean;
    parsedAt?: Date;
    totalSheets?: number;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const OMRUpload: mongoose.Model<IOMRUpload, {}, {}, {}, mongoose.Document<unknown, {}, IOMRUpload, {}, {}> & IOMRUpload & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=upload.model.d.ts.map
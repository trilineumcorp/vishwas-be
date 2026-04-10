import mongoose, { Document } from 'mongoose';
export interface IFlipBook extends Document {
    title: string;
    pdfUrl: string;
    thumbnail?: string;
    description?: string;
    standard?: number;
    subject?: string;
    isActive: boolean;
    createdBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const FlipBook: mongoose.Model<IFlipBook, {}, {}, {}, mongoose.Document<unknown, {}, IFlipBook, {}, {}> & IFlipBook & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=flipbook.model.d.ts.map
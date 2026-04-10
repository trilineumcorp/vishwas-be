import mongoose, { Document } from 'mongoose';
export interface IVideo extends Document {
    title: string;
    youtubeUrl: string;
    description?: string;
    category?: string;
    duration?: string;
    thumbnail?: string;
    standard?: number;
    subject?: string;
    isActive: boolean;
    createdBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Video: mongoose.Model<IVideo, {}, {}, {}, mongoose.Document<unknown, {}, IVideo, {}, {}> & IVideo & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=video.model.d.ts.map
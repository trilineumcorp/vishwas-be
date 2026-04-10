import mongoose, { Document, Schema } from 'mongoose';

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

const omrUploadSchema = new Schema<IOMRUpload>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true,
    },
    storagePath: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    parsed: {
      type: Boolean,
      default: false,
      index: true,
    },
    parsedAt: {
      type: Date,
    },
    totalSheets: {
      type: Number,
      min: 0,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

omrUploadSchema.index({ examId: 1, createdAt: -1 });

export const OMRUpload = mongoose.model<IOMRUpload>('OMRUpload', omrUploadSchema);


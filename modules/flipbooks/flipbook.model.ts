import mongoose, { Document, Schema } from 'mongoose';

export interface IFlipBook extends Document {
  title: string;
  pdfUrl: string;
  thumbnail?: string;
  description?: string;
  standard?: number; // 6, 7, 8, 9, 10
  subject?: string; // Mathematics, Physics, Chemistry, Biology
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const flipbookSchema = new Schema<IFlipBook>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    pdfUrl: {
      type: String,
      required: [true, 'PDF URL is required'],
      trim: true,
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    standard: {
      type: Number,
      enum: [6, 7, 8, 9, 10],
      trim: true,
    },
    subject: {
      type: String,
      enum: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

export const FlipBook = mongoose.model<IFlipBook>('FlipBook', flipbookSchema);


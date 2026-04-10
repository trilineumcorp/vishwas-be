import mongoose, { Document, Schema } from 'mongoose';

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

const doubtSchema = new Schema<IDoubt>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    studentName: {
      type: String,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'resolved'],
      default: 'pending',
      index: true,
    },
    response: {
      type: String,
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Doubt = mongoose.model<IDoubt>('Doubt', doubtSchema);


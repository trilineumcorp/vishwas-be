import mongoose, { Document, Schema } from 'mongoose';

export type UserExamAttemptStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface IUserExamAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  status: UserExamAttemptStatus;
  score?: number;
  attemptedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userExamAttemptSchema = new Schema<IUserExamAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'NOT_STARTED',
    },
    score: { type: Number, min: 0 },
    attemptedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

userExamAttemptSchema.index({ userId: 1, examId: 1 }, { unique: true });
userExamAttemptSchema.index({ userId: 1, completedAt: -1 });

export const UserExamAttempt = mongoose.model<IUserExamAttempt>(
  'UserExamAttempt',
  userExamAttemptSchema
);


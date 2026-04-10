import mongoose, { Document, Schema } from 'mongoose';

export type LeaderboardScope = 'GLOBAL' | 'SUBJECT' | 'REGION';

export interface ILeaderboardEntry extends Document {
  examId: mongoose.Types.ObjectId;
  scope: LeaderboardScope;
  /** e.g. ALL, PHYSICS, IN-KA (region key) */
  scopeKey: string;
  studentId: mongoose.Types.ObjectId;
  score: number;
  maxScore: number;
  accuracy: number;
  /** Lower is better for tie-break */
  timeSpentMs: number;
  submittedAt: Date;
  rank: number;
  percentile?: number;
  createdAt: Date;
  updatedAt: Date;
}

const leaderboardSchema = new Schema<ILeaderboardEntry>(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true,
    },
    scope: {
      type: String,
      enum: ['GLOBAL', 'SUBJECT', 'REGION'],
      required: true,
    },
    scopeKey: {
      type: String,
      required: true,
      default: 'ALL',
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    accuracy: { type: Number, required: true, min: 0, max: 1 },
    timeSpentMs: { type: Number, default: 0, min: 0 },
    submittedAt: { type: Date, required: true },
    rank: { type: Number, required: true, min: 1 },
    percentile: { type: Number, min: 0, max: 100 },
  },
  { timestamps: true }
);

leaderboardSchema.index(
  { examId: 1, scope: 1, scopeKey: 1, studentId: 1 },
  { unique: true }
);

leaderboardSchema.index({
  examId: 1,
  scope: 1,
  scopeKey: 1,
  score: -1,
  accuracy: -1,
  timeSpentMs: 1,
  submittedAt: 1,
});

export const LeaderboardEntry = mongoose.model<ILeaderboardEntry>(
  'LeaderboardEntry',
  leaderboardSchema
);

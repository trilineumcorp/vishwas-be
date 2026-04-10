import mongoose, { Document, Schema } from 'mongoose';

export interface IExamResult extends Document {
  examId: string;
  examTitle: string;
  studentId: mongoose.Types.ObjectId;
  attemptId?: mongoose.Types.ObjectId;
  score: number;
  totalMarks: number;
  percentage: number;
  /** JEE/NEET evaluation */
  accuracy?: {
    correct: number;
    attempted: number;
    wrong: number;
    unattempted: number;
  };
  subjectBreakdown?: Array<{
    subjectId: string;
    rawScore: number;
    maxScore: number;
    correct: number;
    attempted: number;
  }>;
  timeSpentMs?: number;
  evaluationVersion?: number;
  /** Denormalized ranks for dashboards (optional; also in LeaderboardEntry) */
  overallRank?: number;
  subjectWiseRanks?: Record<string, number>;
  regionalRank?: number;
  regionKey?: string;
  answers: {
    questionId: string;
    selectedAnswer: number;
    selectedOptions?: number[];
    isCorrect: boolean;
    marksGained?: number;
    timeTakenMs?: number;
  }[];
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const examResultSchema = new Schema<IExamResult>(
  {
    examId: {
      type: String,
      required: [true, 'Exam ID is required'],
      trim: true,
    },
    examTitle: {
      type: String,
      required: [true, 'Exam title is required'],
      trim: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
    },
    attemptId: {
      type: Schema.Types.ObjectId,
      ref: 'ExamAttempt',
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: 0,
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks is required'],
      min: 0,
    },
    percentage: {
      type: Number,
      required: [true, 'Percentage is required'],
      min: 0,
      max: 100,
    },
    accuracy: {
      correct: { type: Number },
      attempted: { type: Number },
      wrong: { type: Number },
      unattempted: { type: Number },
    },
    subjectBreakdown: [
      {
        subjectId: { type: String, required: true },
        rawScore: { type: Number, required: true },
        maxScore: { type: Number, required: true },
        correct: { type: Number, required: true },
        attempted: { type: Number, required: true },
      },
    ],
    timeSpentMs: { type: Number, min: 0 },
    evaluationVersion: { type: Number, default: 1 },
    overallRank: { type: Number, min: 1 },
    subjectWiseRanks: { type: Schema.Types.Mixed, default: undefined },
    regionalRank: { type: Number, min: 1 },
    regionKey: { type: String, trim: true },
    answers: [
      {
        questionId: {
          type: String,
          required: true,
        },
        selectedAnswer: {
          type: Number,
          required: false,
        },
        selectedOptions: [{ type: Number }],
        isCorrect: {
          type: Boolean,
          required: true,
        },
        marksGained: { type: Number },
        timeTakenMs: { type: Number, min: 0 },
      },
    ],
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
examResultSchema.index({ studentId: 1, completedAt: -1 });
examResultSchema.index({ examId: 1 });
examResultSchema.index({ attemptId: 1 }, { sparse: true });

export const ExamResult = mongoose.model<IExamResult>('ExamResult', examResultSchema);


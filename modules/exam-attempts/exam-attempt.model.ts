import mongoose, { Document, Schema } from 'mongoose';

export type ExamAttemptStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'AUTO_SUBMITTED'
  | 'EXPIRED';

export interface IExamAttemptResponse {
  questionKey: string;
  selectedOption?: number;
  selectedOptions?: number[];
  selectedNumeric?: number;
  answeredAt?: Date;
}

export interface IExamAttempt extends Document {
  examId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  status: ExamAttemptStatus;
  startedAt?: Date;
  endsAt?: Date;
  submittedAt?: Date;
  /** Time spent on exam in ms (client-reported or derived) */
  timeSpentMs?: number;
  responses: IExamAttemptResponse[];
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const responseSchema = new Schema<IExamAttemptResponse>(
  {
    questionKey: { type: String, required: true },
    selectedOption: { type: Number },
    selectedOptions: { type: [Number] },
    selectedNumeric: { type: Number },
    answeredAt: { type: Date },
  },
  { _id: false }
);

const examAttemptSchema = new Schema<IExamAttempt>(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'EXPIRED'],
      default: 'IN_PROGRESS',
    },
    startedAt: { type: Date },
    endsAt: { type: Date },
    submittedAt: { type: Date },
    timeSpentMs: { type: Number, min: 0 },
    responses: { type: [responseSchema], default: [] },
    idempotencyKey: { type: String, sparse: true },
  },
  { timestamps: true }
);

examAttemptSchema.index({ examId: 1, studentId: 1, status: 1 });
examAttemptSchema.index({ studentId: 1, createdAt: -1 });

export const ExamAttempt = mongoose.model<IExamAttempt>('ExamAttempt', examAttemptSchema);

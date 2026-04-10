import mongoose, { Document, Schema } from 'mongoose';

export type ExamQuestionType = 'single' | 'multi';
export type CompetitiveQuestionType = 'MCQ' | 'NUMERICAL';

export interface IExamQuestion {
  question: string;
  options: string[];
  /** Single-correct: index 0-based. Ignored when correctOptionIndices is set with length >= 1 */
  correctAnswer: number;
  /** Multi-correct: option indices (e.g. [0,2]). When set, used for scoring */
  correctOptionIndices?: number[];
  questionType?: ExamQuestionType;
  competitiveType?: CompetitiveQuestionType;
  /** Stable id for client answers (e.g. q1). If omitted, API uses q{n} by index */
  questionKey?: string;
  /** Section / subject for breakdown (Physics, Chemistry, …) */
  subjectId?: string;
  sectionId?: string;
  section?: 'A' | 'B';
  /** Optional metadata for seeds / UI */
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  explanation?: string;
  marks: number;
  negativeMarks?: number;
  correctNumericAnswer?: number;
}

export interface IExamMarkingDefaults {
  /** Default max positive marks per question if not set on question (optional) */
  correctMarks?: number;
  /** Negative marks for wrong attempt (e.g. -1). Stored as negative number */
  wrongMarks?: number;
}

export interface IExamSectionRule {
  questionType?: ExamQuestionType;
  positiveMarks?: number;
  negativeMarks?: number;
}

export interface IExamSection {
  sectionId: string;
  sectionName: string;
  subjectKey: string;
  sectionType?: 'A' | 'B';
  totalQuestions?: number;
  maxAttempts?: number;
  isOptional?: boolean;
  questionIds?: string[];
  rules?: IExamSectionRule;
}

export interface IExam extends Document {
  title: string;
  testName?: string;
  testType?: 'JEE' | 'NEET';
  maxAttempts?: number;
  totalQuestions?: number;
  description?: string;
  duration: number; // in minutes
  /** 1 = legacy flat exam; 2 = JEE/NEET marking + sections metadata */
  examSchemaVersion?: number;
  markingDefaults?: IExamMarkingDefaults;
  /** How to score multi-correct questions */
  multiCorrectRule?: 'all_or_nothing' | 'proportional';
  sections?: IExamSection[];
  questions: IExamQuestion[];
  totalMarks: number;
  passingMarks?: number;
  standard?: number; // 6, 7, 8, 9, 10
  subject?: string; // Mathematics, Physics, Chemistry, Biology
  examType?: string; // IIT, NEET
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const examQuestionSchema = new Schema<IExamQuestion>(
  {
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
    },
    options: {
      type: [String],
      required: [true, 'Options are required'],
      validate: {
        validator: function (v: string[]) {
          return v.length >= 2 && v.length <= 6;
        },
        message: 'Question must have between 2 and 6 options',
      },
    },
    correctAnswer: {
      type: Number,
      required: false,
      min: 0,
    },
    correctOptionIndices: {
      type: [Number],
      default: undefined,
    },
    questionType: {
      type: String,
      enum: ['single', 'multi'],
    },
    competitiveType: {
      type: String,
      enum: ['MCQ', 'NUMERICAL'],
      default: 'MCQ',
    },
    questionKey: {
      type: String,
      trim: true,
    },
    subjectId: {
      type: String,
      trim: true,
    },
    sectionId: {
      type: String,
      trim: true,
    },
    section: {
      type: String,
      enum: ['A', 'B'],
    },
    difficultyLevel: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
    },
    explanation: {
      type: String,
      trim: true,
    },
    marks: {
      type: Number,
      required: [true, 'Marks are required'],
      min: 1,
      default: 1,
    },
    negativeMarks: {
      type: Number,
      max: 0,
      default: -1,
    },
    correctNumericAnswer: {
      type: Number,
      required: false,
    },
  },
  { _id: false }
);

const examSchema = new Schema<IExam>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    testName: {
      type: String,
      trim: true,
    },
    testType: {
      type: String,
      enum: ['JEE', 'NEET'],
      trim: true,
    },
    maxAttempts: {
      type: Number,
      min: 1,
    },
    totalQuestions: {
      type: Number,
      min: 1,
    },
    description: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: 1,
    },
    examSchemaVersion: {
      type: Number,
      default: 1,
      min: 1,
      max: 2,
    },
    markingDefaults: {
      correctMarks: { type: Number, min: 0 },
      wrongMarks: { type: Number, max: 0 },
    },
    multiCorrectRule: {
      type: String,
      enum: ['all_or_nothing', 'proportional'],
      default: 'all_or_nothing',
    },
    sections: {
      type: [
        {
          _id: false,
          sectionId: { type: String, required: true, trim: true },
          sectionName: { type: String, required: true, trim: true },
          subjectKey: { type: String, required: true, trim: true },
          sectionType: { type: String, enum: ['A', 'B'] },
          totalQuestions: { type: Number, min: 1 },
          maxAttempts: { type: Number, min: 1 },
          isOptional: { type: Boolean, default: false },
          questionIds: { type: [String], default: undefined },
          rules: {
            _id: false,
            questionType: { type: String, enum: ['single', 'multi'] },
            positiveMarks: { type: Number, min: 0 },
            negativeMarks: { type: Number, max: 0 },
          },
        },
      ],
      default: undefined,
    },
    questions: {
      type: [examQuestionSchema],
      required: [true, 'Questions are required'],
      validate: {
        validator: function (v: IExamQuestion[]) {
          return v.length > 0;
        },
        message: 'Exam must have at least one question',
      },
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks are required'],
      min: 1,
    },
    passingMarks: {
      type: Number,
      min: 0,
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
    examType: {
      type: String,
      enum: ['IIT', 'NEET'],
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

// Calculate max achievable marks (sum of positive marks per question)
examSchema.pre('save', function (next) {
  if (this.testName && !this.title) {
    this.title = this.testName;
  }
  if (!this.testName && this.title) {
    this.testName = this.title;
  }
  if (this.isModified('questions')) {
    this.totalMarks = this.questions.reduce((sum, q) => sum + q.marks, 0);
    this.totalQuestions = this.questions.length;
  }
  next();
});

examSchema.pre('validate', function (next) {
  const qs = this.questions || [];
  for (let i = 0; i < qs.length; i++) {
    const q = qs[i] as IExamQuestion;
    if (q.competitiveType === 'NUMERICAL') {
      if (typeof q.correctNumericAnswer !== 'number') {
        return next(new Error(`Question ${i + 1}: correctNumericAnswer is required for NUMERICAL type`));
      }
      continue;
    }
    const hasMulti =
      Array.isArray(q.correctOptionIndices) && q.correctOptionIndices.length > 0;
    if (!hasMulti && (q.correctAnswer === undefined || q.correctAnswer === null)) {
      return next(new Error(`Question ${i + 1}: correctAnswer is required when correctOptionIndices is empty`));
    }
    if (!hasMulti && q.options && typeof q.correctAnswer === 'number') {
      if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        return next(new Error(`Question ${i + 1}: correctAnswer out of range`));
      }
    }
    if (hasMulti && q.options) {
      for (const idx of q.correctOptionIndices!) {
        if (idx < 0 || idx >= q.options.length) {
          return next(new Error(`Question ${i + 1}: invalid correctOptionIndices`));
        }
      }
    }
  }
  next();
});

export const Exam = mongoose.model<IExam>('Exam', examSchema);


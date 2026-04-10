"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Exam = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const examQuestionSchema = new mongoose_1.Schema({
    question: {
        type: String,
        required: [true, 'Question is required'],
        trim: true,
    },
    options: {
        type: [String],
        required: [true, 'Options are required'],
        validate: {
            validator: function (v) {
                return v.length >= 2 && v.length <= 6;
            },
            message: 'Question must have between 2 and 6 options',
        },
    },
    correctAnswer: {
        type: Number,
        required: [true, 'Correct answer index is required'],
        min: 0,
    },
    marks: {
        type: Number,
        required: [true, 'Marks are required'],
        min: 1,
        default: 1,
    },
}, { _id: false });
const examSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
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
    questions: {
        type: [examQuestionSchema],
        required: [true, 'Questions are required'],
        validate: {
            validator: function (v) {
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Admin',
    },
}, {
    timestamps: true,
});
// Calculate total marks before saving
examSchema.pre('save', function (next) {
    if (this.isModified('questions')) {
        this.totalMarks = this.questions.reduce((sum, q) => sum + q.marks, 0);
    }
    next();
});
exports.Exam = mongoose_1.default.model('Exam', examSchema);
//# sourceMappingURL=exam.model.js.map
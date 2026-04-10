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
exports.ExamResult = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const examResultSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'Student ID is required'],
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
    answers: [
        {
            questionId: {
                type: String,
                required: true,
            },
            selectedAnswer: {
                type: Number,
                required: true,
            },
            isCorrect: {
                type: Boolean,
                required: true,
            },
        },
    ],
    completedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
// Index for faster queries
examResultSchema.index({ studentId: 1, completedAt: -1 });
examResultSchema.index({ examId: 1 });
exports.ExamResult = mongoose_1.default.model('ExamResult', examResultSchema);
//# sourceMappingURL=exam-result.model.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.examController = exports.ExamController = void 0;
const express_1 = require("express");
const exam_model_1 = require("./exam.model");
const logger_1 = require("../../utils/logger");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const fs_1 = __importDefault(require("fs"));
class ExamController {
    async getAllExams(req, res) {
        try {
            const { standard, subject, examType } = req.query;
            const filter = { isActive: true };
            if (standard) {
                filter.standard = parseInt(standard);
            }
            if (subject) {
                filter.subject = subject;
            }
            if (examType) {
                filter.examType = examType;
            }
            const exams = await exam_model_1.Exam.find(filter)
                .sort({ createdAt: -1 })
                .select('-__v');
            res.status(200).json({
                success: true,
                data: exams,
            });
        }
        catch (error) {
            logger_1.logger.error('Get exams error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch exams',
            });
        }
    }
    async getExamById(req, res) {
        try {
            const { id } = req.params;
            const exam = await exam_model_1.Exam.findById(id);
            if (!exam || !exam.isActive) {
                res.status(404).json({
                    success: false,
                    message: 'Exam not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: exam,
            });
        }
        catch (error) {
            logger_1.logger.error('Get exam error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch exam',
            });
        }
    }
    async createExam(req, res) {
        try {
            const { title, description, duration, questions, passingMarks, standard, subject, examType } = req.body;
            const userId = req.user?.id;
            // Validate questions
            if (!questions || !Array.isArray(questions) || questions.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Exam must have at least one question',
                });
                return;
            }
            // Validate each question
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length < 2) {
                    res.status(400).json({
                        success: false,
                        message: `Question ${i + 1} is invalid`,
                    });
                    return;
                }
                if (q.correctAnswer === undefined || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
                    res.status(400).json({
                        success: false,
                        message: `Question ${i + 1} has invalid correct answer index`,
                    });
                    return;
                }
            }
            const exam = await exam_model_1.Exam.create({
                title,
                description,
                duration,
                questions,
                passingMarks,
                standard,
                subject,
                examType,
                createdBy: userId,
                isActive: true,
            });
            res.status(201).json({
                success: true,
                data: exam,
            });
        }
        catch (error) {
            logger_1.logger.error('Create exam error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create exam',
            });
        }
    }
    async updateExam(req, res) {
        try {
            const { id } = req.params;
            const { title, description, duration, questions, passingMarks, standard, subject, examType, isActive } = req.body;
            const updateData = {};
            if (title !== undefined)
                updateData.title = title;
            if (description !== undefined)
                updateData.description = description;
            if (duration !== undefined)
                updateData.duration = duration;
            if (questions !== undefined) {
                // Validate questions if provided
                if (!Array.isArray(questions) || questions.length === 0) {
                    res.status(400).json({
                        success: false,
                        message: 'Exam must have at least one question',
                    });
                    return;
                }
                updateData.questions = questions;
            }
            if (passingMarks !== undefined)
                updateData.passingMarks = passingMarks;
            if (standard !== undefined)
                updateData.standard = standard;
            if (subject !== undefined)
                updateData.subject = subject;
            if (examType !== undefined)
                updateData.examType = examType;
            if (isActive !== undefined)
                updateData.isActive = isActive;
            const exam = await exam_model_1.Exam.findByIdAndUpdate(id, updateData, {
                new: true,
                runValidators: true,
            });
            if (!exam) {
                res.status(404).json({
                    success: false,
                    message: 'Exam not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: exam,
            });
        }
        catch (error) {
            logger_1.logger.error('Update exam error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update exam',
            });
        }
    }
    async deleteExam(req, res) {
        try {
            const { id } = req.params;
            const exam = await exam_model_1.Exam.findByIdAndUpdate(id, { isActive: false }, { new: true });
            if (!exam) {
                res.status(404).json({
                    success: false,
                    message: 'Exam not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Exam deleted successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Delete exam error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete exam',
            });
        }
    }
    /**
     * Upload an exam document (PDF/DOCX), parse questions, and return
     * a structured exam payload for the admin to review before saving.
     * This does NOT create the exam in the database.
     */
    async uploadExamDocument(req, res) {
        try {
            const file = req.file;
            const { standard, subject, examType, title } = req.body;
            if (!file) {
                res.status(400).json({ success: false, message: 'File is required' });
                return;
            }
            const buffer = fs_1.default.readFileSync(file.path);
            let text = '';
            if (file.mimetype === 'application/pdf') {
                // Lazy require to avoid issues during build if dependencies missing
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const pdfParse = require('pdf-parse');
                const result = await pdfParse(buffer);
                text = result.text || '';
            }
            else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.originalname.toLowerCase().endsWith('.docx')) {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const mammoth = require('mammoth');
                const result = await mammoth.extractRawText({ buffer });
                text = result.value || '';
            }
            else {
                // Fallback: try treating as plain text
                text = buffer.toString('utf-8');
            }
            if (!text.trim()) {
                res.status(400).json({
                    success: false,
                    message: 'Could not extract text from document',
                });
                return;
            }
            const questions = this.parseQuestionsFromText(text);
            res.status(200).json({
                success: true,
                data: {
                    title: title || file.originalname.replace(/\.(pdf|docx)$/i, ''),
                    duration: 60,
                    standard: standard ? parseInt(standard, 10) : undefined,
                    subject: subject || undefined,
                    examType: examType || undefined,
                    passingMarks: 0,
                    questions,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Upload exam document error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to parse exam document',
            });
        }
    }
    /**
     * Very simple parser for MCQ-style documents.
     * Looks for patterns like:
     * 1. Question text...
     * A) Option
     * B) Option
     * C) Option
     * D) Option
     * Answer: B
     */
    parseQuestionsFromText(rawText) {
        const lines = rawText
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter((l) => !!l);
        const questions = [];
        let current = null;
        const questionRegex = /^(\d+)[\.\)]\s*(.+)$/;
        const optionRegex = /^[A-Da-d][\)\.\:\-]\s*(.+)$/;
        const answerRegex = /^ans(?:wer)?[:\.\-\s]+([A-Da-d0-3])/i;
        for (const line of lines) {
            const qMatch = line.match(questionRegex);
            if (qMatch) {
                if (current) {
                    questions.push(current);
                }
                current = {
                    question: qMatch[2],
                    options: [],
                    correctAnswer: 0,
                    marks: 1,
                };
                continue;
            }
            if (!current)
                continue;
            const oMatch = line.match(optionRegex);
            if (oMatch) {
                current.options.push(oMatch[1]);
                continue;
            }
            const aMatch = line.match(answerRegex);
            if (aMatch) {
                const ans = aMatch[1].toUpperCase();
                if (/[A-D]/.test(ans)) {
                    current.correctAnswer = ans.charCodeAt(0) - 'A'.charCodeAt(0);
                }
                else {
                    const idx = parseInt(ans, 10);
                    if (!isNaN(idx)) {
                        current.correctAnswer = idx;
                    }
                }
            }
        }
        if (current) {
            questions.push(current);
        }
        // Ensure every question has at least 2 options
        return questions.filter((q) => Array.isArray(q.options) && q.options.length >= 2);
    }
}
exports.ExamController = ExamController;
exports.examController = new ExamController();
//# sourceMappingURL=exam.controller.js.map
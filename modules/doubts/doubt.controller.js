"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doubtController = exports.DoubtController = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const student_model_1 = require("../student/student.model");
const doubt_model_1 = require("./doubt.model");
const logger_1 = require("../../utils/logger");
class DoubtController {
    async getMyDoubts(req, res) {
        try {
            const studentId = req.user?.id;
            const doubts = await doubt_model_1.Doubt.find({ studentId })
                .sort({ createdAt: -1 })
                .lean();
            res.status(200).json({
                success: true,
                data: doubts,
            });
        }
        catch (error) {
            logger_1.logger.error('Get doubts error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch doubts',
            });
        }
    }
    async createDoubt(req, res) {
        try {
            const studentId = req.user?.id;
            const { title, description, subject } = req.body;
            if (!title || !description) {
                res.status(400).json({
                    success: false,
                    message: 'title and description are required',
                });
                return;
            }
            const student = await student_model_1.Student.findById(studentId).lean();
            const doubt = await doubt_model_1.Doubt.create({
                studentId,
                studentName: student?.name,
                title,
                description,
                subject,
                status: 'pending',
            });
            res.status(201).json({
                success: true,
                data: doubt,
            });
        }
        catch (error) {
            logger_1.logger.error('Create doubt error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create doubt',
            });
        }
    }
}
exports.DoubtController = DoubtController;
exports.doubtController = new DoubtController();
//# sourceMappingURL=doubt.controller.js.map
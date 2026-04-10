"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = exports.DashboardController = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const student_model_1 = require("../student/student.model");
const exam_model_1 = require("../exams/exam.model");
const video_model_1 = require("../videos/video.model");
const flipbook_model_1 = require("../flipbooks/flipbook.model");
const exam_result_model_1 = require("../exam-results/exam-result.model");
const logger_1 = require("../../utils/logger");
class DashboardController {
    async getAdminDashboard(req, res) {
        try {
            const [totalStudents, activeStudents, totalExams, activeExams, totalVideos, totalFlipbooks, totalExamResults, avgScoreAgg,] = await Promise.all([
                student_model_1.Student.countDocuments({}),
                student_model_1.Student.countDocuments({ isActive: true }),
                exam_model_1.Exam.countDocuments({}),
                exam_model_1.Exam.countDocuments({ isActive: true }),
                video_model_1.Video.countDocuments({}),
                flipbook_model_1.FlipBook.countDocuments({}),
                exam_result_model_1.ExamResult.countDocuments({}),
                exam_result_model_1.ExamResult.aggregate([{ $group: { _id: null, avg: { $avg: '$percentage' } } }]),
            ]);
            const avgScore = Array.isArray(avgScoreAgg) && avgScoreAgg[0] && typeof avgScoreAgg[0].avg === 'number'
                ? Math.round(avgScoreAgg[0].avg * 10) / 10
                : 0;
            res.status(200).json({
                success: true,
                data: {
                    totalStudents,
                    activeStudents,
                    totalExams,
                    activeExams,
                    totalVideos,
                    totalFlipbooks,
                    totalExamResults,
                    avgScore,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Admin dashboard error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch admin dashboard',
            });
        }
    }
}
exports.DashboardController = DashboardController;
exports.dashboardController = new DashboardController();
//# sourceMappingURL=dashboard.controller.js.map
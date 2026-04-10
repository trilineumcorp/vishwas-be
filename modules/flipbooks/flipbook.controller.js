"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flipBookController = exports.FlipBookController = void 0;
const express_1 = require("express");
const flipbook_model_1 = require("./flipbook.model");
const logger_1 = require("../../utils/logger");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
class FlipBookController {
    async getAllFlipBooks(req, res) {
        try {
            const { standard, subject } = req.query;
            const filter = { isActive: true };
            if (standard) {
                filter.standard = parseInt(standard);
            }
            if (subject) {
                filter.subject = subject;
            }
            const flipbooks = await flipbook_model_1.FlipBook.find(filter)
                .sort({ createdAt: -1 })
                .select('-__v');
            res.status(200).json({
                success: true,
                data: flipbooks,
            });
        }
        catch (error) {
            logger_1.logger.error('Get flipbooks error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch flipbooks',
            });
        }
    }
    async getFlipBookById(req, res) {
        try {
            const { id } = req.params;
            const flipbook = await flipbook_model_1.FlipBook.findById(id);
            if (!flipbook || !flipbook.isActive) {
                res.status(404).json({
                    success: false,
                    message: 'Flipbook not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: flipbook,
            });
        }
        catch (error) {
            logger_1.logger.error('Get flipbook error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch flipbook',
            });
        }
    }
    async createFlipBook(req, res) {
        try {
            const { title, pdfUrl, thumbnail, description, standard, subject } = req.body;
            const userId = req.user?.id;
            const flipbook = await flipbook_model_1.FlipBook.create({
                title,
                pdfUrl,
                thumbnail,
                description,
                standard,
                subject,
                createdBy: userId,
                isActive: true,
            });
            res.status(201).json({
                success: true,
                data: flipbook,
            });
        }
        catch (error) {
            logger_1.logger.error('Create flipbook error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create flipbook',
            });
        }
    }
    async updateFlipBook(req, res) {
        try {
            const { id } = req.params;
            const { title, pdfUrl, thumbnail, description, standard, subject, isActive } = req.body;
            const flipbook = await flipbook_model_1.FlipBook.findByIdAndUpdate(id, {
                title,
                pdfUrl,
                thumbnail,
                description,
                standard,
                subject,
                isActive,
            }, { new: true, runValidators: true });
            if (!flipbook) {
                res.status(404).json({
                    success: false,
                    message: 'Flipbook not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: flipbook,
            });
        }
        catch (error) {
            logger_1.logger.error('Update flipbook error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update flipbook',
            });
        }
    }
    async deleteFlipBook(req, res) {
        try {
            const { id } = req.params;
            const flipbook = await flipbook_model_1.FlipBook.findByIdAndUpdate(id, { isActive: false }, { new: true });
            if (!flipbook) {
                res.status(404).json({
                    success: false,
                    message: 'Flipbook not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Flipbook deleted successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Delete flipbook error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete flipbook',
            });
        }
    }
}
exports.FlipBookController = FlipBookController;
exports.flipBookController = new FlipBookController();
//# sourceMappingURL=flipbook.controller.js.map
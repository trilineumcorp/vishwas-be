"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoController = exports.VideoController = void 0;
const express_1 = require("express");
const video_model_1 = require("./video.model");
const logger_1 = require("../../utils/logger");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
class VideoController {
    async getAllVideos(req, res) {
        try {
            const { standard, subject } = req.query;
            const filter = { isActive: true };
            if (standard) {
                filter.standard = parseInt(standard);
            }
            if (subject) {
                filter.subject = subject;
            }
            const videos = await video_model_1.Video.find(filter)
                .sort({ createdAt: -1 })
                .select('-__v');
            res.status(200).json({
                success: true,
                data: videos,
            });
        }
        catch (error) {
            logger_1.logger.error('Get videos error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch videos',
            });
        }
    }
    async getVideoById(req, res) {
        try {
            const { id } = req.params;
            const video = await video_model_1.Video.findById(id);
            if (!video || !video.isActive) {
                res.status(404).json({
                    success: false,
                    message: 'Video not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: video,
            });
        }
        catch (error) {
            logger_1.logger.error('Get video error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch video',
            });
        }
    }
    async createVideo(req, res) {
        try {
            const { title, youtubeUrl, description, category, duration, thumbnail, standard, subject } = req.body;
            const userId = req.user?.id;
            const video = await video_model_1.Video.create({
                title,
                youtubeUrl,
                description,
                category,
                duration,
                thumbnail,
                standard,
                subject,
                createdBy: userId,
                isActive: true,
            });
            res.status(201).json({
                success: true,
                data: video,
            });
        }
        catch (error) {
            logger_1.logger.error('Create video error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create video',
            });
        }
    }
    async updateVideo(req, res) {
        try {
            const { id } = req.params;
            const { title, youtubeUrl, description, category, duration, thumbnail, standard, subject, isActive } = req.body;
            const video = await video_model_1.Video.findByIdAndUpdate(id, {
                title,
                youtubeUrl,
                description,
                category,
                duration,
                thumbnail,
                standard,
                subject,
                isActive,
            }, { new: true, runValidators: true });
            if (!video) {
                res.status(404).json({
                    success: false,
                    message: 'Video not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: video,
            });
        }
        catch (error) {
            logger_1.logger.error('Update video error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update video',
            });
        }
    }
    async deleteVideo(req, res) {
        try {
            const { id } = req.params;
            const video = await video_model_1.Video.findByIdAndUpdate(id, { isActive: false }, { new: true });
            if (!video) {
                res.status(404).json({
                    success: false,
                    message: 'Video not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Video deleted successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Delete video error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete video',
            });
        }
    }
}
exports.VideoController = VideoController;
exports.videoController = new VideoController();
//# sourceMappingURL=video.controller.js.map
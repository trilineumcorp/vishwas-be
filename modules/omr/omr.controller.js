"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.omrController = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const upload_model_1 = require("./upload.model");
const logger_1 = require("../../utils/logger");
class OMRController {
    async uploadAndQueueProcessing(req, res) {
        try {
            const adminId = req.user?.id;
            const { examId } = req.body;
            const file = req.file;
            if (!adminId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            if (!file) {
                res.status(400).json({ success: false, message: 'File is required' });
                return;
            }
            const upload = await upload_model_1.OMRUpload.create({
                adminId,
                examId: examId || undefined,
                originalFilename: file.originalname,
                storagePath: file.path,
                mimeType: file.mimetype,
                parsed: false,
            });
            // TODO: enqueue background OMR processing job (BullMQ / worker)
            logger_1.logger.info('OMR upload saved', { uploadId: upload._id.toString() });
            res.status(201).json({
                success: true,
                data: upload,
                message: 'OMR file uploaded. Processing will run in background.',
            });
        }
        catch (error) {
            logger_1.logger.error('OMR upload error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to upload OMR file',
            });
        }
    }
    async listUploads(req, res) {
        try {
            const { examId } = req.query;
            const filter = {};
            if (examId) {
                filter.examId = examId;
            }
            const uploads = await upload_model_1.OMRUpload.find(filter)
                .sort({ createdAt: -1 })
                .limit(100);
            res.status(200).json({
                success: true,
                data: uploads,
            });
        }
        catch (error) {
            logger_1.logger.error('List OMR uploads error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch OMR uploads',
            });
        }
    }
}
exports.omrController = new OMRController();
//# sourceMappingURL=omr.controller.js.map
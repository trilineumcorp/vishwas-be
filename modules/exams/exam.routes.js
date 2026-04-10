"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const exam_controller_1 = require("./exam.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
// Legacy exam upload route (disk storage disabled).
// Use exam.routes.s3.ts for serverless / Vercel deployments.
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
    },
});
// Public routes
router.get('/', exam_controller_1.examController.getAllExams.bind(exam_controller_1.examController));
router.get('/:id', exam_controller_1.examController.getExamById.bind(exam_controller_1.examController));
// Admin only routes
router.post('/', auth_middleware_1.authenticate, (0, role_middleware_1.roleMiddleware)(['admin']), exam_controller_1.examController.createExam.bind(exam_controller_1.examController));
router.put('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.roleMiddleware)(['admin']), exam_controller_1.examController.updateExam.bind(exam_controller_1.examController));
router.delete('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.roleMiddleware)(['admin']), exam_controller_1.examController.deleteExam.bind(exam_controller_1.examController));
// Admin document upload + parsing (PDF/DOCX)
router.post('/upload', auth_middleware_1.authenticate, (0, role_middleware_1.roleMiddleware)(['admin']), upload.single('file'), exam_controller_1.examController.uploadExamDocument.bind(exam_controller_1.examController));
exports.default = router;
//# sourceMappingURL=exam.routes.js.map
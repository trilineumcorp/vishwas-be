"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const exam_result_controller_1 = require("./exam-result.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
router.get('/', exam_result_controller_1.examResultController.getAllResults.bind(exam_result_controller_1.examResultController));
router.get('/student/:studentId', exam_result_controller_1.examResultController.getResultsByStudent.bind(exam_result_controller_1.examResultController));
router.get('/:id', exam_result_controller_1.examResultController.getResultById.bind(exam_result_controller_1.examResultController));
router.post('/', exam_result_controller_1.examResultController.createResult.bind(exam_result_controller_1.examResultController));
exports.default = router;
//# sourceMappingURL=exam-result.routes.js.map
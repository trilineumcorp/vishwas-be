"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const video_controller_1 = require("./video.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get('/', video_controller_1.videoController.getAllVideos.bind(video_controller_1.videoController));
router.get('/:id', video_controller_1.videoController.getVideoById.bind(video_controller_1.videoController));
// Admin only routes
router.post('/', auth_middleware_1.authenticate, (0, role_middleware_1.roleMiddleware)(['admin']), video_controller_1.videoController.createVideo.bind(video_controller_1.videoController));
router.put('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.roleMiddleware)(['admin']), video_controller_1.videoController.updateVideo.bind(video_controller_1.videoController));
router.delete('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.roleMiddleware)(['admin']), video_controller_1.videoController.deleteVideo.bind(video_controller_1.videoController));
exports.default = router;
//# sourceMappingURL=video.routes.js.map
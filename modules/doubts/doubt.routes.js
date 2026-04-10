"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const doubt_controller_1 = require("./doubt.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, (0, role_middleware_1.roleMiddleware)(['student']), doubt_controller_1.doubtController.getMyDoubts.bind(doubt_controller_1.doubtController));
router.post('/', auth_middleware_1.authenticate, (0, role_middleware_1.roleMiddleware)(['student']), doubt_controller_1.doubtController.createDoubt.bind(doubt_controller_1.doubtController));
exports.default = router;
//# sourceMappingURL=doubt.routes.js.map
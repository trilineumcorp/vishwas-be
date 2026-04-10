"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const flipbook_controller_1 = require("./flipbook.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get('/', flipbook_controller_1.flipBookController.getAllFlipBooks.bind(flipbook_controller_1.flipBookController));
router.get('/:id', flipbook_controller_1.flipBookController.getFlipBookById.bind(flipbook_controller_1.flipBookController));
// Admin only routes
router.post('/', auth_middleware_1.authenticate, (0, role_middleware_1.roleMiddleware)(['admin']), flipbook_controller_1.flipBookController.createFlipBook.bind(flipbook_controller_1.flipBookController));
router.put('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.roleMiddleware)(['admin']), flipbook_controller_1.flipBookController.updateFlipBook.bind(flipbook_controller_1.flipBookController));
router.delete('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.roleMiddleware)(['admin']), flipbook_controller_1.flipBookController.deleteFlipBook.bind(flipbook_controller_1.flipBookController));
exports.default = router;
//# sourceMappingURL=flipbook.routes.js.map
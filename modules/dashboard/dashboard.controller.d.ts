import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
export declare class DashboardController {
    getAdminDashboard(req: AuthRequest, res: Response): Promise<void>;
}
export declare const dashboardController: DashboardController;
//# sourceMappingURL=dashboard.controller.d.ts.map
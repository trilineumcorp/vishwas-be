import { Request, Response, NextFunction } from 'express';
export declare const roleMiddleware: (allowedRoles: ("admin" | "student")[]) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=role.middleware.d.ts.map
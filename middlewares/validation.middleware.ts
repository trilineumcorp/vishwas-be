import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Zod v4 exposes issues on the error instance.
        const issues = (error as any).issues ?? (error as any).errors ?? [];
        const errors = issues.map((err: any) => ({
          field: Array.isArray(err.path) ? err.path.join('.') : '',
          message: err.message ?? 'Invalid input',
        }));
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors,
        });
      } else {
        next(error);
      }
    }
  };
};


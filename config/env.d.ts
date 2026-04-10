import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        test: "test";
        development: "development";
        production: "production";
    }>>;
    PORT: z.ZodDefault<z.ZodString>;
    MONGODB_URI: z.ZodOptional<z.ZodString>;
    JWT_SECRET: z.ZodOptional<z.ZodString>;
    JWT_EXPIRES_IN: z.ZodDefault<z.ZodString>;
    JWT_REFRESH_SECRET: z.ZodOptional<z.ZodString>;
    JWT_REFRESH_EXPIRES_IN: z.ZodDefault<z.ZodString>;
    CORS_ORIGIN: z.ZodOptional<z.ZodString>;
    EMAIL_HOST: z.ZodOptional<z.ZodString>;
    EMAIL_PORT: z.ZodOptional<z.ZodString>;
    EMAIL_USER: z.ZodOptional<z.ZodString>;
    EMAIL_PASSWORD: z.ZodOptional<z.ZodString>;
    EMAIL_FROM: z.ZodOptional<z.ZodString>;
    FRONTEND_URL: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export type Env = z.infer<typeof envSchema>;
export declare const validateEnv: () => Env;
export {};
//# sourceMappingURL=env.d.ts.map
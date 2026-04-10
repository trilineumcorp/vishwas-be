import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  MONGODB_URI: z.string().optional(),
  // JWT secrets are validated and padded in validateEnv, so we allow any string here
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  CORS_ORIGIN: z.string().optional(),
  // Email configuration
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
}).passthrough(); // Allow extra environment variables

export type Env = z.infer<typeof envSchema>;

export const validateEnv = (): Env => {
  // Set defaults for JWT secrets if not provided (for development only)
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production-min-32-chars-development-only';
  } else if (process.env.JWT_SECRET.length < 32) {
    // Pad JWT secret if it's too short (for development)
    const padding = 'x'.repeat(32 - process.env.JWT_SECRET.length);
    process.env.JWT_SECRET = process.env.JWT_SECRET + padding;
    console.warn('JWT_SECRET was too short, padded to 32 characters');
  }
  
  if (!process.env.JWT_REFRESH_SECRET) {
    process.env.JWT_REFRESH_SECRET = 'your-super-secret-refresh-token-key-change-this-in-production-min-32-chars-development-only';
  } else if (process.env.JWT_REFRESH_SECRET.length < 32) {
    // Pad JWT refresh secret if it's too short (for development)
    const padding = 'x'.repeat(32 - process.env.JWT_REFRESH_SECRET.length);
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET + padding;
    console.warn('JWT_REFRESH_SECRET was too short, padded to 32 characters');
  }
  
  // Ensure NODE_ENV is set
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }
  
  // Ensure PORT is set
  if (!process.env.PORT) {
    process.env.PORT = '3000';
  }
  
  // Use safeParse for better error handling
  try {
    const result = envSchema.safeParse(process.env);
    
    if (!result.success) {
      const zodError = result.error;
      
      // Safely extract errors array
      let errors: any[] = [];
      if (zodError && typeof zodError === 'object' && 'errors' in zodError) {
        errors = Array.isArray(zodError.errors) ? zodError.errors : [];
      }
      
      if (errors.length > 0) {
        const errorDetails = errors.map(err => {
          const path = err?.path ? (Array.isArray(err.path) ? err.path.join('.') : String(err.path)) : 'root';
          const message = err?.message || 'Unknown error';
          return `${path}: ${message}`;
        }).join(', ');
        console.error('Environment validation error:', errorDetails);
        console.error('Full error details:', JSON.stringify(errors, null, 2));
        throw new Error(`Invalid environment variables: ${errorDetails}`);
      } else {
        const errorMsg = (zodError && typeof zodError === 'object' && 'message' in zodError) 
          ? String(zodError.message) 
          : 'Unknown validation error';
        console.error('Environment validation error:', errorMsg);
        console.error('ZodError object:', zodError);
        throw new Error(`Invalid environment variables: ${errorMsg}`);
      }
    }
    
    return result.data;
  } catch (error: any) {
    // If it's already our formatted error, re-throw it
    if (error?.message && error.message.includes('Invalid environment variables')) {
      throw error;
    }
    // Otherwise, wrap it
    console.error('Unexpected error during environment validation:', error);
    throw new Error(`Environment validation failed: ${error?.message || String(error)}`);
  }
};


import 'dotenv/config';
import createApp from './app';
import { logger } from '../utils/logger';
import { connectMongoDB } from '../config/mongo';
import { validateEnv } from '../config/env';
import mongoose from 'mongoose';

const PORT = Number(process.env.PORT) || 3000;

const startServer = async () => {
  // Important for serverless (Vercel): never `process.exit(1)` on startup.
  // If env/DB is missing, we still want the server to boot so `/health` works.
  try {
    // Validate environment variables (best-effort).
    try {
      validateEnv();
    } catch (error: any) {
      logger.error('Env validation failed (continuing in graceful mode):', error);
    }

    // Connect to MongoDB before starting server (best-effort).
    try {
      await connectMongoDB();
      const isConnected = mongoose.connection.readyState === 1;
      logger.info(isConnected ? 'MongoDB connection established' : 'MongoDB not connected (graceful mode)');
    } catch (error: any) {
      logger.error('MongoDB connection failed (continuing):', error);
      logger.warn('Server starting without MongoDB connection. DB-dependent features may not work.');
    }

    const app = createApp();

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Server accessible at http://0.0.0.0:${PORT} and http://localhost:${PORT}`);
      logger.info(`API endpoints available at http://0.0.0.0:${PORT}/api`);
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
      } else {
        logger.error('Server error:', error);
      }
      // Do not process.exit in serverless; just log.
    });
  } catch (error: any) {
    logger.error('Failed to start server (continuing without crash):', error);
    // If something truly prevents startup, there's nothing we can do here.
  }
};

startServer();


import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorHandler } from '../middlewares/error.middleware';

const createApp = (): Express => {
  const app = express();

  // Security middleware
  app.use(helmet());
  
  // CORS configuration
  const corsOptions = {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : '*', // Allow all origins in development for mobile apps
    credentials: true,
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Root endpoint for platform checks and browser access
  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Topscorer backend is running',
      api: '/api',
      health: '/health',
    });
  });

  // Routes
  app.get('/api', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Topscorer backend API is running',
      health: '/health',
    });
  });

  app.use('/api', routes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState;
    const dbStatusMap: { [key: number]: string } = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    const dbStatusText = dbStatusMap[dbStatus] || 'unknown';
    
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: dbStatusText,
      databaseConnected: dbStatus === 1
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
};

export default createApp;


import mongoose from 'mongoose';
import { logger } from '../utils/logger';

// Get MongoDB URI and ensure it has a database name
const getMongoDBUri = (): string => {
  let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/viswas';
  
  if (!uri) {
    return 'mongodb://localhost:27017/viswas';
  }
  
  // Check if database name is already in the URI
  // Pattern: mongodb://host/dbname or mongodb+srv://host/dbname
  // Extract database name from URI if it exists
  const dbNameMatch = uri.match(/\/([^\/\?]+)(\?|$)/);
  const hasDbName = dbNameMatch && dbNameMatch[1] && !dbNameMatch[1].includes('@');
  
  // If URI has /? (no database name before query params) or ends with /
  if (uri.includes('/?') || (uri.endsWith('/') && !hasDbName)) {
    // Use 'topscore' as default database name
    uri = uri.replace('/?', '/topscore?').replace(/\/$/, '/topscore');
  }
  // If URI has ? but no database name before it
  else if (uri.includes('?') && !hasDbName) {
    uri = uri.replace('?', '/viswas?');
  }
  // If no database name found at all and no query params
  else if (!hasDbName && !uri.includes('?')) {
    uri = uri + (uri.endsWith('/') ? '' : '/') + 'topscore';
  }
  
  // If database name exists in URI, use it as-is (respects 'vishwas' or 'viswas' from env)
  
  return uri;
};

const MONGODB_URI = getMongoDBUri();

// Log the MongoDB URI (without password for security)
const getSafeUri = (uri: string): string => {
  try {
    return uri.replace(/:([^:@]+)@/, ':****@');
  } catch {
    return '****';
  }
};

export const connectMongoDB = async (): Promise<void> => {
  try {
    logger.info(`Connecting to MongoDB: ${getSafeUri(MONGODB_URI)}`);
    
    // Connection options for better reliability
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };
    
    await mongoose.connect(MONGODB_URI, options);
    
    // Log connection details
    logger.info(`MongoDB connected successfully`);
    logger.info(`Database: ${mongoose.connection.db?.databaseName || 'unknown'}`);
    logger.info(`Connection state: ${mongoose.connection.readyState === 1 ? 'connected' : 'not connected'}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error: any) {
    logger.error('MongoDB connection error:', error.message || error);
    if (error.stack) {
      logger.error('Stack trace:', error.stack);
    }
    // Don't crash the whole serverless function if MongoDB isn't available.
    // The app can still serve `/health` and fail gracefully on DB-dependent routes.
    logger.warn('MongoDB connection failed; server will start without DB (graceful mode).');
  }
};

export const disconnectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('MongoDB disconnection error:', error);
  }
};


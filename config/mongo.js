"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectMongoDB = exports.connectMongoDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
// Get MongoDB URI and ensure it has a database name
const getMongoDBUri = () => {
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
const getSafeUri = (uri) => {
    try {
        return uri.replace(/:([^:@]+)@/, ':****@');
    }
    catch {
        return '****';
    }
};
const connectMongoDB = async () => {
    try {
        logger_1.logger.info(`Connecting to MongoDB: ${getSafeUri(MONGODB_URI)}`);
        // Connection options for better reliability
        const options = {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        };
        await mongoose_1.default.connect(MONGODB_URI, options);
        // Log connection details
        logger_1.logger.info(`MongoDB connected successfully`);
        logger_1.logger.info(`Database: ${mongoose_1.default.connection.db?.databaseName || 'unknown'}`);
        logger_1.logger.info(`Connection state: ${mongoose_1.default.connection.readyState === 1 ? 'connected' : 'not connected'}`);
        // Handle connection events
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.logger.error('MongoDB connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.logger.warn('MongoDB disconnected');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            logger_1.logger.info('MongoDB reconnected');
        });
    }
    catch (error) {
        logger_1.logger.error('MongoDB connection error:', error.message || error);
        if (error.stack) {
            logger_1.logger.error('Stack trace:', error.stack);
        }
        // In development, allow server to start even if MongoDB is not available
        // This helps with testing and development
        if (process.env.NODE_ENV === 'production') {
            logger_1.logger.error('MongoDB connection is required in production. Exiting...');
            process.exit(1);
        }
        else {
            logger_1.logger.warn('MongoDB connection failed, but continuing in development mode');
            logger_1.logger.warn('Some features may not work without MongoDB connection');
            throw error; // Re-throw so server knows connection failed
        }
    }
};
exports.connectMongoDB = connectMongoDB;
const disconnectMongoDB = async () => {
    try {
        await mongoose_1.default.disconnect();
        logger_1.logger.info('MongoDB disconnected successfully');
    }
    catch (error) {
        logger_1.logger.error('MongoDB disconnection error:', error);
    }
};
exports.disconnectMongoDB = disconnectMongoDB;
//# sourceMappingURL=mongo.js.map
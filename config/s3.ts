import { S3Client } from '@aws-sdk/client-s3';
import { logger } from '../utils/logger';

/**
 * AWS S3 Client Configuration
 * Uses environment variables for credentials and region
 */

const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const awsRegion = process.env.AWS_REGION || 'us-east-1';

// Validate required environment variables
if (!awsAccessKeyId || !awsSecretAccessKey) {
  logger.error('AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
}

/**
 * S3 Client instance
 * Configured with credentials from environment variables
 * Reused across the application for efficiency
 */
export const s3Client = new S3Client({
  region: awsRegion,
  credentials: {
    accessKeyId: awsAccessKeyId || '',
    secretAccessKey: awsSecretAccessKey || '',
  },
});

// Export configuration for reference
export const s3Config = {
  bucket: process.env.AWS_S3_BUCKET_NAME || '',
  region: awsRegion,
  endpoint: process.env.AWS_S3_ENDPOINT, // Optional: for custom S3-compatible services
};

// Validate bucket name
if (!s3Config.bucket) {
  logger.error('AWS_S3_BUCKET_NAME is not configured');
}

logger.info(`S3 configured for bucket: ${s3Config.bucket} in region: ${s3Config.region}`);

export default s3Client;

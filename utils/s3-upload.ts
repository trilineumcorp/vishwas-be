import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { s3Client, s3Config } from '../config/s3';
import { logger } from './logger';

/**
 * S3 Upload Utilities
 * Handles file uploads, deletions, URL generation, and other S3 operations
 */

interface UploadOptions {
  folder?: string; // e.g., 'omr', 'exams', 'assignments'
  isPublic?: boolean; // Set ACL to public-read if true
  metadata?: Record<string, string>;
}

interface UploadResult {
  success: boolean;
  key: string; // S3 object key
  url: string; // Public or signed URL
  bucket: string;
  fileSize: number;
  uploadedAt: string;
  message?: string;
}

/**
 * Generate a unique file name
 * Format: timestamp-uuid-originalname
 * Example: 1712750123456-a1b2c3d4-e5f6-4g7h-8i9j-k0l1m2n3o4p5-document.pdf
 */
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const uuid = uuidv4();
  const extension = originalName.split('.').pop() || 'bin';
  const sanitizedName = originalName
    .replace(/\.[^/.]+$/, '') // Remove existing extension
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars with hyphens
    .substring(0, 30); // Limit length

  return `${timestamp}-${uuid}-${sanitizedName}.${extension}`;
}

/**
 * Determine content type from file name
 */
function getContentType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  const contentTypeMap: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    txt: 'text/plain',
  };
  return contentTypeMap[ext || ''] || 'application/octet-stream';
}

/**
 * Upload file buffer to S3
 * Supports organizing files into folders within the bucket
 */
export async function uploadFileToS3(
  fileBuffer: Buffer,
  originalFileName: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    if (!s3Config.bucket) {
      throw new Error('S3 bucket name is not configured');
    }

    const { folder = 'uploads', isPublic = false, metadata = {} } = options;

    // Generate unique file name
    const uniqueFileName = generateUniqueFileName(originalFileName);
    const s3Key = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

    // Prepare upload command
    const command = new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: getContentType(originalFileName),
      ACL: isPublic ? 'public-read' : 'private',
      Metadata: {
        'original-name': originalFileName,
        'uploaded-at': new Date().toISOString(),
        ...metadata,
      },
    });

    // Upload to S3
    const response = await s3Client.send(command);

    logger.info(`File uploaded to S3: s3://${s3Config.bucket}/${s3Key}`);

    // Generate URL
    const url = isPublic
      ? `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${s3Key}`
      : await generateSignedUrl(s3Key);

    return {
      success: true,
      key: s3Key,
      url,
      bucket: s3Config.bucket,
      fileSize: fileBuffer.length,
      uploadedAt: new Date().toISOString(),
      message: 'File uploaded successfully',
    };
  } catch (error: any) {
    logger.error('S3 upload error:', error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
}

/**
 * Upload OMR image to S3
 * Automatically organizes into 'uploads/omr' folder
 */
export async function uploadOMRImage(
  fileBuffer: Buffer,
  fileName: string,
  metadata?: Record<string, string>
): Promise<UploadResult> {
  return uploadFileToS3(fileBuffer, fileName, {
    folder: 'uploads/omr',
    isPublic: false, // Keep private for security
    metadata: {
      type: 'omr-image',
      ...metadata,
    },
  });
}

/**
 * Upload exam document (PDF, DOCX) to S3
 * Automatically organizes into 'uploads/exams' folder
 */
export async function uploadExamDocument(
  fileBuffer: Buffer,
  fileName: string,
  metadata?: Record<string, string>
): Promise<UploadResult> {
  return uploadFileToS3(fileBuffer, fileName, {
    folder: 'uploads/exams',
    isPublic: false,
    metadata: {
      type: 'exam-document',
      ...metadata,
    },
  });
}

/**
 * Upload student assignment to S3
 */
export async function uploadStudentAssignment(
  fileBuffer: Buffer,
  fileName: string,
  studentId: string,
  assignmentId: string
): Promise<UploadResult> {
  return uploadFileToS3(fileBuffer, fileName, {
    folder: 'uploads/assignments',
    isPublic: false,
    metadata: {
      type: 'student-assignment',
      studentId,
      assignmentId,
    },
  });
}

/**
 * Delete file from S3
 */
export async function deleteFileFromS3(s3Key: string): Promise<void> {
  try {
    if (!s3Config.bucket) {
      throw new Error('S3 bucket name is not configured');
    }

    const command = new DeleteObjectCommand({
      Bucket: s3Config.bucket,
      Key: s3Key,
    });

    await s3Client.send(command);
    logger.info(`File deleted from S3: s3://${s3Config.bucket}/${s3Key}`);
  } catch (error: any) {
    logger.error('S3 delete error:', error);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
}

/**
 * Check if file exists in S3
 */
export async function checkFileExists(s3Key: string): Promise<boolean> {
  try {
    if (!s3Config.bucket) {
      throw new Error('S3 bucket name is not configured');
    }

    const command = new HeadObjectCommand({
      Bucket: s3Config.bucket,
      Key: s3Key,
    });

    await s3Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound') {
      return false;
    }
    logger.error('S3 check file error:', error);
    throw error;
  }
}

/**
 * Generate signed URL for private file
 * URL expires in 1 hour by default
 */
export async function generateSignedUrl(
  s3Key: string,
  expirationSeconds: number = 3600
): Promise<string> {
  try {
    if (!s3Config.bucket) {
      throw new Error('S3 bucket name is not configured');
    }

    const command = new GetObjectCommand({
      Bucket: s3Config.bucket,
      Key: s3Key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: expirationSeconds });
    return url;
  } catch (error: any) {
    logger.error('S3 signed URL generation error:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
}

/**
 * Get public URL for a file (only works if ACL is set to public-read)
 */
export function getPublicUrl(s3Key: string): string {
  return `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${s3Key}`;
}

/**
 * Get public URL with custom domain (if configured)
 */
export function getPublicUrlWithDomain(s3Key: string, customDomain?: string): string {
  if (customDomain) {
    return `https://${customDomain}/${s3Key}`;
  }
  return getPublicUrl(s3Key);
}

export default {
  uploadFileToS3,
  uploadOMRImage,
  uploadExamDocument,
  uploadStudentAssignment,
  deleteFileFromS3,
  checkFileExists,
  generateSignedUrl,
  getPublicUrl,
  getPublicUrlWithDomain,
};

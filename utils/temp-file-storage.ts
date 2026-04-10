import * as fs from 'fs';
import * as path from 'path';
import multer from 'multer';
import { logger } from '../utils/logger';

/**
 * Temporary File Storage Utility for Vercel Serverless Functions
 *
 * IMPORTANT LIMITATIONS:
 * - Files are stored in /tmp which is wiped after each function execution
 * - No persistent storage - files disappear when the function ends
 * - Maximum file size limited by Vercel's memory/disk constraints
 * - Processing must be synchronous or return results immediately
 * - No background jobs that depend on file persistence
 */

// Vercel's writable temporary directory
const TMP_DIR = '/tmp';

// Create a unique subdirectory for this execution to avoid conflicts
const getExecutionDir = (): string => {
  const executionId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
  return path.join(TMP_DIR, 'topscorer-' + executionId);
};

// Ensure directory exists safely
export const ensureTempDir = (dirPath: string): void => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info(`Created temporary directory: ${dirPath}`);
    }
  } catch (error: any) {
    logger.error(`Failed to create temp directory ${dirPath}:`, error);
    throw new Error(`Cannot create temporary directory: ${error.message}`);
  }
};

// Clean up a file or directory
export const cleanupTempFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
        logger.info(`Cleaned up temp directory: ${filePath}`);
      } else {
        fs.unlinkSync(filePath);
        logger.info(`Cleaned up temp file: ${filePath}`);
      }
    }
  } catch (error: any) {
    logger.warn(`Failed to cleanup ${filePath}:`, error);
    // Don't throw - cleanup failures shouldn't crash the function
  }
};

// Clean up multiple files/directories
export const cleanupTempFiles = (filePaths: string[]): void => {
  filePaths.forEach(cleanupTempFile);
};

// Multer storage configuration for temporary files
export const createTempMulterStorage = (subDir: string = 'uploads') => {
  const executionDir = getExecutionDir();
  const uploadDir = path.join(executionDir, subDir);

  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      try {
        ensureTempDir(uploadDir);
        cb(null, uploadDir);
      } catch (error: any) {
        cb(error as Error, '');
      }
    },
    filename: (_req, file, cb) => {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const ext = path.extname(file.originalname);
      const basename = path.basename(file.originalname, ext);
      cb(null, `${timestamp}-${randomId}-${basename}${ext}`);
    },
  });
};

// Multer configuration for file uploads
export const createTempMulterUpload = (subDir: string = 'uploads', maxFileSize: number = 20 * 1024 * 1024) => {
  const storage = createTempMulterStorage(subDir);

  return multer({
    storage,
    limits: {
      fileSize: maxFileSize, // Default 20MB
    },
    fileFilter: (_req, file, cb) => {
      // Allow common file types for exams and OMR
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/msword', // .doc
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/webp',
        'text/csv',
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      ];

      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: PDF, DOCX, images, spreadsheets.`));
      }
    },
  });
};

// Get file info for processing
export const getTempFileInfo = (multerFile: any) => {
  return {
    originalName: multerFile.originalname,
    mimeType: multerFile.mimetype,
    size: multerFile.size,
    tempPath: multerFile.path,
    filename: multerFile.filename,
    encoding: multerFile.encoding,
  };
};

// Read file content as buffer
export const readTempFileAsBuffer = (filePath: string): Buffer => {
  try {
    return fs.readFileSync(filePath);
  } catch (error: any) {
    logger.error(`Failed to read temp file ${filePath}:`, error);
    throw new Error(`Cannot read file: ${error.message}`);
  }
};

// Read file content as string
export const readTempFileAsString = (filePath: string, encoding: BufferEncoding = 'utf8'): string => {
  try {
    return fs.readFileSync(filePath, encoding);
  } catch (error: any) {
    logger.error(`Failed to read temp file ${filePath}:`, error);
    throw new Error(`Cannot read file: ${error.message}`);
  }
};

// Write buffer to temp file
export const writeTempBuffer = (dirPath: string, filename: string, buffer: Buffer): string => {
  try {
    ensureTempDir(dirPath);
    const filePath = path.join(dirPath, filename);
    fs.writeFileSync(filePath, buffer);
    logger.info(`Wrote temp file: ${filePath}`);
    return filePath;
  } catch (error: any) {
    logger.error(`Failed to write temp file ${filename}:`, error);
    throw new Error(`Cannot write file: ${error.message}`);
  }
};

// Copy file within temp directory
export const copyTempFile = (sourcePath: string, destDir: string, newFilename?: string): string => {
  try {
    ensureTempDir(destDir);
    const filename = newFilename || path.basename(sourcePath);
    const destPath = path.join(destDir, filename);
    fs.copyFileSync(sourcePath, destPath);
    logger.info(`Copied temp file to: ${destPath}`);
    return destPath;
  } catch (error: any) {
    logger.error(`Failed to copy temp file to ${destDir}:`, error);
    throw new Error(`Cannot copy file: ${error.message}`);
  }
};

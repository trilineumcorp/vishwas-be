import multer, { StorageEngine } from 'multer';

/**
 * Multer Memory Storage Configuration
 * Files are stored in memory as buffers, not on disk
 * Ideal for serverless environments like Vercel
 */

// Define allowed file types
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/jpg'],
  pdf: ['application/pdf'],
  document: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'], // .docx
};

const ALL_ALLOWED_TYPES = [
  ...ALLOWED_MIME_TYPES.image,
  ...ALLOWED_MIME_TYPES.pdf,
  ...ALLOWED_MIME_TYPES.document,
];

// Configuration limits (in bytes)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * File filter function
 * Validates file type before upload
 */
const fileFilter = (
  req: any,
  file: any,
  cb: (error: Error | null, acceptFile?: boolean) => void
): void => {
  if (!ALL_ALLOWED_TYPES.includes(file.mimetype)) {
    const error = new Error(
      `Invalid file type: ${file.mimetype}. Allowed types: images (JPEG, PNG), PDF, DOCX`
    );
    cb(error);
    return;
  }
  cb(null, true);
};

/**
 * Create multer instance with memory storage
 * Files uploaded are stored in memory as buffers
 */
export const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

/**
 * Specific upload middleware for OMR uploads
 * Single file upload named 'file'
 */
export const uploadOMRFile = uploadMemory.single('file');

/**
 * Specific upload middleware for Exam documents (PDF, DOCX)
 * Single file upload named 'file'
 */
export const uploadExamDocument = uploadMemory.single('file');

/**
 * Specific upload middleware for multiple OMR files
 * Multiple file uploads named 'files'
 */
export const uploadMultipleOMRFiles = uploadMemory.array('files', 10); // Max 10 files

/**
 * Generic upload middleware
 * Can be reused for any single file upload
 */
export const uploadSingleFile = uploadMemory.single('file');

export default uploadMemory;

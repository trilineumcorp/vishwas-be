# AWS S3 File Upload System - Complete Guide

This document provides a comprehensive guide for using AWS S3 for file uploads in a Vercel serverless Node.js backend.

## Overview

This system provides:
- ✅ **Serverless-compatible** file uploads (no local disk storage)
- ✅ **Direct S3 integration** using AWS SDK v3
- ✅ **Memory-based file processing** (multer memoryStorage)
- ✅ **Production-ready** error handling and security
- ✅ **Modular architecture** for easy maintenance
- ✅ **Scalable** for high-traffic applications

## Architecture

```
Request Flow:
1. Client sends file via multipart form-data
   ↓
2. Multer middleware (memory storage) buffers file in RAM
   ↓
3. S3 upload utility (PutObjectCommand) uploads buffer directly to S3
   ↓
4. Response returns S3 file key and signed URL
```

## File Structure

```
backend/
├── config/
│   └── s3.ts                    # S3 client configuration
├── middlewares/
│   └── upload.middleware.ts     # Multer memory storage setup
├── modules/
│   ├── omr/
│   │   ├── omr.routes.s3.ts    # OMR upload routes
│   │   └── omr.controller.s3.ts# OMR controller with S3 integration
│   └── exams/
│       ├── exam.routes.s3.ts   # Exam upload routes
│       └── exam.controller.s3.ts# Exam controller with S3 integration
├── utils/
│   └── s3-upload.ts            # S3 utilities (upload, delete, URL generation)
└── api/
    └── upload.ts               # Vercel serverless handler
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer uuid

# TypeScript types
npm install --save-dev @types/express @types/multer
```

### 2. Environment Variables

Add to `.env`:

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name

# Optional: For custom S3-compatible services
AWS_S3_ENDPOINT=https://custom-s3-endpoint.com
```

### 3. AWS IAM Permissions

Create an IAM user with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name"
    }
  ]
}
```

### 4. S3 Bucket Configuration

**Bucket Policy** (for public files, if needed):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/uploads/*"
    }
  ]
}
```

**CORS Configuration** (for browser uploads):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## Usage

### Upload OMR Image

**Request:**

```bash
curl -X POST http://localhost:3000/api/omr/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@omr-answer-sheet.jpg"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "s3Key": "uploads/omr/1712750123456-a1b2c3d4-e5f6-4g7h-8i9j-k0l1m2n3o4p5-omr-answer-sheet.jpg",
    "s3Url": "https://your-bucket.s3.us-east-1.amazonaws.com/uploads/omr/1712750123456-...",
    "fileName": "omr-answer-sheet.jpg",
    "fileSize": 245000,
    "processingStatus": "pending",
    "message": "OMR file uploaded successfully. Processing will start shortly."
  }
}
```

### Upload Exam Document

**Request:**

```bash
curl -X POST http://localhost:3000/api/exams/upload-document \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@exam-questions.pdf" \
  -F "standard=12" \
  -F "subject=Math"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "s3Key": "uploads/exams/1712750123456-a1b2c3d4-e5f6-4g7h-8i9j-k0l1m2n3o4p5-exam-questions.pdf",
    "s3Url": "https://your-bucket.s3.us-east-1.amazonaws.com/uploads/exams/1712750123456-...",
    "fileName": "exam-questions.pdf",
    "fileSize": 512000,
    "title": "exam-questions",
    "duration": 60,
    "standard": 12,
    "subject": "Math",
    "questions": [
      {
        "question": "What is 2 + 2?",
        "options": ["3", "4", "5", "6"],
        "correctAnswer": 1,
        "marks": 1
      }
    ],
    "documentInfo": {
      "format": "pdf",
      "pageCount": 5,
      "wordCount": 2500,
      "processingTime": 1200
    }
  }
}
```

## Advanced Usage

### Using S3 Utilities Programmatically

```typescript
import {
  uploadFileToS3,
  uploadOMRImage,
  deleteFileFromS3,
  generateSignedUrl,
  getPublicUrl,
} from './utils/s3-upload';

// Upload a file
const result = await uploadFileToS3(
  buffer,
  'document.pdf',
  {
    folder: 'uploads/custom',
    isPublic: false,
    metadata: { userId: '123', type: 'document' }
  }
);

console.log(`File uploaded: ${result.key}`);
console.log(`Access URL: ${result.url}`);

// Generate a signed URL for a private file (expires in 1 hour)
const signedUrl = await generateSignedUrl(result.key, 3600);

// Delete a file
await deleteFileFromS3(result.key);
```

### Custom Upload Handler

```typescript
import express from 'express';
import { uploadSingleFile } from './middlewares/upload.middleware';
import { uploadFileToS3 } from './utils/s3-upload';

const app = express();

app.post('/api/custom-upload', uploadSingleFile, async (req, res) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const result = await uploadFileToS3(
      file.buffer,
      file.originalname,
      { folder: 'uploads/custom' }
    );

    res.json({
      success: true,
      key: result.key,
      url: result.url,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Security Best Practices

### 1. File Type Validation

Multer automatically validates file types based on MIME type:

```typescript
// Allowed types in upload.middleware.ts:
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/jpg'],
  pdf: ['application/pdf'],
  document: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};
```

To add more types, modify this configuration.

### 2. File Size Limits

```typescript
// Current limit: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024; // bytes

// Customize in upload.middleware.ts
```

### 3. Access Control

- Private files are stored with ACL: `private`
- Signed URLs are generated on-demand (default: 1 hour expiration)
- Only authenticated users can upload

```typescript
// Example: Generate short-lived signed URLs
const url = await generateSignedUrl(s3Key, 1800); // 30 minutes
```

### 4. Credentials Management

**DO NOT:**
- Hardcode credentials in code
- Commit `.env` file to git
- Share AWS credentials

**DO:**
- Use environment variables
- Use IAM roles in production (Vercel, Lambda, EC2)
- Rotate credentials regularly
- Use separate IAM users for different services

### 5. Sanitize File Names

```typescript
// File names are automatically sanitized:
// Original: "Important Document (1).pdf"
// Stored as: "1712750123456-uuid-important-document-1.pdf"

// Special characters are replaced with hyphens
// Original name is preserved in S3 metadata
```

## Error Handling

The system includes comprehensive error handling:

```typescript
// Upload errors are caught and logged
try {
  const result = await uploadFileToS3(buffer, fileName);
} catch (error) {
  console.error('Upload failed:', error.message);
  // Returns proper HTTP status code
  // Provides user-friendly error message
}
```

**Common Errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| `AWS credentials not configured` | Missing env vars | Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY |
| `Access Denied` | Invalid IAM permissions | Add required S3 permissions to IAM user |
| `NoSuchBucket` | Bucket doesn't exist | Create S3 bucket with correct name |
| `File too large` | Exceeds 5MB limit | Compress file or increase MAX_FILE_SIZE |
| `Invalid file type` | MIME type not allowed | Only JPEG, PNG, PDF, DOCX supported |

## Performance Optimization

### 1. File Size Tuning

```typescript
// For images (optimize for speed)
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// For documents (larger files)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

### 2. Parallel Uploads

```typescript
// Upload multiple files in parallel
const results = await Promise.all([
  uploadFileToS3(buffer1, 'file1.pdf'),
  uploadFileToS3(buffer2, 'file2.pdf'),
  uploadFileToS3(buffer3, 'file3.pdf'),
]);
```

### 3. Connection Reuse

The S3 client is reused across requests (singleton pattern):

```typescript
// config/s3.ts
export const s3Client = new S3Client({ ... });
// Reused for all requests - no connection overhead per request
```

## Monitoring & Logging

All operations are logged using the logger utility:

```typescript
logger.info(`File uploaded to S3: s3://${bucket}/${key}`);
logger.error('S3 upload error:', error);
```

**Monitor these events:**

- File upload success/failure
- S3 API errors
- Invalid file uploads
- Large file uploads

## Cost Estimation (AWS S3)

**Typical usage for education platform:**

- **Storage**: ~$0.023 per GB/month
- **PUT requests**: ~$0.005 per 1,000 requests
- **GET requests**: ~$0.0004 per 1,000 requests
- **Data transfer**: ~$0.09 per GB (outbound)

**Example (1000 exams, 10 OMR uploads per exam):**

- 1,000 exam PDFs × 500KB = 500GB storage
- 10,000 OMR images × 200KB = 2GB storage
- Monthly cost: ~$15-25 (storage) + API calls

## Troubleshooting

### Problem: "ENOENT: no such file or directory"

**Cause**: Trying to use disk storage (fs module) instead of S3

**Solution**: Ensure multer is configured with `memoryStorage()` in `upload.middleware.ts`

### Problem: Vercel Deployment Fails

**Cause**: Missing environment variables in Vercel settings

**Solution**: 
1. Go to Vercel project settings
2. Add environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET_NAME
3. Redeploy

### Problem: "Access Denied" Errors

**Cause**: IAM user doesn't have S3 permissions

**Solution**: Add following permissions to IAM user:
- `s3:PutObject`
- `s3:GetObject`
- `s3:DeleteObject`
- `s3:HeadObject`

### Problem: Large File Uploads Timeout

**Cause**: File size exceeds limit or network too slow

**Solution**: 
- Compress files before upload
- Increase timeout in API route
- Use chunked upload for very large files

## Migration from Local Storage

If migrating from local disk storage:

### Before (Disk Storage)

```typescript
// OLD: Uses fs module - won't work on Vercel
const upload = multer({
  storage: multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => cb(null, file.originalname),
  }),
});
```

### After (S3 Storage)

```typescript
// NEW: Uses AWS S3 - works on Vercel
import { uploadOMRFile } from './middlewares/upload.middleware';

// File automatically uploaded to S3
router.post('/upload', uploadOMRFile, async (req, res) => {
  const result = await uploadOMRImage(req.file.buffer, req.file.originalname);
  // S3Key is in result.key
});
```

## Delete Files from S3

```typescript
import { deleteFileFromS3 } from './utils/s3-upload';

// Delete a specific file
await deleteFileFromS3(s3Key);

// Example: Delete when exam is deleted
router.delete('/api/exams/:id', async (req, res) => {
  const exam = await Exam.findById(id);
  
  if (exam?.s3Key) {
    try {
      await deleteFileFromS3(exam.s3Key);
    } catch (error) {
      logger.error('Failed to delete S3 file:', error);
    }
  }
  
  await Exam.findByIdAndDelete(id);
});
```

## Additional Resources

- [AWS SDK v3 Documentation](https://docs.aws.amazon.com/sdk-for-javascript/latest/developer-guide/)
- [Multer Documentation](https://github.com/expressjs/multer)
- [Vercel Deployment Guide](https://vercel.com/docs/functions/serverless-functions)
- [AWS S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/BestPractices.html)

## Support

For issues or questions:
1. Check the error handling section
2. Review AWS IAM permissions
3. Verify environment variables are set correctly
4. Check AWS S3 bucket settings (CORS, bucket policy)

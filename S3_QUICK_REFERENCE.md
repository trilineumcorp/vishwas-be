/**
 * AWS S3 FILE UPLOAD - QUICK REFERENCE CARD
 * 
 * For quick lookup while coding
 */

// ============================================================
// 🟢 QUICK START
// ============================================================

// 1. Install dependencies
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer uuid

// 2. Set environment variables (.env)
AWS_ACCESS_KEY_ID=key
AWS_SECRET_ACCESS_KEY=secret
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=bucket-name

// 3. Use in routes
import { uploadOMRFile } from '../middlewares/upload.middleware';
import { uploadOMRImage } from '../utils/s3-upload';

// ============================================================
// 📁 FILE STRUCTURE
// ============================================================

backend/
├── config/s3.ts              ← S3 client setup
├── middlewares/
│   └── upload.middleware.ts  ← Multer config
├── utils/s3-upload.ts        ← Upload utilities
└── modules/omr|exams/
    ├── omr.routes.s3.ts      ← Routes with S3
    └── omr.controller.s3.ts  ← Controller with S3

frontend/utils/s3-upload-client.ts ← Client utilities

// ============================================================
// 🚀 BASIC USAGE (BACKEND)
// ============================================================

// In routes:
router.post('/upload', uploadOMRFile, async (req, res) => {
  const file = req.file; // File is in memory as buffer
  
  try {
    // Upload to S3
    const result = await uploadOMRImage(
      file.buffer,
      file.originalname
    );
    
    res.json({
      success: true,
      s3Key: result.key,
      s3Url: result.url,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 💻 BASIC USAGE (FRONTEND - REACT)
// ============================================================

import { uploadOMRImage } from '../utils/s3-upload-client';

function MyComponent() {
  const handleUpload = async (file) => {
    try {
      const token = localStorage.getItem('token');
      const result = await uploadOMRImage(file, token);
      console.log('SUCCESS:', result.s3Url);
    } catch (error) {
      console.error('ERROR:', error.message);
    }
  };

  return (
    <input
      type="file"
      onChange={(e) => handleUpload(e.target.files[0])}
    />
  );
}

// ============================================================
// 🔧 KEY UTILITIES
// ============================================================

// Upload OMR Image
import { uploadOMRImage } from '../utils/s3-upload';
const result = await uploadOMRImage(buffer, 'filename.jpg');
// Returns: { key, url, bucket, fileSize, uploadedAt }

// Upload Exam Document
import { uploadExamDocument } from '../utils/s3-upload';
const result = await uploadExamDocument(buffer, 'exam.pdf');

// Delete File
import { deleteFileFromS3 } from '../utils/s3-upload';
await deleteFileFromS3('uploads/omr/filename.jpg');

// Generate Signed URL (for private files)
import { generateSignedUrl } from '../utils/s3-upload';
const url = await generateSignedUrl('key', 3600); // 1 hour

// Check File Exists
import { checkFileExists } from '../utils/s3-upload';
const exists = await checkFileExists('key');

// ============================================================
// 📋 MULTER MIDDLEWARE OPTIONS
// ============================================================

// Single file with name 'file'
uploadSingleFile

// OMR file (single)
uploadOMRFile

// Exam document (single)
uploadExamDocument

// Multiple OMR files (array)
uploadMultipleOMRFiles

// ============================================================
// ✅ VALIDATION
// ============================================================

ALLOWED TYPES:
- Images: JPEG, PNG, JPG
- Documents: PDF, DOCX
- Max size: 5MB (configurable)

// Custom validation in routes
if (!file) return res.status(400).json({ error: 'No file' });
if (!req.user) return res.status(401).json({ error: 'Not auth' });

// ============================================================
// 🗂️ S3 BUCKET STRUCTURE
// ============================================================

Automatically organized by type:

your-bucket/
  uploads/
    omr/
      1712750123456-uuid-filename.jpg
      1712750123457-uuid-filename.jpg
    exams/
      1712750123458-uuid-filename.pdf
      1712750123459-uuid-filename.docx
    assignments/
      1712750123460-uuid-filename.pdf

// ============================================================
// 🔗 API ENDPOINTS
// ============================================================

POST /api/omr/upload
- Authorization: Bearer TOKEN
- Body: multipart/form-data
- Field: file (image)
- Response: { s3Key, s3Url, fileSize }

POST /api/exams/upload-document
- Authorization: Bearer TOKEN
- Body: multipart/form-data
- Fields: file (pdf/docx), standard, subject, examType
- Response: { s3Key, s3Url, questions, documentInfo }

// ============================================================
// 🛡️ SECURITY
// ============================================================

Environment:
✓ Store AWS keys in .env
✓ Add .env to .gitignore
✓ Never commit credentials
✓ Use IAM users (not root account)

Permissions:
✓ s3:PutObject (upload)
✓ s3:GetObject (download)
✓ s3:DeleteObject (delete)
✓ s3:HeadObject (check exists)

File Validation:
✓ MIME type checked by multer
✓ File size limited (5MB)
✓ File names sanitized
✓ Original name preserved in metadata

// ============================================================
// ❌ COMMON ERRORS & FIXES
// ============================================================

ERROR: "AWS credentials not configured"
FIX: Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env

ERROR: "Access Denied"
FIX: Verify IAM user has s3:PutObject permission

ERROR: "NoSuchBucket"
FIX: Check bucket name and AWS account

ERROR: "File too large"
FIX: Increase MAX_FILE_SIZE in upload.middleware.ts

ERROR: "Invalid file type"
FIX: Use only JPEG, PNG, PDF, DOCX

ERROR: Vercel deployment fails
FIX: Set environment variables in Vercel project settings

// ============================================================
// 📊 PERFORMANCE
// ============================================================

Memory Usage:
- File stored in RAM temporarily
- Automatic cleanup after upload
- 5MB max = minimal memory impact

Upload Speed:
- Direct from client buffer to S3
- No intermediate disk writes
- Parallel uploads supported

Cost (typical):
- Storage: $0.023/GB/month
- 10K uploads/month: ~$0.50
- Total: ~$15/month for 500GB

// ============================================================
// 🧪 TESTING
// ============================================================

// Test with cURL
curl -X POST http://localhost:3000/api/omr/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@test.jpg"

// Test with client
const formData = new FormData();
formData.append('file', fileInput.files[0]);
fetch('/api/omr/upload', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer TOKEN' },
  body: formData,
});

// ============================================================
// 📚 REFERENCES
// ============================================================

Main files:
→ backend/AWS_S3_SETUP_GUIDE.md (detailed guide)
→ S3_IMPLEMENTATION_GUIDE.md (setup checklist)
→ backend/config/s3.ts (configuration)
→ backend/utils/s3-upload.ts (all utilities)

AWS Docs:
→ https://docs.aws.amazon.com/s3/
→ https://docs.aws.amazon.com/sdk-for-javascript/

Other:
→ Multer: https://github.com/expressjs/multer
→ Vercel: https://vercel.com/docs/functions/

// ============================================================
// 💡 TIPS & TRICKS
// ============================================================

1. Multer in memory = no disk I/O = fast uploads
2. S3 Key format includes timestamp = unique names
3. Signed URLs expire = secure temporary access
4. ACL private by default = secure by default
5. Batch operations = use Promise.all()
6. Compression = reduce costs and speed
7. CloudFront CDN = faster downloads
8. S3 lifecycle = auto delete old files

// ============================================================
// 🎯 NEXT STEPS
// ============================================================

1. Installation:
   - npm install dependencies
   - Add 4 env variables

2. AWS Setup:
   - Create S3 bucket
   - Create IAM user
   - Get access keys

3. Integration:
   - Copy 8 backend files
   - Update routes/controllers
   - Test endpoints

4. Frontend:
   - Copy client utilities
   - Create upload component
   - Add progress tracking

5. Deployment:
   - Add env vars to Vercel
   - Deploy backend
   - Test production

6. Monitoring:
   - Check CloudWatch
   - Monitor costs
   - Review error logs

// ============================================================
// 📞 SUPPORT CHECKLIST
// ============================================================

Before asking for help:
□ Check .env has all 4 AWS variables
□ Verify bucket exists in AWS
□ Check IAM user permissions
□ Restart dev server after env changes
□ Check Vercel environment variables
□ Review error logs
□ Verify file is valid format
□ Check file size < 5MB

// ============================================================
// 🚀 YOU'RE READY TO GO!
// ============================================================

All files are ready to use.
Start with S3_IMPLEMENTATION_GUIDE.md for step-by-step setup.

Questions? Check AWS_S3_SETUP_GUIDE.md for detailed documentation.

# Vercel Serverless File Upload Implementation

This backend has been updated to work with Vercel's serverless functions, which have a read-only filesystem except for the `/tmp` directory.

## 🚨 IMPORTANT LIMITATIONS

**Files are temporary and will be deleted after each function execution!**

- **No persistent storage**: Files disappear when the serverless function ends
- **No background processing**: All processing must complete within the function timeout (typically 10-30 seconds)
- **Memory constraints**: Large files may cause out-of-memory errors
- **No file sharing**: Files cannot be accessed by other functions or persisted across requests

## 📁 File Storage Strategy

### Temporary Directory: `/tmp`
- Vercel's only writable directory in serverless functions
- Files are automatically cleaned up after function execution
- Safe for concurrent function executions (each gets its own `/tmp`)

### Directory Structure
```
/tmp/
├── topscorer-{timestamp}-{random}/
│   ├── omr/           # OMR sheet images
│   └── exams/         # Exam documents (PDF/DOCX)
```

## 🔧 Implementation Details

### 1. Multer Configuration (`utils/temp-file-storage.ts`)
```typescript
// Creates unique temporary directories
const createTempMulterUpload = (subDir: string, maxFileSize: number)

// Safe directory creation with recursive option
fs.mkdirSync(dirPath, { recursive: true });

// Automatic cleanup after processing
cleanupTempFile(filePath);
```

### 2. File Processing Flow
1. **Upload**: File saved to `/tmp/topscorer-{id}/{type}/`
2. **Process**: File processed immediately (OMR scanning, PDF parsing)
3. **Return**: Results returned to client
4. **Cleanup**: Temporary files automatically deleted

### 3. Error Handling
- Try-catch blocks prevent function crashes
- Graceful fallbacks for missing dependencies
- File validation before processing
- Automatic cleanup on errors

## 📋 API Endpoints

### OMR Processing
```
POST /api/omr/uploads
- Accepts: image/jpeg, image/png, image/jpg
- Processing: Immediate OMR bubble detection
- Returns: Detected answers with confidence scores
- Cleanup: Automatic after processing
```

### Exam Document Upload
```
POST /api/exams/upload
- Accepts: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document
- Processing: PDF/DOCX text extraction + question parsing
- Returns: Parsed questions with metadata
- Cleanup: Automatic after processing
```

## 🛠️ Dependencies

Required packages (already in package.json):
- `multer`: File upload handling
- `pdf-parse`: PDF text extraction
- `mammoth`: DOCX text extraction

## 🚀 Deployment

### Vercel Configuration (`vercel.json`)
```json
{
  "version": 3,
  "builds": [
    {
      "src": "backend/api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/api/index.ts"
    }
  ]
}
```

### Environment Variables
Set these in Vercel dashboard:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: For authentication
- `CORS_ORIGIN`: Allowed origins (optional)

## 🔍 Monitoring & Debugging

### Logs
- File operations are logged with paths and sizes
- Processing times are tracked
- Errors include file paths for debugging

### Health Check
```
GET /api/health
- Shows database connection status
- Includes file system info
```

## 🚫 What This Implementation Does NOT Support

1. **Persistent File Storage**: No S3, Cloudinary, or external services
2. **Background Jobs**: All processing must complete synchronously
3. **File Sharing**: Cannot access files from other functions
4. **Large Files**: Limited by Vercel's memory and timeout constraints
5. **File Downloads**: Cannot serve uploaded files back to clients

## 🔄 Migration from Local Development

If you were previously using local file storage:

1. **Remove** any `fs.mkdirSync()` calls with local paths
2. **Replace** with `createTempMulterUpload()` from `temp-file-storage.ts`
3. **Add** immediate processing (no background queues)
4. **Remove** file persistence logic
5. **Test** with small files first

## 🧪 Testing

### Local Testing
```bash
# Start backend locally
npm run dev

# Test file upload
curl -X POST http://localhost:3000/api/exams/upload \
  -F "file=@sample.pdf" \
  -F "title=Sample Exam"
```

### Vercel Testing
```bash
# Deploy to Vercel
vercel --prod

# Test the deployed endpoint
curl -X POST https://your-app.vercel.app/api/exams/upload \
  -F "file=@sample.pdf" \
  -F "title=Sample Exam"
```

## 📊 Performance Considerations

- **File Size Limits**: Keep under 10MB for reliable processing
- **Processing Time**: Complex operations should complete within 25 seconds
- **Memory Usage**: Monitor for out-of-memory errors with large files
- **Concurrent Requests**: Each function execution is isolated

## 🆘 Troubleshooting

### Common Issues

1. **ENOENT Errors**: You're trying to write to read-only directories
   - Solution: Use `/tmp` and `createTempMulterUpload()`

2. **Function Timeouts**: Processing takes too long
   - Solution: Optimize processing or reduce file sizes

3. **Out of Memory**: Large files cause crashes
   - Solution: Implement file size limits and streaming

4. **Missing Dependencies**: PDF/DOCX parsing fails
   - Solution: Ensure `pdf-parse` and `mammoth` are installed

### Debug Steps

1. Check Vercel function logs
2. Verify file paths in logs
3. Test with smaller files
4. Ensure proper error handling

## 🔮 Future Improvements

If you need persistent file storage, consider:

1. **External Services**: AWS S3, Cloudinary, Firebase Storage
2. **Database Storage**: Store files as base64 in MongoDB (not recommended for large files)
3. **CDN Integration**: Upload to CDN and store URLs in database
4. **Hybrid Approach**: Temporary processing + external storage for results

---

**Remember**: This is a temporary file solution. Files disappear after processing. If you need to keep files, integrate with a cloud storage service.
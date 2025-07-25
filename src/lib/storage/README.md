# Minu.AI Storage System

A comprehensive storage solution for persistent image and video storage in the Minu.AI platform.

## Overview

The storage system provides:
- **Persistent Storage**: Files are stored permanently in Supabase storage buckets
- **Automatic Processing**: Replicate API responses are automatically processed and stored
- **Error Handling**: Comprehensive error handling with retry mechanisms
- **Performance Monitoring**: Built-in performance tracking and optimization
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Replicate     │───▶│  Response        │───▶│   Supabase      │
│   API Response  │    │  Processor       │    │   Storage       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Database       │
                       │   Records        │
                       └──────────────────┘
```

## Core Components

### 1. SupabaseStorageService
Main storage service for handling file uploads and management.

```typescript
import { getStorageService } from '@/lib/storage'

const storageService = getStorageService()
const result = await storageService.storeFromUrl(fileUrl, metadata)
```

### 2. Response Processor
Processes Replicate API responses and handles storage workflow.

```typescript
import { getResponseProcessor } from '@/lib/replicate/responseProcessor'

const processor = getResponseProcessor()
const result = await processor.processResponse(replicateResponse, options)
```

### 3. Error Handling
Comprehensive error handling with retry mechanisms.

```typescript
import { StorageErrorHandler } from '@/lib/storage'

const result = await StorageErrorHandler.withRetry(
  () => uploadOperation(),
  'file-upload'
)
```

## Configuration

### Environment-Specific Settings

```typescript
// Development
{
  bucketName: 'dev-generated-content',
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'video/mp4']
}

// Production
{
  bucketName: 'generated-content',
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'video/mp4']
}
```

### Storage Patterns

Files are organized using the following pattern:
```
{content-type}/{year}/{month}/{day}/{timestamp}-{randomId}.{extension}

Examples:
- images/2024/01/15/1705123456789-abc123.jpg
- videos/2024/01/15/1705123456789-def456.mp4
```

## Usage Examples

### Basic Image Storage

```typescript
import { getStorageService } from '@/lib/storage'

const storageService = getStorageService()

const metadata = {
  originalUrl: 'https://replicate.delivery/...',
  filename: 'generated-image.jpg',
  mimeType: 'image/jpeg',
  modelUsed: 'flux-dev',
  prompt: 'A beautiful landscape'
}

const result = await storageService.storeFromUrl(fileUrl, metadata)

if (result.success) {
  console.log('Stored at:', result.data.publicUrl)
}
```

### Processing Replicate Response

```typescript
import { getResponseProcessor } from '@/lib/replicate/responseProcessor'

const processor = getResponseProcessor()

const result = await processor.processResponse(
  replicateResponse,
  {
    userId: 'user-123',
    prompt: 'Generate an image',
    modelUsed: 'flux-dev',
    storeInDatabase: true,
    onProgress: (progress) => {
      console.log(`${progress.stage}: ${progress.progress}%`)
    }
  }
)
```

### Video Storage

```typescript
import { getVideoStorageService } from '@/lib/storage'

const videoService = getVideoStorageService()

const result = await videoService.storeVideo(
  videoUrl,
  videoMetadata,
  {
    generateThumbnail: true,
    thumbnailTimestamp: 2.0
  }
)
```

## Error Handling

The system provides multiple levels of error handling:

### 1. Automatic Retry
```typescript
// Automatically retries failed operations
const result = await StorageErrorHandler.withRetry(
  () => storageOperation(),
  'operation-name',
  { maxAttempts: 3, baseDelay: 1000 }
)
```

### 2. Fallback Mechanisms
```typescript
// Falls back to temporary URLs if storage fails
const result = await StorageErrorHandler.withFallback(
  () => persistentStorage(),
  () => temporaryStorage(),
  'storage-operation'
)
```

### 3. User-Friendly Messages
```typescript
const userMessage = StorageErrorHandler.getUserMessage(error)
// Returns: "The file is too large. Please choose a smaller file."
```

## Performance Monitoring

### Built-in Metrics
- Upload/download speeds
- Processing times
- Error rates
- Storage usage

### Performance Testing
```typescript
import { storagePerformanceTester } from '@/lib/testing/performanceTest'

const result = await storagePerformanceTester.runPerformanceTest()
console.log(storagePerformanceTester.generateReport(result))
```

## Database Integration

### Image Records
```sql
INSERT INTO images (
  user_id,
  file_path,
  original_prompt,
  model,
  parameters,
  width,
  height,
  cost,
  generation_time
) VALUES (...)
```

### Video Records
```sql
INSERT INTO videos (
  user_id,
  url,
  thumbnail_url,
  title,
  prompt,
  model_used,
  duration,
  fps,
  width,
  height,
  file_size,
  format
) VALUES (...)
```

## Security

### Access Control
- Files are stored in public buckets for easy access
- Database records are protected by Row Level Security (RLS)
- File validation prevents malicious uploads

### File Validation
- MIME type checking
- File size limits
- URL validation for trusted domains

## Troubleshooting

### Common Issues

1. **Storage Quota Exceeded**
   - Check Supabase storage usage
   - Implement cleanup policies
   - Consider file compression

2. **Upload Failures**
   - Verify network connectivity
   - Check file size limits
   - Validate MIME types

3. **Performance Issues**
   - Monitor file sizes
   - Check network conditions
   - Review error logs

### Debug Mode
Set `NODE_ENV=development` for detailed logging:
```typescript
console.log('Storage operation:', operation)
console.log('File metadata:', metadata)
console.log('Result:', result)
```

## Migration Guide

### From Temporary URLs
1. Update gallery components to handle storage metadata
2. Implement progressive migration of existing images
3. Update API responses to include storage information

### Database Schema Updates
```sql
-- Add storage metadata columns
ALTER TABLE images ADD COLUMN storage_provider TEXT DEFAULT 'replicate';
ALTER TABLE images ADD COLUMN storage_persistent BOOLEAN DEFAULT FALSE;
```

## Contributing

When adding new storage features:
1. Update type definitions
2. Add comprehensive error handling
3. Include performance monitoring
4. Write tests for new functionality
5. Update documentation

## License

Part of the Minu.AI platform - All rights reserved.

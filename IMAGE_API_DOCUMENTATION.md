# AutoLensAI Image Processing API Documentation

## Overview

The AutoLensAI Image Processing API provides comprehensive endpoints for uploading, processing, and managing vehicle images with advanced AI-powered features including background removal, image enhancement, and automated thumbnail generation.

## Architecture

- **Upload Endpoints**: Handle multi-file uploads with immediate Cloudinary storage
- **Processing Endpoints**: AI-powered image enhancement with async queue processing
- **Management Endpoints**: CRUD operations for individual images
- **Bulk Operations**: Batch processing for multiple images
- **Queue Management**: Monitor and control background processing jobs

## API Endpoints

### 1. Image Upload API (`/api/images/upload`)

#### POST - Upload Vehicle Images
```bash
POST /api/images/upload
Content-Type: application/json

{
  "vehicleId": "uuid",
  "files": [
    {
      "name": "car-front.jpg",
      "type": "image/jpeg",
      "data": "base64-encoded-image-data"
    }
  ],
  "folder": "autolensai/vehicles", // optional
  "applyEnhancements": false,      // optional
  "orderIndex": 0,                 // optional
  "isPrimary": true                // optional
}
```

**Response:**
```json
{
  "images": [
    {
      "id": "image-uuid",
      "originalUrl": "https://cloudinary.com/...",
      "publicId": "autolensai/vehicles/...",
      "width": 1920,
      "height": 1080,
      "format": "jpg"
    }
  ],
  "message": "2 image(s) uploaded successfully",
  "enhancementQueued": false
}
```

#### GET - List Vehicle Images
```bash
GET /api/images/upload?vehicleId=uuid
```

**Response:**
```json
{
  "images": [
    {
      "id": "uuid",
      "vehicle_id": "uuid",
      "original_url": "...",
      "processed_url": "...",
      "cloudinary_public_id": "...",
      "order_index": 0,
      "is_primary": true,
      "processing_status": "completed",
      "thumbnail": "...",
      "url": "..."
    }
  ]
}
```

### 2. Image Processing API (`/api/images/process`)

#### POST - Process Single Image
```bash
POST /api/images/process
Content-Type: application/json

{
  "imageId": "uuid",
  "operation": "enhance", // "remove_background" | "enhance" | "create_thumbnail"
  "async": true,          // optional, default true
  "options": {            // optional
    "width": 800,
    "height": 600,
    "quality": "auto"
  }
}
```

**Async Response:**
```json
{
  "success": true,
  "async": true,
  "jobId": "enhance-uuid-timestamp",
  "operation": "enhance",
  "message": "Image enhance queued for processing"
}
```

**Sync Response:**
```json
{
  "success": true,
  "async": false,
  "operation": "enhance",
  "result": {
    "publicId": "...",
    "url": "...",
    "width": 1920,
    "height": 1080
  },
  "message": "Image enhance completed successfully"
}
```

#### GET - Check Processing Status
```bash
GET /api/images/process?imageId=uuid
```

**Response:**
```json
{
  "imageId": "uuid",
  "status": "processing", // "pending" | "processing" | "completed" | "failed"
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### 3. Individual Image Management (`/api/images/[id]`)

#### GET - Get Image Details
```bash
GET /api/images/{imageId}
```

**Response:**
```json
{
  "image": {
    "id": "uuid",
    "vehicle_id": "uuid",
    "original_url": "...",
    "processed_url": "...",
    "cloudinary_public_id": "...",
    "order_index": 0,
    "is_primary": true,
    "processing_status": "completed",
    "url": "...",
    "optimizedUrls": {
      "thumbnail": "...",
      "medium": "...",
      "large": "...",
      "original": "..."
    },
    "vehicles": {
      "id": "uuid",
      "user_id": "uuid",
      "make": "Tesla",
      "model": "Model 3",
      "year": 2023
    }
  }
}
```

#### PATCH - Update Image Metadata
```bash
PATCH /api/images/{imageId}
Content-Type: application/json

{
  "isPrimary": true,     // optional
  "orderIndex": 1        // optional
}
```

#### DELETE - Delete Image
```bash
DELETE /api/images/{imageId}
```

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully",
  "cloudinaryDeleted": true
}
```

### 4. Bulk Processing API (`/api/images/bulk-process`)

#### POST - Process Multiple Images
```bash
POST /api/images/bulk-process
Content-Type: application/json

{
  "vehicleId": "uuid",
  "imageIds": ["uuid1", "uuid2", "uuid3"],
  "operation": "enhance", // "remove_background" | "enhance" | "create_thumbnails"
  "options": {            // optional
    "width": 800,
    "height": 600,
    "quality": "auto",
    "priority": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "operation": "enhance",
  "vehicleId": "uuid",
  "totalImages": 3,
  "queuedJobs": 3,
  "jobs": [
    {
      "jobId": "bulk-enhance-uuid1-timestamp-0",
      "imageId": "uuid1",
      "status": "queued"
    }
  ],
  "bulkJobId": "bulk-uuid-timestamp",
  "message": "3 images queued for enhance"
}
```

#### GET - Check Bulk Processing Status
```bash
GET /api/images/bulk-process?vehicleId=uuid&jobIds=job1,job2,job3
```

**Response:**
```json
{
  "vehicleId": "uuid",
  "totalImages": 3,
  "imageStatuses": [...],
  "jobStatuses": [
    {
      "jobId": "bulk-enhance-uuid1-timestamp-0",
      "status": "completed",
      "progress": 100,
      "data": {...},
      "finishedOn": 1234567890
    }
  ],
  "statusCounts": {
    "completed": 2,
    "processing": 1,
    "pending": 0,
    "failed": 0
  },
  "overallProgress": {
    "completed": 2,
    "processing": 1,
    "pending": 0,
    "failed": 0
  }
}
```

### 5. Queue Management API (`/api/queue/images`)

#### GET - Get Queue Statistics
```bash
GET /api/queue/images
```

**Response:**
```json
{
  "queueName": "image-processing",
  "stats": {
    "waiting": 5,
    "active": 2,
    "completed": 150,
    "failed": 3,
    "delayed": 0,
    "paused": 0,
    "total": 160
  },
  "processorStats": {...},
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### POST - Manage Queue Operations
```bash
POST /api/queue/images
Content-Type: application/json

{
  "action": "pause",     // "pause" | "resume" | "clean" | "stats"
  "olderThan": 86400000  // optional, milliseconds
}
```

## Processing Operations

### 1. Background Removal
- Uses Cloudinary's AI-powered background removal
- Optimized for automotive images
- Maintains vehicle detail while removing distracting backgrounds

### 2. Image Enhancement
- AI-powered image improvement
- Sharpening and quality optimization
- Professional automotive showroom backgrounds
- Automatic lighting and color correction

### 3. Thumbnail Generation
- Multiple size variants (thumbnail, medium, large)
- Optimized for web delivery
- Automatic format selection (WebP, JPEG)
- Responsive image URLs

## Queue System

### Background Processing
- Redis-backed Bull queue for reliable job processing
- Configurable concurrency limits
- Automatic retry with exponential backoff
- Job progress tracking and status updates

### Queue Configuration
```typescript
{
  concurrency: 5,
  limiter: {
    max: 10,        // Max 10 jobs per second
    duration: 1000  // Time window in ms
  },
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  }
}
```

## Security & Authentication

### User Authorization
- All endpoints require valid Supabase JWT authentication
- Row-Level Security (RLS) enforces user ownership
- Vehicle ownership verification for all image operations

### File Validation
- Supported formats: JPEG, PNG, WebP
- Maximum file size: 10MB per image
- Maximum batch size: 20 images per upload, 50 per bulk operation
- Base64 encoding validation

## Error Handling

### Common Error Responses
```json
{
  "error": "Error description",
  "details": [...], // For validation errors
  "status": 400
}
```

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

### API Limits
- Upload: 10 requests per minute per user
- Processing: 50 requests per minute per user
- Queue operations: 5 requests per minute per user

### Processing Limits
- Cloudinary API limits enforced
- Queue concurrency: 5 concurrent jobs
- Bulk operations staggered by 1 second per image

## Monitoring & Logging

### Job Monitoring
- Real-time job progress tracking
- Comprehensive error logging
- Performance metrics collection
- Queue health monitoring

### Logging Events
- Image upload success/failure
- Processing job lifecycle
- Queue management operations
- Error conditions and recovery

## Integration Examples

### Frontend Upload Example
```javascript
// Upload multiple images
const uploadImages = async (vehicleId, files) => {
  const formattedFiles = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      type: file.type,
      data: await fileToBase64(file)
    }))
  );

  const response = await fetch('/api/images/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      vehicleId,
      files: formattedFiles,
      applyEnhancements: true
    })
  });

  return response.json();
};
```

### Bulk Processing Example
```javascript
// Process multiple images
const bulkProcess = async (vehicleId, imageIds) => {
  const response = await fetch('/api/images/bulk-process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      vehicleId,
      imageIds,
      operation: 'enhance',
      options: { priority: 8 }
    })
  });

  return response.json();
};
```

## Performance Optimization

### Cloudinary Optimization
- Automatic format selection (WebP when supported)
- Quality optimization based on content
- Progressive JPEG for faster loading
- Lazy loading support with placeholder URLs

### Database Optimization
- Indexed queries for fast image retrieval
- Optimized RLS policies
- Efficient batch operations
- Connection pooling

### Queue Optimization
- Staggered job execution to avoid rate limits
- Priority-based job processing
- Automatic cleanup of old jobs
- Memory-efficient job data handling

## Troubleshooting

### Common Issues

1. **Upload Failures**
   - Check file format and size limits
   - Verify base64 encoding
   - Ensure vehicle ownership

2. **Processing Stuck**
   - Check queue status
   - Verify Cloudinary API limits
   - Review job logs

3. **Authentication Errors**
   - Verify JWT token validity
   - Check user permissions
   - Ensure vehicle ownership

### Recovery Procedures
- Restart queue processors: `POST /api/queue/images {"action": "resume"}`
- Clean failed jobs: `POST /api/queue/images {"action": "clean"}`
- Check processing status: `GET /api/images/process?imageId=uuid`

This comprehensive API provides a robust foundation for automotive image management with AI-powered processing capabilities, ensuring high-quality results while maintaining performance and reliability.
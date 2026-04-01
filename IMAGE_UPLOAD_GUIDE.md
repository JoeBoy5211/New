# Image Upload Feature - Installation Guide

## Overview
This feature enables vendors to upload images for:
- Caterer cover images
- Menu item images  
- User profile avatars

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install multer @types/multer
```

### 2. Files Created

The following files have been created:

- `backend/src/config/upload.ts` - Multer configuration
- `backend/src/controllers/uploadController.ts` - Upload endpoints
- `backend/src/routes/uploadRoutes.ts` - Upload routes
- `backend/src/server.ts` - Updated to include upload routes and static file serving

### 3. Uploads Directory

The `backend/uploads/` directory will be created automatically when the first image is uploaded. This directory stores all uploaded images.

**Important**: Add `/uploads` to your `.gitignore` if you don't want to commit uploaded images to version control.

### 4. Environment Configuration

No additional environment variables are required. The upload feature uses the existing server configuration.

## Frontend Setup

### 1. Files Created

- `frontend/src/components/ImageUpload.tsx` - Reusable image upload component
- Updated `frontend/src/pages/vendor/Dashboard.tsx` - Integrated cover image upload

### 2. Usage in Vendor Dashboard

Vendors can now upload cover images from the "Profile" tab in their dashboard. The component includes:
- Image preview
- File validation (type and size)
- Upload progress indication
- Error handling

## API Endpoints

### Upload Cover Image
```
POST /api/upload/cover-image
Content-Type: multipart/form-data

Body:
- image: File (required)
- caterer_id: string (required)
```

### Upload Menu Item Image
```
POST /api/upload/menu-item-image
Content-Type: multipart/form-data

Body:
- image: File (required)
- menu_item_id: string (required)
```

### Upload Avatar
```
POST /api/upload/avatar
Content-Type: multipart/form-data

Body:
- image: File (required)
- user_id: string (required)
```

### Access Uploaded Images
```
GET /uploads/{filename}
```

## File Validation

- **Allowed formats**: JPEG, JPG, PNG, WebP, GIF
- **Maximum file size**: 5MB
- **Storage**: Local filesystem in `backend/uploads/`

## Features

### Automatic Cleanup
- When a new image is uploaded, the old image is automatically deleted
- Prevents disk space waste from unused images

### Image Preview
- Users see a preview before uploading
- Can cancel and select a different image

### Error Handling
- File type validation
- File size validation
- Network error handling
- User-friendly error messages

## Security Considerations

1. **File Type Validation**: Only image files are accepted
2. **File Size Limits**: 5MB maximum to prevent abuse
3. **Unique Filenames**: Generated using timestamp + random number
4. **CORS Configuration**: Updated helmet configuration to allow cross-origin resource loading

## Future Enhancements

Consider implementing:
1. **Cloud Storage**: Integrate with AWS S3, Cloudinary, or similar services
2. **Image Optimization**: Compress and resize images automatically
3. **Multiple Images**: Allow vendors to upload image galleries
4. **Image Cropping**: Let users crop images before upload
5. **CDN Integration**: Serve images through a CDN for better performance

## Troubleshooting

### Images not displaying
- Check that the backend server is running
- Verify the `/uploads` directory exists and has proper permissions
- Check browser console for CORS errors

### Upload fails
- Ensure file size is under 5MB
- Verify file is a valid image format
- Check backend logs for detailed error messages

### PowerShell execution policy error
If you encounter script execution errors on Windows:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then run the npm install command again.

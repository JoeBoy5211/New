# Image Upload Flow Diagram

## Upload Process Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTIONS                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Vendor navigates to Dashboard → Profile Tab                 │
│  2. Clicks "Upload Image" or drags image file                   │
│  3. Sees preview of selected image                              │
│  4. Clicks "Upload Image" button                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  ImageUpload Component                                  │    │
│  │  - Validates file type (JPEG, PNG, WebP, GIF)          │    │
│  │  - Validates file size (max 5MB)                       │    │
│  │  - Creates FormData with image + entity ID             │    │
│  │  - Sends POST request to backend                       │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express)                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Upload Route: /api/upload/cover-image                 │    │
│  │  - Receives multipart/form-data                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Multer Middleware                                      │    │
│  │  - Validates file type (server-side)                   │    │
│  │  - Validates file size (server-side)                   │    │
│  │  - Generates unique filename                           │    │
│  │  - Saves to backend/uploads/ directory                 │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Upload Controller                                      │    │
│  │  1. Checks if file was uploaded                        │    │
│  │  2. Validates entity ID (caterer_id)                   │    │
│  │  3. Queries database for old image                     │    │
│  │  4. Deletes old image file (if exists)                 │    │
│  │  5. Updates database with new image URL               │    │
│  │  6. Returns success response with image URL            │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE (MySQL)                           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  UPDATE caterers                                        │    │
│  │  SET cover_image = '/uploads/image-123456.jpg'         │    │
│  │  WHERE id = 'caterer-uuid'                             │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RESPONSE TO FRONTEND                          │
│  {                                                               │
│    "success": true,                                              │
│    "message": "Cover image uploaded successfully",              │
│    "data": {                                                     │
│      "imageUrl": "/uploads/cover-image-1234567890.jpg"         │
│    }                                                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND UPDATE                               │
│  - Shows success toast notification                             │
│  - Refreshes vendor data                                        │
│  - Updates UI with new image                                    │
└─────────────────────────────────────────────────────────────────┘
```

## File Storage Structure

```
backend/
└── uploads/
    ├── cover-image-1707425123456-123456789.jpg
    ├── cover-image-1707425234567-234567890.png
    ├── menu-item-image-1707425345678-345678901.jpg
    ├── avatar-1707425456789-456789012.webp
    └── ...
```

## Image Access

Images are served as static files:

```
Frontend Request:
GET http://localhost:3000/uploads/cover-image-1707425123456-123456789.jpg

Backend Response:
- Serves the actual image file
- Proper Content-Type headers
- CORS headers for cross-origin access
```

## Component Reusability

The `ImageUpload` component can be used for different image types:

```tsx
// Cover Image
<ImageUpload
  uploadType="cover-image"
  entityId={catererId}
  aspectRatio="wide"
/>

// Menu Item Image
<ImageUpload
  uploadType="menu-item-image"
  entityId={menuItemId}
  aspectRatio="square"
/>

// User Avatar
<ImageUpload
  uploadType="avatar"
  entityId={userId}
  aspectRatio="square"
/>
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      ERROR SCENARIOS                             │
└─────────────────────────────────────────────────────────────────┘

1. Invalid File Type
   Frontend → Validates → Shows error toast → Prevents upload

2. File Too Large (>5MB)
   Frontend → Validates → Shows error toast → Prevents upload

3. Network Error
   Frontend → Catches error → Shows error toast → Allows retry

4. Entity Not Found
   Backend → Returns 404 → Frontend shows error → Deletes temp file

5. Database Error
   Backend → Returns 500 → Frontend shows error → Deletes temp file

6. Disk Space Full
   Backend → Multer error → Returns 500 → Frontend shows error
```

## Security Measures

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                               │
└─────────────────────────────────────────────────────────────────┘

1. Frontend Validation
   ✓ File type check (client-side)
   ✓ File size check (client-side)

2. Backend Validation
   ✓ Multer file filter (server-side type check)
   ✓ File size limit (server-side)
   ✓ MIME type validation

3. Storage Security
   ✓ Unique filename generation
   ✓ No executable file extensions
   ✓ Isolated uploads directory

4. Network Security
   ✓ CORS configuration
   ✓ Helmet security headers
   ✓ Cross-origin resource policy
```

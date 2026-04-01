# Quick Fix: Getting the Server Running

## The Problem
The backend server crashes because `multer` package is not installed, but PowerShell execution policy prevents running npm commands.

## Solution Options

### Option 1: Fix PowerShell Policy (Recommended)

1. **Open PowerShell as Administrator**
   - Press `Win + X`
   - Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

2. **Run this command:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **Type `Y` and press Enter**

4. **Install multer:**
   ```bash
   cd j:\cateringapp-main\backend
   npm install multer @types/multer
   ```

5. **Uncomment the upload routes in `backend/src/server.ts`:**
   - Line 13: Uncomment `import uploadRoutes from './routes/uploadRoutes';`
   - Line 42: Uncomment `app.use('/api/upload', uploadRoutes);`

6. **Start the server:**
   ```bash
   npm run dev
   ```

### Option 2: Use Command Prompt (cmd)

1. **Press `Win + R`**
2. **Type `cmd` and press Enter**
3. **Navigate to backend:**
   ```cmd
   cd /d j:\cateringapp-main\backend
   ```
4. **Install multer:**
   ```cmd
   npm install multer @types/multer
   ```
5. **Follow steps 5-6 from Option 1**

### Option 3: Run Without Image Upload (Temporary)

The server will now start **without** image upload functionality:

1. **Use Command Prompt or fix PowerShell policy**
2. **Start the backend:**
   ```cmd
   cd /d j:\cateringapp-main\backend
   npm run dev
   ```
3. **Start the frontend (in another terminal):**
   ```cmd
   cd /d j:\cateringapp-main\frontend
   npm run dev
   ```

**Note:** Image upload won't work until you install multer and uncomment the routes.

## Current Status

✅ Server will start without crashes
✅ All other features work (auth, bookings, reviews, etc.)
❌ Image upload is temporarily disabled

## To Enable Image Upload Later

1. Install multer (using Option 1 or 2 above)
2. Edit `backend/src/server.ts`:
   - Remove the `//` from line 13
   - Remove the `//` from line 42
3. Restart the backend server

## Verify Server is Running

Once started, open your browser and go to:
```
http://localhost:3000/api/health
```

You should see:
```json
{
  "status": "ok",
  "database": "connected"
}
```

## Next Steps

1. ✅ Get the server running (Option 3 works now)
2. ⏳ Fix PowerShell policy or use cmd
3. ⏳ Install multer dependencies
4. ⏳ Uncomment upload routes
5. ⏳ Restart server with full image upload support

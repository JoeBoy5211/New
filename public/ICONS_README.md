# App Icons Required

To complete the PWA setup, you need to create two icon files:

## Required Icons

1. **icon-192.png** - 192x192 pixels
2. **icon-512.png** - 512x512 pixels

## How to Create Icons

### Option 1: Online Generators (Easiest)
1. Visit https://realfavicongenerator.net/
2. Upload your logo/image
3. Download the generated icons
4. Place `icon-192.png` and `icon-512.png` in the `public/` folder

### Option 2: Design Tools
1. Create a square logo (at least 512x512)
2. Export as PNG:
   - `icon-192.png` (192x192)
   - `icon-512.png` (512x512)
3. Place both files in the `public/` folder

### Option 3: Quick Placeholder (For Testing)
You can temporarily use any square image and resize it:
- Use online tools like https://www.iloveimg.com/resize-image
- Or image editing software (Photoshop, GIMP, Canva)

## Icon Design Tips

- **Use a simple, recognizable logo**
- **Ensure good contrast** - icons should be visible on light/dark backgrounds
- **Avoid text** - icons are small, text won't be readable
- **Use your brand colors** - match your app's theme
- **Test on devices** - check how it looks on actual home screens

## Temporary Solution

Until you create proper icons, you can:
1. Use a simple colored square with your app initial (e.g., "CC" for CaterConnect)
2. Or use a free icon from https://www.flaticon.com/

## After Adding Icons

1. Run `npm run build`
2. Test the PWA installation
3. Verify icons appear correctly on home screen

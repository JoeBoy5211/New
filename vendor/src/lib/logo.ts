// Vendor logo helpers — validation + Cloudinary upload.
// Logos live in Cloudinary (folder `catering_app/logos`), same unsigned
// preset as covers/menu/packages. Only the secure_url is saved on
// `caterers.logo_url` (see supabase-vendor-logo.sql).
import { isCloudinaryConfigured, uploadToCloudinary } from '@/lib/cloudinary';

export const LOGO_FOLDER = 'catering_app/logos';
export const MAX_LOGO_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

export function validateLogoFile(file: File | null | undefined): string | null {
  if (!file) return 'Please choose a logo image.';
  const isImageMime = file.type.startsWith('image/');
  const isImageExt = /\.(png|jpe?g|webp|svg)$/i.test(file.name);
  if (!isImageMime && !isImageExt) return 'Logo must be an image file (PNG, JPG, WEBP or SVG).';
  if (!ACCEPTED_TYPES.includes(file.type) && file.type !== '') {
    // Allow other image/* types (e.g. avif/gif) but still require image/*.
    if (!isImageMime) return 'Logo must be an image file (PNG, JPG, WEBP or SVG).';
  }
  if (file.size <= 0) return 'That file looks empty — please choose another image.';
  if (file.size > MAX_LOGO_BYTES) {
    return `Logo is too large (${formatLogoBytes(file.size)}). Maximum is ${formatLogoBytes(MAX_LOGO_BYTES)}.`;
  }
  return null;
}

export function formatLogoBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Upload a logo file to Cloudinary and return its secure_url. */
export async function uploadLogoToCloudinary(file: File): Promise<string> {
  const err = validateLogoFile(file);
  if (err) throw new Error(err);
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.');
  }
  return uploadToCloudinary(file, LOGO_FOLDER);
}

// Cloudinary direct unsigned upload for React Native (Expo).
// Note: uses EXPO_PUBLIC_ vars (exposed to JS). Keep preset as unsigned in Cloudinary console.
import { env } from '@/config/env';

const CLOUD_NAME = env.cloudinaryCloudName;
const UPLOAD_PRESET = env.cloudinaryUploadPreset;

export function isCloudinaryConfigured() {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

function guessMime(uri: string, fallback = 'image/jpeg') {
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase();
  if (!ext) return fallback;
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'mp4') return 'video/mp4';
  return fallback;
}

/**
 * Upload a local file uri (from expo-image-picker) to Cloudinary via unsigned preset.
 * Returns the secure_url.
 */
export async function uploadToCloudinary(localUri: string, folder = 'catering_app/mobile'): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary not configured. Set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET.');
  }
  const mime = guessMime(localUri);
  const name = `upload-${Date.now()}.${mime.split('/')[1] ?? 'jpg'}`;

  const form = new FormData();
  // React Native FormData file shape: { uri, name, type }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form.append('file', { uri: localUri, name, type: mime } as any);
  form.append('upload_preset', UPLOAD_PRESET!);
  form.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cloudinary upload failed: ${res.status} ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.secure_url as string;
}

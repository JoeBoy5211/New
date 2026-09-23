import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'caterer-media';

/** Upload a file from the device to Supabase Storage and return its public URL. */
export async function uploadMenuImage(file: File, vendorId: string): Promise<string> {
  return uploadCatererImage(file, vendorId, 'menu');
}

/** Upload a package image from the device to Supabase Storage and return its public URL. */
export async function uploadPackageImage(file: File, vendorId: string): Promise<string> {
  return uploadCatererImage(file, vendorId, 'packages');
}

async function uploadCatererImage(file: File, vendorId: string, kind: 'menu' | 'packages'): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${vendorId}/${kind}/${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

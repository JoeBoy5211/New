import { supabase } from '@/integrations/supabase/client';

/**
 * Business licence (PDF) helpers — validation, storage upload, signed URLs.
 * Bucket: private `vendor-licences`, path `{vendor_id}/business-licence.pdf`.
 * Provisioned by `supabase-vendor-licence.sql` (bucket + RLS + column).
 */

export const LICENCE_BUCKET = 'vendor-licences';
export const LICENCE_FILE_NAME = 'business-licence.pdf';
export const MAX_LICENCE_BYTES = 10 * 1024 * 1024; // 10 MB

export function licenceStoragePath(vendorId: string): string {
  return `${vendorId}/${LICENCE_FILE_NAME}`;
}

/**
 * Client-side validation. Returns an error message, or null when the file
 * is an acceptable PDF. Checks extension + MIME + size (browsers disagree
 * on `file.type` for PDFs, so never rely on MIME alone).
 */
export function validateLicenceFile(file: File | null | undefined): string | null {
  if (!file) return 'Please attach your business licence (PDF).';
  const name = file.name.toLowerCase();
  const isPdfName = name.endsWith('.pdf');
  const isPdfMime = file.type === 'application/pdf' || file.type === '';
  if (!isPdfName || !isPdfMime) return 'Licence must be a PDF file (.pdf).';
  if (file.size <= 0) return 'That file looks empty — please choose another PDF.';
  if (file.size > MAX_LICENCE_BYTES) {
    return `Licence is too large (${formatBytes(file.size)}). Maximum is ${formatBytes(MAX_LICENCE_BYTES)}.`;
  }
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Upload (upsert) the licence PDF and link it on the vendor's caterer row.
 * Throws an Error with a user-facing message on failure.
 */
export async function uploadLicencePdf(vendorId: string, file: File): Promise<string> {
  const validationError = validateLicenceFile(file);
  if (validationError) throw new Error(validationError);
  if (!vendorId) throw new Error('You need to be signed in to upload a licence.');

  const path = licenceStoragePath(vendorId);
  const { error: uploadError } = await supabase.storage
    .from(LICENCE_BUCKET)
    .upload(path, file, { contentType: 'application/pdf', upsert: true });
  if (uploadError) {
    if (/bucket|not found/i.test(uploadError.message)) {
      throw new Error('Licence storage is not set up yet (missing bucket). Please contact support.');
    }
    if (/row-level security|policy|unauthorized/i.test(uploadError.message)) {
      throw new Error('Upload was blocked. Please sign in again and retry.');
    }
    throw new Error(uploadError.message || 'Could not upload the licence. Please try again.');
  }

  const { error: rowError } = await supabase
    .from('caterers')
    .update({ licence_path: path })
    .eq('vendor_id', vendorId);
  if (rowError) {
    // File is stored; the link failed. Surface clearly so the Pending page
    // (which re-checks licence_path) can repair it on retry.
    throw new Error('Licence uploaded but could not be linked. Please retry from the pending page.');
  }
  return path;
}

/** Short-lived read URL for the private bucket (vendor preview / admin review). */
export async function getLicenceSignedUrl(path: string, expiresIn = 300): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(LICENCE_BUCKET).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

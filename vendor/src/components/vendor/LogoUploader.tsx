import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { isCloudinaryConfigured } from '@/lib/cloudinary';
import { formatLogoBytes, uploadLogoToCloudinary, validateLogoFile } from '@/lib/logo';
import { cn } from '@/lib/utils';

interface LogoUploaderProps {
  value: string;
  onChange: (url: string) => void;
  /** Optional vendor name for alt text / fallback initials. */
  businessName?: string;
  idPrefix?: string;
}

/**
 * Vendor logo picker — Cloudinary upload (catering_app/logos) + manual URL.
 * Square logos work best; previewed as a circle to match public display.
 */
export function LogoUploader({ value, onChange, businessName, idPrefix = 'logo' }: LogoUploaderProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const trimmed = value.trim();
  const displayUrl = previewUrl || (trimmed ? trimmed : null);
  const cloudinaryReady = isCloudinaryConfigured();

  // Local preview for the picked file; revoked on change/unmount.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const err = validateLogoFile(file);
    if (err) {
      toast({ title: 'Invalid logo', description: err, variant: 'destructive' });
      return;
    }
    if (!cloudinaryReady) {
      toast({
        title: 'Upload unavailable',
        description: 'Cloudinary is not configured — paste a logo URL instead.',
        variant: 'destructive',
      });
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setFileName(file.name);
    setUploading(true);
    try {
      const url = await uploadLogoToCloudinary(file);
      onChange(url);
      setPreviewUrl(null);
      toast({ title: 'Logo uploaded', description: 'Preview looks good? Save changes to publish it.' });
    } catch (e) {
      setPreviewUrl(null);
      setFileName(null);
      toast({
        title: 'Upload failed',
        description: e instanceof Error ? e.message : 'Could not upload logo.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange('');
    setPreviewUrl(null);
    setFileName(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const initials = (businessName || 'V')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-muted/50',
            displayUrl ? 'border-transparent' : '',
          )}
          aria-label={displayUrl ? `Logo preview for ${businessName || 'vendor'}` : 'No logo yet'}
        >
          {displayUrl ? (
            <img src={displayUrl} alt={businessName ? `${businessName} logo` : 'Vendor logo'} className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-semibold text-muted-foreground">{initials}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-foreground">Business logo</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Square PNG/JPG/WEBP/SVG up to {formatLogoBytes(5 * 1024 * 1024)}. Shown on your public profile and listings.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {cloudinaryReady && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <ImagePlus className="mr-2 h-3.5 w-3.5" />
                    {trimmed ? 'Replace logo' : 'Upload logo'}
                  </>
                )}
              </Button>
            )}
            {trimmed && (
              <Button type="button" variant="ghost" size="sm" className="rounded-xl text-destructive hover:text-destructive" onClick={handleRemove}>
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove
              </Button>
            )}
          </div>
          {fileName && uploading && <p className="mt-1.5 truncate text-xs text-muted-foreground">{fileName} — uploading to Cloudinary…</p>}
        </div>
      </div>

      {cloudinaryReady && (
        <Input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/*"
          className="hidden"
          aria-label="Upload business logo"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      )}

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-url`}>Logo URL {cloudinaryReady && <span className="font-normal text-muted-foreground">(or paste manually)</span>}</Label>
        <Input
          id={`${idPrefix}-url`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="h-10 rounded-xl border-border/70 bg-white"
          inputMode="url"
        />
      </div>
    </div>
  );
}

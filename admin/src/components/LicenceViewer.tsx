import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileWarning, FileCheck2, ExternalLink, Download, RefreshCw } from 'lucide-react';

const LICENCE_BUCKET = 'vendor-licences';

/**
 * Embedded viewer for a vendor's business licence PDF.
 * The bucket is private, so access goes through short-lived signed URLs
 * (readable by admins via the "Admins can view all licences" storage
 * policy from `New-Vendor/frontend/supabase-vendor-licence.sql`).
 */
export function LicenceViewer({ path }: { path: string | null | undefined }) {
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!path) return;
    setIsLoading(true);
    setError(null);
    try {
      const [view, download] = await Promise.all([
        supabase.storage.from(LICENCE_BUCKET).createSignedUrl(path, 3600),
        supabase.storage.from(LICENCE_BUCKET).createSignedUrl(path, 3600, {
          download: 'business-licence.pdf',
        }),
      ]);
      if (view.error || !view.data?.signedUrl) {
        throw new Error(
          /not found|object/i.test(view.error?.message ?? '')
            ? 'Licence file not found in storage — the vendor may need to re-upload it.'
            : view.error?.message || 'Could not open the licence file.',
        );
      }
      setViewUrl(view.data.signedUrl);
      setDownloadUrl(download.data?.signedUrl ?? view.data.signedUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open the licence file.');
      setViewUrl(null);
      setDownloadUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [path]);

  useEffect(() => {
    setViewUrl(null);
    setDownloadUrl(null);
    setError(null);
    if (path) void load();
  }, [path, load]);

  if (!path) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-[#E3C878] bg-[#FFF9E8] p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF5DF] text-[#B7791F]">
          <FileWarning className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[13.5px] font-semibold">No licence attached yet</p>
          <p className="mt-0.5 text-[13px] text-[#5F5C59]">
            This vendor hasn&apos;t uploaded a business licence. Ask them to attach it
            from their pending page before approving.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-[560px] w-full rounded-lg" />
        <p className="text-xs text-[#8A8783]">Opening licence…</p>
      </div>
    );
  }

  if (error || !viewUrl) {
    return (
      <div className="flex flex-col items-start gap-2 rounded-lg border border-[#E5E2DE] bg-[#FAF9F7] p-4">
        <p className="text-[13.5px] font-semibold">Licence unavailable</p>
        <p className="text-[13px] text-[#5F5C59]">{error ?? 'Could not open the licence file.'}</p>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E9F6F0] px-2.5 py-1 text-[11px] font-medium text-[#16845B]">
          <FileCheck2 className="h-3.5 w-3.5" /> Licence attached
        </span>
        <span className="ml-auto flex gap-1.5">
          <Button variant="outline" size="sm" asChild>
            <a href={viewUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5" /> Open in new tab
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={downloadUrl ?? viewUrl} download="business-licence.pdf">
              <Download className="h-3.5 w-3.5" /> Download
            </a>
          </Button>
        </span>
      </div>
      <iframe
        src={viewUrl}
        title="Business licence (PDF)"
        className="h-[560px] w-full rounded-lg border border-[#E5E2DE] bg-white"
      />
      <p className="truncate text-[11px] text-[#8A8783]" title={path}>
        {path} · link expires in 1 hour
      </p>
    </div>
  );
}

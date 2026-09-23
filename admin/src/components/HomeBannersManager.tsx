import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/PageHeader";
import {
  Images,
  Upload,
  Eye,
  EyeOff,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  MonitorSmartphone,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useHomeBanners,
  useUploadHomeBanner,
  useUpdateHomeBanner,
  useDeleteHomeBanner,
  type HomeBanner,
} from "@/hooks/useHomeBanners";
import { cn } from "@/lib/utils";

export function HomeBannersManager() {
  const { toast } = useToast();
  const { data, isLoading, error, refetch } = useHomeBanners();
  const upload = useUploadHomeBanner();
  const update = useUpdateHomeBanner();
  const remove = useDeleteHomeBanner();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const banners = data ?? [];

  const onPick = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast({ title: "Not an image", description: "Please choose an image file.", variant: "destructive" });
      return;
    }
    setFile(f);
  };

  const onUpload = async () => {
    if (!file) return;
    try {
      await upload.mutateAsync({ file, title });
      toast({ title: "Banner added", description: "It is now live on the mobile home page." });
      setFile(null);
      setTitle("");
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Could not add banner.",
        variant: "destructive",
      });
    }
  };

  const toggle = async (b: HomeBanner) => {
    setBusyId(b.id);
    try {
      await update.mutateAsync({ id: b.id, updates: { is_active: !b.is_active } });
    } catch (e) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Could not update banner.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const other = banners[index + dir];
    const current = banners[index];
    if (!other || !current) return;
    setBusyId(current.id);
    try {
      await update.mutateAsync({ id: current.id, updates: { sort_order: other.sort_order } });
      await update.mutateAsync({ id: other.id, updates: { sort_order: current.sort_order } });
    } catch (e) {
      toast({
        title: "Reorder failed",
        description: e instanceof Error ? e.message : "Could not reorder banners.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (b: HomeBanner) => {
    if (!window.confirm(`Delete "${b.title}"? This removes it from the mobile home page.`)) return;
    setBusyId(b.id);
    try {
      await remove.mutateAsync(b);
      toast({ title: "Banner deleted" });
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : "Could not delete banner.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const saveTitle = async (b: HomeBanner, next: string) => {
    const trimmed = next.trim();
    if (!trimmed || trimmed === b.title) return;
    setBusyId(b.id);
    try {
      await update.mutateAsync({ id: b.id, updates: { title: trimmed } });
    } catch (e) {
      toast({
        title: "Rename failed",
        description: e instanceof Error ? e.message : "Could not rename banner.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-primary">
            <MonitorSmartphone className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold">Home page banners</h2>
            <p className="mt-0.5 text-[13px] text-[#5F5C59]">
              Posted images appear in the fixed banner slot on the mobile home page.
              Multiple active banners play as a carousel — the slot size never changes.
              Upload at least <span className="font-medium">1534 × 636 px</span> (2.41:1);
              images are center-cropped to fit.
            </p>
          </div>
        </div>

        {/* Upload */}
        <div className="mt-4 rounded-lg border border-dashed border-[#E5E2DE] bg-[#FAF9F7] p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_220px_auto] sm:items-end">
            <div>
              <Label htmlFor="banner-file" className="text-xs">Image</Label>
              <Input
                id="banner-file"
                type="file"
                accept="image/*"
                className="mt-1 bg-white"
                onChange={(e) => {
                  onPick(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              {file && (
                <p className="mt-1.5 truncate text-xs text-[#5F5C59]">
                  Selected: <span className="font-medium">{file.name}</span> · {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="banner-title" className="text-xs">Title (for accessibility)</Label>
              <Input
                id="banner-title"
                placeholder="e.g. Holiday catering offer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 bg-white"
              />
            </div>
            <Button onClick={onUpload} disabled={!file || upload.isPending} className="w-full sm:w-auto">
              {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {upload.isPending ? "Uploading…" : "Add banner"}
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <ErrorState
              title="Unable to load banners"
              description="Run admin/supabase-home-banners.sql in Supabase, then try again."
              onRetry={() => refetch()}
            />
          ) : banners.length === 0 ? (
            <EmptyState
              icon={Images}
              title="No banners yet"
              description="Upload the first image above — the mobile home page falls back to its built-in banner until then."
            />
          ) : (
            <ul className="divide-y divide-[#EEECE8] rounded-lg border border-[#EEECE8]">
              {banners.map((b, i) => (
                <li key={b.id} className={cn("flex items-center gap-3 p-3", !b.is_active && "opacity-60")}>
                  <img
                    src={b.image_url}
                    alt=""
                    className="h-14 w-28 shrink-0 rounded-md border border-[#EEECE8] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <Input
                      defaultValue={b.title}
                      key={`${b.id}-${b.title}`}
                      aria-label="Banner title"
                      className="h-8 border-transparent px-1.5 text-[13.5px] font-medium shadow-none hover:border-[#E5E2DE] focus-visible:border-[#74263A]"
                      onBlur={(e) => void saveTitle(b, e.target.value)}
                    />
                    <p className="mt-0.5 px-1.5 text-[11px] text-[#8A8783]">
                      {b.is_active ? `Live · position ${i + 1}` : "Hidden from app"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="sm" disabled={i === 0 || busyId === b.id} title="Move up" onClick={() => void move(i, -1)}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" disabled={i === banners.length - 1 || busyId === b.id} title="Move down" onClick={() => void move(i, 1)}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" disabled={busyId === b.id} title={b.is_active ? "Hide" : "Show"} onClick={() => void toggle(b)}>
                      {b.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="sm" disabled={busyId === b.id} title="Delete" onClick={() => void onDelete(b)}>
                      <Trash2 className="h-3.5 w-3.5 text-[#C24141]" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

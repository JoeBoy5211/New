import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, Package as PackageIcon, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useVendorCaterer } from '@/hooks/supabase/useCaterers';
import { useCatererBookings } from '@/hooks/supabase/useBookings';
import {
  useCreatePackage,
  usePackagesByCaterer,
  useUpdatePackage,
} from '@/hooks/supabase/usePackages';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';
import { uploadPackageImage } from '@/lib/media';
import { SectionCard, VendorLayout } from '@/components/vendor/portal';

async function uploadPackageImageFile(file: File, vendorId: string): Promise<string> {
  if (isCloudinaryConfigured()) {
    try {
      return await uploadToCloudinary(file, 'catering_app/packages');
    } catch (cloudinaryError) {
      try {
        return await uploadPackageImage(file, vendorId);
      } catch {
        throw cloudinaryError;
      }
    }
  }
  return uploadPackageImage(file, vendorId);
}

export default function PackageForm() {
  const { packageId } = useParams<{ packageId: string }>();
  const isEdit = Boolean(packageId);

  const { user, profile, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: caterer, isLoading: catererLoading } = useVendorCaterer(user?.id);
  const catererId = caterer?.id;
  const vendorId = caterer?.vendor_id;

  const { data: bookings = [] } = useCatererBookings(catererId);
  const { data: packages = [], isLoading: packagesLoading } = usePackagesByCaterer(catererId);

  const createPkg = useCreatePackage();
  const updatePkg = useUpdatePackage();

  const existingPkg = useMemo(
    () => (isEdit ? (packages ?? []).find((p) => p.id === packageId) : undefined),
    [isEdit, packages, packageId],
  );

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    min_guests: '10',
    max_guests: '100',
    includes: '',
    imageUrls: '',
    is_active: true,
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isEdit && existingPkg) {
      setForm({
        name: existingPkg.name ?? '',
        description: existingPkg.description ?? '',
        price: String(existingPkg.price ?? ''),
        min_guests: String(existingPkg.min_guests ?? 10),
        max_guests: String(existingPkg.max_guests ?? 100),
        includes: (existingPkg.includes ?? []).join(', '),
        imageUrls: (existingPkg.images ?? []).join('\n'),
        is_active: existingPkg.is_active ?? true,
      });
      setImageFiles([]);
    }
  }, [isEdit, existingPkg]);

  useEffect(() => {
    if (imageFiles.length === 0) {
      setPreviewUrls([]);
      return;
    }
    const urls = imageFiles.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [imageFiles]);

  if (catererLoading) {
    return (
      <div className="portal flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!caterer) return null;
  if (caterer.is_pending) return <Navigate to="/vendor/pending" replace />;

  if (!caterer.is_approved) {
    return (
      <div className="portal flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md rounded-[22px] p-6 text-center">
          <Ban className="mx-auto mb-4 h-12 w-12 text-destructive" strokeWidth={1.5} />
          <CardTitle className="text-lg">Account suspended</CardTitle>
          <CardDescription className="mt-2">
            Your store &quot;{caterer.name}&quot; is currently offline. Please contact admin about your monthly access.
          </CardDescription>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => navigate('/vendor/dashboard?tab=packages')}>
              Back to dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isEdit && !packagesLoading && !existingPkg) {
    return (
      <VendorLayout
        activeTab="packages"
        onTabChange={(tab) => navigate(tab === 'overview' ? '/vendor/dashboard' : `/vendor/dashboard?tab=${tab}`)}
        displayName={profile?.name || caterer.name}
        logoUrl={(caterer as Partial<typeof caterer>).logo_url ?? null}
        notificationCount={(bookings ?? []).filter((b) => b.status === 'pending').length}
        onLogout={() => {
          logout();
          navigate('/');
        }}
        header={null}
      >
        <section className="rounded-[20px] border border-border/70 bg-white">
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <PackageIcon className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <p className="mt-4 text-[15px] font-semibold text-foreground">Package not found</p>
            <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">
              It may have been deleted. Back to your packages to keep working.
            </p>
            <Button className="mt-5 rounded-xl" onClick={() => navigate('/vendor/dashboard?tab=packages')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to packages
            </Button>
          </div>
        </section>
      </VendorLayout>
    );
  }

  const existingImageList = form.imageUrls.split('\n').map((s) => s.trim()).filter(Boolean);
  const isSaving = createPkg.isPending || updatePkg.isPending || uploading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catererId || !vendorId) return;
    if (!form.name.trim() || !form.price.trim()) {
      toast({ title: 'Missing fields', description: 'Name and price are required.', variant: 'destructive' });
      return;
    }
    const price = parseFloat(form.price);
    if (Number.isNaN(price) || price < 0) {
      toast({ title: 'Invalid price', description: 'Please enter a valid price.', variant: 'destructive' });
      return;
    }
    const min_guests = form.min_guests.trim() === '' ? 1 : Number(form.min_guests);
    const max_guests = form.max_guests.trim() === '' ? 100 : Number(form.max_guests);
    if (!Number.isFinite(min_guests) || !Number.isFinite(max_guests) || min_guests < 1 || max_guests < min_guests) {
      toast({ title: 'Invalid guests', description: 'Check min/max guests (min ≥ 1, max ≥ min).', variant: 'destructive' });
      return;
    }

    try {
      setUploading(imageFiles.length > 0);
      const uploaded: string[] = [];
      for (const file of imageFiles) {
        uploaded.push(await uploadPackageImageFile(file, vendorId));
      }
      setUploading(false);

      const images = [...existingImageList, ...uploaded];
      const includes = form.includes.split(',').map((s) => s.trim()).filter(Boolean);

      const payload = {
        caterer_id: catererId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        price,
        min_guests,
        max_guests,
        includes,
        images,
        is_active: form.is_active,
      };

      if (isEdit && existingPkg) {
        await updatePkg.mutateAsync({ id: existingPkg.id, updates: payload });
        toast({ title: 'Package updated', description: `${payload.name} has been updated.` });
      } else {
        await createPkg.mutateAsync(payload);
        toast({ title: 'Package created', description: `${payload.name} is now visible to customers.` });
      }
      navigate('/vendor/dashboard?tab=packages');
    } catch (err) {
      setUploading(false);
      toast({
        title: isEdit ? 'Update failed' : 'Create failed',
        description: err instanceof Error ? err.message : 'Could not save package.',
        variant: 'destructive',
      });
    }
  };

  const pendingCount = (bookings ?? []).filter((b) => b.status === 'pending').length;

  return (
    <VendorLayout
      activeTab="packages"
      onTabChange={(tab) => navigate(tab === 'overview' ? '/vendor/dashboard' : `/vendor/dashboard?tab=${tab}`)}
      displayName={profile?.name || caterer.name}
      logoUrl={(caterer as Partial<typeof caterer>).logo_url ?? null}
      notificationCount={pendingCount}
      onLogout={() => {
        logout();
        navigate('/');
      }}
      header={null}
    >
      <div className="mx-auto w-full max-w-2xl">
        <Button
          variant="ghost"
          className="mb-4 h-9 rounded-xl px-3 text-[13.5px] text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/vendor/dashboard?tab=packages')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to packages
        </Button>

        <div className="mb-6">
          <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
            {isEdit ? 'Edit package' : 'Add package'}
          </h2>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            {isEdit
              ? 'Update this bundle — customers selecting it in a booking will see the new details.'
              : 'Bundle dishes/services into one price customers can select when booking.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <SectionCard title="Package details" description="Name, pricing and guest limits.">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pkg-name">Name *</Label>
                <Input
                  id="pkg-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Premium Wedding Package"
                  className="h-10 rounded-xl border-border/70 bg-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pkg-description">Description</Label>
                <Textarea
                  id="pkg-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Includes staff, setup, etc."
                  rows={3}
                  className="rounded-xl border-border/70 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="pkg-price">Price *</Label>
                  <Input
                    id="pkg-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="500.00"
                    className="h-10 rounded-xl border-border/70 bg-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pkg-min">Min guests</Label>
                  <Input
                    id="pkg-min"
                    type="number"
                    min="1"
                    value={form.min_guests}
                    onChange={(e) => setForm({ ...form, min_guests: e.target.value })}
                    className="h-10 rounded-xl border-border/70 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pkg-max">Max guests</Label>
                  <Input
                    id="pkg-max"
                    type="number"
                    min="1"
                    value={form.max_guests}
                    onChange={(e) => setForm({ ...form, max_guests: e.target.value })}
                    className="h-10 rounded-xl border-border/70 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pkg-includes">Includes (comma-separated)</Label>
                <Input
                  id="pkg-includes"
                  value={form.includes}
                  onChange={(e) => setForm({ ...form, includes: e.target.value })}
                  placeholder="Waitstaff, Decor, Drinks"
                  className="h-10 rounded-xl border-border/70 bg-white"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 px-4 py-3">
                <div>
                  <p className="text-[14px] font-medium text-foreground">Visible to customers</p>
                  <p className="text-xs text-muted-foreground">Hidden packages stay in your dashboard only.</p>
                </div>
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} aria-label="Visible to customers" />
              </div>
            </div>
          </SectionCard>

          <div className="mt-4">
            <SectionCard title="Photos" description="Upload from your device — same as menu photos. First image is the cover.">
              <div className="space-y-4">
                {existingImageList.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {existingImageList.map((url) => (
                      <div key={url} className="relative overflow-hidden rounded-xl border border-border/70">
                        <img src={url} alt="" className="h-24 w-full object-cover" />
                        <button
                          type="button"
                          aria-label="Remove image"
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                          onClick={() =>
                            setForm({
                              ...form,
                              imageUrls: existingImageList.filter((u) => u !== url).join('\n'),
                            })
                          }
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {previewUrls.map((url, i) => (
                      <div key={url} className="relative overflow-hidden rounded-xl border border-primary/40">
                        <img src={url} alt="" className="h-24 w-full object-cover" />
                        <button
                          type="button"
                          aria-label="Remove selected file"
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                          onClick={() => setImageFiles(imageFiles.filter((_, idx) => idx !== i))}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="pkg-images">Upload photos (from device)</Label>
                  <Input
                    id="pkg-images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setImageFiles(Array.from(e.target.files || []).slice(0, 6))}
                    className="rounded-xl border-border/70 bg-white"
                  />
                  {imageFiles.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {imageFiles.map((f) => f.name).join(', ')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pkg-image-urls">Image URLs (one per line, optional)</Label>
                  <Textarea
                    id="pkg-image-urls"
                    value={form.imageUrls}
                    onChange={(e) => setForm({ ...form, imageUrls: e.target.value })}
                    placeholder="https://…"
                    rows={2}
                    className="rounded-xl border-border/70 bg-white"
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => navigate('/vendor/dashboard?tab=packages')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl" disabled={isSaving}>
              {uploading ? 'Uploading…' : isEdit ? 'Save changes' : 'Create package'}
            </Button>
          </div>
        </form>
      </div>
    </VendorLayout>
  );
}

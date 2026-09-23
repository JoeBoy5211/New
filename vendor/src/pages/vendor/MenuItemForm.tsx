import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, Utensils } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useVendorCaterer } from '@/hooks/supabase/useCaterers';
import { useCatererBookings } from '@/hooks/supabase/useBookings';
import {
  useCreateMenuItem,
  useMenuItemsByCaterer,
  useUpdateMenuItem,
} from '@/hooks/supabase/useMenuItems';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';
import { uploadMenuImage } from '@/lib/media';
import { SectionCard, VendorLayout } from '@/components/vendor/portal';

async function uploadMenuImageFile(file: File, vendorId: string): Promise<string> {
  if (isCloudinaryConfigured()) {
    try {
      return await uploadToCloudinary(file, 'catering_app/menu_items');
    } catch (cloudinaryError) {
      // Fall back to Supabase Storage if Cloudinary upload fails
      try {
        return await uploadMenuImage(file, vendorId);
      } catch {
        throw cloudinaryError;
      }
    }
  }
  return uploadMenuImage(file, vendorId);
}

export default function MenuItemForm() {
  const { itemId } = useParams<{ itemId: string }>();
  const isEdit = Boolean(itemId);

  const { user, profile, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: caterer, isLoading: catererLoading } = useVendorCaterer(user?.id);
  const catererId = caterer?.id;
  const vendorId = caterer?.vendor_id;

  const { data: bookings = [] } = useCatererBookings(catererId);
  const { data: menuItems = [], isLoading: menuLoading } = useMenuItemsByCaterer(catererId);

  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();

  const existingItem = useMemo(
    () => (isEdit ? (menuItems ?? []).find((m) => m.id === itemId) : undefined),
    [isEdit, menuItems, itemId],
  );

  const existingCategories = useMemo(
    () => [...new Set((menuItems ?? []).map((m) => m.category).filter(Boolean))] as string[],
    [menuItems],
  );

  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', imageUrl: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Prefill when editing
  useEffect(() => {
    if (isEdit && existingItem) {
      setForm({
        name: existingItem.name ?? '',
        description: existingItem.description ?? '',
        price: String(existingItem.price ?? ''),
        category: existingItem.category ?? '',
        imageUrl: existingItem.image ?? '',
      });
      setImageFile(null);
    }
  }, [isEdit, existingItem]);

  // Local preview for a newly picked file
  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  if (catererLoading) {
    return (
      <div className="portal flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!caterer) return null;

  if (caterer.is_pending) {
    return <Navigate to="/vendor/pending" replace />;
  }

  if (!caterer.is_approved) {
    return (
      <div className="portal flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md rounded-[22px] p-6 text-center">
          <Ban className="mx-auto mb-4 h-12 w-12 text-destructive" strokeWidth={1.5} />
          <CardTitle className="text-lg">Account suspended</CardTitle>
          <CardDescription className="mt-2">
            Your store &quot;{caterer.name}&quot; is currently offline. Please contact admin about your
            monthly access.
          </CardDescription>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => navigate('/vendor/dashboard?tab=menu')}>
              Back to dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isEdit && !menuLoading && !existingItem) {
    return (
      <VendorLayout
        activeTab="menu"
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
              <Utensils className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <p className="mt-4 text-[15px] font-semibold text-foreground">Menu item not found</p>
            <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">
              It may have been deleted. Back to your menu to keep working.
            </p>
            <Button className="mt-5 rounded-xl" onClick={() => navigate('/vendor/dashboard?tab=menu')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to menu
            </Button>
          </div>
        </section>
      </VendorLayout>
    );
  }

  const displayImage = previewUrl || form.imageUrl.trim() || null;
  const isSaving = createItem.isPending || updateItem.isPending || uploading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catererId || !vendorId) return;
    if (!form.name.trim() || !form.price.trim() || !form.category.trim()) {
      toast({ title: 'Missing fields', description: 'Name, price and category are required.', variant: 'destructive' });
      return;
    }
    const price = parseFloat(form.price);
    if (Number.isNaN(price) || price < 0) {
      toast({ title: 'Invalid price', description: 'Please enter a valid price.', variant: 'destructive' });
      return;
    }

    try {
      let imageUrl: string | null = form.imageUrl.trim() || null;
      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadMenuImageFile(imageFile, vendorId);
        setUploading(false);
      }

      if (isEdit && existingItem) {
        await updateItem.mutateAsync({
          id: existingItem.id,
          updates: {
            name: form.name.trim(),
            description: form.description.trim() || null,
            price,
            category: form.category.trim(),
            image: imageUrl,
          },
        });
        toast({ title: 'Menu item updated', description: `${form.name.trim()} has been updated.` });
      } else {
        await createItem.mutateAsync({
          caterer_id: catererId,
          name: form.name.trim(),
          description: form.description.trim() || null,
          price,
          category: form.category.trim(),
          image: imageUrl,
          is_popular: false,
          dietary_info: [],
        });
        toast({ title: 'Menu item added', description: `${form.name.trim()} has been added.` });
      }
      navigate('/vendor/dashboard?tab=menu');
    } catch (err) {
      setUploading(false);
      toast({
        title: isEdit ? 'Update failed' : 'Add failed',
        description: err instanceof Error ? err.message : 'Could not save menu item.',
        variant: 'destructive',
      });
    }
  };

  const pendingCount = (bookings ?? []).filter((b) => b.status === 'pending').length;

  return (
    <VendorLayout
      activeTab="menu"
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
          onClick={() => navigate('/vendor/dashboard?tab=menu')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to menu
        </Button>

        <div className="mb-6">
          <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
            {isEdit ? 'Edit menu item' : 'Add menu item'}
          </h2>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            {isEdit
              ? `Update ${existingItem?.name ?? 'this dish'} — changes go live for customers right away.`
              : 'Add a new dish to your menu — it becomes visible to customers once saved.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <SectionCard
            title="Dish details"
            description="Name, pricing and how it appears to customers."
          >
            <div className="space-y-4">
              {displayImage && (
                <img src={displayImage} alt="" className="h-44 w-full rounded-2xl object-cover" />
              )}

              <div className="space-y-2">
                <Label htmlFor="menu-name">Name *</Label>
                <Input
                  id="menu-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Grilled Salmon"
                  className="h-10 rounded-xl border-border/70 bg-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="menu-description">Description</Label>
                <Textarea
                  id="menu-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the dish..."
                  rows={3}
                  className="rounded-xl border-border/70 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="menu-price">Price *</Label>
                  <Input
                    id="menu-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="25.00"
                    className="h-10 rounded-xl border-border/70 bg-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="menu-category">Category *</Label>
                  <Input
                    id="menu-category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g., Main Course"
                    list="menu-categories"
                    className="h-10 rounded-xl border-border/70 bg-white"
                    required
                  />
                  <datalist id="menu-categories">
                    {existingCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="menu-image">Photo upload (from device)</Label>
                <Input
                  id="menu-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="rounded-xl border-border/70 bg-white"
                />
                {imageFile && (
                  <p className="text-xs text-muted-foreground">Selected: {imageFile.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="menu-image-url">Photo URL (optional if uploading above)</Label>
                <Input
                  id="menu-image-url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://…"
                  className="h-10 rounded-xl border-border/70 bg-white"
                />
              </div>
            </div>
          </SectionCard>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => navigate('/vendor/dashboard?tab=menu')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl" disabled={isSaving}>
              {uploading ? 'Uploading…' : isEdit ? 'Save changes' : 'Add item'}
            </Button>
          </div>
        </form>
      </div>
    </VendorLayout>
  );
}

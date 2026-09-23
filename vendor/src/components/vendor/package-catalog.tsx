import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  MoreVertical,
  Package as PackageIcon,
  Pencil,
  Plus,
  Search,
  SearchX,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useDeletePackage,
  useUpdatePackage,
  type Package,
} from '@/hooks/supabase/usePackages';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/vendor/portal';

function formatPrice(value: number) {
  return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function guestRange(pkg: Package) {
  return `${pkg.min_guests ?? 1}–${pkg.max_guests ?? 100} guests`;
}

/* ------------------------------- HiddenBadge -------------------------------- */

function HiddenBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-inset ring-border">
      <EyeOff className="h-3 w-3" aria-hidden="true" />
      Hidden
    </span>
  );
}

/* ------------------------------ PackageItemImage ----------------------------- */

function PackageItemImage({ pkg }: { pkg: Package }) {
  const cover = (pkg.images ?? [])[0];
  return (
    <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-[136px] sm:w-[136px]">
      {cover ? (
        <img
          src={cover}
          alt={pkg.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-200 ease-out motion-safe:group-hover:scale-[1.02]"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-muted text-muted-foreground">
          <PackageIcon className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
          <span className="text-[11px] font-medium">No photo</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- PackageItemCard ----------------------------- */

function PackageItemCard({
  pkg,
  onEdit,
  onToggleActive,
  onRequestDelete,
}: {
  pkg: Package;
  onEdit: () => void;
  onToggleActive: () => void;
  onRequestDelete: () => void;
}) {
  const active = pkg.is_active ?? true;
  const includes = pkg.includes ?? [];
  const description = pkg.description || (includes.length > 0 ? includes.slice(0, 3).join(' · ') : null);

  return (
    <article
      aria-label={pkg.name}
      className="group relative flex flex-col rounded-[20px] border border-border/70 bg-white p-4 transition-[border-color,box-shadow,transform] duration-200 ease-out motion-safe:hover:-translate-y-0.5 hover:border-border hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.15)]"
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <PackageItemImage pkg={pkg} />

        <div className="flex min-w-0 flex-1 flex-col pr-8 sm:pr-10">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="min-w-0 flex-1 truncate text-[16px] font-semibold tracking-tight text-foreground">
              {pkg.name}
            </h3>
            {!active && <HiddenBadge />}
          </div>

          {description && (
            <p className="mt-1 line-clamp-2 text-[13.5px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}

          <p className="mt-1.5 text-[12.5px] font-medium text-muted-foreground">
            {guestRange(pkg)}
            {includes.length > 0 && pkg.description
              ? ` · ${includes.length} inclusion${includes.length === 1 ? '' : 's'}`
              : ''}
          </p>

          <div className="mt-auto flex items-center justify-between pt-3">
            <p className="text-[17px] font-semibold tracking-tight text-primary">
              {formatPrice(Number(pkg.price))}
            </p>
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${pkg.name}`}
            className="absolute right-3 top-3 h-9 w-9 rounded-xl text-muted-foreground opacity-60 transition-all duration-200 hover:bg-muted hover:text-foreground hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-52 rounded-xl border-border/70 bg-white p-1.5 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.18)]"
        >
          <DropdownMenuItem
            onClick={onEdit}
            className="cursor-pointer rounded-lg px-3 py-2 text-[13.5px] font-medium focus:bg-muted"
          >
            <Pencil className="mr-2.5 h-4 w-4 text-muted-foreground" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onToggleActive}
            className="cursor-pointer rounded-lg px-3 py-2 text-[13.5px] font-medium focus:bg-muted"
          >
            {active ? (
              <>
                <EyeOff className="mr-2.5 h-4 w-4 text-muted-foreground" />
                Hide from customers
              </>
            ) : (
              <>
                <Eye className="mr-2.5 h-4 w-4 text-muted-foreground" />
                Make visible
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="mx-1 my-1.5 bg-border/70" />
          <DropdownMenuItem
            onClick={onRequestDelete}
            className="cursor-pointer rounded-lg px-3 py-2 text-[13.5px] font-medium text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <Trash2 className="mr-2.5 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  );
}

/* ---------------------------- PackageCardSkeleton ---------------------------- */

function PackageCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-4 rounded-[20px] border border-border/70 bg-white p-4 sm:flex-row"
    >
      <Skeleton className="h-44 w-full shrink-0 rounded-2xl sm:h-[136px] sm:w-[136px]" />
      <div className="min-w-0 flex-1 space-y-2.5 py-1">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3 w-1/4" />
        <div className="pt-2">
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- PackagesTab ------------------------------- */

export function PackagesTab({ packages, isLoading }: { packages: Package[]; isLoading: boolean }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const deletePkg = useDeletePackage();
  const updatePkg = useUpdatePackage();
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Package | null>(null);

  const visiblePackages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return packages;
    return packages.filter(
      (pkg) =>
        pkg.name.toLowerCase().includes(q) ||
        (pkg.description ?? '').toLowerCase().includes(q) ||
        (pkg.includes ?? []).join(' ').toLowerCase().includes(q),
    );
  }, [packages, search]);

  const toggleActive = async (pkg: Package) => {
    try {
      await updatePkg.mutateAsync({ id: pkg.id, updates: { is_active: !(pkg.is_active ?? true) } });
      toast({
        title: (pkg.is_active ?? true) ? 'Package hidden' : 'Package visible',
        description: `${pkg.name} ${
          pkg.is_active ? 'is now hidden from customers.' : 'is now visible to customers.'
        }`,
      });
    } catch (e) {
      toast({
        title: 'Update failed',
        description: e instanceof Error ? e.message : 'Could not update.',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deletePkg.mutateAsync(pendingDelete.id);
      toast({ title: 'Package removed' });
      setPendingDelete(null);
    } catch (e) {
      toast({
        title: 'Delete failed',
        description: e instanceof Error ? e.message : 'Could not delete.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[26px] font-semibold tracking-tight text-foreground sm:text-[28px]">
            Packages
          </h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Bundles customers can select when requesting a booking.
          </p>
        </div>
        <Button
          className="h-11 shrink-0 rounded-xl px-5 text-[14px] font-semibold shadow-sm transition-all duration-150 hover:bg-primary/90 active:scale-[0.98]"
          onClick={() => navigate('/vendor/packages/new')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add package
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <PackageCardSkeleton key={i} />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <section className="rounded-[20px] border border-border/70 bg-white">
          <EmptyState
            icon={PackageIcon}
            title="No packages yet"
            description="Create your first bundle so customers can book a complete package."
            action={
              <Button
                className="h-11 rounded-xl px-5 text-[14px] font-semibold"
                onClick={() => navigate('/vendor/packages/new')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add package
              </Button>
            }
          />
        </section>
      ) : (
        <>
          {/* Toolbar */}
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search packages"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search packages"
                className="h-10 rounded-xl border-border/70 bg-white pl-9 text-[13.5px]"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13.5px] font-semibold text-foreground">Your packages</p>
            <p aria-live="polite" className="text-[13px] text-muted-foreground">
              {visiblePackages.length} package{visiblePackages.length === 1 ? '' : 's'}
            </p>
          </div>

          {/* Cards */}
          {visiblePackages.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {visiblePackages.map((pkg) => (
                <PackageItemCard
                  key={pkg.id}
                  pkg={pkg}
                  onEdit={() => navigate(`/vendor/packages/${pkg.id}/edit`)}
                  onToggleActive={() => toggleActive(pkg)}
                  onRequestDelete={() => setPendingDelete(pkg)}
                />
              ))}
            </div>
          ) : (
            <section className="rounded-[20px] border border-border/70 bg-white">
              <EmptyState
                icon={SearchX}
                title="No packages found"
                description={`Nothing matches “${search.trim()}”. Try a different search.`}
                action={
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setSearch('')}>
                    Clear search
                  </Button>
                }
              />
            </section>
          )}
        </>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent className="max-w-sm rounded-[20px] border-border/70 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px] font-semibold">
              Delete package?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13.5px]">
              Are you sure you want to delete “{pendingDelete?.name}”? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex-row justify-end gap-2">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deletePkg.isPending}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePkg.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MoreVertical,
  Pencil,
  Plus,
  Search,
  SearchX,
  Star,
  Trash2,
  Utensils,
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
  useDeleteMenuItem,
  useUpdateMenuItem,
  type MenuItem,
} from '@/hooks/supabase/useMenuItems';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/vendor/portal';
import { cn } from '@/lib/utils';

function formatPrice(value: number) {
  return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

/* ------------------------------- PopularBadge ------------------------------ */

function PopularBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
      <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden="true" />
      Popular
    </span>
  );
}

/* ------------------------------- MenuItemImage ------------------------------ */

function MenuItemImage({ item }: { item: MenuItem }) {
  return (
    <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-[136px] sm:w-[136px]">
      {item.image ? (
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-200 ease-out motion-safe:group-hover:scale-[1.02]"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-muted text-muted-foreground">
          <Utensils className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
          <span className="text-[11px] font-medium">No photo</span>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- MenuItemCard ------------------------------ */

function MenuItemCard({
  item,
  onEdit,
  onTogglePopular,
  onRequestDelete,
}: {
  item: MenuItem;
  onEdit: () => void;
  onTogglePopular: () => void;
  onRequestDelete: () => void;
}) {
  return (
    <article
      aria-label={item.name}
      className="group relative flex flex-col rounded-[20px] border border-border/70 bg-white p-4 transition-[border-color,box-shadow,transform] duration-200 ease-out motion-safe:hover:-translate-y-0.5 hover:border-border hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.15)]"
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <MenuItemImage item={item} />

        <div className="flex min-w-0 flex-1 flex-col pr-8 sm:pr-10">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="min-w-0 flex-1 truncate text-[16px] font-semibold tracking-tight text-foreground">
              {item.name}
            </h3>
            {item.is_popular && <PopularBadge />}
          </div>

          {item.description && (
            <p className="mt-1 line-clamp-2 text-[13.5px] leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          )}

          <p className="mt-1.5 text-[12.5px] font-medium text-muted-foreground">
            {item.category || 'Uncategorized'}
          </p>

          <div className="mt-auto flex items-center justify-between pt-3">
            <p className="text-[17px] font-semibold tracking-tight text-primary">
              {formatPrice(item.price)}
            </p>
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${item.name}`}
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
            onClick={onTogglePopular}
            className="cursor-pointer rounded-lg px-3 py-2 text-[13.5px] font-medium focus:bg-muted"
          >
            <Star className="mr-2.5 h-4 w-4 text-muted-foreground" />
            {item.is_popular ? 'Remove from popular' : 'Make popular'}
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

/* ------------------------------ MenuCardSkeleton ----------------------------- */

function MenuCardSkeleton() {
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

/* ---------------------------------- MenuTab --------------------------------- */

export function MenuTab({ menuItems, isLoading }: { menuItems: MenuItem[]; isLoading: boolean }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const deleteItem = useDeleteMenuItem();
  const updateItem = useUpdateMenuItem();
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<MenuItem | null>(null);

  const categories = useMemo(
    () => ['All', ...new Set(menuItems.map((item) => item.category || 'Uncategorized'))],
    [menuItems],
  );

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menuItems.filter((item) => {
      const matchesCategory =
        categoryFilter === 'All' || (item.category || 'Uncategorized') === categoryFilter;
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.description ?? '').toLowerCase().includes(q) ||
        (item.category ?? '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, categoryFilter, search]);

  const togglePopular = async (item: MenuItem) => {
    try {
      await updateItem.mutateAsync({ id: item.id, updates: { is_popular: !item.is_popular } });
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
      await deleteItem.mutateAsync(pendingDelete.id);
      toast({ title: 'Menu item removed' });
      setPendingDelete(null);
    } catch (e) {
      toast({
        title: 'Delete failed',
        description: e instanceof Error ? e.message : 'Could not delete.',
        variant: 'destructive',
      });
    }
  };

  const clearFilters = () => {
    setCategoryFilter('All');
    setSearch('');
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[26px] font-semibold tracking-tight text-foreground sm:text-[28px]">
            Menu
          </h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Your catering offerings, visible to customers once you&apos;re live.
          </p>
        </div>
        <Button
          className="h-11 shrink-0 rounded-xl px-5 text-[14px] font-semibold shadow-sm transition-all duration-150 hover:bg-primary/90 active:scale-[0.98]"
          onClick={() => navigate('/vendor/menu/new')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add item
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <MenuCardSkeleton key={i} />
          ))}
        </div>
      ) : menuItems.length === 0 ? (
        <section className="rounded-[20px] border border-border/70 bg-white">
          <EmptyState
            icon={Utensils}
            title="Your menu is empty"
            description="Add your first catering offering to start building your menu."
            action={
              <Button
                className="h-11 rounded-xl px-5 text-[14px] font-semibold"
                onClick={() => navigate('/vendor/menu/new')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add item
              </Button>
            }
          />
        </section>
      ) : (
        <>
          {/* Filters */}
          <div className="mb-7 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div
              role="group"
              aria-label="Filter by category"
              className="flex flex-wrap gap-1.5"
            >
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  aria-pressed={categoryFilter === c}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    categoryFilter === c
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-white text-muted-foreground ring-1 ring-inset ring-border/70 hover:text-foreground hover:ring-border',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="relative w-full lg:max-w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search menu"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search menu"
                className="h-10 rounded-xl border-border/70 bg-white pl-9 text-[13.5px]"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13.5px] font-semibold text-foreground">
              {categoryFilter === 'All' ? 'Your menu' : categoryFilter}
            </p>
            <p aria-live="polite" className="text-[13px] text-muted-foreground">
              {visibleItems.length} item{visibleItems.length === 1 ? '' : 's'}
            </p>
          </div>

          {/* Cards */}
          {visibleItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {visibleItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => navigate(`/vendor/menu/${item.id}/edit`)}
                  onTogglePopular={() => togglePopular(item)}
                  onRequestDelete={() => setPendingDelete(item)}
                />
              ))}
            </div>
          ) : (
            <section className="rounded-[20px] border border-border/70 bg-white">
              <EmptyState
                icon={SearchX}
                title="No items found"
                description={
                  search.trim()
                    ? `Nothing matches “${search.trim()}”. Try a different search or category.`
                    : 'Nothing in this category yet. Try another category.'
                }
                action={
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={clearFilters}>
                    Clear filters
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
              Delete menu item?
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
              disabled={deleteItem.isPending}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteItem.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

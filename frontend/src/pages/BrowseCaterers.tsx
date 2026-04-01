import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { MainLayout } from '@/components/layout/MainLayout';
import { CatererCard } from '@/components/CatererCard';
import { useCaterers } from '@/hooks/useCaterers';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Maps DB price_range enum value to display label
const PRICE_RANGE_OPTIONS = [
  { value: '$', label: 'Budget Friendly', subtitle: 'ETB 100–200 per guest' },
  { value: '$$', label: 'Moderate', subtitle: 'ETB 300–600 per guest' },
  { value: '$$$', label: 'Premium', subtitle: 'ETB 600–900 per guest' },
  { value: '$$$$', label: 'Luxury', subtitle: 'ETB 1,000+ per guest' },
];

export function getPriceRangeLabel(value: string): string {
  return PRICE_RANGE_OPTIONS.find(o => o.value === value)?.label ?? value;
}

export default function BrowseCaterers() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const { caterers: allCaterers, isLoading } = useCaterers();


  const cuisineCategories = useMemo(() => {
    const cuisines = new Set<string>();
    allCaterers.forEach(c => {
      if (Array.isArray(c.cuisines)) {
        c.cuisines.forEach(cuisine => cuisines.add(cuisine));
      } else if (typeof c.cuisines === 'string') {
        (c.cuisines as string).split(',').forEach(cuisine => cuisines.add(cuisine.trim()));
      }
    });
    return Array.from(cuisines).sort();
  }, [allCaterers]);

  const eventTypes = useMemo(() => {
    const types = new Set<string>();
    allCaterers.forEach(c => {
      const et = c.eventTypes;
      if (Array.isArray(et)) {
        et.forEach(t => types.add(t));
      } else if (typeof et === 'string') {
        (et as string).split(',').forEach(t => types.add(t.trim()));
      }
    });
    return Array.from(types).sort();
  }, [allCaterers]);

  const filteredCaterers = useMemo(() => {
    let result = [...allCaterers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.location.toLowerCase().includes(query) ||
          (Array.isArray(c.cuisines) ? c.cuisines.some((cuisine) => cuisine.toLowerCase().includes(query)) : (c.cuisines as string).toLowerCase().includes(query)) ||
          (Array.isArray(c.eventTypes) ? c.eventTypes.some((event) => event.toLowerCase().includes(query)) : (c.eventTypes as string).toLowerCase().includes(query))
      );
    }

    // Cuisine filter
    if (selectedCuisines.length > 0) {
      result = result.filter((c) => {
        const cuisines = Array.isArray(c.cuisines) ? c.cuisines : (c.cuisines as string).split(',').map(s => s.trim());
        return cuisines.some((cuisine) => selectedCuisines.includes(cuisine));
      });
    }

    // Event type filter
    if (selectedEventTypes.length > 0) {
      result = result.filter((c) => {
        const types = Array.isArray(c.eventTypes) ? c.eventTypes : (c.eventTypes as string).split(',').map(s => s.trim());
        return types.some((event) => selectedEventTypes.includes(event));
      });
    }

    // Price range filter
    if (priceRange !== 'all') {
      result = result.filter((c) => c.priceRange === priceRange);
    }

    // Sorting
    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [allCaterers, searchQuery, selectedCuisines, selectedEventTypes, priceRange, sortBy]);

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const toggleEventType = (event: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  const clearFilters = () => {
    setSelectedCuisines([]);
    setSelectedEventTypes([]);
    setPriceRange('all');
    setSearchQuery('');
  };

  const activeFilterCount =
    selectedCuisines.length +
    selectedEventTypes.length +
    (priceRange !== 'all' ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Cuisines */}
      <div>
        <h4 className="mb-3 font-semibold">Cuisine Type</h4>
        <div className="space-y-2">
          {cuisineCategories.map((cuisine) => (
            <label
              key={cuisine}
              className="flex cursor-pointer items-center gap-2"
            >
              <Checkbox
                checked={selectedCuisines.includes(cuisine)}
                onCheckedChange={() => toggleCuisine(cuisine)}
              />
              <span className="text-sm">{cuisine}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Event Types */}
      <div>
        <h4 className="mb-3 font-semibold">Event Type</h4>
        <div className="space-y-2">
          {eventTypes.slice(0, 6).map((event) => (
            <label
              key={event}
              className="flex cursor-pointer items-center gap-2"
            >
              <Checkbox
                checked={selectedEventTypes.includes(event)}
                onCheckedChange={() => toggleEventType(event)}
              />
              <span className="text-sm">{event}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="mb-3 font-semibold">Price Range</h4>
        <Select value={priceRange} onValueChange={setPriceRange}>
          <SelectTrigger>
            <SelectValue placeholder="All prices" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Prices</SelectItem>
            {PRICE_RANGE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="font-medium">{opt.label}</span>
                <span className="ml-2 text-xs text-muted-foreground">{opt.subtitle}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeFilterCount > 0 && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold md:text-4xl">
            Browse Caterers
          </h1>
          <p className="mt-2 text-muted-foreground">
            Discover premium catering services for your next event
          </p>
        </div>

        {/* Search and Filters Bar */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search caterers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="reviews">Most Reviews</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile Filter Button */}
          <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-2" variant="secondary">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {selectedCuisines.map((cuisine) => (
              <Badge
                key={cuisine}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => toggleCuisine(cuisine)}
              >
                {cuisine}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
            {selectedEventTypes.map((event) => (
              <Badge
                key={event}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => toggleEventType(event)}
              >
                {event}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
            {priceRange !== 'all' && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setPriceRange('all')}
              >
                {getPriceRangeLabel(priceRange)}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden w-64 shrink-0 md:block">
            <div className="sticky top-24 rounded-lg border bg-card p-6">
              <h3 className="mb-4 font-display text-lg font-semibold">Filters</h3>
              <FilterContent />
            </div>
          </aside>

          {/* Caterer Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <LoadingSpinner size={40} text="Loading caterers..." />
              </div>
            ) : filteredCaterers.length === 0 ? (
              <div className="rounded-lg border bg-muted/50 py-16 text-center">
                <p className="text-lg font-medium">No caterers found</p>
                <p className="mt-2 text-muted-foreground">
                  Try adjusting your filters or search query
                </p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  Showing {filteredCaterers.length} caterer
                  {filteredCaterers.length !== 1 ? 's' : ''}
                </p>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCaterers.map((caterer) => (
                    <CatererCard key={caterer.id} caterer={caterer} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

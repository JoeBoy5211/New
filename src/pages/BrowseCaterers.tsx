import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Loader2 } from 'lucide-react';
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
import { useApprovedCaterers } from '@/hooks/useCaterers';
import { useCuisineCategories, useEventTypes } from '@/hooks/useCategories';

export default function BrowseCaterers() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Fetch data from database
  const { data: allCaterers = [], isLoading: caterersLoading } = useApprovedCaterers();
  const { data: cuisineCategories = [] } = useCuisineCategories();
  const { data: eventTypes = [] } = useEventTypes();

  const filteredCaterers = useMemo(() => {
    let result = [...allCaterers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.description?.toLowerCase().includes(query)) ||
          (c.location?.toLowerCase().includes(query)) ||
          c.cuisines.some((cuisine) => cuisine.toLowerCase().includes(query)) ||
          c.event_types.some((event) => event.toLowerCase().includes(query))
      );
    }

    // Cuisine filter
    if (selectedCuisines.length > 0) {
      result = result.filter((c) =>
        c.cuisines.some((cuisine) => selectedCuisines.includes(cuisine))
      );
    }

    // Event type filter
    if (selectedEventTypes.length > 0) {
      result = result.filter((c) =>
        c.event_types.some((event) => selectedEventTypes.includes(event))
      );
    }

    // Price range filter
    if (priceRange !== 'all') {
      result = result.filter((c) => c.price_range === priceRange);
    }

    // Sorting
    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        result.sort((a, b) => b.review_count - a.review_count);
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
          {cuisineCategories.map((category) => (
            <label
              key={category.id}
              className="flex cursor-pointer items-center gap-2"
            >
              <Checkbox
                checked={selectedCuisines.includes(category.name)}
                onCheckedChange={() => toggleCuisine(category.name)}
              />
              <span className="text-sm">{category.name}</span>
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
              key={event.id}
              className="flex cursor-pointer items-center gap-2"
            >
              <Checkbox
                checked={selectedEventTypes.includes(event.name)}
                onCheckedChange={() => toggleEventType(event.name)}
              />
              <span className="text-sm">{event.name}</span>
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
            <SelectItem value="$">$ - Budget Friendly</SelectItem>
            <SelectItem value="$$">$$ - Moderate</SelectItem>
            <SelectItem value="$$$">$$$ - Premium</SelectItem>
            <SelectItem value="$$$$">$$$$ - Luxury</SelectItem>
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
                {priceRange}
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
            {caterersLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

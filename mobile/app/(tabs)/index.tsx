import React, { useCallback, useRef, useState, memo } from 'react';
import {
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  TextInput,
  Platform,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  View,
  Text,
} from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/api/client';
import { Search, MapPin, Star, SlidersHorizontal, Check, Users, ChefHat } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BRAND, LIGHT, DARK, RADIUS, SPACING, TYPOGRAPHY, SHADOW } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { TouchableOpacity } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

const PRICE_LABELS: Record<string, string> = {
  '$': 'Budget',
  '$$': 'Moderate',
  '$$$': 'Premium',
  '$$$$': 'Luxury',
};

// Normalize location names to handle casing inconsistencies and common typos
const normalizeLocation = (location: string): string => {
  if (!location) return '';
  
  return location
    .trim()
    .toLowerCase()
    // Fix common misspellings
    .replace(/\baddis abeba\b/g, 'addis ababa')
    .replace(/\badis ababa\b/g, 'addis ababa')
    .replace(/\baddis abeba\b/g, 'addis ababa')
    // Convert to title case
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const MOCK_CATERERS = [
  {
    id: 'c1',
    name: 'Silver Spoon Events',
    description: 'Gourmet Italian & French Fusion',
    location: 'San Francisco',
    ratingValue: 4.7,
    reviewCount: 120,
    min_price: 250,
    min_guests: 20,
    max_guests: 200,
    cover_image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    cuisines: ['Italian', 'French'],
  },
  {
    id: 'c2',
    name: 'Rustic Roots BBQ',
    description: 'Premium Smoked Meats',
    location: 'Oakland',
    ratingValue: 4.9,
    reviewCount: 84,
    min_price: 150,
    min_guests: 10,
    max_guests: 500,
    cover_image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800',
    cuisines: ['BBQ', 'American'],
  },
  {
    id: 'c3',
    name: 'Lumière Catering',
    description: 'Modern French Fine Dining',
    location: 'San Francisco',
    ratingValue: 4.8,
    reviewCount: 56,
    min_price: 320,
    min_guests: 30,
    max_guests: 150,
    cover_image: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=800',
    cuisines: ['French'],
  },
];

const RATING_OPTIONS = [
  { label: 'Any', value: 0 },
  { label: '4.0+', value: 4.0 },
  { label: '4.5+', value: 4.5 },
  { label: '4.8+', value: 4.8 },
];
const EXPERIENCE_OPTIONS = [
  { label: 'Any', min: 0, max: Infinity },
  { label: '1–2 yrs', min: 1, max: 2 },
  { label: '3–5 yrs', min: 3, max: 5 },
  { label: '6–10 yrs', min: 6, max: 10 },
  { label: '10+ yrs', min: 10, max: Infinity },
];
const PRICE_BANDS = [
  { label: 'Any', min: 0, max: Infinity },
  { label: 'ETB 100–300', min: 100, max: 300 },
  { label: 'ETB 300–600', min: 301, max: 600 },
  { label: 'ETB 600–900', min: 601, max: 900 },
  { label: 'ETB 900+', min: 901, max: Infinity },
];
const GUEST_OPTIONS = [
  { label: 'Any', min: 0, max: Infinity },
  { label: '50–100', min: 50, max: 100 },
  { label: '100–200', min: 100, max: 200 },
  { label: '200–400', min: 200, max: 400 },
  { label: '400–500', min: 400, max: 500 },
  { label: '500+', min: 500, max: Infinity },
];

const resolveImageUrl = (path?: string) => {
  if (!path) return 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800';
  if (path.startsWith('http')) return path;
  const baseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:3000';
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

// ── Filter Pill ───────────────────────────────────────────────────────────────
const FilterPill = memo(function FilterPill({
  label,
  active,
  onPress,
  tint,
  isDark,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  tint: string;
  isDark: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.filterSheetPill,
        active
          ? { backgroundColor: tint }
          : { backgroundColor: isDark ? '#2A2825' : '#F0EEEA' },
      ]}
    >
      {active && <Check size={11} color="#fff" />}
      <Text style={[styles.filterSheetPillText, { color: active ? '#fff' : isDark ? '#ccc' : '#555' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

// ── Filter Sheet ──────────────────────────────────────────────────────────────
const FilterSheetContent = memo(({
  initialFilters, allCuisines, onApply, tint, text, subtle, isDark,
}: any) => {
  const [c, setC] = useState<string[]>(initialFilters.cuisines);
  const [r, setR] = useState(initialFilters.rating);
  const [e, setE] = useState(initialFilters.experience);
  const [p, setP] = useState(initialFilters.price);
  const [g, setG] = useState(initialFilters.guests);

  const clearFilter = () => {
    setC([]); setR(0); setE(EXPERIENCE_OPTIONS[0]); setP(PRICE_BANDS[0]); setG(GUEST_OPTIONS[0]);
  };

  const applyFilter = () => {
    onApply({ cuisines: c, rating: r, experience: e, price: p, guests: g });
  };

  return (
    <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
      <View style={[styles.sheetHeader, { backgroundColor: 'transparent' }]}>
        <Text style={[styles.sheetTitle, { color: text }]}>Filter Caterers</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={clearFilter}>
          <Text style={[styles.sheetClear, { color: tint }]}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sheetSectionLabel, { color: subtle }]}>CUISINE TYPE</Text>
      <View style={[styles.pillWrap, { backgroundColor: 'transparent' }]}>
        {allCuisines.map((cuisine: string) => {
          const active = c.includes(cuisine);
          return (
            <FilterPill
              key={cuisine}
              label={cuisine}
              active={active}
              onPress={() => setC(prev => active ? prev.filter(item => item !== cuisine) : [...prev, cuisine])}
              tint={tint}
              isDark={isDark}
            />
          );
        })}
      </View>

      <Text style={[styles.sheetSectionLabel, { color: subtle }]}>MINIMUM RATING</Text>
      <View style={[styles.pillWrap, { backgroundColor: 'transparent' }]}>
        {RATING_OPTIONS.map(opt => (
          <FilterPill key={opt.label} label={opt.label} active={r === opt.value}
            onPress={() => setR(opt.value)} tint={tint} isDark={isDark} />
        ))}
      </View>

      <Text style={[styles.sheetSectionLabel, { color: subtle }]}>YEARS OF EXPERIENCE</Text>
      <View style={[styles.pillWrap, { backgroundColor: 'transparent' }]}>
        {EXPERIENCE_OPTIONS.map(opt => (
          <FilterPill key={opt.label} label={opt.label} active={e.label === opt.label}
            onPress={() => setE(opt)} tint={tint} isDark={isDark} />
        ))}
      </View>

      <Text style={[styles.sheetSectionLabel, { color: subtle }]}>PRICE PER PERSON (ETB)</Text>
      <View style={[styles.pillWrap, { backgroundColor: 'transparent' }]}>
        {PRICE_BANDS.map(opt => (
          <FilterPill key={opt.label} label={opt.label} active={p.label === opt.label}
            onPress={() => setP(opt)} tint={tint} isDark={isDark} />
        ))}
      </View>

      <Text style={[styles.sheetSectionLabel, { color: subtle }]}>GUEST COUNT</Text>
      <View style={[styles.pillWrap, { backgroundColor: 'transparent' }]}>
        {GUEST_OPTIONS.map(opt => (
          <FilterPill key={opt.label} label={opt.label} active={g.label === opt.label}
            onPress={() => setG(opt)} tint={tint} isDark={isDark} />
        ))}
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.applyBtn, { backgroundColor: tint }]}
        onPress={applyFilter}
      >
        <Text style={styles.applyBtnText}>Apply Filters</Text>
      </TouchableOpacity>
    </BottomSheetScrollView>
  );
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bg = isDark ? '#0F0E0D' : LIGHT.background;
  const card = isDark ? DARK.card : LIGHT.card;
  const text = isDark ? DARK.text : LIGHT.text;
  const subtle = isDark ? DARK.textSecondary : LIGHT.textSecondary;
  const tint = isDark ? DARK.tint : LIGHT.tint;
  const border = isDark ? DARK.border : LIGHT.border;

  const [selectedLocation, setSelectedLocation] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCuisines, setFilterCuisines] = useState<string[]>([]);
  const [filterRating, setFilterRating] = useState(0);
  const [filterExperience, setFilterExperience] = useState(EXPERIENCE_OPTIONS[0]);
  const [filterPrice, setFilterPrice] = useState(PRICE_BANDS[0]);
  const [filterGuests, setFilterGuests] = useState(GUEST_OPTIONS[0]);
  const [sheetKey, setSheetKey] = useState(0);

  const filterSheetRef = useRef<BottomSheet>(null);

  const openFilter = () => {
    setSheetKey(prev => prev + 1);
    filterSheetRef.current?.expand();
  };

  const clearCommittedFilters = () => {
    setFilterCuisines([]);
    setFilterRating(0);
    setFilterExperience(EXPERIENCE_OPTIONS[0]);
    setFilterPrice(PRICE_BANDS[0]);
    setFilterGuests(GUEST_OPTIONS[0]);
  };

  const handleApplyFilter = useCallback((filters: any) => {
    setFilterCuisines(filters.cuisines);
    setFilterRating(filters.rating);
    setFilterExperience(filters.experience);
    setFilterPrice(filters.price);
    setFilterGuests(filters.guests);
    filterSheetRef.current?.close();
  }, []);

  const activeFilterCount = [
    filterCuisines.length > 0,
    filterRating > 0,
    filterExperience.label !== 'Any',
    filterPrice.label !== 'Any',
    filterGuests.label !== 'Any',
  ].filter(Boolean).length;

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  );

  const { data: apiCaterers, isLoading } = useQuery({
    queryKey: ['caterers'],
    queryFn: async () => {
      const response = await api.get('/caterers');
      return response.data.data as any[];
    },
    retry: 1,
  });

  const allCaterers: any[] = apiCaterers && apiCaterers.length > 0 ? apiCaterers : MOCK_CATERERS;
  // Extract unique normalized locations for the filter dropdown
  const locations = ['All', ...Array.from(new Set(
    allCaterers
      .map(c => normalizeLocation(c.location))
      .filter(Boolean)
  ))];
  const allCuisines = Array.from(
    new Set(allCaterers.flatMap(c =>
      Array.isArray(c.cuisines) ? c.cuisines : typeof c.cuisines === 'string' ? c.cuisines.split(',') : []
    ))
  ).filter(Boolean) as string[];

  const topRated = [...allCaterers]
    .sort((a, b) => Number(b.ratingValue || 0) - Number(a.ratingValue || 0))
    .slice(0, 4);

  const filtered = allCaterers.filter(c => {
    const cuisinesList: string[] = Array.isArray(c.cuisines)
      ? c.cuisines
      : typeof c.cuisines === 'string' ? c.cuisines.split(',') : [];
    const matchSearch = !searchQuery.trim() ||
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cuisinesList.join(' ').toLowerCase().includes(searchQuery.toLowerCase());
    const matchLocation = selectedLocation === 'All' || normalizeLocation(c.location) === selectedLocation;
    const matchCuisine = filterCuisines.length === 0 || filterCuisines.some(fc => cuisinesList.includes(fc));
    const matchRating = filterRating === 0 || Number(c.ratingValue || 0) >= filterRating;
    const yrs = Number(c.years_in_business || 0);
    const matchExperience = filterExperience.label === 'Any' || (yrs >= filterExperience.min && yrs <= filterExperience.max);
    const price = Number(c.min_price || 0);
    const matchPrice = filterPrice.label === 'Any' || (price >= filterPrice.min && price <= filterPrice.max);
    const guestCount = Number(c.min_guests || 0);
    const matchGuests = filterGuests.label === 'Any' || (guestCount >= filterGuests.min && guestCount <= filterGuests.max);
    return matchSearch && matchLocation && matchCuisine && matchRating && matchExperience && matchPrice && matchGuests;
  });

  const firstName = user?.name?.split(' ')[0] || '';

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── PREMIUM HEADER ── */}
        <View style={styles.headerHero}>
          {/* Burgundy gradient background */}
          <View style={[StyleSheet.absoluteFillObject, styles.heroGradient]} />
          {/* Decorative circles */}
          <View style={styles.heroDecorCircle1} />
          <View style={styles.heroDecorCircle2} />

          <View style={styles.headerTopRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.greetingChip}>
                <ChefHat size={12} color={BRAND.gold} />
                <Text style={styles.greetingChipText}>
                  {user ? `Good ${getGreeting()}, ${firstName}` : 'Welcome to CaterConnect'}
                </Text>
              </View>
              <Text style={styles.heroHeading}>Find Your</Text>
              <Text style={[styles.heroHeadingAccent]}>Perfect Caterer</Text>
            </View>

            {/* Filter Button */}
            <Pressable
              style={[styles.filterBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
              onPress={openFilter}
            >
              <SlidersHorizontal size={20} color="#FFF" />
              {activeFilterCount > 0 && (
                <View style={[styles.filterBadge, { backgroundColor: BRAND.gold }]}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Search bar — floats at bottom of hero */}
          <View style={[styles.searchBar, { backgroundColor: card }]}>
            <Search size={18} color={subtle} />
            <TextInput
              placeholder="Search caterers, cuisine, location..."
              style={[styles.searchInput, { color: text }]}
              placeholderTextColor={subtle}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* ── LOCATION PILLS ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
          style={styles.pillScroll}
        >
          {locations.map(loc => {
            const isActive = selectedLocation === loc;
            return (
              <Pressable
                key={loc}
                onPress={() => setSelectedLocation(loc)}
                style={[
                  styles.locationPill,
                  isActive
                    ? { backgroundColor: tint }
                    : { backgroundColor: card, borderWidth: 1, borderColor: border },
                ]}
              >
                {!isActive && loc !== 'All' && (
                  <MapPin size={11} color={isDark ? '#aaa' : '#888'} style={{ marginRight: 3 }} />
                )}
                <Text style={[styles.locationPillText, { color: isActive ? '#FFF' : isDark ? '#ccc' : '#555' }]}>
                  {loc}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── TOP RATED SECTION ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <View>
              <Text style={[styles.sectionLabel, { color: tint }]}>⭐ FEATURED</Text>
              <Text style={[styles.sectionTitle, { color: text }]}>Top Rated</Text>
            </View>
            <Pressable>
              <Text style={[styles.seeAll, { color: tint }]}>See All →</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={tint} />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: SPACING.md, gap: 14 }}
            >
              {topRated.map(item => (
                <TouchableOpacity
                  activeOpacity={0.92}
                  key={item.id}
                  style={styles.topRatedCard}
                  onPress={() => router.push(`/caterer/${item.id}`)}
                >
                  <Image
                    source={{ uri: resolveImageUrl(item.cover_image) }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                  />
                  {/* Gradient overlay */}
                  <View style={styles.topRatedOverlay} />

                  {/* Content */}
                  <View style={styles.topRatedContent}>
                    {/* Top row: rating + price */}
                    <View style={styles.topRatedTopRow}>
                      <View style={styles.ratingBadge}>
                        <Star size={10} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.ratingBadgeText}>{Number(item.ratingValue || 0).toFixed(1)}</Text>
                      </View>
                      <View style={[styles.priceBadge, { backgroundColor: BRAND.gold }]}>
                        <Text style={styles.priceBadgeText}>
                          {PRICE_LABELS[item.price_range] || 'Moderate'}
                        </Text>
                      </View>
                    </View>

                    {/* Name */}
                    <Text style={styles.topRatedName} numberOfLines={1}>{item.name}</Text>

                    {/* Cuisine tags */}
                    <View style={styles.cuisineTags}>
                      {(Array.isArray(item.cuisines)
                        ? item.cuisines
                        : typeof item.cuisines === 'string'
                        ? item.cuisines.split(',')
                        : []
                      ).slice(0, 2).map((c: string) => (
                        <View key={c} style={styles.cuisineTag}>
                          <Text style={styles.cuisineTagText}>{c.trim()}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── DISCOVER ALL ── */}
        <View style={[styles.section, { marginBottom: 32 }]}>
          <View style={styles.sectionRow}>
            <View>
              <Text style={[styles.sectionLabel, { color: tint }]}>🍽️ ALL CATERERS</Text>
              <Text style={[styles.sectionTitle, { color: text }]}>
                {activeFilterCount > 0 ? `${filtered.length} Results` : 'Discover All'}
              </Text>
            </View>
            {activeFilterCount > 0 && (
              <Pressable onPress={() => { clearCommittedFilters(); setSearchQuery(''); setSelectedLocation('All'); }}>
                <Text style={[styles.seeAll, { color: tint }]}>Clear ✕</Text>
              </Pressable>
            )}
          </View>

          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={tint} />
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <ChefHat size={48} color={isDark ? '#444' : '#DDD'} />
              <Text style={[styles.emptyText, { color: subtle }]}>No caterers match your filters</Text>
              <Pressable
                onPress={() => { clearCommittedFilters(); setSearchQuery(''); setSelectedLocation('All'); }}
                style={[styles.clearBtn, { borderColor: tint }]}
              >
                <Text style={[styles.clearBtnText, { color: tint }]}>Clear All Filters</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.discoverGrid}>
              {filtered.map((item: any) => (
                <TouchableOpacity
                  activeOpacity={0.92}
                  key={item.id}
                  style={[styles.discoverCard, { backgroundColor: card }]}
                  onPress={() => router.push(`/caterer/${item.id}`)}
                >
                  {/* Image */}
                  <View style={styles.discoverImageWrap}>
                    <Image
                      source={{ uri: resolveImageUrl(item.cover_image) }}
                      style={styles.discoverImage}
                      resizeMode="cover"
                    />
                    {/* Overlaid rating */}
                    <View style={styles.discoverRatingBadge}>
                      <Star size={11} color="#FFD700" fill="#FFD700" />
                      <Text style={styles.discoverRatingText}>
                        {Number(item.ratingValue || 0).toFixed(1)}
                        <Text style={{ opacity: 0.75 }}> ({item.reviewCount || 0})</Text>
                      </Text>
                    </View>
                    {/* Cuisine chips on image */}
                    <View style={styles.discoverOverlayBottom}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                        {(Array.isArray(item.cuisines) ? item.cuisines : typeof item.cuisines === 'string' ? item.cuisines.split(',') : [])
                          .slice(0, 2)
                          .map((c: string) => (
                            <View key={c} style={styles.discoverCuisineChip}>
                              <Text style={styles.discoverCuisineChipText}>{c.trim()}</Text>
                            </View>
                          ))}
                      </View>
                      {item.min_price ? (
                        <View style={[styles.minPriceBadge, { backgroundColor: BRAND.burgundy }]}>
                          <Text style={styles.minPriceText}>ETB {item.min_price}+</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                    {/* Body - simplified for grid */}
                    <View style={styles.discoverBody}>
                      <Text style={[styles.discoverName, { color: text }]} numberOfLines={1}>
                        {item.name}
                      </Text>

                      <View style={styles.discoverMeta}>
                        <View style={styles.metaItem}>
                          <Users size={11} color={subtle} />
                          <Text style={[styles.metaText, { color: subtle }]}>
                            {item.min_guests}+ guests
                          </Text>
                        </View>
                        {item.location && (
                          <View style={styles.metaItem}>
                            <MapPin size={11} color={subtle} />
                            <Text style={[styles.metaText, { color: subtle }]} numberOfLines={1}>
                              {item.location}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── FILTER BOTTOM SHEET ── */}
      <BottomSheet
        ref={filterSheetRef}
        index={-1}
        snapPoints={['70%', '92%']}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: card }}
        handleIndicatorStyle={{ backgroundColor: isDark ? '#555' : '#DDD', width: 40 }}
      >
        <FilterSheetContent
          key={sheetKey}
          initialFilters={{
            cuisines: filterCuisines,
            rating: filterRating,
            experience: filterExperience,
            price: filterPrice,
            guests: filterGuests,
          }}
          allCuisines={allCuisines}
          onApply={handleApplyFilter}
          tint={tint}
          text={text}
          subtle={subtle}
          isDark={isDark}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  /* ── Hero Header ── */
  headerHero: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingHorizontal: SPACING.md,
    paddingBottom: 28,
    backgroundColor: BRAND.burgundy,
    overflow: 'hidden',
  },
  heroGradient: {
    // Simulated gradient using a second view
    // The overflow:hidden on parent clips these decorative shapes
  },
  heroDecorCircle1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroDecorCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(204,133,51,0.15)',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greetingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  greetingChipText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  heroHeading: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 32,
    ...Platform.select({
      ios: { fontFamily: 'Georgia' },
      android: { fontFamily: 'serif' },
    }),
  },
  heroHeadingAccent: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 38,
    ...Platform.select({
      ios: { fontFamily: 'Georgia' },
      android: { fontFamily: 'serif' },
    }),
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  /* Search Bar — overlaps hero bottom */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 50,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  searchInput: { flex: 1, fontSize: TYPOGRAPHY.base },

  /* Location pills */
  pillScroll: { marginTop: -4 },
  pillRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: 8,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    gap: 3,
  },
  locationPillText: { fontSize: TYPOGRAPHY.sm, fontWeight: '600' },

  /* Section */
  section: { marginBottom: SPACING.lg },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '800',
    ...Platform.select({
      ios: { fontFamily: 'Georgia' },
      android: { fontFamily: 'serif' },
    }),
  },
  seeAll: { fontSize: TYPOGRAPHY.sm, fontWeight: '700' },
  loadingRow: { height: 80, justifyContent: 'center', alignItems: 'center' },

  /* Top Rated Cards */
  topRatedCard: {
    width: width * 0.42,
    height: 140,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.md,
  },
  topRatedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  topRatedContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    // Manual gradient effect
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  topRatedTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    gap: 3,
  },
  ratingBadgeText: { color: '#FFD700', fontSize: 11, fontWeight: '700' },
  priceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  priceBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  topRatedName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
    ...Platform.select({
      ios: { fontFamily: 'Georgia' },
      android: { fontFamily: 'serif' },
    }),
  },
  cuisineTags: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  cuisineTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  cuisineTagText: { color: '#FFF', fontSize: 9, fontWeight: '700' },

  /* Discover Cards Grid */
  discoverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    justifyContent: 'space-between',
    gap: 12, // Vertical gap
  },
  discoverCard: {
    width: (width - (SPACING.md * 2) - 12) / 2, // width - outer padding - gap
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.md,
    marginBottom: 4,
  },
  discoverImageWrap: { height: 130, position: 'relative' },
  discoverImage: { width: '100%', height: '100%' },
  discoverRatingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 3,
  },
  discoverRatingText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  discoverOverlayBottom: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  discoverCuisineChip: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  discoverCuisineChipText: { color: '#1A1A2E', fontSize: 8, fontWeight: '700' },
  minPriceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  minPriceText: { color: '#FFF', fontSize: 9, fontWeight: '800' },

  discoverBody: { padding: 12 },
  discoverTitleRow: {
    marginBottom: 6,
    gap: 4,
  },
  discoverName: {
    fontSize: 14,
    fontWeight: '800',
    ...Platform.select({
      ios: { fontFamily: 'Georgia' },
      android: { fontFamily: 'serif' },
    }),
  },
  priceLabel: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    alignSelf: 'flex-start',
  },
  priceLabelText: { fontSize: 9, fontWeight: '700' },
  discoverDesc: { display: 'none' }, // Hidden in grid view
  discoverMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 10 },

  /* Empty state */
  emptyState: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: { fontSize: TYPOGRAPHY.base, textAlign: 'center' },
  clearBtn: {
    borderWidth: 1.5,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    marginTop: 4,
  },
  clearBtnText: { fontWeight: '700', fontSize: TYPOGRAPHY.sm },

  /* Filter Sheet */
  sheetContent: { paddingHorizontal: SPACING.md, paddingBottom: 40 },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  sheetTitle: { fontSize: TYPOGRAPHY.xl, fontWeight: '800' },
  sheetClear: { fontSize: TYPOGRAPHY.base, fontWeight: '700' },
  sheetSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 20,
    marginBottom: 10,
  },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filterSheetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  filterSheetPillText: { fontSize: TYPOGRAPHY.sm, fontWeight: '600' },
  applyBtn: {
    marginTop: 28,
    height: 54,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BRAND.burgundy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  applyBtnText: { color: '#FFF', fontSize: TYPOGRAPHY.md, fontWeight: '800' },
});

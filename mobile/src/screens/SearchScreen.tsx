import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApprovedCaterers } from '@/hooks/useCaterers';
import { useLanguage } from '@/i18n/LanguageContext';
import type { TxKey } from '@/i18n/translations_en';
import { useCatererRatings } from '@/hooks/useCatererRatings';
import { useMenuItemsByCaterer } from '@/hooks/useMenuItems';
import { useFavorites } from '@/hooks/useFavorites';
import { colors } from '@/theme/colors';
import { SearchBar } from '@/components/mobile/SearchBar';
import { CUISINES, CuisineChip, FilterChip } from '@/components/mobile/Chips';
import {
  FilterSheet,
  priceLabel,
  ratingLabel,
  sortLabel,
  type FilterSection,
  type SortKey,
} from '@/components/mobile/SearchFilters';
import { SearchResultCard } from '@/components/mobile/CatererCards';
import { EmptyStateBlock, SkeletonCard } from '@/components/mobile/shared';
import { AppIcon } from '@/components/mobile/AppIcons';
import type { TabScreenProps } from '@/navigation/types';

const SEARCH_ASSET = require('../../assets/search-header-tight.png');

function useCheapestPrice(catererId: string | undefined) {
  const { data } = useMenuItemsByCaterer(catererId);
  if (!data || data.length === 0) return null;
  return Math.min(...data.map((m) => Number(m.price)));
}

function PriceProbe({ id, onPrice }: { id: string; onPrice: (id: string, price: number | null) => void }) {
  const price = useCheapestPrice(id);
  useEffect(() => {
    onPrice(id, price);
  }, [id, price]);
  return null;
}

export default function SearchScreen({ navigation }: TabScreenProps<'Search'>) {
  const { data: caterers, isLoading, error, refetch } = useApprovedCaterers();
  const { isFavorite, toggle } = useFavorites();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [cuisine, setCuisine] = useState('All');
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [location, setLocation] = useState<string>('All');
  const [sort, setSort] = useState<SortKey>('rating');
  const [prices, setPrices] = useState<Record<string, number | null>>({});
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetSection, setSheetSection] = useState<FilterSection | null>(null);

  const locations = useMemo(() => {
    const set = new Set<string>();
    (caterers ?? []).forEach((c) => {
      if (c.location) set.add(c.location.split(',')[0].trim());
    });
    return ['All', ...[...set].slice(0, 6)];
  }, [caterers]);

  const handlePrice = useCallback((id: string, price: number | null) => {
    setPrices((p) => (p[id] === price ? p : { ...p, [id]: price }));
  }, []);

  // Live aggregates from `reviews` — authoritative when the stored
  // caterers.rating columns are stale (missing DB trigger).
  const allIds = useMemo(() => (caterers ?? []).map((c) => c.id), [caterers]);
  const { data: liveRatings } = useCatererRatings(allIds);

  const effectiveRatingOf = useCallback(
    (c: { id: string; rating: number; review_count: number }) => {
      const live = liveRatings?.[c.id];
      if (live !== undefined) return Number(live.rating ?? 0);
      return Number(c.rating ?? 0);
    },
    [liveRatings],
  );
  const effectiveCountOf = useCallback(
    (c: { id: string; rating: number; review_count: number }) => {
      const live = liveRatings?.[c.id];
      if (live !== undefined) return Number(live.count ?? 0);
      return Number(c.review_count ?? 0);
    },
    [liveRatings],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = (caterers ?? []).filter((c) => {
      const matchesQ =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.location ?? '').toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q) ||
        (c.cuisines ?? []).some((x) => x.toLowerCase().includes(q));
      const matchesCuisine = cuisine === 'All' || (c.cuisines ?? []).includes(cuisine);
      const price = prices[c.id] ?? null;
      // Unknown prices stay visible so the list doesn't flicker while menus load.
      const matchesPrice = priceMax == null || price == null || price <= priceMax;
      const matchesRating = minRating == null || effectiveRatingOf(c) >= minRating;
      const matchesLoc = location === 'All' || (c.location ?? '').includes(location);
      return matchesQ && matchesCuisine && matchesPrice && matchesRating && matchesLoc;
    });
    list = [...list].sort((a, b) => {
      if (sort === 'rating') return effectiveRatingOf(b) - effectiveRatingOf(a);
      if (sort === 'reviews') return effectiveCountOf(b) - effectiveCountOf(a);
      const pa = prices[a.id] ?? Number.MAX_SAFE_INTEGER;
      const pb = prices[b.id] ?? Number.MAX_SAFE_INTEGER;
      return sort === 'priceLow' ? pa - pb : pb - pa;
    });
    return list;
  }, [caterers, query, cuisine, prices, priceMax, minRating, location, sort, effectiveRatingOf, effectiveCountOf]);

  const openSheet = (section: FilterSection | null) => {
    setSheetSection(section);
    setSheetVisible(true);
  };

  const clearAllFilters = useCallback(() => {
    setQuery('');
    setCuisine('All');
    setPriceMax(null);
    setMinRating(null);
    setLocation('All');
  }, []);

  const handleSheetChange = useCallback(
    (patch: { priceMax?: number | null; minRating?: number | null; location?: string; sort?: SortKey }) => {
      if (patch.priceMax !== undefined) setPriceMax(patch.priceMax);
      if (patch.minRating !== undefined) setMinRating(patch.minRating);
      if (patch.location !== undefined) setLocation(patch.location);
      if (patch.sort !== undefined) setSort(patch.sort);
    },
    [],
  );

  const activeFilterCount =
    (cuisine !== 'All' ? 1 : 0) + (priceMax != null ? 1 : 0) + (minRating != null ? 1 : 0) + (location !== 'All' ? 1 : 0);

  const emptySubtitle =
    activeFilterCount > 0
      ? t('search.noMatchFilters')
      : t('search.noMatchGeneric');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.kicker}>{t('search.kicker')}</Text>
              <Text style={styles.title}>{t('search.title')}</Text>
              <Text style={styles.sub}>{t('search.sub')}</Text>
            </View>
            <Image source={SEARCH_ASSET} style={styles.deco} resizeMode="contain" accessibilityLabel="Featured dish" />
          </View>

          <View style={styles.pad}>
            <SearchBar value={query} onChangeText={setQuery} onFilterPress={() => openSheet(null)} />
          </View>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[...CUISINES]}
            keyExtractor={(x) => x}
            contentContainerStyle={styles.chipRow}
            renderItem={({ item }) => (
              <CuisineChip label={t(`cuisines.${item}` as TxKey)} active={cuisine === item} onPress={() => setCuisine(item)} />
            )}
          />

          <View style={styles.filterRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              <FilterChip
                label={activeFilterCount > 0 ? t('search.filtersCount', { n: activeFilterCount }) : t('search.allFilters')}
                icon="sliders"
                active={activeFilterCount > 0}
                onPress={() => openSheet(null)}
                chevron={false}
              />
              <FilterChip
                label={priceLabel(priceMax, t)}
                icon="tag"
                active={priceMax != null}
                onPress={() => openSheet('price')}
              />
              <FilterChip
                label={ratingLabel(minRating, t)}
                icon="star"
                active={minRating != null}
                onPress={() => openSheet('rating')}
              />
              <FilterChip
                label={location === 'All' ? t('search.location') : location}
                icon="pin"
                active={location !== 'All'}
                onPress={() => openSheet('location')}
              />
              <FilterChip label={sortLabel(sort, t)} icon="sort" active={sort !== 'rating'} onPress={() => openSheet('sort')} />
            </ScrollView>
          </View>

          <View style={styles.pad}>
            <View style={styles.countRow}>
              <Text style={styles.count}>
                {filtered.length === 1 ? t('search.foundOne') : t('search.foundMany', { n: filtered.length })}
              </Text>
              {activeFilterCount > 0 ? (
                <Text onPress={clearAllFilters} style={styles.clearAll} accessibilityRole="button">
                  {t('common.clearAll')}
                </Text>
              ) : (
                <View style={styles.locRow}>
                  <AppIcon name="pin" size={16} color={colors.primary} filled />
                  <Text style={styles.loc}>Bole, Addis Ababa</Text>
                  <AppIcon name="chevronDown" size={16} color={colors.primary} />
                </View>
              )}
            </View>
          </View>

          {isLoading ? (
            <View style={styles.pad}>
              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <SkeletonCard imageHeight={120} />
                </View>
                <View style={styles.gridItem}>
                  <SkeletonCard imageHeight={120} />
                </View>
              </View>
            </View>
          ) : error ? (
            <View style={styles.pad}>
              <EmptyStateBlock title={t('explore.loadFail')} subtitle={t('explore.loadFailSub')} actionLabel={t('common.retry')} onAction={() => refetch()} />
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.pad}>
              <EmptyStateBlock
                title={t('search.noResult')}
                subtitle={emptySubtitle}
                actionLabel={t('search.clearFilters')}
                onAction={clearAllFilters}
              />
            </View>
          ) : (
            <View style={styles.pad}>
              {(caterers ?? []).map((c) => (
                <PriceProbe key={c.id} id={c.id} onPrice={handlePrice} />
              ))}
              <View style={styles.grid}>
                {filtered.map((item) => {
                  const live = liveRatings?.[item.id];
                  const effectiveRating = live !== undefined ? Number(live.rating ?? 0) : Number(item.rating ?? 0);
                  const effectiveCount = live !== undefined ? Number(live.count ?? 0) : Number(item.review_count ?? 0);
                  return (
                    <View key={item.id} style={styles.gridItem}>
                      <SearchResultCard
                        caterer={item}
                        topRated={effectiveRating >= 4.5 && effectiveCount > 0}
                        isFavorite={isFavorite(item.id)}
                        onToggleFavorite={() => toggle(item.id)}
                        onPress={() => navigation.navigate('CatererDetail', { id: item.id })}
                        liveRating={live}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
        <FilterSheet
          visible={sheetVisible}
          initialSection={sheetSection}
          priceMax={priceMax}
          minRating={minRating}
          location={location}
          sort={sort}
          locations={locations}
          resultCount={filtered.length}
          onChange={handleSheetChange}
          onClearAll={clearAllFilters}
          onClose={() => setSheetVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F8F6' },
  flex: { flex: 1 },
  content: { paddingBottom: 120 },
  pad: { paddingHorizontal: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  gridItem: { width: '48%' },
  header: { flexDirection: 'row', paddingLeft: 16, paddingRight: 4, paddingTop: 10, alignItems: 'flex-start' },
  headerText: { flex: 1, paddingTop: 8, paddingRight: 4 },
  kicker: { fontSize: 16, fontWeight: '700', color: '#15803D', letterSpacing: 0.1 },
  title: { fontSize: 22, fontWeight: '800', color: '#101828', letterSpacing: -0.5, marginTop: 4, lineHeight: 28 },
  sub: { fontSize: 14, fontWeight: '400', color: '#667085', marginTop: 6, lineHeight: 20 },
  deco: { width: 150, height: 132, marginTop: -10, marginRight: -4, marginLeft: 6 },
  chipRow: { paddingHorizontal: 16, paddingVertical: 6 },
  filterRow: { marginTop: 4 },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 },
  count: { fontSize: 20, fontWeight: '800', color: '#101828', letterSpacing: -0.3 },
  clearAll: { fontSize: 14, fontWeight: '700', color: '#15803D' },
  locRow: { flexDirection: 'row', alignItems: 'center' },
  loc: { fontSize: 13, fontWeight: '700', color: '#15803D', marginHorizontal: 4 },
});

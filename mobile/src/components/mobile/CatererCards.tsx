import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, radius } from '@/theme/colors';
import { formatDistance } from '@/lib/geo';
import { useLanguage } from '@/i18n/LanguageContext';
import { AppIcon, type IconName } from './AppIcons';
import {
  DEFAULT_LOCATION,
} from '@/constants/app';
import type { Caterer } from '@/types/domain';
import { getEffectiveRating } from '@/lib/ratings';

export type LiveRating = { rating: number; count: number } | undefined;

function getRating(caterer: Caterer, live?: LiveRating): { hasReviews: boolean; rating: number; count: number } {
  // Live aggregate (from `reviews`) is authoritative once loaded. `undefined`
  // means still loading — fall back to the stored caterers columns meanwhile.
  if (live !== undefined) {
    const rating = Number(live.rating ?? 0);
    const count = Math.trunc(Number(live.count ?? 0));
    return { hasReviews: count > 0 && rating > 0, rating, count };
  }
  return getEffectiveRating(caterer);
}

/** First 2 letters of the vendor name, used when no logo was uploaded. */
function vendorInitials(name: string): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'V';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

/**
 * Full-bleed vendor logo banner — the logo fills the whole top of the card.
 * Falls back to an elegant monogram panel when the vendor has no logo.
 */
export function VendorBanner({
  uri,
  name,
  height = 120,
}: {
  uri: string | null | undefined;
  name: string;
  height?: number;
}) {
  const [failed, setFailed] = useState(false);
  const clean = (uri ?? '').trim();
  return (
    <View style={[styles.banner, { height }]}>
      {clean && !failed ? (
        <Image
          source={{ uri: clean }}
          style={styles.bannerImg}
          resizeMode="cover"
          onError={() => setFailed(true)}
          accessibilityLabel={`${name} logo`}
        />
      ) : (
        <View style={styles.bannerFallback}>
          <Text style={styles.bannerInitials}>{vendorInitials(name)}</Text>
          <Text style={styles.bannerSub} numberOfLines={1}>
            {name}
          </Text>
        </View>
      )}
    </View>
  );
}

function TopRatedBadge({ label }: { label: string }) {
  return (
    <View style={styles.topOverlay}>
      <AppIcon name="star" size={11} color={colors.starGold} filled />
      <Text style={styles.topText}>{label}</Text>
    </View>
  );
}

function FavoriteOverlay({
  active,
  onPress,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  onPress: () => void;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={active ? activeLabel : inactiveLabel}
      style={({ pressed }) => [styles.favOverlay, pressed && { opacity: 0.6 }]}
    >
      <AppIcon
        name="heart"
        size={16}
        color={active ? colors.primary : '#9CA3AF'}
        filled={active}
      />
    </Pressable>
  );
}

/** Home card — same style as search, with View Details + distance. */
export function PopularCatererCard({
  caterer,
  topRated,
  isFavorite,
  onToggleFavorite,
  onPress,
  liveRating,
  distanceKm,
  style,
}: {
  caterer: Caterer;
  topRated?: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPress: () => void;
  liveRating?: LiveRating;
  distanceKm?: number | null;
  style?: ViewStyle;
}) {
  const { t, language } = useLanguage();
  const cuisineLine = [caterer.cuisines?.[0], caterer.specialties?.[0] ?? caterer.cuisines?.[1]]
    .filter(Boolean)
    .join('  •  ');
  const { hasReviews, rating, count } = getRating(caterer, liveRating);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.shell, style, pressed && { opacity: 0.94 }]}>
      <View>
        <VendorBanner uri={caterer.logo_url} name={caterer.name} />
        {topRated ? <TopRatedBadge label={t('cards.topRated')} /> : null}
        <FavoriteOverlay
          active={isFavorite}
          onPress={onToggleFavorite}
          activeLabel={t('cards.removeFav')}
          inactiveLabel={t('cards.addFav')}
        />
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {caterer.name}
          </Text>
          <AppIcon name="badgeCheck" size={15} color={colors.primary} />
        </View>

        {!!cuisineLine && (
          <Text style={styles.sub} numberOfLines={1}>
            {cuisineLine}
          </Text>
        )}

        <View style={styles.metaRow}>
          <AppIcon name="star" size={13} color={colors.starGold} filled />
          {hasReviews ? (
            <>
              <Text style={styles.ratingVal}>{rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}> ({count})</Text>
            </>
          ) : (
            <Text style={styles.newText}> {t('cards.new')}</Text>
          )}
          <View style={styles.sep} />
          <AppIcon name="pin" size={12} color="#64748B" />
          <Text style={styles.loc} numberOfLines={1}>
            {caterer.location ?? 'Bole, Addis Ababa'}
          </Text>
        </View>
        {distanceKm != null ? (
          <Text style={styles.dist}>{formatDistance(distanceKm, language)}</Text>
        ) : null}

        <View style={styles.ctaRow}>
          <Pressable onPress={onPress} style={({ pressed }) => [styles.bookBtn, pressed && { opacity: 0.85 }]}>
            <AppIcon name="eye" size={13} color={colors.white} />
            <Text style={styles.bookText}>{t('booking.viewDetails')}</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

/** Search result card — same shell as home, with cuisine tags. */
export function SearchResultCard({
  caterer,
  topRated,
  isFavorite,
  onToggleFavorite,
  onPress,
  liveRating,
  style,
}: {
  caterer: Caterer;
  topRated?: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPress: () => void;
  liveRating?: LiveRating;
  style?: ViewStyle;
}) {
  const tags = [...(caterer.cuisines ?? []).slice(0, 1), ...(caterer.specialties ?? []).slice(0, 1)].slice(0, 2);
  const { hasReviews: hasSearchReviews, rating, count } = getRating(caterer, liveRating);
  const { t } = useLanguage();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.shell, style, pressed && { opacity: 0.92 }]}>
      <View>
        <VendorBanner uri={caterer.logo_url} name={caterer.name} />
        {topRated ? <TopRatedBadge label={t('cards.topRated')} /> : null}
        <FavoriteOverlay
          active={isFavorite}
          onPress={onToggleFavorite}
          activeLabel={t('cards.removeFav')}
          inactiveLabel={t('cards.addFav')}
        />
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {caterer.name}
          </Text>
          <AppIcon name="badgeCheck" size={15} color={colors.primary} />
        </View>
        <Text style={styles.sub} numberOfLines={1}>
          {caterer.description || t('cards.descFallback', { cuisine: caterer.cuisines?.[0] ?? 'Catering' })}
        </Text>
        <View style={styles.metaRow}>
          <AppIcon name="star" size={13} color={colors.starGold} filled />
          {hasSearchReviews ? (
            <>
              <Text style={styles.ratingVal}>{rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}> ({count})</Text>
            </>
          ) : (
            <Text style={styles.newText}> {t('cards.new')}</Text>
          )}
          <View style={styles.sep} />
          <AppIcon name="pin" size={12} color="#64748B" />
          <Text style={styles.loc} numberOfLines={1}>
            {caterer.location ?? DEFAULT_LOCATION}
          </Text>
        </View>
        {tags.length > 0 ? (
          <View style={styles.tagRow}>
            {tags.slice(0, 1).map((tag) => (
              <View key={tag} style={styles.tag}>
                <AppIcon name={tagIconFor(tag)} size={11} color="#15803D" />
                <Text style={styles.tagText} numberOfLines={1}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function tagIconFor(tag: string): IconName {
  const t = tag.toLowerCase();
  if (t.includes('ethiopian')) return 'pot';
  if (t.includes('italian') || t.includes('pasta')) return 'pizza';
  if (t.includes('indian')) return 'bowl';
  if (t.includes('chinese') || t.includes('noodle')) return 'bowl';
  if (t.includes('mexican')) return 'sandwich';
  if (t.includes('deliver') || t.includes('on-time')) return 'truck';
  if (t.includes('tradition') || t.includes('authentic')) return 'cloche';
  if (t.includes('fresh') || t.includes('vegetarian') || t.includes('veg')) return 'sprout';
  if (t.includes('large') || t.includes('group')) return 'users';
  if (t.includes('quick')) return 'clock';
  if (t.includes('sweet') || t.includes('dessert')) return 'salad';
  return 'leaf';
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE9DF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#14281E',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  banner: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerImg: { width: '100%', height: '100%' },
  bannerFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#F0FDF4',
  },
  bannerInitials: { fontSize: 34, fontWeight: '800', color: colors.primaryDark, letterSpacing: 1 },
  bannerSub: { fontSize: 11, fontWeight: '600', color: '#5F7A66', marginTop: 4, textAlign: 'center' },
  body: { paddingHorizontal: 11, paddingTop: 9, paddingBottom: 11 },
  topOverlay: { position: 'absolute', top: 8, left: 8, zIndex: 2, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4 },
  favOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#14281E',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  topText: { color: '#15803D', fontSize: 11, fontWeight: '700', marginLeft: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 13.5, fontWeight: '800', color: '#101828', letterSpacing: -0.2, flexShrink: 1, marginRight: 4, textAlign: 'center' },
  sub: { fontSize: 11, fontWeight: '400', color: '#667085', marginTop: 2, lineHeight: 14, textAlign: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  ratingVal: { fontSize: 12.5, fontWeight: '800', color: '#101828', marginLeft: 4 },
  reviewCount: { fontSize: 11, fontWeight: '400', color: '#667085' },
  newText: { color: colors.primaryDark, fontWeight: '800', fontSize: 12.5, marginLeft: 3 },
  sep: { width: 1, height: 13, backgroundColor: '#E5E7EB', marginHorizontal: 7 },
  loc: { fontSize: 11, fontWeight: '400', color: '#667085', marginLeft: 3, flexShrink: 1 },
  dist: { fontSize: 11, fontWeight: '700', color: colors.primaryDark, textAlign: 'center', marginTop: 1 },
  tagRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 7 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4, maxWidth: '100%' },
  tagText: { fontSize: 10.5, color: '#15803D', fontWeight: '600', marginLeft: 4, flexShrink: 1 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  bookBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803D',
    borderRadius: radius.pill,
    paddingVertical: 9,
  },
  bookText: { color: colors.white, fontWeight: '700', fontSize: 12.5, marginLeft: 6 },
});

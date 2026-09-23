import { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Path } from 'react-native-svg';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCustomerBookings, type BookingWithCaterer } from '@/hooks/useBookings';
import { colors, radius } from '@/theme/colors';
import { BookingCard } from '@/components/mobile/MenuBookingCards';
import { ReviewModal } from '@/components/mobile/ReviewModal';
import { EmptyStateBlock, SkeletonCard } from '@/components/mobile/shared';
import type { TabScreenProps } from '@/navigation/types';

const BOOKING_ASSET = require('../../assets/booking-asset.png');

type Filter = 'All' | 'Upcoming' | 'Completed' | 'Cancelled';

function displayStatus(b: BookingWithCaterer): Filter {
  const v = (b.request_status ?? 'NEW').toUpperCase();
  if (v === 'CANCELLED') return 'Cancelled';
  if (v === 'COMPLETED') return 'Completed';
  return 'Upcoming';
}

export default function MyBookingsScreen({ navigation }: TabScreenProps<'MyBookings'>) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data, isLoading, error, refetch, isRefetching } = useCustomerBookings(user?.id);
  const [filter, setFilter] = useState<Filter>('All');
  const [reviewFor, setReviewFor] = useState<BookingWithCaterer | null>(null);

  const filterLabel = (f: Filter) =>
    f === 'All' ? t('cuisines.All') : t(`status.${f.toLowerCase()}` as 'status.upcoming');

  const list = useMemo(() => {
    const all = (data ?? []) as BookingWithCaterer[];
    if (filter === 'All') return all;
    return all.filter((b) => displayStatus(b) === filter);
  }, [data, filter]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.flex}>
        <FlatList
          data={isLoading || error ? [] : list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onRefresh={() => refetch()}
          refreshing={isRefetching}
          ListHeaderComponent={
            <View>
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={styles.kicker}>{t('bookings.kicker')}</Text>
                  <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                    {t('bookings.titleA')}
                  </Text>
                  <View style={styles.titleLine2Wrap}>
                    <Text
                      style={[styles.title, styles.titleGreen]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      {t('bookings.titleB')}
                    </Text>
                    <Svg width={72} height={7} viewBox="0 0 84 8" style={styles.underline}>
                      <Path
                        d="M2 5.5 Q 43 1.5 82 4.5"
                        stroke="#22C55E"
                        strokeWidth={3}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </Svg>
                  </View>
                  <Text style={styles.sub}>{t('bookings.sub')}</Text>
                </View>
                <Image
                  source={BOOKING_ASSET}
                  style={styles.deco}
                  resizeMode="contain"
                  accessibilityLabel={t('bookings.illustration')}
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
                contentContainerStyle={styles.filterContent}
              >
                {(['All', 'Upcoming', 'Completed', 'Cancelled'] as Filter[]).map((f) => (
                  <Pressable
                    key={f}
                    onPress={() => setFilter(f)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: filter === f }}
                    accessibilityLabel={t('bookings.show', { f: filterLabel(f) })}
                    hitSlop={6}
                    style={[styles.chip, filter === f && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{filterLabel(f)}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {isLoading ? (
                <View>
                  <SkeletonCard imageHeight={150} />
                  <SkeletonCard imageHeight={150} />
                </View>
              ) : error ? (
                <EmptyStateBlock
                  title={t('bookings.loadFail')}
                  subtitle={t('det.retrySub')}
                  actionLabel={t('common.retry')}
                  onAction={() => refetch()}
                />
              ) : list.length === 0 ? (
                <EmptyStateBlock
                  title={t('bookings.empty')}
                  subtitle={t('bookings.emptySub')}
                  actionLabel={t('bookings.find')}
                  onAction={() => navigation.navigate('Search')}
                />
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <BookingCard
              item={item}
              onPress={() => navigation.navigate('BookingDetails', { bookingId: item.id })}
              onReview={item.caterer?.id ? () => setReviewFor(item) : undefined}
            />
          )}
          ListFooterComponent={<View style={{ height: 8 }} />}
        />
        {reviewFor?.caterer?.id ? (
          <ReviewModal
            visible={!!reviewFor}
            onClose={() => setReviewFor(null)}
            catererId={reviewFor.caterer.id}
            catererName={reviewFor.caterer.name ?? t('common.catererFallback')}
            customerId={user?.id}
            bookingId={reviewFor.id}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 116 },
  header: { flexDirection: 'row', paddingTop: 10, alignItems: 'flex-start' },
  headerText: { flex: 1, paddingRight: 2, minWidth: 0, flexShrink: 1 },
  kicker: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  title: { fontSize: 21, fontWeight: '800', color: colors.text, lineHeight: 26, marginTop: 4, letterSpacing: -0.3 },
  titleGreen: { color: colors.primaryDark },
  titleLine2Wrap: { alignSelf: 'stretch' },
  underline: { marginTop: 1, marginLeft: 2 },
  sub: { fontSize: 14, color: colors.textMuted, marginTop: 10, lineHeight: 20 },
  deco: { width: 150, height: 138, marginTop: -12, marginRight: -14, marginLeft: 2, flexShrink: 0 },
  filterScroll: { marginTop: 16, marginBottom: 14, marginHorizontal: -20 },
  filterContent: { paddingHorizontal: 20, flexGrow: 0, alignItems: 'center' },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 13,
    paddingVertical: 7,
    marginRight: 6,
    overflow: 'hidden',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.text },
  chipTextActive: { color: colors.white, fontWeight: '700' },
});

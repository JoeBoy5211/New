import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCustomerBookings } from '@/hooks/useBookings';
import { useMenuItemsByCaterer } from '@/hooks/useMenuItems';
import { usePackagesByCaterer } from '@/hooks/usePackages';
import { colors, radius, shadow } from '@/theme/colors';
import { AppIcon, type IconName } from '@/components/mobile/AppIcons';
import { BottomNav } from '@/components/mobile/BottomNav';
import { ReviewModal } from '@/components/mobile/ReviewModal';
import { EmptyStateBlock, FoodImage } from '@/components/mobile/shared';
import { formatBirr, formatBookingDate, formatTime12h } from '@/lib/format';
import type { RootScreenProps } from '@/navigation/types';

function detailsStatus(requestStatus: string | null | undefined): {
  key: 'upcoming' | 'completed' | 'cancelled';
  bg: string;
  fg: string;
  icon: IconName;
} {
  const v = (requestStatus ?? 'NEW').toUpperCase();
  if (v === 'CANCELLED') return { key: 'cancelled', bg: colors.dangerBg, fg: colors.danger, icon: 'info' };
  if (v === 'COMPLETED') return { key: 'completed', bg: colors.infoBg, fg: colors.info, icon: 'check' };
  return { key: 'upcoming', bg: colors.successBg, fg: colors.successDark, icon: 'calendar' };
}

export default function BookingDetailsScreen({ route, navigation }: RootScreenProps<'BookingDetails'>) {
  const { bookingId } = route.params;
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data, isLoading, error, refetch } = useCustomerBookings(user?.id);
  const [reviewOpen, setReviewOpen] = useState(false);

  const booking = useMemo(() => (data ?? []).find((b) => b.id === bookingId) ?? null, [data, bookingId]);

  const { data: packages } = usePackagesByCaterer(booking?.caterer_id);
  const { data: menuItems } = useMenuItemsByCaterer(booking?.caterer_id);

  const selectedPackages = useMemo(() => {
    const ids = new Set(booking?.package_ids ?? []);
    if (ids.size === 0) return [];
    return (packages ?? []).filter((p) => ids.has(p.id));
  }, [booking?.package_ids, packages]);

  const selectedMenu = useMemo(() => {
    const ids = new Set(booking?.menu_selections ?? []);
    if (ids.size === 0) return [];
    return (menuItems ?? []).filter((m) => ids.has(m.id));
  }, [booking?.menu_selections, menuItems]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('det.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !booking) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.flex}>
          <EmptyStateBlock
            title={error ? t('det.loadFail') : t('det.notFound')}
            subtitle={error ? t('det.retrySub') : t('det.removed')}
            actionLabel={error ? t('det.retry') : t('common.goBack')}
            onAction={() => (error ? refetch() : navigation.goBack())}
          />
          <BottomNav active="Bookings" onNavigate={(r) => navigation.navigate('MainTabs', { screen: r })} />
        </View>
      </SafeAreaView>
    );
  }

  const status = detailsStatus(booking.request_status);
  const statusLabel = t(`status.${status.key}` as 'status.upcoming');
  const catererName = booking.caterer?.name ?? t('common.catererFallback');
  const catererLoc = booking.caterer?.location ?? 'Addis Ababa';
  const requestedOn = booking.created_at ? formatBookingDate(String(booking.created_at).slice(0, 10)) : '';
  const servicesCount = selectedPackages.length + selectedMenu.length;

  const facts: { icon: IconName; label: string; value: string }[] = [
    { icon: 'calendar', label: t('det.factDate'), value: formatBookingDate(booking.event_date) },
    { icon: 'clock', label: t('det.factTime'), value: booking.event_time ? formatTime12h(booking.event_time) : t('det.flexible') },
    { icon: 'users', label: t('det.factGuests'), value: t('det.people', { n: booking.guest_count }) },
    { icon: 'cloche', label: t('det.factType'), value: booking.event_type },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.flex}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <FoodImage uri={booking.caterer?.cover_image} style={styles.heroImg} borderRadius={24} />
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel={t('common.goBack')}
              hitSlop={10}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            >
              <AppIcon name="back" size={22} color={colors.text} />
            </Pressable>
            <View style={[styles.statusPill, { backgroundColor: colors.surface }]}>
              <AppIcon name={status.icon} size={13} color={status.fg} />
              <Text style={[styles.statusText, { color: status.fg }]}>{statusLabel}</Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleRow}>
            <View style={styles.titleCol}>
              <Text style={styles.name} numberOfLines={1}>{catererName}</Text>
              <View style={styles.locRow}>
                <AppIcon name="pin" size={14} color={colors.textMuted} />
                <Text style={styles.loc} numberOfLines={1}>{catererLoc}</Text>
              </View>
            </View>
            {booking.total_amount ? (
              <View style={styles.totalBadge}>
                <Text style={styles.totalLabel}>{t('det.total')}</Text>
                <Text style={styles.totalValue} numberOfLines={1}>{formatBirr(booking.total_amount)}</Text>
              </View>
            ) : null}
          </View>
          {requestedOn ? <Text style={styles.requested}>{t('det.requestedOn', { date: requestedOn })}</Text> : null}

          {/* Facts bento */}
          <View style={styles.bento}>
            {facts.map((f) => (
              <View key={f.label} style={styles.factCell}>
                <View style={styles.factIcon}>
                  <AppIcon name={f.icon} size={17} color={colors.primaryDark} />
                </View>
                <Text style={styles.factLabel}>{f.label}</Text>
                <Text style={styles.factValue} numberOfLines={1}>{f.value}</Text>
              </View>
            ))}
          </View>

          {/* Venue */}
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <AppIcon name="pin" size={17} color={colors.primaryDark} />
              <Text style={styles.cardTitle}>{t('det.venue')}</Text>
            </View>
            <Text style={styles.cardValue}>{booking.venue?.trim() || '—'}</Text>
          </View>

          {/* Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('det.services')}</Text>
            <Text style={styles.sectionHint}>
              {servicesCount > 0
                ? `${selectedPackages.length === 1 ? t('book.pkgOne') : t('book.pkgMany', { n: selectedPackages.length })} · ${selectedMenu.length === 1 ? t('book.menuOne') : t('book.menuMany', { n: selectedMenu.length })}`
                : t('det.included')}
            </Text>
            {servicesCount === 0 ? (
              <Text style={styles.helper}>{t('det.noServices')}</Text>
            ) : (
              <View style={styles.card}>
                {selectedPackages.map((p) => (
                  <View key={p.id} style={styles.serviceRow}>
                    <Text style={styles.serviceName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.servicePrice}>{formatBirr(p.price)}</Text>
                  </View>
                ))}
                {selectedMenu.map((m) => (
                  <View key={m.id} style={styles.serviceRow}>
                    <Text style={styles.serviceName} numberOfLines={1}>{m.name}</Text>
                    <Text style={styles.servicePrice}>{formatBirr(m.price)}</Text>
                  </View>
                ))}
                {booking.total_amount ? (
                  <View style={[styles.serviceRow, styles.totalRow]}>
                    <Text style={styles.totalRowLabel}>{t('det.estTotal')}</Text>
                    <Text style={styles.totalRowValue}>{formatBirr(booking.total_amount)}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('det.contactTitle')}</Text>
            <View style={styles.card}>
              <View style={styles.contactRow}>
                <AppIcon name="user" size={16} color={colors.primaryDark} />
                <Text style={styles.contactLabel}>{t('det.nameLabel')}</Text>
                <Text style={styles.contactValue} numberOfLines={1}>
                  {booking.contact_name?.trim() || '—'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.contactRow}>
                <AppIcon name="phone" size={16} color={colors.primaryDark} />
                <Text style={styles.contactLabel}>{t('det.phoneLabel')}</Text>
                <Text style={styles.contactValue} numberOfLines={1}>
                  {booking.contact_phone?.trim() || '—'}
                </Text>
              </View>
            </View>
          </View>

          {/* Special requests */}
          {booking.special_requests?.trim() ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('det.specialTitle')}</Text>
              <View style={styles.card}>
                <Text style={styles.notes}>{booking.special_requests.trim()}</Text>
              </View>
            </View>
          ) : null}

          {/* Actions */}
          {status.key === 'completed' && booking.caterer?.id ? (
            <Pressable
              onPress={() => setReviewOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={t('det.rateLabel', { name: catererName })}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.88 }]}
            >
              <AppIcon name="star" size={17} color={colors.white} filled />
              <Text style={styles.primaryText}>{t('det.rate')}</Text>
            </Pressable>
          ) : null}
          {booking.caterer?.id ? (
            <Pressable
              onPress={() => navigation.navigate('CatererDetail', { id: booking.caterer!.id })}
              accessibilityRole="button"
              accessibilityLabel={t('det.viewCatererLabel', { name: catererName })}
              style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.ghostText}>{t('det.viewCaterer')}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
        <BottomNav active="Bookings" onNavigate={(r) => navigation.navigate('MainTabs', { screen: r })} />
        {reviewOpen && booking.caterer?.id ? (
          <ReviewModal
            visible={reviewOpen}
            onClose={() => setReviewOpen(false)}
            catererId={booking.caterer.id}
            catererName={catererName}
            customerId={user?.id}
            bookingId={booking.id}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 140 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.textMuted },

  hero: { height: 230 },
  heroImg: { width: '100%', height: 230 },
  backBtn: {
    position: 'absolute', top: 12, left: 12, width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', ...shadow.card,
  },
  statusPill: {
    position: 'absolute', left: 12, bottom: 12, flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, ...shadow.card,
  },
  statusText: { fontSize: 12.5, fontWeight: '800', marginLeft: 6 },

  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 16 },
  titleCol: { flex: 1, marginRight: 10, minWidth: 0 },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  locRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  loc: { fontSize: 13.5, color: colors.textMuted, marginLeft: 4, flex: 1 },
  totalBadge: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'flex-end', ...shadow.card,
  },
  totalLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.4 },
  totalValue: { fontSize: 17, fontWeight: '800', color: colors.primaryDark, marginTop: 2 },
  requested: { fontSize: 12.5, color: colors.textFaint, marginTop: 6 },

  bento: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginTop: 16 },
  factCell: {
    width: '48%', marginHorizontal: '1%', marginTop: 8, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 14, ...shadow.card,
  },
  factIcon: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  factLabel: { fontSize: 12, color: colors.textMuted, marginTop: 10 },
  factValue: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 2 },

  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 18, padding: 16, marginTop: 12, ...shadow.card,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginLeft: 8 },
  cardValue: { fontSize: 14.5, color: colors.text, marginTop: 8, lineHeight: 20 },

  section: { marginTop: 24 },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  sectionHint: { fontSize: 13.5, color: colors.textMuted, marginTop: 4 },
  helper: { fontSize: 13.5, color: colors.textMuted, marginTop: 8 },

  serviceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  serviceName: { flex: 1, fontSize: 14.5, fontWeight: '600', color: colors.text, marginRight: 10 },
  servicePrice: { fontSize: 14.5, fontWeight: '800', color: colors.text },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 6, paddingTop: 12 },
  totalRowLabel: { fontSize: 14, color: colors.textMuted },
  totalRowValue: { fontSize: 18, fontWeight: '800', color: colors.primaryDark },

  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  contactLabel: { fontSize: 13.5, color: colors.textMuted, marginLeft: 10, width: 56 },
  contactValue: { flex: 1, fontSize: 14.5, fontWeight: '700', color: colors.text, textAlign: 'right', marginLeft: 8 },
  divider: { height: 1, backgroundColor: colors.border, opacity: 0.7, marginVertical: 10 },

  notes: { fontSize: 14.5, color: colors.text, lineHeight: 21 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primaryDark, borderRadius: 15, paddingVertical: 16, marginTop: 24,
  },
  primaryText: { color: colors.white, fontWeight: '800', fontSize: 16, marginLeft: 8 },
  ghostBtn: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 15,
    paddingVertical: 15, alignItems: 'center', marginTop: 10, backgroundColor: colors.surface,
  },
  ghostText: { fontSize: 15, fontWeight: '800', color: colors.text },
});

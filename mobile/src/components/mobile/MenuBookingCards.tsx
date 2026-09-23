import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadow } from '@/theme/colors';
import { useLanguage } from '@/i18n/LanguageContext';
import { FoodImage } from './shared';
import { AppIcon, type IconName } from './AppIcons';
import { formatBirr, formatBookingDate, formatTime12h } from '@/lib/format';
import type { MenuItem } from '@/types/domain';
import type { Package } from '@/types/domain';
import type { BookingWithCaterer } from '@/types/domain';

export function DishCard({ item, onPress }: { item: MenuItem; onPress?: () => void }) {
  const { t } = useLanguage();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('menu.viewDetails', { name: item.name })}
      style={({ pressed }) => [styles.dish, pressed && { opacity: 0.92 }]}
    >
      <View>
        <FoodImage uri={item.image} style={styles.dishImg} borderRadius={14} />
        {item.is_popular ? (
          <View style={styles.popBadge}>
            <AppIcon name="star" size={11} color={colors.starGold} filled />
            <Text style={styles.popText}>{t('menu.mostPopular')}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.dishName} numberOfLines={1}>
        {item.name}
      </Text>
      {!!item.description && (
        <Text style={styles.dishDesc} numberOfLines={3}>
          {item.description}
        </Text>
      )}
      <Text style={styles.dishPrice}>{formatBirr(item.price)}</Text>
    </Pressable>
  );
}

export function DishDetailSheet({
  item,
  visible,
  onClose,
}: {
  item: MenuItem | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={styles.sheetBackdropTap} onPress={onClose} accessibilityLabel={t('menu.closeDetails')} />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.sheetHandle} />
          {item ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetBody}>
              <View>
                <FoodImage uri={item.image} style={styles.sheetImg} borderRadius={16} />
                {item.is_popular ? (
                  <View style={styles.popBadge}>
                    <AppIcon name="star" size={11} color={colors.starGold} filled />
                    <Text style={styles.popText}>{t('menu.mostPopular')}</Text>
                  </View>
                ) : null}
                <Pressable
                  onPress={onClose}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={t('menu.closeDetails')}
                  style={({ pressed }) => [styles.sheetClose, pressed && { opacity: 0.6 }]}
                >
                  <AppIcon name="close" size={18} color={colors.text} />
                </Pressable>
              </View>
              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetName} accessibilityRole="header">
                  {item.name}
                </Text>
                <Text style={styles.sheetPrice}>{formatBirr(item.price)}</Text>
              </View>
              <View style={styles.sheetChips}>
                {item.category ? (
                  <View style={styles.sheetChip}>
                    <AppIcon name="utensils" size={13} color={colors.primaryDark} />
                    <Text style={styles.sheetChipText}>{item.category}</Text>
                  </View>
                ) : null}
                {(item.dietary_info ?? []).map((d) => (
                  <View key={d} style={styles.sheetChip}>
                    <AppIcon name="leaf" size={13} color={colors.primaryDark} />
                    <Text style={styles.sheetChipText}>{d}</Text>
                  </View>
                ))}
              </View>
              {!!item.description && <Text style={styles.sheetDesc}>{item.description}</Text>}
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

export function PackageCard({ pkg, onPress }: { pkg: Package; onPress?: () => void }) {
  const { t } = useLanguage();
  const guests =
    pkg.min_guests || pkg.max_guests ? t('pkg.guestsRange', { min: pkg.min_guests ?? '', max: pkg.max_guests ?? '' }) : t('pkg.flexible');
  const dishCount = !pkg.includes?.length
    ? t('pkg.setMenu')
    : pkg.includes.length === 1
      ? t('pkg.dishOne')
      : t('pkg.dishesMany', { n: pkg.includes.length });
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.pkg, pressed && { opacity: 0.9 }]}>
      <FoodImage uri={pkg.images?.[0]} style={styles.pkgImg} borderRadius={12} />
      <View style={styles.pkgBody}>
        <Text style={styles.pkgName} numberOfLines={1}>
          {pkg.name}
        </Text>
        <Text style={styles.pkgMeta} numberOfLines={1}>
          {guests} • {dishCount}
        </Text>
        <Text style={styles.pkgPrice}>{formatBirr(pkg.price)}</Text>
      </View>
      <AppIcon name="forward" size={20} color={colors.primaryDark} />
    </Pressable>
  );
}

function bookingDisplayStatus(requestStatus: string | null | undefined): 'Upcoming' | 'Completed' | 'Cancelled' {
  const v = (requestStatus ?? 'NEW').toUpperCase();
  if (v === 'CANCELLED') return 'Cancelled';
  if (v === 'COMPLETED') return 'Completed';
  return 'Upcoming';
}

export function BookingCard({ item, onPress, onReview }: { item: BookingWithCaterer; onPress: () => void; onReview?: () => void }) {
  const { t } = useLanguage();
  const status = bookingDisplayStatus(item.request_status);
  const display = t(`status.${status.toLowerCase()}` as 'status.upcoming');
  const bg = status === 'Cancelled' ? colors.infoBg : colors.successBg;
  const fg = status === 'Cancelled' ? colors.info : colors.successDark;
  const statusIcon: IconName =
    status === 'Upcoming' ? 'calendar' : status === 'Completed' ? 'check' : 'clock';
  const actionIcon: IconName =
    status === 'Cancelled' ? 'info' : status === 'Completed' ? 'refresh' : 'calendar';
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.booking, pressed && { opacity: 0.93 }]}>
      <FoodImage uri={item.caterer?.cover_image} style={styles.bookingImg} borderRadius={12} />
      <View style={styles.bookingBody}>
        <View style={styles.bookingTop}>
          <View style={[styles.statusPill, { backgroundColor: bg }]}>
            <AppIcon name={statusIcon} size={12} color={fg} />
            <Text style={[styles.statusText, { color: fg }]}>{display}</Text>
          </View>
          <AppIcon name="forward" size={20} color={colors.textFaint} />
        </View>
        <Text style={styles.bookingName} numberOfLines={1}>
          {item.caterer?.name ?? t('common.catererFallback')}
        </Text>
        <View style={styles.subRow}>
          <Text style={styles.bookingSub} numberOfLines={1}>
            {item.event_type}
          </Text>
          <Text style={styles.bookingPrice} numberOfLines={1}>
            {formatBirr(item.total_amount ?? 0)}
          </Text>
        </View>
        <View style={styles.metaCol}>
          <View style={styles.metaRow}>
            <AppIcon name="calendar" size={13} color={colors.textMuted} />
            <Text style={styles.meta} numberOfLines={1}>
              {formatBookingDate(item.event_date)}
              {item.event_time ? ` · ${formatTime12h(item.event_time)}` : ''}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <AppIcon name="users" size={13} color={colors.textMuted} />
            <Text style={styles.meta} numberOfLines={1}>
              {t('det.people', { n: item.guest_count })}
            </Text>
          </View>
        </View>
        <View style={[styles.viewBtn, status === 'Cancelled' && styles.viewBtnMuted]}>
          <AppIcon
            name={actionIcon}
            size={15}
            color={status === 'Cancelled' ? colors.textMuted : colors.primaryDark}
          />
          <Text style={[styles.viewText, status === 'Cancelled' && { color: colors.textMuted }]}>
            {t('booking.viewDetails')}
          </Text>
          <AppIcon
            name="forward"
            size={18}
            color={status === 'Cancelled' ? colors.textMuted : colors.primaryDark}
          />
        </View>
        {status === 'Completed' && onReview ? (
          <Pressable
            onPress={onReview}
            accessibilityRole="button"
            accessibilityLabel={t('det.rateLabel', { name: item.caterer?.name ?? t('common.catererFallback') })}
            style={({ pressed }) => [styles.rateBtn, pressed && { opacity: 0.85 }]}
          >
            <AppIcon name="star" size={15} color={colors.white} filled />
            <Text style={styles.rateText}>{t('det.rate')}</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dish: { width: 210, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 10, marginRight: 12, ...shadow.card },
  dishImg: { width: '100%', height: 120 },
  popBadge: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4 },
  popText: { color: colors.primaryDark, fontSize: 11, fontWeight: '700', marginLeft: 4 },
  dishName: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 8 },
  dishDesc: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 18, minHeight: 54 },
  dishPrice: { fontSize: 17, fontWeight: '800', color: colors.primaryDark, marginTop: 6 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(16,24,20,0.45)', justifyContent: 'flex-end' },
  sheetBackdropTap: { flex: 1 },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%' },
  sheetHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#E2DDD0', alignSelf: 'center', marginTop: 10 },
  sheetBody: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  sheetImg: { width: '100%', height: 220 },
  sheetClose: { position: 'absolute', top: 12, right: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  sheetTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 14 },
  sheetName: { flex: 1, fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.4, marginRight: 12 },
  sheetPrice: { fontSize: 20, fontWeight: '800', color: colors.primaryDark },
  sheetChips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  sheetChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8, marginBottom: 8 },
  sheetChipText: { fontSize: 12.5, fontWeight: '700', color: colors.primaryDark, marginLeft: 5 },
  sheetDesc: { fontSize: 14.5, color: colors.textMuted, marginTop: 10, lineHeight: 21 },
  pkg: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 10, ...shadow.card },
  pkgImg: { width: 64, height: 64 },
  pkgBody: { flex: 1, marginLeft: 10 },
  pkgName: { fontSize: 15, fontWeight: '800', color: colors.text },
  pkgMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  pkgPrice: { fontSize: 16, fontWeight: '800', color: colors.primaryDark, marginTop: 4 },
  pkgChev: { fontSize: 22, color: colors.primaryDark, paddingHorizontal: 4 },
  booking: { flexDirection: 'row', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 10, marginBottom: 12, ...shadow.card },
  bookingImg: { width: 104, height: 132 },
  bookingBody: { flex: 1, marginLeft: 12, minWidth: 0 },
  bookingTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusPill: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 12, fontWeight: '700', marginLeft: 5 },
  bookingName: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 6 },
  subRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  bookingSub: { flex: 1, fontSize: 13, color: colors.textMuted, marginRight: 8 },
  metaCol: { marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  meta: { fontSize: 11.5, color: colors.textMuted, marginLeft: 5, flex: 1 },
  bookingPrice: { fontSize: 15, fontWeight: '800', color: colors.primaryDark },
  viewBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.softGreen, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 9, marginTop: 10 },
  viewBtnMuted: { backgroundColor: '#F1F2F4' },
  viewText: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.primaryDark, marginLeft: 8 },
  rateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryDark, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 11, marginTop: 8 },
  rateText: { flex: 1, fontSize: 14, fontWeight: '800', color: colors.white, marginLeft: 8, textAlign: 'center' },
});

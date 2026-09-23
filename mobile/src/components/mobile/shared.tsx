import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme/colors';
import { useLanguage } from '@/i18n/LanguageContext';
import { AppIcon, type IconName } from './AppIcons';

const FALLBACK_FOOD = require('../../../assets/caterer-zemen.png');

export function FoodImage({
  uri,
  style,
  borderRadius = 12,
}: {
  uri: string | number | null | undefined;
  style?: object;
  borderRadius?: number;
}) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    return <Image source={FALLBACK_FOOD} style={[{ borderRadius }, style]} resizeMode="cover" />;
  }
  if (typeof uri === 'number') {
    return <Image source={uri} style={[{ borderRadius }, style]} resizeMode="cover" />;
  }
  return (
    <Image
      source={{ uri }}
      style={[{ borderRadius }, style]}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel ? (
        <Text onPress={onAction} style={styles.action} accessibilityRole="link">
          {actionLabel} →
        </Text>
      ) : null}
    </View>
  );
}

export function RatingLine({ rating, count }: { rating: number; count: number }) {
  return (
    <View style={styles.ratingRow}>
      <AppIcon name="star" size={15} color={colors.starGold} filled />
      <Text style={styles.value}> {rating.toFixed(1)}</Text>
      <Text style={styles.count}> ({count})</Text>
    </View>
  );
}

export function FavoriteButton({
  active,
  onPress,
  circled = false,
}: {
  active: boolean;
  onPress: () => void;
  circled?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={active ? t('cards.removeFav') : t('cards.addFav')}
      style={({ pressed }) => [circled && styles.favCircle, pressed && { opacity: 0.6 }]}
    >
      <AppIcon
        name="heart"
        size={circled ? 17 : 22}
        color={active ? colors.primary : '#9CA3AF'}
        filled={active}
      />
    </Pressable>
  );
}

export function VerificationBadge() {
  const { t } = useLanguage();
  return (
    <View style={styles.verified}>
      <AppIcon name="badgeCheck" size={14} color={colors.primaryDark} />
      <Text style={styles.verifiedText}>{t('detail.verified')}</Text>
      <AppIcon name="forward" size={14} color={colors.primaryDark} />
    </View>
  );
}

export function StatusBadge({ status }: { status: 'Upcoming' | 'Completed' | 'Cancelled' }) {
  const bg = status === 'Cancelled' ? colors.infoBg : colors.successBg;
  const fg = status === 'Cancelled' ? colors.info : colors.successDark;
  const icon: IconName = status === 'Upcoming' ? 'calendar' : status === 'Completed' ? 'check' : 'clock';
  return (
    <View style={[styles.status, { backgroundColor: bg }]}>
      <AppIcon name={icon} size={13} color={fg} />
      <Text style={[styles.statusText, { color: fg }]}>{status}</Text>
    </View>
  );
}

export function EmptyStateBlock({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <AppIcon name="calendar" size={30} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{subtitle}</Text>
      {actionLabel ? (
        <Text onPress={onAction} style={styles.emptyAction}>
          {actionLabel}
        </Text>
      ) : null}
    </View>
  );
}

export function SkeletonCard({ imageHeight = 150 }: { imageHeight?: number }) {
  return (
    <View style={styles.skel}>
      <View style={[styles.skelImg, { height: imageHeight }]} />
      <View style={styles.skelLine} />
      <View style={[styles.skelLine, { width: '60%' }]} />
      <View style={[styles.skelBtn]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 19, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },
  action: { fontSize: 13, fontWeight: '700', color: colors.primary },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  value: { color: colors.text, fontWeight: '800', fontSize: 15 },
  count: { color: colors.textMuted, fontWeight: '400', fontSize: 13 },
  favCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.softGreen,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  verifiedText: { color: colors.primaryDark, fontWeight: '700', fontSize: 13, marginHorizontal: 6 },
  status: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  statusText: { fontSize: 13, fontWeight: '700', marginLeft: 6 },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.softGreen, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  emptyAction: { marginTop: 14, backgroundColor: colors.primary, color: colors.white, fontWeight: '700', paddingHorizontal: 22, paddingVertical: 12, borderRadius: radius.pill, overflow: 'hidden' },
  skel: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 14 },
  skelImg: { backgroundColor: '#ECEBE6', borderRadius: 12 },
  skelLine: { height: 12, backgroundColor: '#ECEBE6', borderRadius: 6, marginTop: 10 },
  skelBtn: { height: 44, backgroundColor: '#E4EFE6', borderRadius: radius.pill, marginTop: 12 },
});

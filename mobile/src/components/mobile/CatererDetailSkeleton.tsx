import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';
import { colors, radius, shadow } from '@/theme/colors';

/**
 * Professional shimmer skeleton for the caterer detail page.
 * Mirrors the real layout 1:1 so there is no layout shift when data arrives:
 * hero (162) → identity row (88 logo overlapping -34) → tagline → meta →
 * badges → about card → tabs → popular dishes → custom packages → CTA.
 *
 * Expo SDK 57 compatible: uses only react-native Animated (no native deps).
 */

const BONE = '#E7E3D8';
const BONE_SOFT = '#EFEBE1';
const SHINE = 'rgba(255,255,255,0.85)';

function useShimmer(duration = 1300) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress, duration]);
  return progress;
}

function Bone({
  width,
  height,
  borderRadius = 6,
  style,
  progress,
  shimmerWidth = 90,
}: {
  width: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
  progress: Animated.Value;
  shimmerWidth?: number;
}) {
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-shimmerWidth, shimmerWidth * 3.2],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.55, 1, 0.55],
  });
  return (
    <Animated.View style={[{ width, height, borderRadius, backgroundColor: BONE, opacity, overflow: 'hidden' }, style]}>
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: shimmerWidth,
          backgroundColor: SHINE,
          opacity: 0.55,
          transform: [{ translateX }, { skewX: '-12deg' }],
        }}
      />
    </Animated.View>
  );
}

function DishSkeleton({ progress }: { progress: Animated.Value }) {
  return (
    <View style={skel.dish}>
      <Bone width="100%" height={120} borderRadius={14} progress={progress} shimmerWidth={70} />
      <Bone width="78%" height={15} borderRadius={6} style={{ marginTop: 10 }} progress={progress} shimmerWidth={70} />
      <Bone width="100%" height={11} borderRadius={6} style={{ marginTop: 8 }} progress={progress} shimmerWidth={70} />
      <Bone width="86%" height={11} borderRadius={6} style={{ marginTop: 6 }} progress={progress} shimmerWidth={70} />
      <Bone width="45%" height={16} borderRadius={6} style={{ marginTop: 8 }} progress={progress} shimmerWidth={70} />
      <View style={skel.dishBtn}>
        <Bone width={86} height={12} borderRadius={6} progress={progress} shimmerWidth={50} />
      </View>
    </View>
  );
}

function PackageSkeleton({ progress }: { progress: Animated.Value }) {
  return (
    <View style={skel.pkg}>
      <Bone width={64} height={64} borderRadius={12} progress={progress} shimmerWidth={40} />
      <View style={skel.pkgBody}>
        <Bone width="72%" height={14} borderRadius={6} progress={progress} shimmerWidth={60} />
        <Bone width="55%" height={11} borderRadius={6} style={{ marginTop: 7 }} progress={progress} shimmerWidth={60} />
        <Bone width="38%" height={14} borderRadius={6} style={{ marginTop: 7 }} progress={progress} shimmerWidth={60} />
      </View>
      <Bone width={14} height={22} borderRadius={7} progress={progress} shimmerWidth={20} />
    </View>
  );
}

export function CatererDetailSkeleton() {
  const progress = useShimmer(1350);
  return (
    <View
      accessible
      accessibilityLabel="Loading caterer details"
      accessibilityRole="progressbar"
      style={skel.flex}
    >
      {/* Hero — same 162 height + rounded bottom as real page */}
      <View style={skel.heroWrap}>
        <View style={skel.heroBase}>
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: BONE_SOFT,
              opacity: progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.5] }),
            }}
          />
        </View>
        <View style={skel.heroTop}>
          <View style={skel.circleBtn} />
          <View style={skel.heroTopRight}>
            <View style={skel.circleBtn} />
            <View style={skel.circleBtn} />
          </View>
        </View>
      </View>

      {/* Identity — overlaps hero by -34 exactly like real page */}
      <View style={skel.pad}>
        <View style={skel.identityRow}>
          <View style={skel.logoWrap}>
            <View style={skel.logo} />
          </View>
          <View style={skel.identityText}>
            <Bone width="82%" height={24} borderRadius={7} progress={progress} />
            <Bone width="48%" height={13} borderRadius={6} style={{ marginTop: 8 }} progress={progress} />
          </View>
        </View>

        {/* Tagline */}
        <Bone width="92%" height={14} borderRadius={6} style={{ marginTop: 12 }} progress={progress} />
        <Bone width="64%" height={14} borderRadius={6} style={{ marginTop: 7 }} progress={progress} />

        {/* Meta row: rating | location | verified */}
        <View style={skel.metaRow}>
          <Bone width={118} height={15} borderRadius={7} progress={progress} shimmerWidth={50} />
          <View style={skel.metaDiv} />
          <Bone width={104} height={15} borderRadius={7} progress={progress} shimmerWidth={50} />
          <View style={skel.metaDiv} />
          <Bone width={112} height={15} borderRadius={7} progress={progress} shimmerWidth={50} />
        </View>

        {/* Badges */}
        <View style={skel.badgeRow}>
          <View style={skel.badge} />
          <View style={skel.badge} />
          <View style={[skel.badge, { width: 118 }]} />
        </View>

        {/* About — transparent + dashed to match real section */}
        <View style={skel.about}>
          <View style={skel.aboutHeader}>
            <View style={skel.aboutIcon} />
            <Bone width={110} height={17} borderRadius={7} progress={progress} shimmerWidth={60} />
          </View>
          <Bone width="100%" height={13} borderRadius={6} style={{ marginTop: 12 }} progress={progress} />
          <Bone width="100%" height={13} borderRadius={6} style={{ marginTop: 7 }} progress={progress} />
          <Bone width="78%" height={13} borderRadius={6} style={{ marginTop: 7 }} progress={progress} />
          <Bone width={86} height={13} borderRadius={6} style={{ marginTop: 12 }} progress={progress} shimmerWidth={50} />
        </View>

        {/* Tabs — 4 tabs with underline slot */}
        <View style={skel.tabs}>
          {(['Menu', 'Gallery', 'Reviews', 'Contact'] as const).map((t, i) => (
            <View key={t} style={skel.tab}>
              <Bone
                width={i === 0 ? 44 : i === 2 ? 58 : 52}
                height={14}
                borderRadius={6}
                progress={progress}
                shimmerWidth={36}
              />
              <View style={[skel.tabUnderline, i === 0 && skel.tabUnderlineActive]} />
            </View>
          ))}
        </View>

        {/* Popular dishes */}
        <View style={skel.sectionHead}>
          <Bone width={150} height={21} borderRadius={7} progress={progress} />
          <Bone width={64} height={13} borderRadius={6} progress={progress} shimmerWidth={40} />
        </View>
        <View style={skel.hRow}>
          <DishSkeleton progress={progress} />
          <DishSkeleton progress={progress} />
        </View>

        {/* Custom packages header */}
        <View style={skel.pkgHead}>
          <View style={skel.pkgIcon} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Bone width={150} height={19} borderRadius={7} progress={progress} />
            <Bone width="88%" height={12} borderRadius={6} style={{ marginTop: 7 }} progress={progress} />
          </View>
          <Bone width={64} height={13} borderRadius={6} progress={progress} shimmerWidth={40} />
        </View>
        <View style={skel.pkgList}>
          <PackageSkeleton progress={progress} />
          <View style={{ height: 10 }} />
          <PackageSkeleton progress={progress} />
        </View>

        {/* CTA */}
        <View style={skel.cta} />
        <View style={{ height: 8 }} />
      </View>
    </View>
  );
}

const skel = StyleSheet.create({
  flex: { flex: 1 },
  pad: { paddingHorizontal: 20 },
  heroWrap: {
    height: 162,
    backgroundColor: BONE_SOFT,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  heroBase: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: BONE_SOFT } as const,
  heroTop: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroTopRight: { flexDirection: 'row' },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFEDE6',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#E3DFD3',
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', marginTop: -34 },
  logoWrap: { marginTop: -20 },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: BONE,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  identityText: { flex: 1, marginLeft: 12, paddingTop: 34 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  metaDiv: { width: 1, height: 14, backgroundColor: colors.border, marginHorizontal: 8 },
  badgeRow: { flexDirection: 'row', paddingVertical: 12 },
  badge: {
    width: 132,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: BONE_SOFT,
    borderWidth: 1,
    borderColor: '#E3DFD3',
    marginRight: 8,
  },
  about: {
    backgroundColor: 'transparent',
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  aboutHeader: { flexDirection: 'row', alignItems: 'center' },
  aboutIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: BONE_SOFT, marginRight: 10, opacity: 0.7 },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: { alignItems: 'center', paddingBottom: 0 },
  tabUnderline: { height: 3, width: 32, borderRadius: 2, marginTop: 10, backgroundColor: 'transparent' },
  tabUnderlineActive: { backgroundColor: BONE },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 10 },
  hRow: { flexDirection: 'row', marginHorizontal: -20, paddingHorizontal: 20 },
  dish: {
    width: 210,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 10,
    marginRight: 12,
    ...shadow.card,
  },
  dishBtn: {
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: BONE_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  pkgHead: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 20, marginBottom: 10 },
  pkgIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: BONE_SOFT },
  pkgList: { paddingVertical: 4 },
  pkg: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 10,
    ...shadow.card,
  },
  pkgBody: { flex: 1, marginLeft: 10, marginRight: 8 },
  cta: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: BONE,
    marginTop: 20,
  },
});

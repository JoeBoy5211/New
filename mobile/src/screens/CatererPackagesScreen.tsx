import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCatererById } from '@/hooks/useCaterers';
import { usePackagesByCaterer } from '@/hooks/usePackages';
import { BottomNav } from '@/components/mobile/BottomNav';
import { EmptyStateBlock } from '@/components/mobile/shared';
import { useLanguage, type Translate } from '@/i18n/LanguageContext';
import { AppIcon } from '@/components/mobile/AppIcons';
import { formatBirr } from '@/lib/format';
import type { RootScreenProps } from '@/navigation/types';
import type { Package } from '@/types/domain';

// Spec palette (§7) — page-local, BottomNav untouched.
const BG = '#F5F7F4';
const SURFACE = '#FFFFFF';
const INK = '#172126';
const SECONDARY = '#68767A';
const MUTED = '#8B9698';
const LINE = '#E4E9E5';
const GREEN = '#168A55';
const GREEN_DARK = '#0C7045';
const GREEN_SOFT = '#EAF7F0';

const PREVIEW_COUNT = 4;

function guestLabel(pkg: Package, t: Translate): string {
  if (pkg.min_guests || pkg.max_guests)
    return t('pkg.guestsRange', { min: pkg.min_guests ?? '', max: pkg.max_guests ?? '' });
  return t('pkg.flexible');
}

function dishLabel(count: number, t: Translate): string {
  if (count === 0) return t('pkg.setMenu');
  return count === 1 ? t('pkg.dishOne') : t('pkg.dishesMany', { n: count });
}

function PackageCard({
  pkg,
  expanded,
  onToggleMore,
}: {
  pkg: Package;
  expanded: boolean;
  onToggleMore: () => void;
}) {
  const { t } = useLanguage();
  const includes = pkg.includes ?? [];
  const images = (pkg.images ?? []).filter(Boolean);
  const cover = images[0] ?? null;
  const visible = expanded ? includes : includes.slice(0, PREVIEW_COUNT);
  const hidden = includes.length - visible.length;

  return (
    <View style={styles.card}>
      {cover ? (
        <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <View style={styles.coverPlaceholder} accessibilityLabel={t('pkgs.noPhoto')}>
          <View style={styles.placeholderIcon}>
            <AppIcon name="cloche" size={30} color={GREEN_DARK} />
          </View>
          <Text style={styles.placeholderText} numberOfLines={1}>
            {pkg.name}
          </Text>
        </View>
      )}
      {images.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
          {images.slice(1, 6).map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.thumb} resizeMode="cover" />
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} accessibilityRole="header">
            {pkg.name}
          </Text>
          <Text style={styles.price}>{formatBirr(pkg.price)}</Text>
        </View>

        <View style={styles.metaRow}>
          <AppIcon name="users" size={14} color={SECONDARY} />
          <Text style={styles.meta}> {guestLabel(pkg, t)}</Text>
          <Text style={styles.metaDot}>  ·  </Text>
          <AppIcon name="utensils" size={14} color={SECONDARY} />
          <Text style={styles.meta}> {dishLabel(includes.length, t)}</Text>
        </View>

        {!!pkg.description && <Text style={styles.desc}>{pkg.description}</Text>}

        {includes.length > 0 ? (
          <View style={styles.includes}>
            <Text style={styles.includesEyebrow}>{t('pkgs.included')}</Text>
            {visible.map((item) => (
              <View key={item} style={styles.includeRow}>
                <AppIcon name="check" size={14} color={GREEN_DARK} />
                <Text style={styles.includeText}>{item}</Text>
              </View>
            ))}
            {hidden > 0 || expanded ? (
              <Pressable
                onPress={onToggleMore}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                accessibilityLabel={
                  expanded ? t('detail.showLess') : t('pkgs.more', { n: hidden })
                }
                hitSlop={8}
                style={({ pressed }) => [styles.moreBtn, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.moreText}>{expanded ? t('detail.showLess') : t('pkgs.more', { n: hidden })}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function PackageSkeleton() {
  const { t } = useLanguage();
  return (
    <View style={styles.card} accessibilityLabel={t('pkgs.loading')}>
      <View style={styles.skelCover} />
      <View style={styles.body}>
        <View style={styles.skelLine} />
        <View style={[styles.skelLine, styles.skelShort]} />
        <View style={[styles.skelLine, styles.skelLong]} />
      </View>
    </View>
  );
}

export default function CatererPackagesScreen({ route, navigation }: RootScreenProps<'CatererPackages'>) {
  const { catererId } = route.params;
  const { width } = useWindowDimensions();
  const { data: caterer } = useCatererById(catererId);
  const { data: packages, isLoading, error, refetch } = usePackagesByCaterer(catererId);
  const { t } = useLanguage();
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const list = packages ?? [];
  const twoCol = width >= 720;

  const toggleMore = (id: string) => setExpandedIds((s) => ({ ...s, [id]: !s[id] }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.flex}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Pressable
                onPress={() => navigation.goBack()}
                accessibilityRole="button"
                accessibilityLabel={t('common.goBack')}
                hitSlop={10}
                style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
              >
                <AppIcon name="back" size={20} color={INK} />
              </Pressable>
              <View style={styles.headerText}>
                <Text style={styles.eyebrow}>{t('pkgs.eyebrow')}</Text>
                <Text style={styles.caterer} numberOfLines={2} accessibilityRole="header">
                  {caterer?.name ?? t('pkgs.fallbackTitle')}
                </Text>
                <Text style={styles.meta_line}>
                  {list.length > 0
                    ? list.length === 1 ? t('pkgs.countOne') : t('pkgs.countMany', { n: list.length })
                    : t('pkgs.curated')}
                </Text>
              </View>
            </View>

            {isLoading ? (
              <View style={[styles.grid, twoCol && styles.gridTwo]}>
                {[0, 1].map((i) => (
                  <View key={i} style={[styles.gridItem, twoCol && styles.gridItemTwo]}>
                    <PackageSkeleton />
                  </View>
                ))}
              </View>
            ) : error ? (
              <EmptyStateBlock
                title={t('pkgs.loadFail')}
                subtitle={t('pkgs.loadFailSub')}
                actionLabel={t('pkgs.tryAgain')}
                onAction={() => refetch()}
              />
            ) : list.length === 0 ? (
              <EmptyStateBlock
                title={t('pkgs.empty')}
                subtitle={t('pkgs.emptySub')}
              />
            ) : (
              <View style={[styles.grid, twoCol && styles.gridTwo]}>
                {list.map((pkg) => (
                  <View key={pkg.id} style={[styles.gridItem, twoCol && styles.gridItemTwo]}>
                    <PackageCard
                      pkg={pkg}
                      expanded={!!expandedIds[pkg.id]}
                      onToggleMore={() => toggleMore(pkg.id)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
        <BottomNav active="Home" onNavigate={(r) => navigation.navigate('MainTabs', { screen: r })} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 150 },
  container: { width: '100%', maxWidth: 1080, alignSelf: 'center' },

  header: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 12, marginBottom: 28 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: SURFACE,
    borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  headerText: { flex: 1, marginLeft: 12 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1.4, color: SECONDARY },
  caterer: { fontSize: 34, fontWeight: '700', letterSpacing: -1.2, color: INK, marginTop: 6, lineHeight: 38 },
  meta_line: { fontSize: 15, fontWeight: '500', color: SECONDARY, marginTop: 6 },

  grid: { marginHorizontal: 0 },
  gridTwo: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { marginBottom: 18 },
  gridItemTwo: { width: '48.6%' },

  card: { backgroundColor: SURFACE, borderRadius: 22, borderWidth: 1, borderColor: LINE, overflow: 'hidden' },
  cover: { width: '100%', aspectRatio: 16 / 10 },
  coverPlaceholder: {
    width: '100%', aspectRatio: 16 / 10, backgroundColor: GREEN_SOFT,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24,
  },
  placeholderIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: SURFACE,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: LINE,
  },
  placeholderText: { fontSize: 14, fontWeight: '700', color: GREEN_DARK, marginTop: 10 },
  thumbs: { paddingHorizontal: 20, paddingTop: 12 },
  thumb: { width: 56, height: 56, borderRadius: 12, marginRight: 8 },

  body: { padding: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { flex: 1, fontSize: 22, fontWeight: '700', letterSpacing: -0.4, color: INK, marginRight: 12, lineHeight: 27 },
  price: { fontSize: 20, fontWeight: '700', color: GREEN, letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 8 },
  meta: { fontSize: 13.5, fontWeight: '500', color: SECONDARY },
  metaDot: { fontSize: 13.5, color: MUTED },
  desc: { fontSize: 14.5, color: SECONDARY, marginTop: 10, lineHeight: 22 },

  includes: { marginTop: 16 },
  includesEyebrow: { fontSize: 11.5, fontWeight: '700', letterSpacing: 1.2, color: MUTED },
  includeRow: {
    flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 9,
    borderBottomWidth: 1, borderBottomColor: LINE,
  },
  includeText: { flex: 1, fontSize: 14, color: INK, marginLeft: 10, lineHeight: 20 },
  moreBtn: {
    minHeight: 44, justifyContent: 'center', alignItems: 'flex-start', paddingTop: 4,
  },
  moreText: { fontSize: 13.5, fontWeight: '700', color: GREEN_DARK },

  skelCover: { width: '100%', aspectRatio: 16 / 10, backgroundColor: '#E7ECE8' },
  skelLine: { height: 14, borderRadius: 7, backgroundColor: '#E7ECE8', marginTop: 12 },
  skelShort: { width: '55%' },
  skelLong: { width: '85%' },
});

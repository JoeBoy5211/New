import { useEffect, useRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '@/theme/colors';
import { useLanguage, type Translate } from '@/i18n/LanguageContext';
import { AppIcon, type IconName } from './AppIcons';
import { formatBirr } from '@/lib/format';

export type SortKey = 'rating' | 'priceLow' | 'priceHigh' | 'reviews';
export type FilterSection = 'price' | 'rating' | 'location' | 'sort';

export interface PriceOption {
  value: number | null;
  label: string;
  hint: string;
}

export function getPriceOptions(t: Translate): PriceOption[] {
  return [
    { value: null, label: t('filters.priceAny'), hint: t('filters.priceAnyHint') },
    { value: 300, label: t('filters.upTo', { price: formatBirr(300) }), hint: t('filters.budgetHint') },
    { value: 500, label: t('filters.upTo', { price: formatBirr(500) }), hint: t('filters.popularHint') },
    { value: 1000, label: t('filters.upTo', { price: formatBirr(1000) }), hint: t('filters.premiumHint') },
  ];
}

export interface RatingOption {
  value: number | null;
  label: string;
  hint: string;
}

export function getRatingOptions(t: Translate): RatingOption[] {
  return [
    { value: null, label: t('filters.ratingAny'), hint: t('filters.ratingAnyHint') },
    { value: 4.0, label: '4.0+', hint: t('filters.goodHint') },
    { value: 4.5, label: '4.5+', hint: t('filters.highHint') },
    { value: 4.8, label: '4.8+', hint: t('filters.topHint') },
  ];
}

export interface SortOption {
  value: SortKey;
  label: string;
  hint: string;
  icon: IconName;
}

export function getSortOptions(t: Translate): SortOption[] {
  return [
    { value: 'rating', label: t('filters.recommended'), hint: t('filters.recommendedHint'), icon: 'star' },
    { value: 'reviews', label: t('filters.mostReviewed'), hint: t('filters.mostReviewedHint'), icon: 'users' },
    { value: 'priceLow', label: t('filters.priceLow'), hint: t('filters.priceLowHint'), icon: 'sort' },
    { value: 'priceHigh', label: t('filters.priceHigh'), hint: t('filters.priceHighHint'), icon: 'sort' },
  ];
}

export function priceLabel(priceMax: number | null, t: Translate): string {
  if (priceMax == null) return t('search.price');
  return t('filters.upTo', { price: formatBirr(priceMax) });
}

export function ratingLabel(minRating: number | null, t: Translate): string {
  if (minRating == null) return t('search.rating');
  return `${minRating.toFixed(1)}+`;
}

export function sortLabel(sort: SortKey, t: Translate): string {
  const found = getSortOptions(t).find((o) => o.value === sort);
  return found ? found.label : t('filters.recommended');
}

function OptionRow({
  selected,
  title,
  hint,
  onPress,
  accessibilityLabel,
  left,
}: {
  selected: boolean;
  title: string;
  hint: string;
  onPress: () => void;
  accessibilityLabel: string;
  left?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && { opacity: 0.7 }]}
    >
      {left ? <View style={styles.optionLeft}>{left}</View> : null}
      <View style={styles.optionText}>
        <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>{title}</Text>
        <Text style={styles.optionHint}>{hint}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <AppIcon name="check" size={14} color={colors.white} /> : null}
      </View>
    </Pressable>
  );
}

export function FilterSheet({
  visible,
  initialSection,
  priceMax,
  minRating,
  location,
  sort,
  locations,
  resultCount,
  onChange,
  onClearAll,
  onClose,
}: {
  visible: boolean;
  initialSection: FilterSection | null;
  priceMax: number | null;
  minRating: number | null;
  location: string;
  sort: SortKey;
  locations: string[];
  resultCount: number;
  onChange: (patch: { priceMax?: number | null; minRating?: number | null; location?: string; sort?: SortKey }) => void;
  onClearAll: () => void;
  onClose: () => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const yBySection = useRef<Partial<Record<FilterSection, number>>>({});
  const { t } = useLanguage();
  const priceOptions = getPriceOptions(t);
  const ratingOptions = getRatingOptions(t);
  const sortOptions = getSortOptions(t);

  useEffect(() => {
    if (visible && initialSection) {
      const t = setTimeout(() => {
        const y = yBySection.current[initialSection];
        if (y != null) scrollRef.current?.scrollTo({ y: Math.max(y - 8, 0), animated: true });
      }, 120);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [visible, initialSection]);

  const activeCount =
    (priceMax != null ? 1 : 0) + (minRating != null ? 1 : 0) + (location !== 'All' ? 1 : 0);
  const showCountText = resultCount === 1 ? t('filters.showOne') : t('filters.showMany', { n: resultCount });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={onClose} accessibilityLabel="Close filters" />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>{activeCount > 0 ? t('filters.titleCount', { n: activeCount }) : t('filters.title')}</Text>
              <Text style={styles.headerSub}>{t('filters.sub')}</Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t('filters.closeFilters')}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
            >
              <AppIcon name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            <View
              onLayout={(e) => {
                yBySection.current.price = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.sectionTitle}>{t('filters.priceRange')}</Text>
              <Text style={styles.sectionSub}>{t('filters.priceSub')}</Text>
              <View style={styles.options}>
                {priceOptions.map((o) => (
                  <OptionRow
                    key={o.label}
                    selected={priceMax === o.value}
                    title={o.label}
                    hint={o.hint}
                    accessibilityLabel={o.label}
                    onPress={() => onChange({ priceMax: o.value })}
                    left={<AppIcon name="tag" size={17} color={priceMax === o.value ? colors.primaryDark : colors.textMuted} />}
                  />
                ))}
              </View>
            </View>

            <View
              onLayout={(e) => {
                yBySection.current.rating = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.sectionTitle}>{t('filters.ratingSection')}</Text>
              <Text style={styles.sectionSub}>{t('filters.ratingSub')}</Text>
              <View style={styles.options}>
                {ratingOptions.map((o) => (
                  <OptionRow
                    key={o.label}
                    selected={minRating === o.value}
                    title={o.label}
                    hint={o.hint}
                    accessibilityLabel={o.label}
                    onPress={() => onChange({ minRating: o.value })}
                    left={
                      <AppIcon
                        name="star"
                        size={17}
                        color={minRating === o.value ? colors.starGold : colors.textFaint}
                        filled
                      />
                    }
                  />
                ))}
              </View>
            </View>

            <View
              onLayout={(e) => {
                yBySection.current.location = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.sectionTitle}>{t('filters.locationSection')}</Text>
              <Text style={styles.sectionSub}>{t('filters.locationSub')}</Text>
              <View style={styles.locWrap}>
                {locations.map((loc) => {
                  const selected = location === loc;
                  const label = loc === 'All' ? t('cuisines.All') : loc;
                  return (
                    <Pressable
                      key={loc}
                      onPress={() => onChange({ location: loc })}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={label}
                      style={({ pressed }) => [styles.locChip, selected && styles.locChipSelected, pressed && { opacity: 0.75 }]}
                    >
                      <AppIcon name="pin" size={14} color={selected ? colors.primaryDark : colors.textMuted} />
                      <Text style={[styles.locText, selected && styles.locTextSelected]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View
              onLayout={(e) => {
                yBySection.current.sort = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.sectionTitle}>{t('filters.sortBy')}</Text>
              <Text style={styles.sectionSub}>{t('filters.sortSub')}</Text>
              <View style={styles.options}>
                {sortOptions.map((o) => (
                  <OptionRow
                    key={o.value}
                    selected={sort === o.value}
                    title={o.label}
                    hint={o.hint}
                    accessibilityLabel={o.label}
                    onPress={() => onChange({ sort: o.value })}
                    left={<AppIcon name={o.icon} size={17} color={sort === o.value ? colors.primaryDark : colors.textMuted} />}
                  />
                ))}
              </View>
            </View>
            <View style={{ height: 8 }} />
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={onClearAll}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('common.clearAll')}
              style={({ pressed }) => pressed && { opacity: 0.6 }}
            >
              <Text style={styles.clearText}>{t('common.clearAll')}</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={showCountText}
              style={({ pressed }) => [styles.applyBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.applyText}>
                {showCountText}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(16,24,20,0.45)', justifyContent: 'flex-end' },
  backdropTap: { flex: 1 },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%' },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#E2DDD0', alignSelf: 'center', marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F3F1EA', alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 20, paddingBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 18 },
  sectionSub: { fontSize: 13, color: colors.textMuted, marginTop: 3, lineHeight: 18 },
  options: { marginTop: 10 },
  option: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8, backgroundColor: colors.surface },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionLeft: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  optionText: { flex: 1, marginLeft: 10 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  optionTitleSelected: { color: colors.primaryDark },
  optionHint: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: '#CFC9B8', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  radioSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  locWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  locChip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8, marginBottom: 8, backgroundColor: colors.surface },
  locChipSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  locText: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginLeft: 6 },
  locTextSelected: { color: colors.primaryDark, fontWeight: '800' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.border },
  clearText: { fontSize: 15, fontWeight: '700', color: colors.textMuted },
  applyBtn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 26, paddingVertical: 14 },
  applyText: { color: colors.white, fontWeight: '800', fontSize: 15 },
});

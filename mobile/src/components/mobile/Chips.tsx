import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '@/theme/colors';
import { CUISINES } from '@/constants/app';
import { useLanguage } from '@/i18n/LanguageContext';
import { AppIcon, type IconName } from './AppIcons';

export { CUISINES };

const CUISINE_ICONS: Record<string, IconName> = {
  All: 'leaf',
  Ethiopian: 'pot',
  Italian: 'pizza',
  Indian: 'salad',
  Chinese: 'bowl',
  Mexican: 'sandwich',
};

export function CuisineChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { t } = useLanguage();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={t('chips.filterBy', { label })}
      hitSlop={6}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.75 }]}
    >
      <AppIcon
        name={CUISINE_ICONS[label] ?? 'bowl'}
        size={16}
        color={active ? colors.white : colors.primaryDark}
      />
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </Pressable>
  );
}

export function FilterChip({
  label,
  icon,
  active,
  onPress,
  chevron = true,
}: {
  label: string;
  icon: IconName;
  active?: boolean;
  onPress?: () => void;
  chevron?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={6}
      style={({ pressed }) => [
        styles.filter,
        active && styles.filterActive,
        pressed && { opacity: 0.75 },
      ]}
    >
      <AppIcon name={icon} size={15} color={colors.primaryDark} filled={false} />
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
      {chevron ? (
        <AppIcon name="chevronDown" size={14} color={colors.primaryDark} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E8E6DC',
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    height: 38,
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { fontSize: 13, fontWeight: '500', color: '#1F2937', marginLeft: 6 },
  textActive: { color: colors.white, fontWeight: '700' },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E8E6DC',
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    height: 38,
    marginRight: 8,
  },
  filterActive: { borderColor: colors.primary, backgroundColor: colors.softGreen },
  filterText: { fontSize: 13, color: '#4B5563', marginHorizontal: 6, fontWeight: '500' },
  filterTextActive: { color: colors.primaryDark, fontWeight: '700' },
});

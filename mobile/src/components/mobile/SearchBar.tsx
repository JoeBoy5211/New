import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors } from '@/theme/colors';
import { useLanguage } from '@/i18n/LanguageContext';
import { AppIcon } from './AppIcons';

export function SearchBar({
  value,
  onChangeText,
  onFilterPress,
  placeholder,
}: {
  value: string;
  onChangeText: (t: string) => void;
  onFilterPress?: () => void;
  placeholder?: string;
}) {
  const { t } = useLanguage();
  const ph = placeholder ?? t('search.placeholder');
  return (
    <View style={styles.wrap}>
      <AppIcon name="search" size={20} color={colors.primaryDark} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={ph}
        placeholderTextColor="#9AA3A8"
        style={styles.input}
        returnKeyType="search"
        accessibilityLabel={t('search.label')}
      />
      <View style={styles.divider} />
      <Pressable
        onPress={onFilterPress}
        hitSlop={12}
        accessibilityLabel={t('search.openFilters')}
        accessibilityRole="button"
        style={({ pressed }) => pressed && { opacity: 0.6 }}
      >
        <AppIcon name="sliders" size={20} color={colors.primaryDark} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E8E6DC',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 50,
  },
  input: { flex: 1, marginLeft: 10, fontSize: 14, color: colors.text, paddingVertical: 0 },
  divider: { width: 1, height: 24, backgroundColor: '#E8E6DC', marginHorizontal: 12 },
});

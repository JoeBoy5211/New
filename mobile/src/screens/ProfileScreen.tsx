import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { CalendarDays, Camera, ChevronRight, LogOut, Mail, Phone, User } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { avatarUrlFromAuthUser } from '@/services/profiles';
import { isCloudinaryConfigured, uploadToCloudinary } from '@/lib/cloudinary';
import { supabase } from '@/lib/supabase';
import type { TabScreenProps } from '@/navigation/types';

// Local palette for the Account page only (global theme untouched).
// Matches the redesign guide §13 while staying close to the existing brand green.
const BG = '#F7F9F7';
const SURFACE = '#FFFFFF';
const BORDER = '#E3E9E5';
const TEXT = '#14232A';
const MUTED = '#64747A';
const PRIMARY = '#16A05D';
const PRIMARY_DARK = '#087443';
const PRIMARY_TINT = '#EAF8F0';
const PRIMARY_TINT_BORDER = '#C8E9D5';
const DANGER = '#D64545';
const DANGER_BG = '#FEF2F2';
const DANGER_BORDER = '#F3C2C2';

export default function ProfileScreen({ navigation }: TabScreenProps<'Profile'>) {
  const { profile, user, logout, updateName } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();

  const displayName = profile?.name?.trim() ? profile.name : '—';
  const email = profile?.email ?? user?.email ?? null;
  const phone = profile?.phone ?? (user?.phone as string | undefined) ?? null;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(language === 'am' ? 'am-ET' : undefined, { month: 'short', year: 'numeric' })
    : '—';
  const initial = (profile?.name?.trim() ?? 'U').charAt(0).toUpperCase();
  // Live Google photo fallback — shows instantly even before the DB backfill lands.
  const avatarUri = profile?.avatar_url || avatarUrlFromAuthUser(user);

  const handleLogout = () => {
    Alert.alert(t('profile.signoutTitle'), t('profile.signoutMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.signout'), style: 'destructive', onPress: async () => { await logout(); navigation.getParent()?.reset({ index: 0, routes: [{ name: 'PhoneAuth' }] }); } },
    ]);
  };

  const handlePickAvatar = async () => {
    if (!isCloudinaryConfigured()) {
      Alert.alert('Cloudinary not configured', 'Set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET in mobile/.env (same preset as New/frontend).');
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('profile.permTitle'), t('profile.permMsg'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled) return;
    const uri = result.assets[0]?.uri;
    if (!uri) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(uri, 'catering_app/avatars');
      if (!user) throw new Error('Not signed in');
      const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('user_id', user.id);
      if (error) throw error;
      Alert.alert(t('profile.avatarOk'), t('profile.avatarOkMsg'));
    } catch (e) {
      Alert.alert(t('profile.uploadFail'), e instanceof Error ? e.message : t('profile.uploadFailMsg'));
    } finally {
      setUploading(false);
    }
  };

  const openEdit = () => {
    setNameDraft(profile?.name ?? '');
    setSaveError(undefined);
    setEditing(true);
  };

  const handleSaveName = async () => {
    const trimmed = nameDraft.trim();
    if (trimmed.length < 2) {
      setSaveError(t('setup.errName'));
      return;
    }
    setSaveError(undefined);
    setSaving(true);
    const result = await updateName(trimmed);
    setSaving(false);
    if (result.success) {
      setEditing(false);
    } else {
      setSaveError(result.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('profile.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('profile.sub')}</Text>
          </View>

          {/* Identity card */}
          <View style={styles.identityCard}>
            <View style={styles.identityRow}>
              <Pressable
                onPress={handlePickAvatar}
                disabled={uploading}
                accessibilityRole="button"
                accessibilityLabel={t('profile.changePhoto')}
                style={({ pressed }) => [styles.avatarPress, pressed && { opacity: 0.75 }]}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>
                )}
                <View style={styles.avatarEditFab}>
                  {uploading ? (
                    <ActivityIndicator size="small" color={TEXT} />
                  ) : (
                    <Camera size={13} color={TEXT} strokeWidth={2.2} />
                  )}
                </View>
              </Pressable>

              <View style={styles.identityInfo}>
                <Text style={styles.identityName} numberOfLines={1} ellipsizeMode="tail">
                  {displayName}
                </Text>
                {email ? (
                  <Text style={styles.identityEmail} numberOfLines={1} ellipsizeMode="tail">
                    {email}
                  </Text>
                ) : phone ? (
                  <Text style={styles.identityEmail} numberOfLines={1} ellipsizeMode="tail">
                    {phone}
                  </Text>
                ) : null}
                <View style={styles.memberRow}>
                  <CalendarDays size={12} color={MUTED} strokeWidth={2} />
                  <Text style={styles.memberText}>{t('profile.memberSince', { date: memberSince })}</Text>
                </View>
              </View>
            </View>

            {editing ? (
              <View style={styles.editBox}>
                <Text style={styles.editLabel}>{t('profile.fullName')}</Text>
                <TextInput
                  value={nameDraft}
                  onChangeText={(t) => {
                    setNameDraft(t);
                    setSaveError(undefined);
                  }}
                  placeholder={t('profile.namePh')}
                  placeholderTextColor="#9AA5AB"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                  style={[styles.editInput, saveError ? styles.editInputError : null]}
                />
                {saveError ? <Text style={styles.editError}>{saveError}</Text> : null}
                <View style={styles.editActions}>
                  <Pressable
                    onPress={() => setEditing(false)}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel={t('profile.cancelEdit')}
                    style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
                  >
                    <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveName}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel={t('profile.saveName')}
                    style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.6 }]}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={SURFACE} />
                    ) : (
                      <Text style={styles.saveBtnText}>{t('common.save')}</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={openEdit}
                accessibilityRole="button"
                accessibilityLabel={t('profile.editProfileLabel')}
                style={({ pressed }) => [styles.editProfileBtn, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.editProfileText}>{t('profile.editProfile')}</Text>
              </Pressable>
            )}
          </View>

          {/* Personal information */}
          <Text style={styles.sectionTitle}>{t('profile.personal')}</Text>
          <View style={styles.group}>
            <Pressable
              onPress={openEdit}
              accessibilityRole="button"
              accessibilityLabel={t('profile.editName')}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View style={styles.iconBox}>
                <User size={18} color={PRIMARY} strokeWidth={2} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{t('profile.nameRow')}</Text>
                <Text style={styles.rowValue} numberOfLines={1} ellipsizeMode="tail">
                  {displayName}
                </Text>
              </View>
              <ChevronRight size={18} color="#B6C0C4" strokeWidth={2} />
            </Pressable>

            <View style={styles.rowDivider} />

            <View style={styles.rowStatic}>
              <View style={styles.iconBox}>
                <Mail size={18} color={PRIMARY} strokeWidth={2} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{t('profile.emailRow')}</Text>
                <Text style={styles.rowValue} numberOfLines={1} ellipsizeMode="tail">
                  {email ?? t('profile.notSet')}
                </Text>
              </View>
            </View>

            <View style={styles.rowDivider} />

            <View style={styles.rowStatic}>
              <View style={styles.iconBox}>
                <Phone size={18} color={PRIMARY} strokeWidth={2} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{t('profile.phoneRow')}</Text>
                <Text style={styles.rowValue} numberOfLines={1} ellipsizeMode="tail">
                  {phone ?? t('profile.addPhone')}
                </Text>
              </View>
            </View>
          </View>

          {/* Language */}
          <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
          <View style={styles.group}>
            <View style={styles.langRow}>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{t('profile.language')}</Text>
                <Text style={styles.rowValueMuted} numberOfLines={1} ellipsizeMode="tail">
                  {t('profile.languageSub')}
                </Text>
              </View>
            </View>
            <View style={styles.langOpts}>
              {(['en', 'am'] as const).map((lang) => {
                const active = language === lang;
                return (
                  <Pressable
                    key={lang}
                    onPress={() => setLanguage(lang)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={lang === 'en' ? t('profile.langEnglish') : t('profile.langAmharic')}
                    style={({ pressed }) => [styles.langOpt, active && styles.langOptActive, pressed && { opacity: 0.8 }]}
                  >
                    <Text style={[styles.langOptText, active && styles.langOptTextActive]}>
                      {lang === 'en' ? t('profile.langEnglish') : t('profile.langAmharic')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Bookings — only existing route is linked; no fake Preferences/Help rows */}
          <Text style={styles.sectionTitle}>{t('profile.bookingsSec')}</Text>
          <View style={styles.group}>
            <Pressable
              onPress={() => navigation.navigate('MyBookings')}
              accessibilityRole="button"
              accessibilityLabel={t('profile.openBookings')}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View style={styles.iconBox}>
                <CalendarDays size={18} color={PRIMARY} strokeWidth={2} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{t('profile.myBookings')}</Text>
                <Text style={styles.rowValueMuted} numberOfLines={1} ellipsizeMode="tail">
                  {t('profile.myBookingsSub')}
                </Text>
              </View>
              <ChevronRight size={18} color="#B6C0C4" strokeWidth={2} />
            </Pressable>
          </View>

          {/* Sign out — restrained destructive action */}
          <Pressable
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel={t('profile.signout')}
            style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.8 }]}
          >
            <LogOut size={18} color={DANGER} strokeWidth={2} />
            <Text style={styles.signOutText}>{t('profile.signout')}</Text>
          </Pressable>

          {!isCloudinaryConfigured() ? (
            <Text style={styles.configNote}>
              Cloudinary not configured — add EXPO_PUBLIC_CLOUDINARY_* in .env to enable photo upload.
            </Text>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1, backgroundColor: BG },
  content: { flexGrow: 1, paddingBottom: 124 },
  header: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 2 },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: TEXT,
    fontFamily: 'System',
  },
  headerSubtitle: { fontSize: 14, color: MUTED, marginTop: 8, lineHeight: 20 },
  identityCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  identityRow: { flexDirection: 'row', alignItems: 'center' },
  avatarPress: { position: 'relative' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: 80, height: 80, borderRadius: 40, backgroundColor: PRIMARY_TINT },
  avatarText: { color: SURFACE, fontSize: 30, fontWeight: '800' },
  avatarEditFab: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  identityInfo: { flex: 1, marginLeft: 16, minWidth: 0 },
  identityName: { fontSize: 18, fontWeight: '700', color: TEXT, letterSpacing: -0.2 },
  identityEmail: { fontSize: 13, color: MUTED, marginTop: 3 },
  memberRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 5 },
  memberText: { fontSize: 12, color: MUTED },
  editProfileBtn: {
    marginTop: 16,
    height: 44,
    borderRadius: 13,
    backgroundColor: PRIMARY_TINT,
    borderWidth: 1,
    borderColor: PRIMARY_TINT_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileText: { fontSize: 15, fontWeight: '700', color: PRIMARY_DARK },
  editBox: { marginTop: 16 },
  editLabel: { fontSize: 13, fontWeight: '600', color: TEXT, marginBottom: 6 },
  editInput: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: TEXT,
  },
  editInputError: { borderColor: DANGER },
  editError: { color: DANGER, fontSize: 12, marginTop: 6 },
  editActions: { flexDirection: 'row', marginTop: 10, gap: 10 },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: TEXT },
  saveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: SURFACE },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.2,
    marginHorizontal: 22,
    marginTop: 30,
    marginBottom: 10,
  },
  group: {
    backgroundColor: SURFACE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    marginHorizontal: 20,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 64,
  },
  rowStatic: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 64,
  },
  rowPressed: { backgroundColor: '#F3F6F3' },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: PRIMARY_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, marginLeft: 12, marginRight: 8, minWidth: 0 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: TEXT },
  rowValue: { fontSize: 13, color: MUTED, marginTop: 2 },
  rowValueMuted: { fontSize: 13, color: MUTED, marginTop: 2 },
  rowDivider: { height: 1, backgroundColor: BORDER, marginLeft: 66 },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    minHeight: 64,
  },
  langOpts: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 },
  langOpt: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langOptActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  langOptText: { fontSize: 15, fontWeight: '600', color: TEXT },
  langOptTextActive: { color: SURFACE, fontWeight: '700' },
  signOut: {
    marginHorizontal: 20,
    marginTop: 28,
    height: 48,
    borderRadius: 13,
    backgroundColor: DANGER_BG,
    borderWidth: 1,
    borderColor: DANGER_BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: DANGER },
  configNote: { fontSize: 12, color: MUTED, textAlign: 'center', marginTop: 16, marginHorizontal: 32, lineHeight: 17 },
});

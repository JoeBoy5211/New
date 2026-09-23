import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCatererById } from '@/hooks/useCaterers';
import { useCatererRatings } from '@/hooks/useCatererRatings';
import { useMenuItemsByCaterer } from '@/hooks/useMenuItems';
import { usePackagesByCaterer } from '@/hooks/usePackages';
import { useUnavailabilityByCaterer } from '@/hooks/useUnavailability';
import { useCreateBooking } from '@/hooks/useBookings';
import { useAuth } from '@/context/AuthContext';
import { useLanguage, type Translate } from '@/i18n/LanguageContext';
import { colors, shadow } from '@/theme/colors';
import { AppIcon } from '@/components/mobile/AppIcons';
import { FoodImage } from '@/components/mobile/shared';
import { formatBirr } from '@/lib/format';
import type { RootScreenProps } from '@/navigation/types';

const EVENT_KEYS = [
  'Wedding',
  'Corporate',
  'Private Party',
  'Birthday',
  'Anniversary',
  'Gala',
  'Festival',
  'Cocktail Party',
  'Family Reunion',
  'Holiday Party',
  'Graduation',
  'Baby Shower',
] as const;

function eventLabel(key: string, t: Translate): string {
  return t(`event.${key}` as 'event.Wedding');
}

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
];

function isValidDate(v: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const day = Number(m[3]);
  if (mo < 1 || mo > 12 || day < 1 || day > 31) return false;
  const d = new Date(y, mo - 1, day);
  return d.getFullYear() === y && d.getMonth() === mo - 1 && d.getDate() === day;
}
function isValidTime(v: string) {
  if (!v) return true;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
}
function toLocalISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function toISODatePlusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalISODate(d);
}
function todayISO() {
  return toLocalISODate(new Date());
}
function displayDate(iso: string, t: Translate): string {
  if (!isValidDate(iso)) return iso || t('book.selectDate');
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
function displayTime(hhmm: string, t: Translate): string {
  if (!hhmm) return t('book.flexibleShort');
  const m = hhmm.slice(0, 5).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return hhmm;
  let h = Number(m[1]);
  const min = m[2];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${min} ${ampm}`;
}
function monthLabel(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

type Errors = Partial<Record<'date' | 'time' | 'guests' | 'venue' | 'phone' | 'submit', string>>;

export default function BookingRequestScreen({ route, navigation }: RootScreenProps<'BookingRequest'>) {
  const { catererId } = route.params;
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const { data: caterer } = useCatererById(catererId);
  const { data: liveRatings } = useCatererRatings(catererId ? [catererId] : []);
  const { data: menuItems } = useMenuItemsByCaterer(catererId);
  const { data: packages } = usePackagesByCaterer(catererId);
  const { data: blocked } = useUnavailabilityByCaterer(catererId);
  const createBooking = useCreateBooking();

  const [eventDate, setEventDate] = useState(toISODatePlusDays(7));
  const [eventTime, setEventTime] = useState('18:00');
  const [eventType, setEventType] = useState('Wedding');
  const [guestCount, setGuestCount] = useState('20');
  const [venue, setVenue] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [special, setSpecial] = useState('');
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date(toISODatePlusDays(7) + 'T00:00:00');
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const guestTouched = useRef(false);
  const contactTouched = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const venueRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const specialRef = useRef<TextInput>(null);

  // Prefill from backend data without clobbering user edits.
  useEffect(() => {
    if (caterer && !guestTouched.current) {
      setGuestCount(String(caterer.min_guests ?? 20));
    }
  }, [caterer]);
  useEffect(() => {
    if (contactTouched.current) return;
    if (!contactName && profile?.name) setContactName(profile.name);
    if (!contactPhone && (profile?.phone || user?.phone)) {
      setContactPhone(profile?.phone ?? (user?.phone as string) ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.name, profile?.phone, user?.phone]);

  const blockedSet = useMemo(() => new Set((blocked ?? []).map((b) => b.blocked_date)), [blocked]);

  const pkgById = useMemo(() => new Map((packages ?? []).map((p) => [p.id, p])), [packages]);
  const menuById = useMemo(() => new Map((menuItems ?? []).map((m) => [m.id, m])), [menuItems]);

  const estimated = useMemo(() => {
    const pkgTotal = selectedPackages.reduce((s, id) => s + Number(pkgById.get(id)?.price ?? 0), 0);
    const menuTotal = selectedMenu.reduce((s, id) => s + Number(menuById.get(id)?.price ?? 0), 0);
    return pkgTotal + menuTotal;
  }, [selectedPackages, selectedMenu, pkgById, menuById]);

  const isBlockedDate = blockedSet.has(eventDate);
  const guestsNum = Number(guestCount);
  const guestsValid = Number.isFinite(guestsNum) && guestsNum >= 1;

  const eventDone = isValidDate(eventDate) && guestsValid && venue.trim().length > 1;
  const contactDone = contactPhone.trim().length >= 4;
  const servicesDone = selectedPackages.length + selectedMenu.length > 0;
  const steps = [
    { key: t('book.stepEvent'), done: eventDone },
    { key: t('book.stepContact'), done: contactDone },
    { key: t('book.stepServices'), done: servicesDone },
    { key: t('book.stepReview'), done: eventDone && contactDone },
  ];
  const activeStep = !eventDone ? 0 : !contactDone ? 1 : !servicesDone ? 2 : 3;

  const toggle = (arr: string[], id: string, setter: (v: string[]) => void) => {
    setter(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
    setSubmitError(null);
  };

  const adjustGuests = (delta: number) => {
    guestTouched.current = true;
    const cur = Number(guestCount);
    const base = Number.isFinite(cur) && cur > 0 ? cur : (caterer?.min_guests ?? 20);
    const next = Math.max(1, Math.min(10000, base + delta));
    setGuestCount(String(next));
    setErrors((e) => ({ ...e, guests: undefined }));
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (!isValidDate(eventDate)) next.date = t('book.errDate');
    else if (eventDate < todayISO()) next.date = t('book.errPast');
    if (!isValidTime(eventTime)) next.time = t('book.errTime');
    if (!Number.isFinite(guestsNum) || guestsNum < 1) next.guests = t('book.errGuests');
    else if (caterer?.min_guests && guestsNum < caterer.min_guests)
      next.guests = t('book.errMin', { min: caterer.min_guests });
    else if (caterer?.max_guests && guestsNum > caterer.max_guests)
      next.guests = t('book.errMax', { max: caterer.max_guests });
    if (!venue.trim()) next.venue = t('book.errVenue');
    if (!contactPhone.trim()) next.phone = t('book.errPhone');
    return next;
  };

  const handleSubmit = async () => {
    if (createBooking.isPending) return;
    const v = validate();
    setErrors(v);
    if (Object.values(v).some(Boolean)) return;
    if (!user) {
      setSubmitError(t('book.errSignin'));
      return;
    }
    if (!caterer) return;
    setSubmitError(null);
    try {
      await createBooking.mutateAsync({
        caterer_id: catererId,
        customer_id: user.id,
        event_date: eventDate,
        event_time: eventTime || null,
        event_type: eventType,
        guest_count: guestsNum,
        venue: venue.trim(),
        contact_phone: contactPhone.trim(),
        contact_name: contactName.trim() || profile?.name || null,
        special_requests: special.trim() || null,
        menu_selections: selectedMenu,
        package_ids: selectedPackages,
        total_amount: estimated > 0 ? estimated : null,
      });
      setSent(true);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : t('book.errSend'));
    }
  };

  // ---------- calendar grid ----------
  const calCells = useMemo(() => {
    const y = calMonth.getFullYear();
    const m = calMonth.getMonth();
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= days; d++) {
      cells.push(`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return cells;
  }, [calMonth]);

  // ---------- success ----------
  if (sent) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.successScroll}
        >
          <View style={styles.successInner}>
            <View style={styles.successSealOuter}>
              <View style={styles.successSealInner}>
                <AppIcon name="badgeCheck" size={44} color={colors.primaryDark} />
              </View>
            </View>
            <Text style={styles.successKicker}>{t('book.sentKicker')}</Text>
            <Text style={styles.successTitle}>{t('book.sentTitle')}</Text>
            <Text style={styles.successSub}>
              {t('book.sentSub', { name: caterer?.name ?? t('common.catererFallback') })}
            </Text>
            <View style={styles.successCard}>
              <Text style={styles.successCardTitle}>{t('book.evtDetails')}</Text>
              <View style={styles.successRow}>
                <AppIcon name="calendar" size={17} color={colors.primaryDark} />
                <Text style={styles.successRowLabel}>{t('book.rowDate')}</Text>
                <Text style={styles.successRowValue} numberOfLines={1}>{displayDate(eventDate, t)}</Text>
              </View>
              <View style={styles.successDivider} />
              <View style={styles.successRow}>
                <AppIcon name="clock" size={17} color={colors.primaryDark} />
                <Text style={styles.successRowLabel}>{t('book.rowTime')}</Text>
                <Text style={styles.successRowValue} numberOfLines={1}>{displayTime(eventTime, t)}</Text>
              </View>
              <View style={styles.successDivider} />
              <View style={styles.successRow}>
                <AppIcon name="cloche" size={17} color={colors.primaryDark} />
                <Text style={styles.successRowLabel}>{t('book.rowType')}</Text>
                <Text style={styles.successRowValue} numberOfLines={1}>{eventLabel(eventType, t)}</Text>
              </View>
              <View style={styles.successDivider} />
              <View style={styles.successRow}>
                <AppIcon name="users" size={17} color={colors.primaryDark} />
                <Text style={styles.successRowLabel}>{t('book.rowGuests')}</Text>
                <Text style={styles.successRowValue} numberOfLines={1}>
                  {guestsValid ? t('book.guestsN', { n: guestsNum }) : '—'}
                </Text>
              </View>
              <View style={styles.successDivider} />
              <View style={styles.successRow}>
                <AppIcon name="pin" size={17} color={colors.primaryDark} />
                <Text style={styles.successRowLabel}>{t('book.rowVenue')}</Text>
                <Text style={styles.successRowValue} numberOfLines={2}>{venue.trim() || '—'}</Text>
              </View>
            </View>
            <Pressable
              onPress={() => navigation.replace('MainTabs', { screen: 'MyBookings' })}
              accessibilityRole="button"
              accessibilityLabel={t('book.viewBookingsLabel')}
              style={({ pressed }) => [styles.ctaBtn, styles.successPrimary, pressed && { opacity: 0.88 }]}
            >
              <Text style={styles.ctaText}>{t('book.viewBookings')}</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel={t('book.returnLabel')}
              style={({ pressed }) => [styles.ghostBtn, styles.successSecondary, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.ghostText}>{t('book.return')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const catererName = caterer?.name ?? t('common.catererFallback');
  const catererLoc = caterer?.location ?? 'Addis Ababa';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <View style={styles.flex}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 150 + insets.bottom }]}
        >
          <View style={styles.centerCol}>
            {/* ONE compact header */}
            <View style={styles.header}>
              <Pressable
                onPress={() => navigation.goBack()}
                accessibilityRole="button"
                accessibilityLabel={t('common.goBack')}
                hitSlop={10}
                style={({ pressed }) => [styles.backAfford, pressed && { opacity: 0.6 }]}
              >
                <AppIcon name="back" size={22} color={colors.text} />
              </Pressable>
              <View style={styles.headerTitles}>
                <Text style={styles.kicker}>{t('book.kicker')}</Text>
                <Text style={styles.pageTitle} numberOfLines={1}>{catererName}</Text>
                <Text style={styles.pageSub} numberOfLines={1}>{catererLoc}</Text>
              </View>
              <View style={styles.headerSpacer} />
            </View>

            {/* subtle progress */}
            <View style={styles.steps} accessibilityRole="progressbar">
              {steps.map((s, i) => (
                <View key={s.key} style={styles.stepItem}>
                  <View style={[styles.stepDot, i === activeStep && styles.stepDotActive, s.done && styles.stepDotDone]}>
                    {s.done ? <AppIcon name="check" size={11} color={colors.white} /> : null}
                  </View>
                  <Text style={[styles.stepLabel, i === activeStep && styles.stepLabelActive]}>{s.key}</Text>
                  {i < steps.length - 1 ? <View style={styles.stepLine} /> : null}
                </View>
              ))}
            </View>

            {/* caterer identity — compact */}
            <Pressable
              onPress={() => navigation.navigate('CatererDetail', { id: catererId })}
              accessibilityRole="button"
              accessibilityLabel={t('book.viewCaterer', { name: catererName })}
              style={({ pressed }) => [styles.vendorCard, pressed && { opacity: 0.92 }]}
            >
              {caterer?.cover_image ? (
                <Image source={{ uri: caterer.cover_image }} style={styles.vendorImg} />
              ) : (
                <View style={[styles.vendorImg, styles.vendorFallback]}>
                  <Text style={styles.vendorFallbackText}>{catererName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.vendorBody}>
                <Text style={styles.vendorName} numberOfLines={1}>{catererName}</Text>
                <Text style={styles.vendorLoc} numberOfLines={1}>{catererLoc}</Text>
                <View style={styles.verifiedRow}>
                  <AppIcon name="badgeCheck" size={14} color={colors.primaryDark} />
                  <Text style={styles.verifiedText}>{t('book.verified')}</Text>
                  {(() => {
                    const live = liveRatings?.[catererId];
                    const rating = live !== undefined ? Number(live.rating ?? 0) : Number(caterer?.rating ?? 0);
                    return rating > 0 ? (
                      <Text style={styles.vendorRating}> · ★ {rating.toFixed(1)}</Text>
                    ) : null;
                  })()}
                </View>
              </View>
              <AppIcon name="forward" size={20} color={colors.textFaint} />
            </Pressable>

            {/* EVENT DETAILS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('book.eventTitle')}</Text>
              <Text style={styles.sectionHint}>{t('book.eventHint', { name: catererName })}</Text>

              <Text style={styles.fieldLabel}>{t('book.eventDate')}</Text>
              <Pressable
                onPress={() => setDateOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={t('book.dateA11y', { d: displayDate(eventDate, t) })}
                style={({ pressed }) => [styles.control, errors.date && styles.controlError, pressed && { opacity: 0.9 }]}
              >
                <AppIcon name="calendar" size={18} color={colors.primaryDark} />
                <Text style={styles.controlText}>{displayDate(eventDate, t)}</Text>
                <AppIcon name="chevronDown" size={18} color={colors.textFaint} />
              </Pressable>
              {errors.date ? <Text style={styles.error}>{errors.date}</Text> : null}
              {isBlockedDate ? (
                <View style={styles.warnBox}>
                  <AppIcon name="info" size={15} color={colors.warning} />
                  <Text style={styles.warnText}>{t('book.warnDate')}</Text>
                </View>
              ) : null}

              <View style={styles.twoCol}>
                <View style={styles.twoColItem}>
                  <Text style={styles.fieldLabel}>{t('book.eventTime')}</Text>
                  <Pressable
                    onPress={() => setTimeOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel={t('book.timeA11y', { t: displayTime(eventTime, t) })}
                    style={({ pressed }) => [styles.control, errors.time && styles.controlError, pressed && { opacity: 0.9 }]}
                  >
                    <AppIcon name="clock" size={18} color={colors.primaryDark} />
                    <Text style={styles.controlText} numberOfLines={1}>{displayTime(eventTime, t)}</Text>
                  </Pressable>
                </View>
                <View style={styles.twoColItem}>
                  <Text style={styles.fieldLabel}>{t('book.guests')}</Text>
                  <View style={[styles.stepper, errors.guests && styles.controlError]}>
                    <Pressable
                      onPress={() => adjustGuests(-1)}
                      accessibilityRole="button"
                      accessibilityLabel={t('book.fewerGuests')}
                      hitSlop={8}
                      style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.6 }]}
                    >
                      <Text style={styles.stepBtnText}>−</Text>
                    </Pressable>
                    <TextInput
                      value={guestCount}
                      onChangeText={(t) => {
                        guestTouched.current = true;
                        setGuestCount(t.replace(/[^0-9]/g, ''));
                        setErrors((e) => ({ ...e, guests: undefined }));
                      }}
                      keyboardType="number-pad"
                      accessibilityLabel={t('book.guestsLabel')}
                      style={styles.stepInput}
                    />
                    <Pressable
                      onPress={() => adjustGuests(1)}
                      accessibilityRole="button"
                      accessibilityLabel={t('book.moreGuests')}
                      hitSlop={8}
                      style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.6 }]}
                    >
                      <Text style={styles.stepBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
              {errors.time ? <Text style={styles.error}>{errors.time}</Text> : null}
              {errors.guests ? (
                <Text style={styles.error}>{errors.guests}</Text>
              ) : caterer ? (
                <Text style={styles.helper}>{t('book.suitable', { min: caterer.min_guests ?? 1, max: caterer.max_guests ?? 100 })}</Text>
              ) : null}

              <Text style={styles.fieldLabel}>{t('book.eventType')}</Text>
              <View style={styles.chipWrap}>
                {EVENT_KEYS.map((key) => {
                  const active = eventType === key;
                  const label = eventLabel(key, t);
                  return (
                    <Pressable
                      key={key}
                      onPress={() => setEventType(key)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={label}
                      style={({ pressed }) => [styles.typeChip, active && styles.typeChipActive, pressed && { opacity: 0.85 }]}
                    >
                      {active ? <AppIcon name="check" size={14} color={colors.white} /> : null}
                      <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>{t('book.venue')}</Text>
              <Pressable
                accessible={false}
                onPress={() => venueRef.current?.focus()}
                style={[styles.control, focused === 'venue' && styles.controlFocused, errors.venue && styles.controlError]}
              >
                <AppIcon name="pin" size={18} color={colors.primaryDark} />
                <TextInput
                  ref={venueRef}
                  value={venue}
                  onChangeText={(t) => {
                    setVenue(t);
                    setErrors((e) => ({ ...e, venue: undefined }));
                  }}
                  onFocus={() => setFocused('venue')}
                  onBlur={() => setFocused(null)}
                  placeholder={t('book.venuePh')}
                  placeholderTextColor={colors.textFaint}
                  accessibilityLabel={t('book.venue')}
                  style={styles.textInput}
                  blurOnSubmit={false}
                  returnKeyType="next"
                  onSubmitEditing={() => nameRef.current?.focus()}
                />
              </Pressable>
              {errors.venue ? <Text style={styles.error}>{errors.venue}</Text> : null}
            </View>

            {/* CONTACT */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('book.contactTitle')}</Text>
              <Text style={styles.sectionHint}>{t('book.contactHint')}</Text>
              <Text style={styles.fieldLabel}>{t('book.yourName')}</Text>
              <Pressable
                accessible={false}
                onPress={() => nameRef.current?.focus()}
                style={[styles.control, focused === 'name' && styles.controlFocused]}
              >
                <AppIcon name="user" size={18} color={colors.primaryDark} />
                <TextInput
                  ref={nameRef}
                  value={contactName}
                  onChangeText={(t) => {
                    contactTouched.current = true;
                    setContactName(t);
                  }}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                  placeholder={t('book.fullNamePh')}
                  placeholderTextColor={colors.textFaint}
                  accessibilityLabel={t('book.yourName')}
                  autoCapitalize="words"
                  style={styles.textInput}
                  blurOnSubmit={false}
                  returnKeyType="next"
                  onSubmitEditing={() => phoneRef.current?.focus()}
                />
                {profile?.name && contactName === profile.name ? (
                  <View style={styles.prefilled}><Text style={styles.prefilledText}>{t('book.saved')}</Text></View>
                ) : null}
              </Pressable>
              <Text style={styles.fieldLabel}>{t('book.phoneLabel')}</Text>
              <Pressable
                accessible={false}
                onPress={() => phoneRef.current?.focus()}
                style={[styles.control, focused === 'phone' && styles.controlFocused, errors.phone && styles.controlError]}
              >
                <AppIcon name="phone" size={18} color={colors.primaryDark} />
                <TextInput
                  ref={phoneRef}
                  value={contactPhone}
                  onChangeText={(t) => {
                    contactTouched.current = true;
                    setContactPhone(t);
                    setErrors((e) => ({ ...e, phone: undefined }));
                  }}
                  onFocus={() => setFocused('phone')}
                  onBlur={() => setFocused(null)}
                  placeholder="+251 900 000 000"
                  placeholderTextColor={colors.textFaint}
                  accessibilityLabel={t('book.phoneLabel')}
                  keyboardType="phone-pad"
                  style={styles.textInput}
                  blurOnSubmit={false}
                  returnKeyType="next"
                  onSubmitEditing={() => specialRef.current?.focus()}
                />
              </Pressable>
              {errors.phone ? <Text style={styles.error}>{errors.phone}</Text> : null}
            </View>

            {/* PACKAGES */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('book.packagesTitle')}</Text>
              <Text style={styles.sectionHint}>{t('book.packagesHint')}</Text>
              {(packages ?? []).length === 0 ? (
                <Text style={styles.helper}>{t('book.noPackages')}</Text>
              ) : (
                (packages ?? []).map((pkg) => {
                  const active = selectedPackages.includes(pkg.id);
                  return (
                    <Pressable
                      key={pkg.id}
                      onPress={() => toggle(selectedPackages, pkg.id, setSelectedPackages)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: active }}
                      accessibilityLabel={`${pkg.name}, ${formatBirr(pkg.price)}${active ? ', selected' : ''}`}
                      style={({ pressed }) => [styles.pkgCard, active && styles.pkgCardActive, pressed && { opacity: 0.96 }]}
                    >
                      <View style={styles.pkgTop}>
                        <View style={styles.pkgHead}>
                          <Text style={styles.pkgName} numberOfLines={2}>{pkg.name}</Text>
                          <Text style={styles.pkgPrice}>{formatBirr(pkg.price)}</Text>
                        </View>
                        {!!pkg.description && (
                          <Text style={styles.pkgDesc} numberOfLines={2}>{pkg.description}</Text>
                        )}
                        <View style={styles.pkgFoot}>
                          <View style={styles.pkgMetaPill}>
                            <AppIcon name="users" size={13} color={colors.primaryDark} />
                            <Text style={styles.pkgMetaText}>
                              {' '}{pkg.min_guests ?? 1}–{pkg.max_guests ?? 100} {t('book.guests').toLowerCase()}
                            </Text>
                          </View>
                          {(pkg.includes ?? []).length > 0 ? (
                            <Text style={styles.pkgIncludes} numberOfLines={1}>
                              {(pkg.includes ?? []).slice(0, 3).join(' · ')}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      <View style={[styles.selectBadge, active && styles.selectBadgeActive]}>
                        <Text style={[styles.selectBadgeText, active && styles.selectBadgeTextActive]}>
                          {active ? '✓' : '+'}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>

            {/* MENU */}
            {(menuItems ?? []).length > 0 ? (
              <View style={styles.section}>
                <View style={styles.menuHead}>
                  <Text style={styles.sectionTitle}>{t('book.addMenu')}</Text>
                  <Text style={styles.optionalPill}>{t('book.optional')}</Text>
                </View>
                <Text style={styles.sectionHint}>{t('book.menuHint')}</Text>
                {menuItems!.slice(0, 30).map((item) => {
                  const active = selectedMenu.includes(item.id);
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => toggle(selectedMenu, item.id, setSelectedMenu)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: active }}
                      accessibilityLabel={`${item.name}, ${formatBirr(item.price)}${active ? ', added' : ''}`}
                      style={({ pressed }) => [styles.menuRow, active && styles.menuRowActive, pressed && { opacity: 0.96 }]}
                    >
                      {item.image ? (
                        <FoodImage uri={item.image} style={styles.menuThumb} borderRadius={12} />
                      ) : null}
                      <View style={styles.menuBody}>
                        <View style={styles.menuTitleRow}>
                          <Text style={styles.menuName} numberOfLines={1}>{item.name}</Text>
                          {item.is_popular ? (
                            <View style={styles.popPill}><Text style={styles.popPillText}>{t('menu.popular')}</Text></View>
                          ) : null}
                        </View>
                        {!!item.description && (
                          <Text style={styles.menuDesc} numberOfLines={2}>{item.description}</Text>
                        )}
                        <Text style={styles.menuPrice}>{formatBirr(item.price)}</Text>
                      </View>
                      <View style={[styles.addBtn, active && styles.addBtnActive]}>
                        {active ? <AppIcon name="check" size={14} color={colors.white} /> : null}
                        <Text style={[styles.addBtnText, active && styles.addBtnTextActive]}>
                          {active ? t('book.added') : t('book.add')}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {/* SELECTION SUMMARY */}
            {servicesDone || estimated > 0 ? (
              <View style={styles.selectionBox}>
                <Text style={styles.selectionTitle}>{t('book.selection')}</Text>
                <View style={styles.selectionRow}>
                  <Text style={styles.selectionText}>
                    {selectedPackages.length === 1 ? t('book.pkgOne') : t('book.pkgMany', { n: selectedPackages.length })} · {selectedMenu.length === 1 ? t('book.menuOne') : t('book.menuMany', { n: selectedMenu.length })}
                  </Text>
                </View>
                {estimated > 0 ? (
                  <View style={styles.selectionTotalRow}>
                    <Text style={styles.selectionTotalLabel}>{t('book.estTotal')}</Text>
                    <Text style={styles.selectionTotal}>{formatBirr(estimated)}</Text>
                  </View>
                ) : null}
                <Text style={styles.selectionNote}>{t('book.finalNote')}</Text>
              </View>
            ) : null}

            {/* SPECIAL */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('book.specialTitle')}</Text>
              <Text style={styles.sectionHint}>{t('book.specialHint')}</Text>
              <TextInput
                ref={specialRef}
                value={special}
                onChangeText={setSpecial}
                onFocus={() => setFocused('special')}
                onBlur={() => setFocused(null)}
                placeholder={t('book.specialPh')}
                placeholderTextColor={colors.textFaint}
                accessibilityLabel={t('book.specialTitle')}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={() => Keyboard.dismiss()}
                style={[styles.textarea, focused === 'special' && styles.controlFocused]}
              />
            </View>

            {/* REVIEW */}
            <View style={styles.reviewCard}>
              <Text style={styles.selectionTitle}>{t('book.reviewTitle')}</Text>
              <Text style={styles.reviewName} numberOfLines={1}>{catererName}</Text>
              <Text style={styles.reviewLine} numberOfLines={1}>{catererLoc}</Text>
              <View style={styles.reviewDivider} />
              <View style={styles.reviewGrid}>
                <View style={styles.reviewItem}>
                  <AppIcon name="calendar" size={15} color={colors.primaryDark} />
                  <Text style={styles.reviewVal} numberOfLines={1}> {displayDate(eventDate, t)}</Text>
                </View>
                <View style={styles.reviewItem}>
                  <AppIcon name="clock" size={15} color={colors.primaryDark} />
                  <Text style={styles.reviewVal}> {displayTime(eventTime, t)}</Text>
                </View>
                <View style={styles.reviewItem}>
                  <AppIcon name="users" size={15} color={colors.primaryDark} />
                  <Text style={styles.reviewVal}> {eventLabel(eventType, t)} · {guestsValid ? guestsNum : '—'} {t('book.guests').toLowerCase()}</Text>
                </View>
                <View style={styles.reviewItem}>
                  <AppIcon name="pin" size={15} color={colors.primaryDark} />
                  <Text style={styles.reviewVal} numberOfLines={1}> {venue.trim() || t('book.addVenue')}</Text>
                </View>
              </View>
              <View style={styles.reviewDivider} />
              <Text style={styles.reviewLine}>
                {selectedPackages.length === 1 ? t('book.pkgOne') : t('book.pkgMany', { n: selectedPackages.length })} · {selectedMenu.length === 1 ? t('book.menuOne') : t('book.menuMany', { n: selectedMenu.length })}
                {estimated > 0 ? ` · ${formatBirr(estimated)}` : ''}
              </Text>
            </View>

            {submitError ? (
              <View style={styles.submitErrorBox}>
                <AppIcon name="info" size={16} color={colors.danger} />
                <Text style={styles.submitErrorText}>{submitError}</Text>
              </View>
            ) : null}
            <Text style={styles.legal}>
              {t('book.legal', { name: catererName })}
            </Text>
          </View>
        </ScrollView>

        {/* sticky CTA */}
        <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          <View style={styles.stickyInner}>
            <View style={styles.stickyTotal}>
              <Text style={styles.stickyLabel}>{t('book.yourRequest')}</Text>
              <Text style={styles.stickyValue} numberOfLines={1}>
                {estimated > 0 ? formatBirr(estimated) : guestsValid ? t('book.guestsN', { n: guestsNum }) : '—'}
              </Text>
            </View>
            <Pressable
              onPress={handleSubmit}
              disabled={createBooking.isPending}
              accessibilityRole="button"
              accessibilityLabel={t('book.sendLabel')}
              accessibilityState={{ disabled: createBooking.isPending }}
              style={({ pressed }) => [styles.ctaBtn, styles.ctaFlex, createBooking.isPending && styles.ctaDisabled, pressed && !createBooking.isPending && { opacity: 0.9 }]}
            >
              {createBooking.isPending ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.ctaText}>{t('book.send')}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
      </KeyboardAvoidingView>

        {/* date picker — native-safe custom calendar (Expo SDK 57, no extra native dep) */}
        <Modal visible={dateOpen} transparent animationType="fade" onRequestClose={() => setDateOpen(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setDateOpen(false)}>
            <Pressable style={styles.modalCard} onPress={() => undefined}>
              <View style={styles.modalHead}>
                <Text style={styles.modalTitle}>{t('book.dateTitle')}</Text>
                <Pressable onPress={() => setDateOpen(false)} hitSlop={10} accessibilityLabel={t('book.closePicker')}>
                  <Text style={styles.modalClose}>✕</Text>
                </Pressable>
              </View>
              <View style={styles.calNav}>
                <Pressable
                  onPress={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
                  hitSlop={10}
                  accessibilityLabel={t('book.prevMonth')}
                  style={styles.calNavBtn}
                >
                  <AppIcon name="back" size={20} color={colors.text} />
                </Pressable>
                <Text style={styles.calMonth}>{monthLabel(calMonth)}</Text>
                <Pressable
                  onPress={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
                  hitSlop={10}
                  accessibilityLabel={t('book.nextMonth')}
                  style={styles.calNavBtn}
                >
                  <AppIcon name="forward" size={20} color={colors.text} />
                </Pressable>
              </View>
              <View style={styles.calGrid}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <Text key={`${d}-${i}`} style={styles.calDow}>{d}</Text>
                ))}
                {calCells.map((iso, i) => {
                  if (!iso) return <View key={`e-${i}`} style={styles.calCell} />;
                  const past = iso < todayISO();
                  const blockedDay = blockedSet.has(iso);
                  const selected = iso === eventDate;
                  return (
                    <Pressable
                      key={iso}
                      disabled={past}
                      onPress={() => {
                        setEventDate(iso);
                        setErrors((e) => ({ ...e, date: undefined }));
                        setDateOpen(false);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={iso}
                      accessibilityState={{ selected, disabled: past }}
                      style={[styles.calCell, selected && styles.calCellActive, past && styles.calCellPast]}
                    >
                      <Text style={[styles.calDay, selected && styles.calDayActive, past && styles.calDayPast]}>
                        {Number(iso.slice(8, 10))}
                      </Text>
                      {blockedDay && !selected ? <View style={styles.blockedDot} /> : null}
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.modalHint}>{t('book.unavailHint')}</Text>
            </Pressable>
          </Pressable>
        </Modal>

        {/* time picker */}
        <Modal visible={timeOpen} transparent animationType="fade" onRequestClose={() => setTimeOpen(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setTimeOpen(false)}>
            <Pressable style={styles.modalCard} onPress={() => undefined}>
              <View style={styles.modalHead}>
                <Text style={styles.modalTitle}>{t('book.timeTitle')}</Text>
                <Pressable onPress={() => setTimeOpen(false)} hitSlop={10} accessibilityLabel={t('book.closeTimePicker')}>
                  <Text style={styles.modalClose}>✕</Text>
                </Pressable>
              </View>
              <View style={styles.timeGrid}>
                {TIME_SLOTS.map((slot) => {
                  const active = eventTime === slot;
                  return (
                    <Pressable
                      key={slot}
                      onPress={() => {
                        setEventTime(slot);
                        setErrors((e) => ({ ...e, time: undefined }));
                        setTimeOpen(false);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={[styles.timeSlot, active && styles.timeSlotActive]}
                    >
                      <Text style={[styles.timeSlotText, active && styles.timeSlotTextActive]}>
                        {displayTime(slot, t)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                onPress={() => {
                  setEventTime('');
                  setTimeOpen(false);
                }}
                accessibilityRole="button"
                style={styles.ghostBtn}
              >
                <Text style={styles.ghostText}>{t('book.flexible')}</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7F4' },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  centerCol: { width: '100%', maxWidth: 680, alignSelf: 'center' },

  header: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 6, paddingBottom: 4 },
  backAfford: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  headerTitles: { flex: 1, marginLeft: 12 },
  headerSpacer: { width: 40 },
  kicker: { fontSize: 12, fontWeight: '800', letterSpacing: 1.4, color: colors.textMuted },
  pageTitle: { fontSize: 30, fontWeight: '800', letterSpacing: -0.9, color: colors.text, marginTop: 2 },
  pageSub: { fontSize: 14, color: colors.textMuted, marginTop: 2 },

  steps: { flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 6 },
  stepItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { borderColor: colors.primary, borderWidth: 2 },
  stepDotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, color: colors.textFaint, marginLeft: 5 },
  stepLabelActive: { color: colors.primaryDark },
  stepLine: { flex: 1, height: 1, backgroundColor: colors.border, marginHorizontal: 6 },

  vendorCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 12, marginTop: 12,
    ...shadow.card,
  },
  vendorImg: { width: 58, height: 58, borderRadius: 16 },
  vendorFallback: { backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  vendorFallbackText: { color: colors.white, fontWeight: '800', fontSize: 22 },
  vendorBody: { flex: 1, marginLeft: 12, marginRight: 8 },
  vendorName: { fontSize: 17, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },
  vendorLoc: { fontSize: 13, color: colors.textMuted, marginTop: 1 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  verifiedText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark, marginLeft: 4 },
  vendorRating: { fontSize: 12, fontWeight: '600', color: colors.textMuted },

  section: { marginTop: 30 },
  sectionTitle: { fontSize: 21, fontWeight: '800', letterSpacing: -0.4, color: colors.text },
  sectionHint: { fontSize: 13.5, color: colors.textMuted, marginTop: 4, lineHeight: 19 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 18, marginBottom: 8 },

  control: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: '#E3E8E4', borderRadius: 14,
    paddingHorizontal: 14, minHeight: 52,
  },
  controlFocused: { borderColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 1 },
  controlError: { borderColor: colors.danger },
  controlText: { flex: 1, fontSize: 15.5, fontWeight: '600', color: colors.text, marginLeft: 10 },
  textInput: { flex: 1, fontSize: 15.5, color: colors.text, marginLeft: 10, paddingVertical: 14 },
  error: { fontSize: 13, color: colors.danger, fontWeight: '600', marginTop: 6 },
  helper: { fontSize: 13, color: colors.textMuted, marginTop: 6 },
  warnBox: {
    flexDirection: 'row', backgroundColor: colors.warningBg, borderRadius: 12,
    padding: 10, marginTop: 8, alignItems: 'flex-start',
  },
  warnText: { flex: 1, fontSize: 12.5, color: '#92400E', marginLeft: 8, lineHeight: 17 },

  twoCol: { flexDirection: 'row', marginHorizontal: -6 },
  twoColItem: { flex: 1, marginHorizontal: 6 },
  stepper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: '#E3E8E4', borderRadius: 14, minHeight: 52, paddingHorizontal: 4,
  },
  stepBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 22, fontWeight: '700', color: colors.primaryDark },
  stepInput: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: colors.text },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2, marginHorizontal: -4 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: '#E3E8E4', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, margin: 4,
  },
  typeChipActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  typeChipText: { fontSize: 14, fontWeight: '600', color: colors.text },
  typeChipTextActive: { color: colors.white, marginLeft: 6 },

  prefilled: { backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  prefilledText: { fontSize: 11, fontWeight: '800', color: colors.primaryDark },

  pkgCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: '#E3E8E4', borderRadius: 18, padding: 16, marginTop: 10,
  },
  pkgCardActive: { borderColor: colors.primary, backgroundColor: '#EFFAF2', borderWidth: 1.5 },
  pkgTop: { flex: 1, marginRight: 12 },
  pkgHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  pkgName: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.text, marginRight: 10, letterSpacing: -0.2 },
  pkgPrice: { fontSize: 16, fontWeight: '800', color: colors.text },
  pkgDesc: { fontSize: 13.5, color: colors.textMuted, marginTop: 4, lineHeight: 19 },
  pkgFoot: { marginTop: 10 },
  pkgMetaPill: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: '#F1F5F1', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6,
  },
  pkgMetaText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  pkgIncludes: { fontSize: 12.5, color: colors.textMuted, marginTop: 6 },
  selectBadge: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  selectBadgeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  selectBadgeText: { fontSize: 16, fontWeight: '800', color: colors.textMuted },
  selectBadgeTextActive: { color: colors.white },

  menuHead: { flexDirection: 'row', alignItems: 'center' },
  optionalPill: {
    fontSize: 11, fontWeight: '800', color: colors.textMuted, backgroundColor: '#ECEEE9',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginLeft: 10, overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: '#E3E8E4', borderRadius: 16, padding: 12, marginTop: 10,
  },
  menuRowActive: { borderColor: colors.primary, backgroundColor: '#EFFAF2' },
  menuThumb: { width: 52, height: 52 },
  menuBody: { flex: 1, marginLeft: 12, marginRight: 10 },
  menuTitleRow: { flexDirection: 'row', alignItems: 'center' },
  menuName: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  popPill: { backgroundColor: colors.warningBg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  popPillText: { fontSize: 10.5, fontWeight: '800', color: '#92400E' },
  menuDesc: { fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  menuPrice: { fontSize: 14.5, fontWeight: '800', color: colors.text, marginTop: 4 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.primaryDark,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  addBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  addBtnText: { fontSize: 13.5, fontWeight: '800', color: colors.primaryDark },
  addBtnTextActive: { color: colors.white, marginLeft: 4 },

  selectionBox: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 16, marginTop: 26 },
  selectionTitle: { fontSize: 11.5, fontWeight: '800', letterSpacing: 1.2, color: colors.textMuted },
  selectionRow: { marginTop: 8 },
  selectionText: { fontSize: 14, fontWeight: '600', color: colors.text },
  selectionTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  selectionTotalLabel: { fontSize: 14, color: colors.textMuted },
  selectionTotal: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  selectionNote: { fontSize: 12.5, color: colors.textFaint, marginTop: 6 },

  textarea: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: '#E3E8E4', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: colors.text, minHeight: 110, lineHeight: 21,
  },

  reviewCard: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 16, marginTop: 26, ...shadow.card },
  reviewName: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 8 },
  reviewLine: { fontSize: 13.5, color: colors.textMuted, marginTop: 2, lineHeight: 19 },
  reviewDivider: { height: 1, backgroundColor: colors.border, marginVertical: 12, opacity: 0.8 },
  reviewGrid: { marginHorizontal: -2 },
  reviewItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  reviewVal: { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 },

  submitErrorBox: { flexDirection: 'row', backgroundColor: colors.dangerBg, borderRadius: 12, padding: 12, marginTop: 16, alignItems: 'flex-start' },
  submitErrorText: { flex: 1, fontSize: 13.5, color: colors.danger, fontWeight: '600', marginLeft: 8, lineHeight: 18 },
  legal: { fontSize: 12, color: colors.textFaint, textAlign: 'center', marginTop: 14, lineHeight: 17 },

  stickyBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.96)', borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: 20, paddingTop: 10,
  },
  stickyInner: { width: '100%', maxWidth: 680, alignSelf: 'center', flexDirection: 'row', alignItems: 'center' },
  stickyTotal: { marginRight: 12, minWidth: 86 },
  stickyLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.4 },
  stickyValue: { fontSize: 16, fontWeight: '800', color: colors.text },
  ctaBtn: { backgroundColor: colors.primaryDark, borderRadius: 15, paddingVertical: 16, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  ctaFlex: { flex: 1 },
  ctaDisabled: { opacity: 0.65 },
  ctaText: { color: colors.white, fontWeight: '800', fontSize: 16, letterSpacing: -0.1 },
  ghostBtn: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginTop: 10, backgroundColor: colors.surface },
  ghostText: { fontSize: 14.5, fontWeight: '700', color: colors.text },

  modalOverlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'flex-end' },
  modalCard: { width: '100%', maxWidth: 520, backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  modalClose: { fontSize: 16, color: colors.textMuted, padding: 8 },
  modalHint: { fontSize: 12, color: colors.textMuted, marginTop: 12, lineHeight: 17 },
  calNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  calNavBtn: { padding: 8 },
  calMonth: { fontSize: 15, fontWeight: '800', color: colors.text },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  calDow: { width: '14.28%', textAlign: 'center', fontSize: 11, fontWeight: '800', color: colors.textFaint, paddingVertical: 6 },
  calCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  calCellActive: { backgroundColor: colors.primaryDark },
  calCellPast: { opacity: 0.35 },
  calDay: { fontSize: 15, fontWeight: '600', color: colors.text },
  calDayActive: { color: colors.white, fontWeight: '800' },
  calDayPast: { color: colors.textFaint },
  blockedDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.warning, marginTop: 2 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, marginHorizontal: -5 },
  timeSlot: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, margin: 5, backgroundColor: colors.surface },
  timeSlotActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  timeSlotText: { fontSize: 14, fontWeight: '700', color: colors.text },
  timeSlotTextActive: { color: colors.white },

  successScroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32, backgroundColor: '#F5F7F4' },
  successInner: { width: '100%', maxWidth: 480, alignSelf: 'center', alignItems: 'center' },
  successSealOuter: { width: 112, height: 112, borderRadius: 56, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  successSealInner: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    ...shadow.card,
  },
  successKicker: { fontSize: 12, fontWeight: '800', letterSpacing: 1.6, color: colors.primaryDark, marginTop: 20 },
  successTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6, color: colors.text, marginTop: 6 },
  successSub: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  successCard: {
    backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border,
    padding: 16, marginTop: 22, alignSelf: 'stretch', ...shadow.card,
  },
  successCardTitle: { fontSize: 11.5, fontWeight: '800', letterSpacing: 1.2, color: colors.textMuted },
  successRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  successRowLabel: { fontSize: 13.5, color: colors.textMuted, marginLeft: 10, width: 86 },
  successRowValue: { flex: 1, fontSize: 14.5, fontWeight: '700', color: colors.text, textAlign: 'right', marginLeft: 8 },
  successDivider: { height: 1, backgroundColor: colors.border, opacity: 0.7, marginTop: 12 },
  successPrimary: { alignSelf: 'stretch', marginTop: 18 },
  successSecondary: { alignSelf: 'stretch' },
});
